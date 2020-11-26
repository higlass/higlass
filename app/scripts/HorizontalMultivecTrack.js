import { format } from 'd3-format';

import HeatmapTiledPixiTrack from './HeatmapTiledPixiTrack';

import { tileProxy } from './services';
import selectedItemsToSize from './utils/selected-items-to-size';
import selectedItemsToCumWeights from './utils/selected-items-to-cum-weights';
import getAggregationFunction from './utils/get-aggregation-function';

export default class HorizontalMultivecTrack extends HeatmapTiledPixiTrack {
  constructor(context, options) {
    super(context, options);
    this.pMain = this.pMobile;

    // Continuous scaling is currently not supported
    this.continuousScaling = false;

    this.updateDataFetcher(options);
  }

  updateDataFetcher(options) {
    if (
      options &&
      options.selectRows &&
      options.selectRowsAggregationMethod === 'server'
    ) {
      const { pubSub, dataFetcher: prevDataFetcher } = this;
      const prevDataConfigOptions = prevDataFetcher.dataConfig.options;
      const nextDataConfigOptions = {
        aggGroups: options.selectRows,
        aggFunc: options.selectRowsAggregationMode,
      };
      if (
        JSON.stringify(prevDataConfigOptions) !==
        JSON.stringify(nextDataConfigOptions)
      ) {
        // Override the dataFetcher object with a new dataConfig,
        // containing the .options property.
        // This would otherwise be set in the call to super()
        // in the TiledPixiTrack ancestor constructor.
        const newDataConfig = {
          ...prevDataFetcher.dataConfig,
          options: nextDataConfigOptions,
        };
        this.dataFetcher = new prevDataFetcher.constructor(
          newDataConfig,
          pubSub,
        );

        // Only fetch new tiles if the tileset has been registered
        // and has a tilesetUid (for example, due to file url-based tracks).
        if (this.dataFetcher.dataConfig.tilesetUid) {
          this.fetchNewTiles(
            Object.keys(this.fetchedTiles).map((x) => ({
              tileId: x,
              remoteId: x,
            })),
          );
        }
      }
    }
  }

  rerender(options, force) {
    this.updateDataFetcher(options);
    super.rerender(options, force);

    if (options.selectRows) {
      // The weights for selectRows groups must be computed
      // any time options.selectRows changes.
      this.selectRowsCumWeights = selectedItemsToCumWeights(
        options.selectRows,
        options.selectRowsAggregationWithRelativeHeight,
      );
    }
  }

  tileDataToCanvas(pixData) {
    const canvas = document.createElement('canvas');

    if (this.options.selectRows && this.tilesetInfo.shape) {
      canvas.width = this.tilesetInfo.shape[0];
      canvas.height = selectedItemsToSize(
        this.options.selectRows,
        this.options.selectRowsAggregationWithRelativeHeight,
      );
    } else if (this.tilesetInfo.shape) {
      canvas.width = this.tilesetInfo.shape[0];
      canvas.height = this.tilesetInfo.shape[1];
    } else {
      canvas.width = this.tilesetInfo.tile_size; // , pixData.length / 4);
      canvas.height = 1;
    }

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (
      pixData.length !== 0 &&
      pixData.length === 4 * canvas.width * canvas.height
    ) {
      const pix = new ImageData(pixData, canvas.width, canvas.height);
      ctx.putImageData(pix, 0, 0);
    } else {
      console.warn('HorizontalMultivecTrack: pixData has an incorrect length.');
    }

    return canvas;
  }

  setSpriteProperties(sprite, zoomLevel, tilePos) {
    const { tileX, tileWidth } = this.getTilePosAndDimensions(
      zoomLevel,
      tilePos,
      this.tilesetInfo.tile_size,
    );

    const tileEndX = tileX + tileWidth;

    sprite.width = this._refXScale(tileEndX) - this._refXScale(tileX);
    sprite.height = this.dimensions[1];

    sprite.x = this._refXScale(tileX);
    sprite.y = 0;
  }

  leftTrackZoomed(newXScale, newYScale, k, tx, ty) {
    // a separate zoom function if the track is drawn on
    // the left
    const offset = this._xScale(0) - k * this._refXScale(0);
    this.pMobile.position.x = offset + this.position[0];
    this.pMobile.position.y = this.position[1];

    this.pMobile.scale.x = k;
    this.pMobile.scale.y = 1;
  }

  zoomed(newXScale, newYScale, k, tx) {
    super.zoomed(newXScale, newYScale);

    this.pMain.position.x = tx; // translateX;
    this.pMain.position.y = this.position[1]; // translateY;

    this.pMain.scale.x = k; // scaleX;
    this.pMain.scale.y = 1; // scaleY;

    this.drawColorbar();
  }

  calculateVisibleTiles() {
    // if we don't know anything about this dataset, no point
    // in trying to get tiles
    if (!this.tilesetInfo) {
      return;
    }

    this.zoomLevel = this.calculateZoomLevel();

    if (this.tilesetInfo.resolutions) {
      const sortedResolutions = this.tilesetInfo.resolutions
        .map((x) => +x)
        .sort((a, b) => b - a);

      this.xTiles = tileProxy.calculateTilesFromResolution(
        sortedResolutions[this.zoomLevel],
        this._xScale,
        this.tilesetInfo.min_pos[0],
        null,
        this.tilesetInfo.tile_size,
      );
    } else {
      this.xTiles = tileProxy.calculateTiles(
        this.zoomLevel,
        this._xScale,
        this.tilesetInfo.min_pos[0],
        this.tilesetInfo.max_pos[0],
        this.tilesetInfo.max_zoom,
        this.tilesetInfo.max_width,
      );
    }

    const tiles = this.xTiles.map((x) => [this.zoomLevel, x]);

    this.setVisibleTiles(tiles);
  }

  calculateZoomLevel() {
    if (!this.tilesetInfo) return undefined;

    const minX = this.tilesetInfo.min_pos[0];

    let zoomIndexX = null;

    if (this.tilesetInfo.resolutions) {
      zoomIndexX = tileProxy.calculateZoomLevelFromResolutions(
        this.tilesetInfo.resolutions,
        this._xScale,
        minX,
      );
    } else {
      zoomIndexX = tileProxy.calculateZoomLevel(
        this._xScale,
        this.tilesetInfo.min_pos[0],
        this.tilesetInfo.max_pos[0],
      );
    }

    return zoomIndexX;
  }

  /**
   * Create the local tile identifier, which be used with the
   * tile stores in TiledPixiTrack
   *
   * @param {array} tile: [zoomLevel, xPos]
   */
  tileToLocalId(tile) {
    return tile.join('.');
  }

  /**
   * Create the remote tile identifier, which will be used to identify the
   * tile on the server
   *
   * @param {array} tile: [zoomLevel, xPos]
   */
  tileToRemoteId(tile) {
    return tile.join('.');
  }

  /**
   * Calculate the tile position at the given track position
   *
   * @param {Number} trackX: The track's X position
   * @param {Number} trackY: The track's Y position
   *
   * @return {array} [zoomLevel, tilePos]
   */
  getTilePosAtPosition(trackX, trackY) {
    if (!this.tilesetInfo) return undefined;

    const zoomLevel = this.calculateZoomLevel();

    // the width of the tile in base pairs
    const tileWidth = tileProxy.calculateTileWidth(
      this.tilesetInfo,
      zoomLevel,
      this.tilesetInfo.tile_size,
    );

    // the position of the tile containing the query position
    const tilePos = this._xScale.invert(trackX) / tileWidth;

    return [zoomLevel, Math.floor(tilePos)];
  }

  /**
   * Return the data currently visible at position X and Y
   *
   * @param {Number} trackX: The x position relative to the track's start and end
   * @param {Number} trakcY: The y position relative to the track's start and end
   */
  getVisibleData(trackX, trackY) {
    const zoomLevel = this.calculateZoomLevel();

    // the width of the tile in base pairs
    const tileWidth = tileProxy.calculateTileWidth(
      this.tilesetInfo,
      zoomLevel,
      this.tilesetInfo.tile_size,
    );

    // the position of the tile containing the query position
    const tilePos = this._xScale.invert(trackX) / tileWidth;
    let numRows = this.tilesetInfo.shape ? this.tilesetInfo.shape[1] : 1;
    if (this.options.selectRows) {
      numRows = selectedItemsToSize(
        this.options.selectRows,
        this.options.selectRowsAggregationWithRelativeHeight,
      );
    }

    // the position of query within the tile
    let posInTileX =
      this.tilesetInfo.tile_size * (tilePos - Math.floor(tilePos));
    const posInTileYNormalized = trackY / this.dimensions[1];
    const posInTileY = posInTileYNormalized * numRows;

    let selectedRowIndex = Math.floor(posInTileY);
    let selectedRowItem;
    if (this.options.selectRows) {
      // The `posInTileY` may not directly correspond to data indices if rows are filtered/reordered,
      // the `selectRows` array must be checked to convert the y-position to a data index/indices first.
      if (this.options.selectRowsAggregationWithRelativeHeight) {
        // Height must take into account the size of sub-arrays, so use the cumulative weight array.
        selectedRowIndex = this.selectRowsCumWeights.findIndex(
          (weight, i) =>
            posInTileYNormalized <= weight &&
            (i === this.selectRowsCumWeights.length - 1 ||
              this.selectRowsCumWeights[i + 1] >= posInTileYNormalized),
        );
      }
      selectedRowItem = this.options.selectRows[selectedRowIndex];
    }

    const tileId = this.tileToLocalId([zoomLevel, Math.floor(tilePos)]);
    const fetchedTile = this.fetchedTiles[tileId];

    let value = '';

    if (fetchedTile) {
      if (!this.tilesetInfo.shape) {
        posInTileX =
          fetchedTile.tileData.dense.length * (tilePos - Math.floor(tilePos));
      }
      /*
      const a = rangeQuery2d(fetchedTile.tileData.dense,
        this.tilesetInfo.shape[0],
        this.tilesetInfo.shape[1],
        [Math.floor(posInTileX), Math.floor(posInTileX)],
        [posInTileY, posInTileY],
      */
      let index = null;
      if (this.tilesetInfo.shape) {
        // Accomodate data from vector sources
        if (
          Array.isArray(selectedRowItem) &&
          this.options.selectRowsAggregationMethod === 'client'
        ) {
          // Need to aggregate, so `index` will actually be an array.
          index = selectedRowItem.map(
            (rowI) => this.tilesetInfo.shape[0] * rowI + Math.floor(posInTileX),
          );
        } else if (
          selectedRowItem &&
          this.options.selectRowsAggregationMethod === 'client'
        ) {
          index =
            this.tilesetInfo.shape[0] * selectedRowItem +
            Math.floor(posInTileX);
        } else {
          // No need to aggregate, `index` will contain a single item.
          index =
            this.tilesetInfo.shape[0] * selectedRowIndex +
            Math.floor(posInTileX);
        }
      } else {
        index =
          fetchedTile.tileData.dense.length * selectedRowIndex +
          Math.floor(posInTileX);
      }
      if (Array.isArray(index)) {
        // Need to aggregate to compute `value`.
        const aggFunc = getAggregationFunction(
          this.options.selectRowsAggregationMode,
        );
        const values = index.map((i) => fetchedTile.tileData.dense[i]);
        value = format('.3f')(aggFunc(values));
        value += '<br/>';
        value += `${index.length}-item ${this.options.selectRowsAggregationMode}`;
      } else {
        value = format('.3f')(fetchedTile.tileData.dense[index]);
        if (Array.isArray(selectedRowItem)) {
          value += '<br/>';
          value += `${selectedRowItem.length}-item ${this.options.selectRowsAggregationMode}`;
        }
      }
    }

    // add information about the row
    if (this.tilesetInfo.row_infos) {
      value += '<br/>';
      let rowInfo = '';
      if (this.options.selectRows && !Array.isArray(selectedRowItem)) {
        rowInfo = this.tilesetInfo.row_infos[selectedRowItem];
      } else if (
        selectedRowIndex >= 0 &&
        selectedRowIndex < this.tilesetInfo.row_infos.length
      ) {
        rowInfo = this.tilesetInfo.row_infos[selectedRowIndex];
      }
      if (typeof rowInfo === 'object') {
        // The simplest thing to do here is conform to the tab-separated values convention.
        value += Object.values(rowInfo).join('\t');
      } else {
        // Probably a tab-separated string since not an object.
        value += rowInfo;
      }
    }

    return `${value}`;
  }

  /**
   * Get some information to display when the mouse is over this
   * track
   *
   * @param {Number} trackX: the x position of the mouse over the track
   * @param {Number} trackY: the y position of the mouse over the track
   *
   * @return {string}: A HTML string containing the information to display
   *
   */
  getMouseOverHtml(trackX, trackY) {
    if (!this.tilesetInfo) return '';

    const tilePos = this.getTilePosAtPosition(trackX, trackY);

    let output = '';

    if (
      this.options &&
      this.options.heatmapValueScaling &&
      this.options.heatmapValueScaling === 'categorical' &&
      this.options.colorRange
    ) {
      const visibleData = this.getVisibleData(trackX, trackY);
      const elements = visibleData.split('<br/>');
      const color = this.options.colorRange[parseInt(elements[0], 10) - 1];
      const label = elements[1];
      if (
        Number.isNaN(color) ||
        color === 'NaN' ||
        typeof color === 'undefined' ||
        color === 'undefined'
      )
        return '';
      output = `<svg width="10" height="10" style="position:relative;bottom:1px"><rect width="10" height="10" rx="2" ry="2"
                 style="fill:${color};stroke:black;stroke-width:2;"></svg> ${label}`;
    } else {
      output += `Data value: ${this.getVisibleData(trackX, trackY)}</br>`;
      output += `Zoom level: ${tilePos[0]} tile position: ${tilePos[1]}`;
    }

    return output;
  }
}
