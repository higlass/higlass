import slugid from 'slugid';
import * as PIXI from 'pixi.js';

// Components
import PixiTrack from './PixiTrack';
import DataFetcher from './DataFetcher';

// Services
import { tileProxy } from './services';

// Utils
import { debounce, trimTrailingSlash as tts } from './utils';

// Configs
import { ZOOM_DEBOUNCE } from './configs';

export class ImageTilesTrack extends PixiTrack {
  /**
   * A track that must pull remote tiles
   *
   * @param scene: A PIXI.js scene to draw everything to.
   * @param options: Options
   * @param animate: PIXI renderer trigger
   */
  constructor(scene, dataConfig, handleTilesetInfoReceived, options, animate) {
    super(scene, options);

    // the tiles which should be visible (although they're not necessarily fetched)
    this.visibleTiles = new Set();
    this.visibleTileIds = new Set();

    // the tiles we already have requests out for
    this.fetching = new Set();

    // tiles we have fetched and ready to be rendered
    this.fetchedTiles = {};

    // the graphics that have already been drawn for this track
    this.tileGraphics = {};

    this.options = this.options || {};

    const minXPos = this.options.minXPos ? +this.options.minXPos : 0;
    const minYPos = this.options.minYPos ? +this.options.minYPos : 0;
    let maxXPos = this.options.maxXPos ? +this.options.maxXPos : 3120000000;
    let maxYPos = this.options.maxYPos ? +this.options.maxYPos : 3120000000;

    this.minPos = [minXPos, minYPos];
    this.maxPos = [maxXPos, maxYPos];
    this.maxZoom = this.options.maxZoom ? +this.options.maxZoom : 19;
    this.maxWidth = maxXPos;
    this.maxHeight = maxYPos;
    this.animate = animate;

    this.uuid = slugid.nice();
    this.refreshTilesDebounced = debounce(
      this.refreshTiles.bind(this), ZOOM_DEBOUNCE
    );

    this.dataConfig = dataConfig;
    this.tileSource = `${tts(dataConfig.server)}/tiles/?d=${dataConfig.tilesetUid}`;

    this.dataFetcher = new DataFetcher(dataConfig);

    this.dataFetcher.tilesetInfo((tilesetInfo) => {
      this.tilesetInfo = tilesetInfo;

      if ('error' in this.tilesetInfo) {
        console.warn(
          'Error retrieving tilesetInfo:', dataConfig, this.tilesetInfo.error
        );

        this.error = this.tilesetInfo.error;
        this.tilesetInfo = null;
        this.draw();
        this.animate();
        return;
      }

      this.maxZoom = +this.tilesetInfo.max_zoom;
      this.maxWidth = +this.tilesetInfo.max_size;
      this.maxHeight = +this.tilesetInfo.max_size;
      this.maxDim = Math.max(this.maxWidth, this.maxHeight);

      maxXPos = this.options.maxXPos || +this.tilesetInfo.max_size;
      maxYPos = this.options.maxYPos || +this.tilesetInfo.max_size;

      this.maxPos = [maxXPos, maxYPos];

      if (this.options && this.options.maxZoom) {
        if (this.options.maxZoom >= 0) {
          this.maxZoom = Math.min(this.options.maxZoom, this.maxZoom);
        } else {
          console.error('Invalid maxZoom on track:', this);
        }
      }

      this.refreshTiles();

      if (handleTilesetInfoReceived) { handleTilesetInfoReceived(tilesetInfo); }

      this.options.name = this.options.name ? this.options.name : tilesetInfo.name;

      this.draw();
      this.animate();
    });
  }

  /**
   * Add graphics for tiles that have no graphics
   */
  addMissingGraphics() {
    const fetchedTileIDs = Object.keys(this.fetchedTiles);

    for (let i = 0; i < fetchedTileIDs.length; i++) {
      if (!(fetchedTileIDs[i] in this.tileGraphics)) {
        const newGraphics = new PIXI.Graphics();

        this.pMain.addChild(newGraphics);

        this.fetchedTiles[fetchedTileIDs[i]].graphics = newGraphics;

        this.initTile(this.fetchedTiles[fetchedTileIDs[i]]);

        this.tileGraphics[fetchedTileIDs[i]] = newGraphics;
      }
    }
  }

  /**
   * Check to see if all the visible tiles are loaded.
   *
   * If they are, remove all other tiles.
   */
  areAllVisibleTilesLoaded() {
    const fetchedTileIDs = new Set(Object.keys(this.fetchedTiles));
    return [...this.visibleTileIds].every(id => fetchedTileIDs.has(id));
  }

  /**
   * Calculate the current zoom level
   *
   * @return  {Number}  The current zoom level.
   */
  calculateZoomLevel() {
    const xZoomLevel = tileProxy.calculateZoomLevel(
      this._xScale,
      this.minPos[0],
      this.maxPos[0]
    );
    const yZoomLevel = tileProxy.calculateZoomLevel(
      this._xScale,
      this.minPos[1],
      this.maxPos[1]
    );

    let zoomLevel = Math.min(Math.max(xZoomLevel, yZoomLevel), this.maxZoom);

    if (this.options && this.options.maxZoom) {
      if (this.options.maxZoom >= 0) {
        zoomLevel = Math.min(this.options.maxZoom, zoomLevel);
      } else {
        console.error('Invalid maxZoom on track:', this);
      }
    }

    return zoomLevel;
  }

  /**
   * Calculate which tiles are visible
   */
  calculateVisibleTiles() {
    // if we don't know anything about this dataset, no point
    // in trying to get tiles
    if (!this.tilesetInfo) return;

    this.zoomLevel = this.calculateZoomLevel();

    this.xTiles = tileProxy.calculateTiles(
      this.zoomLevel,
      this._xScale,
      this.minPos[0],
      this.maxPos[0],
      this.maxZoom,
      this.maxDim
    );

    this.yTiles = tileProxy.calculateTiles(
      this.zoomLevel,
      this._yScale,
      this.minPos[1],
      this.maxPos[1],
      this.maxZoom,
      this.maxDim
    );

    const rows = this.yTiles;
    const cols = this.xTiles;
    const zoomLevel = this.zoomLevel;

    // if we're mirroring tiles, then we only need tiles along the diagonal
    const tiles = [];

    // calculate the ids of the tiles that should be visible
    for (let i = 0; i < rows.length; i++) {
      for (let j = 0; j < cols.length; j++) {
        const newTile = [zoomLevel, rows[i], cols[j]];

        tiles.push(newTile);
      }
    }

    this.setVisibleTiles(tiles);
  }

  /**
   * Destroy tile graphics and unset sprite and tile data
   *
   * @param  {Object}  tile  Tile object to be destroyed.
   */
  destroyTile(tile) {
    tile.graphics.destroy();
    tile.sprite = undefined;
    tile.tileData = undefined;
  }

  /**
   * Wrapper for calling the parent class draw method.
   */
  draw() {
    if (this.delayDrawing) return;

    super.draw();
  }

  /**
   * Fetch new tiles.
   *
   * @param  {Array}  toFetch  Tiles to be fetched.
   */
  fetchNewTiles(toFetch) {
    if (toFetch.length > 0) {
      const toFetchList = [...(new Set(toFetch.map(x => x.remoteId)))];

      toFetchList.forEach((tileId) => {
        const parts = tileId.split('.');
        const src = `${this.tileSource}.${tileId}&raw=1`;

        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = src;

        img.onload = () => {
          const loadedTiles = {};
          loadedTiles[tileId] = {
            tileId,
            img,
            zoomLevel: +parts[0],
            tilePos: [+parts[1], +parts[2]],
            tileSrc: src
          };

          this.receivedTiles(loadedTiles);
        };
      });
    }
  }

  /**
   * Get the tile's position in its coordinate system.
   *
   * @param  {Integer}  zoomLevel  Current zoom level.
   * @param  {Array}  tilePos   Tile position in form of [y, x].
   * @return  {Object}  Tile position and dimension
   */
  getTilePosAndDimensions(zoomLevel, tilePos) {
    const xTilePos = tilePos[1];
    const yTilePos = tilePos[0];

    const totalWidth = this.maxPos[0] - this.minPos[0];
    const totalHeight = this.maxPos[0] - this.minPos[0];

    const minX = 0;
    const minY = 0;

    const tileWidth = totalWidth / (2 ** zoomLevel);
    const tileHeight = totalHeight / (2 ** zoomLevel);

    const tileX = minX + (xTilePos * tileWidth);
    const tileY = minY + (yTilePos * tileHeight);

    return {
      tileX,
      tileY,
      tileWidth,
      tileHeight
    };
  }

  /**
   * Initialize tile, i.e., generate, position, and add sprite from tile image
   *
   * @param  {Object}  tile  Tile to be initialized
   */
  initTile(tile) {
    // create the tile
    // should be overwritten by child classes
    const texture = new PIXI.Texture(new PIXI.BaseTexture(tile.tileData.img));
    const sprite = new PIXI.Sprite(texture);

    const graphics = tile.graphics;

    tile.sprite = sprite;

    this.setSpriteProperties(
      tile.sprite, tile.tileData.zoomLevel, tile.tileData.tilePos
    );

    graphics.removeChildren();
    graphics.addChild(tile.sprite);
  }

  /**
   * Set or get minimum value of `this.scale`.
   *
   * @param  {Number}  value  If not undefined, value to be set as minimum
   *   scale.
   * @return  {Number}  The (new) minimum scale.
   */
  minValue(value) {
    if (value) this.scale.minValue = value;
    return this.scale.minValue;
  }

  /**
   * Set or get maximum value of `this.scale`.
   *
   * @param  {Number}  value  If not undefined, value to be set as maximum
   *   scale.
   * @return  {Number}  The (new) maximum scale.
   */
  maxValue(value) {
    if (value) this.scale.maxValue = value;
    return this.scale.maxValue;
  }

  /**
   * Get minimum raw value of `this.scale`.
   *
   * @return  {Number}  The minimum raw scale. This is the minimum value from
   *   all the tiles that hasn't been externally modified by locked scales.
   */
  minRawValue() {
    return this.scale.minRawValue;
  }

  /**
   * Get minimum raw value of `this.scale`.
   *
   * @return  {Number}  The minimum raw scale. This is the maximum value from
   *   all the tiles that hasn't been externally modified by locked scales.
   */
  maxRawValue() {
    return this.scale.maxRawValue;
  }

  /**
   * We've gotten a bunch of tiles from the server in
   * response to a request from fetchTiles.
   */
  receivedTiles(loadedTiles) {
    this.visibleTiles
      .filter(tile => loadedTiles[tile.remoteId])
      .forEach((tile) => {
        if (!this.fetchedTiles[tile.tileId]) {
          // this tile may have graphics associated with it
          this.fetchedTiles[tile.tileId] = tile;
        }

        this.fetchedTiles[tile.tileId].tileData = loadedTiles[tile.remoteId];
      });

    Object.keys(loadedTiles).forEach((key) => {
      if (loadedTiles[key]) {
        if (this.fetching.has(key)) { this.fetching.delete(key); }
      }
    });

    this.synchronizeTilesAndGraphics();

    // Mainly called to remove old unnecessary tiles
    this.refreshTiles();

    // we need to draw when we receive new data
    this.draw();

    // Let HiGlass know we need to re-render
    this.animate();
  }

  /**
   * Refresh tiles, i.e., determine tiles to be removed and new tiles to be
   * loaded.
   */
  refreshTiles() {
    this.calculateVisibleTiles();

    // tiles that are fetched
    const fetchedTileIDs = new Set(Object.keys(this.fetchedTiles));

    // fetch the tiles that should be visible but haven't been fetched
    // and aren't in the process of being fetched
    const toFetch = [...this.visibleTiles].filter(
      x => !this.fetching.has(x.remoteId) && !fetchedTileIDs.has(x.tileId)
    );

    for (let i = 0; i < toFetch.length; i++) {
      this.fetching.add(toFetch[i].remoteId);
    }

    // calculate which tiles are obsolete and remove them
    // fetchedTileID are remote ids
    const toRemove = [...fetchedTileIDs]
      .filter(x => !this.visibleTileIds.has(x));

    this.removeTiles(toRemove);
    this.fetchNewTiles(toFetch);
  }

  /**
   * Update reference scales and the sprite properties
   *
   * @method  refScalesChanged
   * @author  Fritz Lekschas
   * @date    2018-01-11
   * @param   {Function}  refXScale  New X reference scale.
   * @param   {Function}  refYScale  New Y reference scale.
   */
  refScalesChanged(refXScale, refYScale) {
    super.refScalesChanged(refXScale, refYScale);

    Object.keys(this.fetchedTiles)
      .map(uid => this.fetchedTiles[uid])
      .filter(tile => tile.sprite)
      .forEach((tile) => {
        this.setSpriteProperties(
          tile.sprite, tile.tileData.zoomLevel, tile.tileData.tilePos
        );
      });
  }

  /**
   * Remove all tiles
   */
  removeAllTiles() {
    const fetchedTileIDs = new Set(Object.keys(this.fetchedTiles));

    this.removeTiles([...fetchedTileIDs]);
  }

  /**
   * Remove obsolete tiles
   *
   * @param toRemoveIds: An array of tile ids to remove from the list of
   *   fetched tiles.
   */
  removeTiles(toRemoveIds) {
    // if there's nothing to remove, don't bother doing anything
    if (!toRemoveIds.length) { return; }

    if (!this.areAllVisibleTilesLoaded()) { return; }

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

  /**
   * Set position and dimension of sprite
   *
   * @param  {Object}  sprite  Sprite to be adjusted
   * @param  {Integer}  zoomLevel  Current zoom level
   * @param  {Array}  tilePos  Pile position in form [y, x]
   */
  setSpriteProperties(sprite, zoomLevel, tilePos) {
    const {
      tileX, tileY, tileWidth, tileHeight
    } = this.getTilePosAndDimensions(zoomLevel, tilePos);

    sprite.x = this._refXScale(tileX);
    sprite.y = this._refYScale(tileY);

    const tileEndX = tileX + tileWidth;
    const tileEndY = tileY + tileHeight;

    sprite.width = this._refXScale(tileEndX) - this._refXScale(tileX);
    sprite.height = this._refYScale(tileEndY) - this._refYScale(tileY);
  }

  /**
   * Set which tiles are visible right now.
   *
   * @param tiles: A set of tiles which will be considered the currently visible
   * tile positions.
   */
  setVisibleTiles(tilePositions) {
    this.visibleTiles = tilePositions.map(x => ({
      tileId: this.tileToLocalId(x),
      remoteId: this.tileToRemoteId(x),
      mirrored: x.mirrored,
    }));

    this.visibleTileIds = new Set(this.visibleTiles.map(x => x.tileId));
  }

  /**
   * Make sure that we have a one to one mapping between tiles
   * and graphics objects
   */
  synchronizeTilesAndGraphics() {
    // keep track of which tiles are visible at the moment
    this.addMissingGraphics();
  }

  /**
   * The local tile identifier
   *
   * @param  {Array}  tile  Array containing [zoomLevel, xPos, yPos]
   * @return  {String}  Joined ID string
   */
  tileToLocalId(tile) {
    return tile.join('.');
  }

  /**
   * The tile identifier used on the server
   *
   * @param  {Array}  tile  Array containing [zoomLevel, xPos, yPos]
   * @return  {String}  Joined ID string
   */
  tileToRemoteId(tile) {
    return tile.join('.');
  }

  /**
   * Return the set of ids of all tiles which are both visible and fetched.
   */
  visibleAndFetchedIds() {
    return Object.keys(this.fetchedTiles)
      .filter(x => this.visibleTileIds.has(x));
  }

  /**
   * Return fetched and visible tiles.
   *
   * @return  {Array}  Fetched and visible tiles
   */
  visibleAndFetchedTiles() {
    return this.visibleAndFetchedIds().map(x => this.fetchedTiles[x]);
  }

  /**
   * Scale and position change handler.
   *
   * @param  {Function}  newXScale  New X scale
   * @param  {Function}  newYScale  New Y scale
   * @param  {Number}  k  New scaling
   * @param  {Number}  tx  New x position
   * @param  {Number}  ty  New y position
   */
  zoomed(newXScale, newYScale, k, tx, ty) {
    super.zoomed(newXScale, newYScale);

    this.xScale(newXScale);
    this.yScale(newYScale);

    this.pMain.position.x = tx; // translateX;
    this.pMain.position.y = ty; // translateY;

    this.pMain.scale.x = k; // scaleX;
    this.pMain.scale.y = k; // scaleY;

    this.refreshTilesDebounced();
  }
}

export default ImageTilesTrack;
