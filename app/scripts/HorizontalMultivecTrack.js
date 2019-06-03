import { format } from 'd3-format';

import HeatmapTiledPixiTrack from './HeatmapTiledPixiTrack';

import { tileProxy } from './services';
import { createSVGElement } from './utils';

export default class HorizontalMultivecTrack extends HeatmapTiledPixiTrack {
  constructor(context, options) {
    super(context, options);
    this.pMain = this.pMobile;
  }

  tileDataToCanvas(pixData) {
    const canvas = document.createElement('canvas');

    if (this.tilesetInfo.shape) {
      canvas.width = this.tilesetInfo.shape[0];
      canvas.height = this.tilesetInfo.shape[1];
    } else {
      canvas.width = this.tilesetInfo.tile_size; // , pixData.length / 4);
      canvas.height = 1;
    }

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (pixData.length) {
      const pix = new ImageData(pixData, canvas.width, canvas.height);
      ctx.putImageData(pix, 0, 0);
    }

    return canvas;
  }

  setSpriteProperties(sprite, zoomLevel, tilePos) {
    const { tileX, tileWidth } = this.getTilePosAndDimensions(zoomLevel,
      tilePos,
      this.tilesetInfo.tile_size);

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
    if (!this.tilesetInfo) { return; }

    this.zoomLevel = this.calculateZoomLevel();

    if (this.tilesetInfo.resolutions) {
      const sortedResolutions = this.tilesetInfo.resolutions
        .map(x => +x).sort((a, b) => b - a);

      this.xTiles = tileProxy.calculateTilesFromResolution(
        sortedResolutions[this.zoomLevel],
        this._xScale,
        this.tilesetInfo.min_pos[0],
        null,
        this.tilesetInfo.tile_size
      );
    } else {
      this.xTiles = tileProxy.calculateTiles(
        this.zoomLevel,
        this._xScale,
        this.tilesetInfo.min_pos[0],
        this.tilesetInfo.max_pos[0],
        this.tilesetInfo.max_zoom,
        this.tilesetInfo.max_width
      );
    }

    const tiles = this.xTiles.map(x => [this.zoomLevel, x]);

    this.setVisibleTiles(tiles);
  }

  calculateZoomLevel() {
    if (!this.tilesetInfo) return undefined;

    const minX = this.tilesetInfo.min_pos[0];

    let zoomIndexX = null;

    if (this.tilesetInfo.resolutions) {
      zoomIndexX = tileProxy.calculateZoomLevelFromResolutions(
        this.tilesetInfo.resolutions, this._xScale, minX
      );
    } else {
      zoomIndexX = tileProxy.calculateZoomLevel(
        this._xScale,
        this.tilesetInfo.min_pos[0],
        this.tilesetInfo.max_pos[0]
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
      this.tilesetInfo, zoomLevel, this.tilesetInfo.tile_size
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
      this.tilesetInfo, zoomLevel, this.tilesetInfo.tile_size
    );

    // the position of the tile containing the query position
    const tilePos = this._xScale.invert(trackX) / tileWidth;
    const numRows = this.tilesetInfo.shape ? this.tilesetInfo.shape[1] : 1;

    // the position of query within the tile
    let posInTileX = this.tilesetInfo.tile_size * (tilePos - Math.floor(tilePos));
    const posInTileY = (trackY / this.dimensions[1]) * numRows;


    const tileId = this.tileToLocalId([zoomLevel, Math.floor(tilePos)]);
    const fetchedTile = this.fetchedTiles[tileId];

    let value = '';

    if (fetchedTile) {
      if (!this.tilesetInfo.shape) {
        posInTileX = fetchedTile.tileData.dense.length * (tilePos - Math.floor(tilePos));
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
        // accomodate data from vector sources
        index = this.tilesetInfo.shape[0] * Math.floor(posInTileY) + Math.floor(posInTileX);
      } else {
        index = fetchedTile.tileData.dense.length * Math.floor(posInTileY) + Math.floor(posInTileX);
      }
      value = format('.3f')(fetchedTile.tileData.dense[index]);
    }

    // add information about the row
    if (this.tilesetInfo.row_infos) {
      value += '<br/>';
      value += this.tilesetInfo.row_infos[Math.floor(posInTileY)];
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

    let output = `Data value: ${this.getVisibleData(trackX, trackY)}</br>`;
    output += `Zoom level: ${tilePos[0]} tile position: ${tilePos[1]}`;

    return output;
  }

  exportSVG() {
    let track = null;
    let base = null;

    if (super.exportSVG) {
      [base, track] = super.exportSVG();
    } else {
      base = createSVGElement('g');
      track = base;
    }

    const output = createSVGElement('g');
    track.appendChild(output);

    output.setAttribute(
      'transform',
      `translate(${this.pMain.position.x},${this.pMain.position.y}) scale(${this.pMain.scale.x},${this.pMain.scale.y})`,
    );

    for (const tile of this.visibleAndFetchedTiles()) {
      const rotation = tile.sprite.rotation * 180 / Math.PI;
      const g = createSVGElement('g');
      g.setAttribute(
        'transform',
        `translate(${tile.sprite.x},${tile.sprite.y}) rotate(${rotation}) scale(${tile.sprite.scale.x},${tile.sprite.scale.y})`,
      );

      const image = createSVGElement('image');
      image.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', tile.canvas.toDataURL());
      image.setAttribute('width', tile.canvas.width);
      image.setAttribute('height', tile.canvas.height);

      g.appendChild(image);
      output.appendChild(g);
    }

    const gColorbar = this.exportColorBarSVG();
    track.appendChild(gColorbar);

    return [base, track];
  }
}
