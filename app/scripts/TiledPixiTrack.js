import { scaleLinear, scaleLog, scaleQuantile } from 'd3-scale';
import { median, range, ticks } from 'd3-array';
import slugid from 'slugid';

import DataFetcher from './DataFetcher';
import PixiTrack from './PixiTrack';

// Utils
import { throttleAndDebounce, parseChromsizesRows } from './utils';
import backgroundTaskScheduler from './utils/background-task-scheduler';

// Configs
import { GLOBALS, ZOOM_DEBOUNCE } from './configs';

/**
 * Get a valueScale for a heatmap.
 *
 * If the scalingType isn't specified, then default to the defaultScaling.
 *
 * @param {string} scalingType: The type of the (e.g. 'linear', or 'log')
 * @param {number} minValue: The minimum data value to which this scale will apply
 * @param {number} pseudocount: A value to add to all numbers to prevent taking the log of 0
 * @param {number} maxValue: The maximum data value to which this scale will apply
 * @param {string} defaultScaling: The default scaling type to use in case
 * 'scalingType' is null (e.g. 'linear' or 'log')
 *
 * @returns {array} An array of [string, scale] containin the scale type
 *  and a scale with an appropriately set domain and range
 */
export function getValueScale(
  scalingType,
  minValue,
  pseudocountIn,
  maxValue,
  defaultScaling,
) {
  const scalingTypeToUse = scalingType || defaultScaling;

  // purposely set to not equal pseudocountIn for now
  // eventually this will be an option
  const pseudocount = 0;

  if (scalingTypeToUse === 'log' && minValue > 0) {
    return [
      'log',
      scaleLog()
        .range([254, 0])
        .domain([minValue + pseudocount, maxValue + pseudocount]),
    ];
  }

  if (scalingTypeToUse === 'log') {
    // warn the users that their desired scaling type couldn't be used
    // console.warn('Negative values present in data. Defaulting to linear scale: ', minValue);
  }

  return ['linear', scaleLinear().range([254, 0]).domain([minValue, maxValue])];
}

class TiledPixiTrack extends PixiTrack {
  /**
   * A track that must pull remote tiles
   *
   * @param (PIXI.scene) scene A PIXI.js scene to draw everything to.
   * @param (Object) dataConfig: A data source. Usually a
   *  ``{{server: 'x/api/v1/', tilesetUuid: 'y'}}`` Object.
   * @param {Object} handleTilesetInfoReceived: A callback to do something once once the tileset
   *  info is received. Usually it registers some information about the tileset with its
   * definition
   * @param {Object} options The track's options
   * @param {function} animate A function to redraw this track. Typically called when an
   *  asynchronous event occurs (i.e. tiles loaded)
   * @param {function} onValueScaleChanged The range of values has changed so we need to inform
   *  the higher ups that the value scale has changed. Only occurs on tracks with ``dense`` data.
   */
  constructor(context, options) {
    super(context, options);
    const {
      pubSub,
      dataConfig,
      handleTilesetInfoReceived,
      animate,
      onValueScaleChanged,
    } = context;

    // keep track of which render we're on so that we save ourselves
    // rerendering all rendering in the same version will have the same
    // scaling so tiles rendered in the same version will have the same
    // output. Mostly useful for heatmap tiles.
    this.renderVersion = 1;

    // the tiles which should be visible (although they're not necessarily fetched)
    this.visibleTiles = new Set();
    this.visibleTileIds = new Set();

    // keep track of tiles that are currently being rendered
    this.renderingTiles = new Set();

    // the tiles we already have requests out for
    this.fetching = new Set();
    this.scale = {};

    // tiles we have fetched and ready to be rendered
    this.fetchedTiles = {};

    // the graphics that have already been drawn for this track
    this.tileGraphics = {};

    this.maxZoom = 0;
    this.medianVisibleValue = null;

    this.backgroundTaskScheduler = backgroundTaskScheduler;

    // If the browser supports requestIdleCallback we use continuous
    // instead of tile based scaling
    this.continuousScaling = 'requestIdleCallback' in window;

    this.valueScaleMin = null;
    this.fixedValueScaleMin = null;
    this.valueScaleMax = null;
    this.fixedValueScaleMax = null;

    this.listeners = {};

    this.pubSub = pubSub;
    this.animate = animate;
    this.onValueScaleChanged = onValueScaleChanged;

    // store the server and tileset uid so they can be used in draw()
    // if the tileset info is not found
    this.prevValueScale = null;

    if (!context.dataFetcher) {
      this.dataFetcher = new DataFetcher(dataConfig, this.pubSub);
    } else {
      this.dataFetcher = context.dataFetcher;
    }

    // To indicate that this track is requiring a tileset info
    this.tilesetInfo = null;
    this.uuid = slugid.nice();

    // this needs to be above the tilesetInfo() call because if that
    // executes first, the call to draw() will complain that this text
    // doesn't exist
    this.trackNotFoundText = new GLOBALS.PIXI.Text('', {
      fontSize: '12px',
      fontFamily: 'Arial',
      fill: 'black',
    });

    this.pLabel.addChild(this.trackNotFoundText);

    this.refreshTilesDebounced = throttleAndDebounce(
      this.refreshTiles.bind(this),
      ZOOM_DEBOUNCE,
      ZOOM_DEBOUNCE,
    );

    this.dataFetcher.tilesetInfo((tilesetInfo, tilesetUid) => {
      if (!tilesetInfo) return;

      this.tilesetInfo = tilesetInfo;
      // If the dataConfig contained a fileUrl, then
      // we need to update the tilesetUid based
      // on the registration of the fileUrl.
      if (!this.dataFetcher.dataConfig.tilesetUid) {
        this.dataFetcher.dataConfig.tilesetUid = tilesetUid;
      }

      this.tilesetUid = this.dataFetcher.dataConfig.tilesetUid;
      this.server = this.dataFetcher.dataConfig.server || 'unknown';

      if (this.tilesetInfo && this.tilesetInfo.chromsizes) {
        this.chromInfo = parseChromsizesRows(this.tilesetInfo.chromsizes);
      }

      if ('error' in this.tilesetInfo) {
        // no tileset info for this track
        console.warn(
          'Error retrieving tilesetInfo:',
          dataConfig,
          this.tilesetInfo.error,
        );

        // Fritz: Not sure why it's reset
        // this.trackNotFoundText = '';
        this.tilesetInfo = null;

        this.setError(this.tilesetInfo.error);
        return;
      }

      if (this.tilesetInfo.resolutions) {
        this.maxZoom = this.tilesetInfo.resolutions.length;
      } else {
        this.maxZoom = +this.tilesetInfo.max_zoom;
      }

      if (this.options && this.options.maxZoom) {
        if (this.options.maxZoom >= 0) {
          this.maxZoom = Math.min(this.options.maxZoom, this.maxZoom);
        } else {
          console.error('Invalid maxZoom on track:', this);
        }
      }

      this.refreshTiles();

      if (handleTilesetInfoReceived) handleTilesetInfoReceived(tilesetInfo);

      if (!this.options) this.options = {};

      this.options.name = this.options.name || tilesetInfo.name;

      this.checkValueScaleLimits();

      this.draw();
      this.drawLabel(); // draw the label so that the current resolution is displayed
      this.animate();
    });
  }

  setError(error) {
    this.errorTextText = error;
    this.draw();
    this.animate();
  }

  setFixedValueScaleMin(value) {
    if (!Number.isNaN(+value)) this.fixedValueScaleMin = +value;
    else this.fixedValueScaleMin = null;
  }

  setFixedValueScaleMax(value) {
    if (!Number.isNaN(+value)) this.fixedValueScaleMax = +value;
    else this.fixedValueScaleMax = null;
  }

  checkValueScaleLimits() {
    this.valueScaleMin =
      typeof this.options.valueScaleMin !== 'undefined'
        ? +this.options.valueScaleMin
        : null;

    if (this.fixedValueScaleMin !== null) {
      this.valueScaleMin = this.fixedValueScaleMin;
    }

    this.valueScaleMax =
      typeof this.options.valueScaleMax !== 'undefined'
        ? +this.options.valueScaleMax
        : null;

    if (this.fixedValueScaleMax !== null) {
      this.valueScaleMax = this.fixedValueScaleMax;
    }
  }

  /**
   * Register an event listener for track events. Currently, the only supported
   * event is ``dataChanged``.
   *
   * @param {string} event The event to listen for
   * @param {function} callback The callback to call when the event occurs. The
   *  parameters for the event depend on the event called.
   *
   * @example
   *
   *  trackObj.on('dataChanged', (newData) => {
   *   console.log('newData:', newData)
   *  });
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event].push(callback);
  }

  off(event, callback) {
    const id = this.listeners[event].indexOf(callback);
    if (id === -1 || id >= this.listeners[event].length) return;

    this.listeners[event].splice(id, 1);
  }

  rerender(options) {
    super.rerender(options);

    this.renderVersion += 1;

    if (!this.tilesetInfo) {
      return;
    }

    this.checkValueScaleLimits();

    if (this.tilesetInfo.resolutions) {
      this.maxZoom = this.tilesetInfo.resolutions.length;
    } else {
      this.maxZoom = +this.tilesetInfo.max_zoom;
    }

    if (this.options && this.options.maxZoom) {
      if (this.options.maxZoom >= 0) {
        this.maxZoom = Math.min(this.options.maxZoom, this.maxZoom);
      } else {
        console.error('Invalid maxZoom on track:', this);
      }
    }
  }

  /**
   * Return the set of ids of all tiles which are both visible and fetched.
   */
  visibleAndFetchedIds() {
    return Object.keys(this.fetchedTiles).filter((x) =>
      this.visibleTileIds.has(x),
    );
  }

  visibleAndFetchedTiles() {
    return this.visibleAndFetchedIds().map((x) => this.fetchedTiles[x]);
  }

  /**
   * Set which tiles are visible right now.
   *
   * @param tiles: A set of tiles which will be considered the currently visible
   * tile positions.
   */
  setVisibleTiles(tilePositions) {
    this.visibleTiles = tilePositions.map((x) => ({
      tileId: this.tileToLocalId(x),
      remoteId: this.tileToRemoteId(x),
      mirrored: x.mirrored,
    }));

    this.visibleTileIds = new Set(this.visibleTiles.map((x) => x.tileId));
  }

  removeOldTiles() {
    this.calculateVisibleTiles();

    // tiles that are fetched
    const fetchedTileIDs = new Set(Object.keys(this.fetchedTiles));
    //
    // calculate which tiles are obsolete and remove them
    // fetchedTileID are remote ids
    const toRemove = [...fetchedTileIDs].filter(
      (x) => !this.visibleTileIds.has(x),
    );

    this.removeTiles(toRemove);
  }

  refreshTiles() {
    if (!this.tilesetInfo) {
      return;
    }

    this.calculateVisibleTiles();

    // tiles that are fetched
    const fetchedTileIDs = new Set(Object.keys(this.fetchedTiles));

    // fetch the tiles that should be visible but haven't been fetched
    // and aren't in the process of being fetched
    const toFetch = [...this.visibleTiles].filter(
      (x) => !this.fetching.has(x.remoteId) && !fetchedTileIDs.has(x.tileId),
    );

    for (let i = 0; i < toFetch.length; i++) {
      this.fetching.add(toFetch[i].remoteId);
    }

    this.removeOldTiles();
    this.fetchNewTiles(toFetch);
  }

  parentInFetched(tile) {
    const uid = tile.tileData.tilesetUid;
    let zl = tile.tileData.zoomLevel;
    let pos = tile.tileData.tilePos;

    while (zl > 0) {
      zl -= 1;
      pos = pos.map((x) => Math.floor(x / 2));

      const parentId = `${uid}.${zl}.${pos.join('.')}`;
      if (parentId in this.fetchedTiles) {
        return true;
      }
    }

    return false;
  }

  parentTileId(tile) {
    const parentZoomLevel = tile.tileData.zoomLevel - 1;
    const parentPos = tile.tileData.tilePos.map((x) => Math.floor(x / 2));
    const parentUid = tile.tileData.tilesetUid;

    return `${parentUid}.${parentZoomLevel}.${parentPos.join('.')}`;
  }

  /**
   * Remove obsolete tiles
   *
   * @param toRemoveIds: An array of tile ids to remove from the list of fetched tiles.
   */
  removeTiles(toRemoveIds) {
    // if there's nothing to remove, don't bother doing anything
    if (
      !toRemoveIds.length ||
      !this.areAllVisibleTilesLoaded() ||
      this.renderingTiles.size
    ) {
      return;
    }

    toRemoveIds.forEach((x) => {
      const tileIdStr = x;
      this.destroyTile(this.fetchedTiles[tileIdStr]);

      if (tileIdStr in this.tileGraphics) {
        this.pMain.removeChild(this.tileGraphics[tileIdStr]);
        delete this.tileGraphics[tileIdStr];
      }

      delete this.fetchedTiles[tileIdStr];
    });

    this.synchronizeTilesAndGraphics();
    this.draw();
  }

  zoomed(newXScale, newYScale, k = 1, tx = 0, ty = 0) {
    this.xScale(newXScale);
    this.yScale(newYScale);

    this.refreshTilesDebounced();

    this.pMobile.position.x = tx;
    this.pMobile.position.y = this.position[1];

    this.pMobile.scale.x = k;
    this.pMobile.scale.y = 1;
  }

  setPosition(newPosition) {
    super.setPosition(newPosition);

    // this.draw();
  }

  setDimensions(newDimensions) {
    super.setDimensions(newDimensions);

    // this.draw();
  }

  /**
   * Check to see if all the visible tiles are loaded.
   *
   * If they are, remove all other tiles.
   */
  areAllVisibleTilesLoaded() {
    // tiles that are fetched
    const fetchedTileIDs = new Set(Object.keys(this.fetchedTiles));

    const visibleTileIdsList = [...this.visibleTileIds];

    for (let i = 0; i < visibleTileIdsList.length; i++) {
      if (!fetchedTileIDs.has(visibleTileIdsList[i])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Function is called when all tiles that should be visible have
   * been received.
   */
  allTilesLoaded() {}

  minValue(_) {
    if (_) {
      this.scale.minValue = _;
      return this;
    }
    return this.valueScaleMin !== null
      ? this.valueScaleMin
      : this.scale.minValue;
  }

  maxValue(_) {
    if (_) {
      this.scale.maxValue = _;
      return this;
    }
    return this.valueScaleMax !== null
      ? this.valueScaleMax
      : this.scale.maxValue;
  }

  minRawValue() {
    // this is the minimum value from all the tiles that
    // hasn't been externally modified by locked scales
    return this.scale.minRawValue;
  }

  maxRawValue() {
    // this is the maximum value from all the tiles that
    // hasn't been externally modified by locked scales
    return this.scale.maxRawValue;
  }

  initTile(/* tile */) {
    // create the tile
    // should be overwritten by child classes
    this.scale.minRawValue = this.continuousScaling
      ? this.minVisibleValue()
      : this.minVisibleValueInTiles();
    this.scale.maxRawValue = this.continuousScaling
      ? this.maxVisibleValue()
      : this.maxVisibleValueInTiles();

    this.scale.minValue = this.scale.minRawValue;
    this.scale.maxValue = this.scale.maxRawValue;
  }

  updateTile(/* tile */) {}

  destroyTile(/* tile */) {
    // remove all data structures needed to draw this tile
  }

  addMissingGraphics() {
    /**
     * Add graphics for tiles that have no graphics
     */
    const fetchedTileIDs = Object.keys(this.fetchedTiles);
    this.renderVersion += 1;

    for (let i = 0; i < fetchedTileIDs.length; i++) {
      if (!(fetchedTileIDs[i] in this.tileGraphics)) {
        // console.trace('adding:', fetchedTileIDs[i]);

        const newGraphics = new GLOBALS.PIXI.Graphics();
        this.pMain.addChild(newGraphics);

        this.fetchedTiles[fetchedTileIDs[i]].graphics = newGraphics;
        this.initTile(this.fetchedTiles[fetchedTileIDs[i]]);

        this.tileGraphics[fetchedTileIDs[i]] = newGraphics;
      }
    }

    /*
        if (added)
            this.draw();
        */
  }

  /**
   * Change the graphics for existing tiles
   */
  updateExistingGraphics() {
    const fetchedTileIDs = Object.keys(this.fetchedTiles);

    for (let i = 0; i < fetchedTileIDs.length; i++) {
      const tile = this.fetchedTiles[fetchedTileIDs[i]];

      this.updateTile(tile);
    }
  }

  synchronizeTilesAndGraphics() {
    /**
     * Make sure that we have a one to one mapping between tiles
     * and graphics objects
     *
     */

    // keep track of which tiles are visible at the moment
    this.addMissingGraphics();
    this.removeOldTiles();
    this.updateExistingGraphics();

    if (this.listeners.dataChanged) {
      for (const callback of this.listeners.dataChanged) {
        callback(this.visibleAndFetchedTiles().map((x) => x.tileData));
      }
    }
  }

  loadTileData(tile, dataLoader) {
    /**
     * Extract drawable data from a tile loaded by a generic tile loader
     *
     * @param tile: A tile returned by a TiledArea.
     * @param dataLoader: A function for extracting drawable data from a tile. This
     *                    usually means differentiating the between dense and sparse
     *                    tiles and putting the data into an array.
     */

    // see if the data is already cached
    let loadedTileData = this.lruCache.get(tile.tileId);

    // if not, load it and put it in the cache
    if (!loadedTileData) {
      loadedTileData = dataLoader(tile.data, tile.type);
      this.lruCache.put(tile.tileId, loadedTileData);
    }

    return loadedTileData;
  }

  fetchNewTiles(toFetch) {
    if (toFetch.length > 0) {
      const toFetchList = [...new Set(toFetch.map((x) => x.remoteId))];

      this.dataFetcher.fetchTilesDebounced(
        this.receivedTiles.bind(this),
        toFetchList,
      );
    }
  }

  /**
   * We've gotten a bunch of tiles from the server in
   * response to a request from fetchTiles.
   */
  receivedTiles(loadedTiles) {
    for (let i = 0; i < this.visibleTiles.length; i++) {
      const { tileId } = this.visibleTiles[i];

      if (!loadedTiles[this.visibleTiles[i].remoteId]) continue;

      if (this.visibleTiles[i].remoteId in loadedTiles) {
        if (!(tileId in this.fetchedTiles)) {
          // this tile may have graphics associated with it
          this.fetchedTiles[tileId] = this.visibleTiles[i];
        }

        // Fritz: Store a shallow copy. If necessary we perform a deep copy of
        // the dense data in `tile-proxy.js :: tileDataToPixData()`
        // Somehow 2d rectangular domain tiles do not come in the flavor of an
        // object but an object array...
        if (Array.isArray(loadedTiles[this.visibleTiles[i].remoteId])) {
          const tileData = loadedTiles[this.visibleTiles[i].remoteId];
          this.fetchedTiles[tileId].tileData = [...tileData];
          // Fritz: this is sooo hacky... we should really not use object arrays
          Object.keys(tileData)
            .filter((key) => Number.isNaN(+key))
            .forEach((key) => {
              this.fetchedTiles[tileId].tileData[key] = tileData[key];
            });
        } else {
          this.fetchedTiles[tileId].tileData = {
            ...loadedTiles[this.visibleTiles[i].remoteId],
          };
        }

        if (this.fetchedTiles[tileId].tileData.error) {
          console.warn(
            'Error in loaded tile',
            tileId,
            this.fetchedTiles[tileId].tileData,
          );
        }
      }
    }

    // const fetchedTileIDs = new Set(Object.keys(this.fetchedTiles));

    for (const key in loadedTiles) {
      if (loadedTiles[key]) {
        const tileId = loadedTiles[key].tilePositionId;

        if (this.fetching.has(tileId)) {
          this.fetching.delete(tileId);
        }
      }
    }

    /*
     * Mainly called to remove old unnecessary tiles
     */
    this.synchronizeTilesAndGraphics();

    // we need to draw when we receive new data
    this.draw();
    this.drawLabel(); // update the current zoom level

    // Let HiGlass know we need to re-render
    // check if the value scale has changed
    if (this.valueScale) {
      if (
        !this.prevValueScale ||
        JSON.stringify(this.valueScale.domain()) !==
          JSON.stringify(this.prevValueScale.domain())
      ) {
        this.prevValueScale = this.valueScale.copy();

        if (this.onValueScaleChanged) {
          // this is used to synchronize tracks with locked value scales
          this.onValueScaleChanged();
        }
      }
    }

    this.animate();

    // 1. Check if all visible tiles are loaded
    // 2. If `true` then send out event
    if (this.areAllVisibleTilesLoaded()) {
      if (this.pubSub) {
        this.pubSub.publish('TiledPixiTrack.tilesLoaded', { uuid: this.uuid });
      }
    }
  }

  draw() {
    if (this.delayDrawing) return;

    if (!this.tilesetInfo) {
      if (this.dataFetcher.tilesetInfoLoading) {
        this.trackNotFoundText.text = 'Loading...';
      } else {
        this.trackNotFoundText.text = `Tileset info not found. Server: [${this.server}] tilesetUid: [${this.tilesetUid}]`;
      }

      [this.trackNotFoundText.x, this.trackNotFoundText.y] = this.position;

      if (this.flipText) {
        this.trackNotFoundText.anchor.x = 1;
        this.trackNotFoundText.scale.x = -1;
      }

      this.trackNotFoundText.visible = true;
    } else {
      this.trackNotFoundText.visible = false;
    }

    if (this.pubSub) {
      this.pubSub.publish('TiledPixiTrack.tilesDrawnStart', {
        uuid: this.uuid,
      });
    }
    const errors = Object.values(this.fetchedTiles)
      .map(
        (x) =>
          x.tileData && x.tileData.error && `${x.tileId}: ${x.tileData.error}`,
      )
      .filter((x) => x);

    if (errors.length) {
      this.errorTextText = errors.join('\n');
    } else {
      this.errorTextText = '';
    }

    super.draw();

    Object.keys(this.fetchedTiles).forEach((tilesetUid) => {
      this.drawTile(this.fetchedTiles[tilesetUid]);
    });
    // console.log('errors:', errors);

    if (this.pubSub) {
      this.pubSub.publish('TiledPixiTrack.tilesDrawnEnd', { uuid: this.uuid });
    }
  }

  /**
   * Draw a tile on some graphics
   */
  drawTile(/* tileData, graphics */) {}

  calculateMedianVisibleValue() {
    if (this.areAllVisibleTilesLoaded()) {
      this.allTilesLoaded();
    }

    let visibleAndFetchedIds = this.visibleAndFetchedIds();

    if (visibleAndFetchedIds.length === 0) {
      visibleAndFetchedIds = Object.keys(this.fetchedTiles);
    }

    const values = []
      .concat(
        ...visibleAndFetchedIds
          .filter((x) => this.fetchedTiles[x].tileData.dense)
          .map((x) => Array.from(this.fetchedTiles[x].tileData.dense)),
      )
      .filter((x) => x > 0);

    this.medianVisibleValue = median(values);
    return this.medianVisibleValue;
  }

  allVisibleValues() {
    return [].concat(
      ...this.visibleAndFetchedIds().map((x) =>
        Array.from(this.fetchedTiles[x].tileData.dense),
      ),
    );
  }

  // Should be overwriten by child clases to get the true minimal
  // visible value in the currently viewed area
  minVisibleValue(ignoreFixedScale = false) {
    return this.minVisibleValueInTiles(ignoreFixedScale);
  }

  minVisibleValueInTiles(ignoreFixedScale = false) {
    // Get minimum in currently visible tiles
    let visibleAndFetchedIds = this.visibleAndFetchedIds();

    if (visibleAndFetchedIds.length === 0) {
      visibleAndFetchedIds = Object.keys(this.fetchedTiles);
    }

    let min = Math.min(
      ...visibleAndFetchedIds.map(
        (x) => this.fetchedTiles[x].tileData.minNonZero,
      ),
    );

    // if there's no data, use null
    if (min === Number.MAX_SAFE_INTEGER) {
      min = null;
    }

    if (ignoreFixedScale) return min;

    return this.valueScaleMin !== null ? this.valueScaleMin : min;
  }

  // Should be overwriten by child clases to get the true maximal
  // visible value in the currently viewed area
  maxVisibleValue(ignoreFixedScale = false) {
    return this.maxVisibleValueInTiles(ignoreFixedScale);
  }

  maxVisibleValueInTiles(ignoreFixedScale = false) {
    // Get maximum in currently visible tiles
    let visibleAndFetchedIds = this.visibleAndFetchedIds();

    if (visibleAndFetchedIds.length === 0) {
      visibleAndFetchedIds = Object.keys(this.fetchedTiles);
    }

    let max = Math.max(
      ...visibleAndFetchedIds.map(
        (x) => this.fetchedTiles[x].tileData.maxNonZero,
      ),
    );

    // if there's no data, use null
    if (max === Number.MIN_SAFE_INTEGER) {
      max = null;
    }

    if (ignoreFixedScale) return max;

    return this.valueScaleMax !== null ? this.valueScaleMax : max;
  }

  makeValueScale(minValue, medianValue, maxValue, inMargin) {
    /*
     * Create a value scale that will be used to position values
     * along the y axis.
     *
     * Parameters
     * ----------
     *  minValue: number
     *    The minimum value of the data
     *  medianValue: number
     *    The median value of the data. Potentially used for adding
     *    a pseudocount
     *  maxValue: number
     *    The maximum value of the data
     *  margin: number
     *    A number of pixels to be left free on the top and bottom
     *    of the track. For example if the glyphs have a certain
     *    width and we want all of them to fit into the space.
     *
     * Returns
     * -------
     *  valueScale: d3.scale
     *      A d3 value scale
     */
    let valueScale = null;
    let offsetValue = 0;

    let margin = inMargin;

    if (margin === null || typeof margin === 'undefined') {
      margin = 6; // set a default value
    }

    let minDimension = Math.min(this.dimensions[1] - margin, margin);
    let maxDimension = Math.max(this.dimensions[1] - margin, margin);

    if (this.dimensions[1] - margin < margin) {
      // if the track becomes smaller than the margins, then just draw a flat
      // line in the center
      minDimension = this.dimensions[1] / 2;
      maxDimension = this.dimensions[1] / 2;
    }

    if (this.options.valueScaling === 'log') {
      offsetValue = medianValue;

      if (!offsetValue) {
        offsetValue = minValue;
      }

      valueScale = scaleLog()
        // .base(Math.E)
        .domain([offsetValue, maxValue + offsetValue])
        // .domain([offsetValue, this.maxValue()])
        .range([minDimension, maxDimension]);

      // pseudocount = offsetValue;
    } else if (this.options.valueScaling === 'quantile') {
      const start = this.dimensions[1] - margin;
      const end = margin;
      const quantScale = scaleQuantile()
        .domain(this.allVisibleValues())
        .range(range(start, end, (end - start) / 256));
      quantScale.ticks = (n) => ticks(start, end, n);

      return [quantScale, 0];
    } else if (this.options.valueScaling === 'setquantile') {
      const start = this.dimensions[1] - margin;
      const end = margin;
      const s = new Set(this.allVisibleValues());
      const quantScale = scaleQuantile()
        .domain([...s])
        .range(range(start, end, (end - start) / 256));
      quantScale.ticks = (n) => ticks(start, end, n);

      return [quantScale, 0];
    } else {
      // linear scale
      valueScale = scaleLinear()
        .domain([minValue, maxValue])
        .range([maxDimension, minDimension]);
    }

    return [valueScale, offsetValue];
  }
}

export default TiledPixiTrack;
