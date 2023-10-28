// @ts-nocheck
import { scaleLinear } from 'd3-scale';

import TiledPixiTrack from './TiledPixiTrack';

import { tileProxy } from './services';

const BINS_PER_TILE = 1024;

class Tiled1DPixiTrack extends TiledPixiTrack {
  constructor(context, options) {
    super(context, options);

    const { onMouseMoveZoom, isValueScaleLocked, getLockGroupExtrema } =
      context;

    this.onMouseMoveZoom = onMouseMoveZoom;
    this.isValueScaleLocked = isValueScaleLocked;
    this.getLockGroupExtrema = getLockGroupExtrema;

    if (this.onMouseMoveZoom) {
      this.pubSubs.push(
        this.pubSub.subscribe(
          'app.mouseMove',
          this.mouseMoveHandler.bind(this),
        ),
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
    this.visibleTiles = tilePositions.map((x) => ({
      tileId: this.tileToLocalId(x),
      remoteId: this.tileToRemoteId(x),
    }));

    this.visibleTileIds = new Set(this.visibleTiles.map((x) => x.tileId));
  }

  calculateVisibleTiles() {
    // if we don't know anything about this dataset, no point
    // in trying to get tiles
    if (!this.tilesetInfo) {
      return;
    }

    // calculate the zoom level given the scales and the data bounds
    this.zoomLevel = this.calculateZoomLevel();

    if (this.tilesetInfo.resolutions) {
      const sortedResolutions = this.tilesetInfo.resolutions
        .map((x) => +x)
        .sort((a, b) => b - a);

      const xTiles = tileProxy.calculateTilesFromResolution(
        sortedResolutions[this.zoomLevel],
        this._xScale,
        this.tilesetInfo.min_pos[0],
        this.tilesetInfo.max_pos[0],
      );

      const tiles = xTiles.map((x) => [this.zoomLevel, x]);
      this.setVisibleTiles(tiles);
      return;
    }

    // x doesn't necessary mean 'x' axis, it just refers to the relevant axis
    // (x if horizontal, y if vertical)
    const xTiles = tileProxy.calculateTiles(
      this.zoomLevel,
      this.relevantScale(),
      this.tilesetInfo.min_pos[0],
      this.tilesetInfo.max_pos[0],
      this.tilesetInfo.max_zoom,
      this.tilesetInfo.max_width,
    );

    const tiles = xTiles.map((x) => [this.zoomLevel, x]);
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
        .map((x) => +x)
        .sort((a, b) => b - a);

      const chosenResolution = sortedResolutions[zoomLevel];

      const tileWidth = chosenResolution * binsPerTile;
      const tileHeight = tileWidth;

      const tileX = chosenResolution * binsPerTile * tilePos[0];
      const tileY = chosenResolution * binsPerTile * tilePos[1];

      return {
        tileX,
        tileY,
        tileWidth,
        tileHeight,
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
      tileHeight,
    };
  }

  updateTile(tile) {
    // no need to redraw this tile, usually
    // unless the data scale changes or something like that
  }

  scheduleRerender() {
    this.backgroundTaskScheduler.enqueueTask(
      this.handleRerender.bind(this),
      null,
      this.uuid,
    );
  }

  handleRerender() {
    this.rerender(this.options, false);
  }

  getIndicesOfVisibleDataInTile(tile) {
    const visible = this._xScale.range();

    if (!this.tilesetInfo) return [null, null];

    const { tileX, tileWidth } = this.getTilePosAndDimensions(
      tile.tileData.zoomLevel,
      tile.tileData.tilePos,
      this.tilesetInfo.bins_per_dimension || this.tilesetInfo.tile_size,
    );

    const tileXScale = scaleLinear()
      .domain([
        0,
        this.tilesetInfo.tile_size || this.tilesetInfo.bins_per_dimension,
      ])
      .range([tileX, tileX + tileWidth]);

    const start = Math.max(
      0,
      Math.round(tileXScale.invert(this._xScale.invert(visible[0]))),
    );
    const end = Math.min(
      tile.tileData.dense.length,
      Math.round(tileXScale.invert(this._xScale.invert(visible[1]))),
    );

    return [start, end];
  }

  /**
   * Returns the minimum in the visible area (not visible tiles)
   */
  minVisibleValue(ignoreFixedScale = false) {
    let visibleAndFetchedIds = this.visibleAndFetchedIds();

    if (visibleAndFetchedIds.length === 0) {
      visibleAndFetchedIds = Object.keys(this.fetchedTiles);
    }

    const minimumsPerTile = visibleAndFetchedIds
      .map((x) => this.fetchedTiles[x])
      .map((tile) => {
        const ind = this.getIndicesOfVisibleDataInTile(tile);
        return tile.tileData.denseDataExtrema.getMinNonZeroInSubset(ind);
      });

    const min = Math.min(...minimumsPerTile);

    if (ignoreFixedScale) return min;

    return this.valueScaleMin !== null ? this.valueScaleMin : min;
  }

  /**
   * Returns the maximum in the visible area (not visible tiles)
   */
  maxVisibleValue(ignoreFixedScale = false) {
    let visibleAndFetchedIds = this.visibleAndFetchedIds();

    if (visibleAndFetchedIds.length === 0) {
      visibleAndFetchedIds = Object.keys(this.fetchedTiles);
    }

    const maximumsPerTile = visibleAndFetchedIds
      .map((x) => this.fetchedTiles[x])
      .map((tile) => {
        const ind = this.getIndicesOfVisibleDataInTile(tile);
        return tile.tileData.denseDataExtrema.getMaxNonZeroInSubset(ind);
      });

    const max = Math.max(...maximumsPerTile);

    if (ignoreFixedScale) return max;

    return this.valueScaleMax !== null ? this.valueScaleMax : max;
  }

  /**
   * Return an aggregated visible value. For example, the minimum or maximum.
   *
   * @description
   *   The difference to `minVisibleValueInTiles`
   *   is that the truly visible min or max value is returned instead of the
   *   min or max value of the tile. The latter is not necessarily visible.
   *
   *   For 'min' and 'max' this is identical to minVisibleValue and maxVisibleValue
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
      .map((x) => this.fetchedTiles[x])
      .map((tile) => {
        if (!tile.tileData.tilePos) {
          return aggregator === 'min'
            ? this.minVisibleValue()
            : this.maxVisibleValue();
        }

        const { tileX, tileWidth } = this.getTilePosAndDimensions(
          tile.tileData.zoomLevel,
          tile.tileData.tilePos,
          this.tilesetInfo.bins_per_dimension || this.tilesetInfo.tile_size,
        );

        const tileXScale = scaleLinear()
          .domain([
            0,
            this.tilesetInfo.tile_size || this.tilesetInfo.bins_per_dimension,
          ])
          .range([tileX, tileX + tileWidth]);

        const start = Math.max(
          0,
          Math.round(tileXScale.invert(this._xScale.invert(visible[0]))),
        );
        const end = Math.min(
          tile.tileData.dense.length,
          Math.round(tileXScale.invert(this._xScale.invert(visible[1]))),
        );

        return tile.tileData.dense.slice(start, end);
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
      this.tilesetInfo,
      zoomLevel,
      this.tilesetInfo.tile_size,
    );

    // console.log('dataPos:', this._xScale.invert(relPos));

    const tilePos = this._xScale.invert(relPos) / tileWidth;
    const tileId = this.tileToLocalId([zoomLevel, Math.floor(tilePos)]);
    const fetchedTile = this.fetchedTiles[tileId];

    if (!fetchedTile) return value;

    const posInTileX =
      this.tilesetInfo.tile_size * (tilePos - Math.floor(tilePos));

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
