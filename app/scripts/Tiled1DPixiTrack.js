import { scaleLinear } from 'd3-scale';

import TiledPixiTrack from './TiledPixiTrack';

import { tileProxy } from './services';

import backgroundTaskScheduler from './utils/background-task-scheduler';


const BINS_PER_TILE = 1024;

class Tiled1DPixiTrack extends TiledPixiTrack {
  constructor(context, options) {
    super(context, options);

    const {
      onMouseMoveZoom,
    } = context;

    this.onMouseMoveZoom = onMouseMoveZoom;

    if (this.onMouseMoveZoom) {
      this.pubSubs.push(
        this.pubSub.subscribe('app.mouseMove', this.mouseMoveHandler.bind(this))
      );
    }
  }

  initTile(tile) {
    /**
         * We don't need to do anything but draw the tile.
         *
         * Child classes that rely on transforming tiles when zooming
         * and panning can override this function to draw all the elements
         * that will later be transformed.
         */
    // this.drawTile(tile);
    super.initTile(tile);
  }

  tileToLocalId(tile) {
    /*
         * The local tile identifier
         */

    // tile contains [zoomLevel, xPos]
    return `${tile.join('.')}`;
  }

  tileToRemoteId(tile) {
    /**
         * The tile identifier used on the server
         */

    // tile contains [zoomLevel, xPos]
    return `${tile.join('.')}`;
  }


  relevantScale() {
    /**
         * Which scale should we use for calculating tile positions?
         *
         * Horizontal tracks should use the xScale and vertical tracks
         * should use the yScale
         *
         * This function should be overwritten by HorizontalTiled1DPixiTrack.js
         * and VerticalTiled1DPixiTrack.js
         */
    return null;
  }

  setVisibleTiles(tilePositions) {
    /**
         * Set which tiles are visible right now.
         *
         * @param tiles: A set of tiles which will be considered the currently visible
         * tile positions.
         */
    this.visibleTiles = tilePositions.map(x => ({
      tileId: this.tileToLocalId(x),
      remoteId: this.tileToRemoteId(x),
    }));

    this.visibleTileIds = new Set(this.visibleTiles.map(x => x.tileId));
  }

  calculateVisibleTiles() {
    // if we don't know anything about this dataset, no point
    // in trying to get tiles
    if (!this.tilesetInfo) { return; }

    // calculate the zoom level given the scales and the data bounds
    this.zoomLevel = this.calculateZoomLevel();

    if (this.tilesetInfo.resolutions) {
      const sortedResolutions = this.tilesetInfo.resolutions
        .map(x => +x)
        .sort((a, b) => b - a);

      const xTiles = tileProxy.calculateTilesFromResolution(
        sortedResolutions[this.zoomLevel],
        this._xScale,
        this.tilesetInfo.min_pos[0], this.tilesetInfo.max_pos[0]
      );

      const tiles = xTiles.map(x => [this.zoomLevel, x]);
      this.setVisibleTiles(tiles);
      return;
    }

    // x doesn't necessary mean 'x' axis, it just refers to the relevant axis
    // (x if horizontal, y if vertical)
    const xTiles = tileProxy.calculateTiles(this.zoomLevel, this.relevantScale(),
      this.tilesetInfo.min_pos[0],
      this.tilesetInfo.max_pos[0],
      this.tilesetInfo.max_zoom,
      this.tilesetInfo.max_width);

    const tiles = xTiles.map(x => [this.zoomLevel, x]);
    this.setVisibleTiles(tiles);
  }


  getTilePosAndDimensions(zoomLevel, tilePos, binsPerTileIn) {
    /**
         * Get the tile's position in its coordinate system.
         */
    const xTilePos = tilePos[0];
    const yTilePos = tilePos[0];


    if (this.tilesetInfo.resolutions) {
      // the default bins per tile which should
      // not be used because the right value should be in the tileset info

      const binsPerTile = binsPerTileIn || BINS_PER_TILE;

      const sortedResolutions = this.tilesetInfo.resolutions
        .map(x => +x)
        .sort((a, b) => b - a);

      const chosenResolution = sortedResolutions[zoomLevel];

      const tileWidth = chosenResolution * binsPerTile;
      const tileHeight = tileWidth;

      const tileX = chosenResolution * binsPerTile * tilePos[0];
      const tileY = chosenResolution * binsPerTile * tilePos[1];

      return {
        tileX, tileY, tileWidth, tileHeight
      };
    }

    // max_width should be substitutable with 2 ** tilesetInfo.max_zoom
    const totalWidth = this.tilesetInfo.max_width;
    const totalHeight = this.tilesetInfo.max_width;

    const minX = this.tilesetInfo.min_pos[0];
    const minY = this.tilesetInfo.min_pos[1];

    const tileWidth = totalWidth / 2 ** zoomLevel;
    const tileHeight = totalHeight / 2 ** zoomLevel;

    const tileX = minX + xTilePos * tileWidth;
    const tileY = minY + yTilePos * tileHeight;

    return {
      tileX,
      tileY,
      tileWidth,
      tileHeight
    };
  }

  updateTile(tile) {
    // no need to redraw this tile, usually
    // unless the data scale changes or something like that


  }

  scheduleRerenderEvent() {
    if (this.continuousScaling) {
      backgroundTaskScheduler.enqueueTask(this.handleRerender.bind(this), null, this.uuid);
    } else {
      // fall back to tile based panning
    }
  }

  handleRerender() {
    this.rerender(this.options, true);
  }


  // scheduleRerenderEvent() {

  //   // requestIdleCallback is not yet supported by all browsers
  //   if ('requestIdleCallback' in window) {
  //     // Only schedule the rIC if one has not already been set.
  //     if (this.scheduledReRenderEventHandle !== undefined){
  //       window.cancelIdleCallback(this.scheduledReRenderEventHandle);
  //     }
  //     console.log(this.scheduledReRenderEventHandle);
  //     // Wait at most 400ms before processing events.
  //     this.scheduledReRenderEventHandle =
  //       window.requestIdleCallback(this.handleRenderer.bind(this), { timeout: 200 });
  //     console.log(this.scheduledReRenderEventHandle);

  //   } else {
  //     // fall back to tile based panning
  //   }
  // }

  // handleRenderer(deadline){

  //   this.isRendererIdleCallbackScheduled = false;

  //   if (typeof deadline === 'undefined'){
  //     deadline = { timeRemaining: function () { return Number.MAX_VALUE } };
  //   }

  //   // Go for as long as there is time remaining.
  //   if (deadline.timeRemaining() > 0 || deadline.didTimeout) {
  //     console.log("fire");
  //     this.rerender(this.options, true);
  //   }
  // }


  updateMinMaxVisibleValues(min = null, max = null) {
    if (min === null || max === null) {
      this.minimalVisibleValue = this.minVisibleValue();
      this.maximalVisibleValue = this.maxVisibleValue();
    } else {
      this.minimalVisibleValue = min;
      this.maximalVisibleValue = max;
    }
  }


  allVisibleValues() {
    if (!this.continuousScaling) {
      return super.allVisibleValues();
    }

    // Get values that are currently visible in the view
    let visibleAndFetchedIds = this.visibleAndFetchedIds();

    if (visibleAndFetchedIds.length === 0) {
      visibleAndFetchedIds = Object.keys(this.fetchedTiles);
    }

    const visible = this._xScale.range();

    const relevantData = visibleAndFetchedIds
      .map(x => this.fetchedTiles[x])
      .map((tile) => {
        const { tileX, tileWidth } = this.getTilePosAndDimensions(
          tile.tileData.zoomLevel,
          tile.tileData.tilePos,
          this.tilesetInfo.bins_per_dimension || this.tilesetInfo.tile_size
        );

        const tileXScale = scaleLinear()
          .domain([
            0, this.tilesetInfo.tile_size || this.tilesetInfo.bins_per_dimension
          ])
          .range([tileX, tileX + tileWidth]);

        const start = Math.max(
          0,
          Math.round(tileXScale.invert(this._xScale.invert(visible[0])))
        );
        const end = Math.min(
          tile.tileData.dense.length,
          Math.round(tileXScale.invert(this._xScale.invert(visible[1])))
        );

        return tile.tileData.dense.slice(start, end);
      });

    // The loop is faster than more elegant solutions
    // let flattenedData = [];
    // for (let i = 0; i < relevantData.length; i++) {
    //   let current = relevantData[i];
    //   for (let j = 0; j < current.length; j++)
    //   flattenedData.push(current[j]);
    // }
    return relevantData;
  }

  minVisibleValue(ignoreFixedScale = false) {
    if (!this.continuousScaling) {
      return super.minVisibleValue(ignoreFixedScale);
    }


    const visibleData = this.allVisibleValues();

    // We compute the minimal nonzero value (as in the parent method)
    const min = visibleData.reduce(
      (smallest, current) => Math.min(smallest, ...(current.filter(x => Math.abs(x) > 1e-6))), Infinity // eslint-disable-line
    );

    if (ignoreFixedScale) return min;

    return this.valueScaleMin !== null
      ? this.valueScaleMin
      : min;
  }

  maxVisibleValue(ignoreFixedScale = false) {
    if (!this.continuousScaling) {
      return super.maxVisibleValue(ignoreFixedScale);
    }

    // We compute the minimal nonzero value (as in the parent method)
    const visibleData = this.allVisibleValues();
    const max = visibleData.reduce(
      (largest, current) => Math.max(largest, ...(current.filter(x => Math.abs(x) > 1e-6))), -Infinity // eslint-disable-line
    );

    if (ignoreFixedScale) return max;

    return this.valueScaleMax !== null
      ? this.valueScaleMax
      : max;
  }


  /**
   * Return the minimal and maximal visible values.
   *
   * @description
   *   The difference to `minVisibleValue` and `maxVisibleValue`
   *   is that the truly visible min or max value is returned instead of the
   *   min or max value of the tile. The latter is not necessarily visible.
   *
   * @return {array} The minimum and maximum  as array [min, max].
   */
  getMinMaxVisibleValues() {
    let visibleAndFetchedIds = this.visibleAndFetchedIds();

    if (visibleAndFetchedIds.length === 0) {
      visibleAndFetchedIds = Object.keys(this.fetchedTiles);
    }

    const visible = this._xScale.range();

    const relevantData = visibleAndFetchedIds
      .map(x => this.fetchedTiles[x])
      .map((tile) => {
        if (!tile.tileData.tilePos) {
          return [this.minVisibleValue(), this.maxVisibleValue()];
        }

        const { tileX, tileWidth } = this.getTilePosAndDimensions(
          tile.tileData.zoomLevel,
          tile.tileData.tilePos,
          this.tilesetInfo.bins_per_dimension || this.tilesetInfo.tile_size
        );

        const tileXScale = scaleLinear()
          .domain([
            0, this.tilesetInfo.tile_size || this.tilesetInfo.bins_per_dimension
          ])
          .range([tileX, tileX + tileWidth]);

        const start = Math.max(
          0,
          Math.round(tileXScale.invert(this._xScale.invert(visible[0])))
        );
        const end = Math.min(
          tile.tileData.dense.length,
          Math.round(tileXScale.invert(this._xScale.invert(visible[1])))
        );

        return tile.tileData.dense.slice(start, end).filter(x => !Number.isNaN(x));
        // return tile.tileData.dense.slice(start, end);
      });

    const min = relevantData.reduce(
      (smallest, current) => Math.min(smallest, ...current), Infinity
    );
    const max = relevantData.reduce(
      (largest, current) => Math.max(largest, ...current), -Infinity
    );

    return [min, max];
  }


  /**
   * Return an aggregated visible value. For example, the minimum or maximum.
   *
   * @description
   *   The difference to `minVisibleValue`
   *   is that the truly visible min or max value is returned instead of the
   *   min or max value of the tile. The latter is not necessarily visible.
   *
   * @param  {string} aggregator Aggregation method. Currently supports `min`
   *   and `max` only.
   * @return {number} The aggregated value.
   */
  getAggregatedVisibleValue(aggregator = 'max') {
    const aggregate = aggregator === 'min' ? Math.min : Math.max;
    const limit = aggregator === 'min' ? Infinity : -Infinity;

    let visibleAndFetchedIds = this.visibleAndFetchedIds();

    if (visibleAndFetchedIds.length === 0) {
      visibleAndFetchedIds = Object.keys(this.fetchedTiles);
    }

    const visible = this._xScale.range();

    return visibleAndFetchedIds
      .map(x => this.fetchedTiles[x])
      .map((tile) => {
        if (!tile.tileData.tilePos) {
          return aggregator === 'min'
            ? this.minVisibleValue()
            : this.maxVisibleValue();
        }

        const { tileX, tileWidth } = this.getTilePosAndDimensions(
          tile.tileData.zoomLevel,
          tile.tileData.tilePos,
          this.tilesetInfo.bins_per_dimension || this.tilesetInfo.tile_size
        );

        const tileXScale = scaleLinear()
          .domain([
            0, this.tilesetInfo.tile_size || this.tilesetInfo.bins_per_dimension
          ])
          .range([tileX, tileX + tileWidth]);

        const start = Math.max(
          0,
          Math.round(tileXScale.invert(this._xScale.invert(visible[0])))
        );
        const end = Math.min(
          tile.tileData.dense.length,
          Math.round(tileXScale.invert(this._xScale.invert(visible[1])))
        );

        return tile.tileData.dense.slice(start, end).filter(x => !Number.isNaN(x));
      })
      .reduce((smallest, current) => aggregate(smallest, ...current), limit);
  }

  /**
   * Get the data value at a relative pixel position
   * @param   {number}  relPos  Relative pixel position, where 0 indicates the
   *   start of the track
   * @return  {number}  The data value at `relPos`
   */
  getDataAtPos(relPos) {
    let value;

    if (!this.tilesetInfo) return value;

    const zoomLevel = this.calculateZoomLevel();
    const tileWidth = tileProxy.calculateTileWidth(
      this.tilesetInfo, zoomLevel, this.tilesetInfo.tile_size
    );

    // console.log('dataPos:', this._xScale.invert(relPos));

    const tilePos = this._xScale.invert(relPos) / tileWidth;
    const tileId = this.tileToLocalId([zoomLevel, Math.floor(tilePos)]);
    const fetchedTile = this.fetchedTiles[tileId];

    if (!fetchedTile) return value;

    const posInTileX = (
      this.tilesetInfo.tile_size * (tilePos - Math.floor(tilePos))
    );

    if (fetchedTile.tileData.dense) {
      // gene annotation tracks, for example, don't have dense
      // data
      return fetchedTile.tileData.dense[Math.floor(posInTileX)];
    }

    return null;
  }

  mouseMoveHandler({ x, y } = {}) {
    if (!this.isWithin(x, y)) return;

    this.mouseX = x;
    this.mouseY = y;

    this.mouseMoveZoomHandler();
  }

  mouseMoveZoomHandler() {
    // Implemented in the horizontal and vertical sub-classes
  }

  zoomed(...args) {
    super.zoomed(...args);
    this.mouseMoveZoomHandler();
  }
}

export default Tiled1DPixiTrack;
