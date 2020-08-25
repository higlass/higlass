import slugid from 'slugid';

import PixiTrack from './PixiTrack';

// Services
import { tileProxy } from './services';

// Utils
import { debounce } from './utils';

// Configs
import { GLOBALS, ZOOM_DEBOUNCE } from './configs';

class OSMTilesTrack extends PixiTrack {
  /**
   * A track that must pull remote tiles
   *
   * @param scene: A PIXI.js scene to draw everything to.
   * @param server: The server to pull tiles from.
   * @param tilesetUid: The data set to get the tiles from the server
   */
  constructor(context, options) {
    super(context, options);
    const { animate } = context;

    // Force OpenStreetMaps copyright
    // this.options.name = `© OpenStreetMap${options.name ? `\n${options.name}` : ''}`;

    // the tiles which should be visible (although they're not necessarily fetched)
    this.visibleTiles = new Set();
    this.visibleTileIds = new Set();

    // the tiles we already have requests out for
    this.fetching = new Set();

    // tiles we have fetched and ready to be rendered
    this.fetchedTiles = {};

    // the graphics that have already been drawn for this track
    this.tileGraphics = {};

    this.minX =
      typeof this.options.minPos !== 'undefined' &&
      !Number.isNaN(+this.options.minPos)
        ? +this.options.minPos
        : -180;
    this.maxX = +this.options.maxPos || 180;

    this.maxX =
      typeof this.options.maxPos !== 'undefined' &&
      !Number.isNaN(+this.options.maxPos)
        ? +this.options.maxPos
        : 180;

    // HiGlass currently only supports squared tile sets but maybe in the
    // future...
    this.minY = this.options.minY || this.minX;
    this.maxY = this.options.maxY || this.maxX;

    this.maxZoom = 19;
    this.maxWidth = this.maxX - this.minX;
    this.animate = animate;

    this.uuid = slugid.nice();
    this.refreshTilesDebounced = debounce(
      this.refreshTiles.bind(this),
      ZOOM_DEBOUNCE,
    );
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

  removeAllTiles() {
    const fetchedTileIDs = new Set(Object.keys(this.fetchedTiles));

    this.removeTiles([...fetchedTileIDs]);
  }

  refreshTiles() {
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

    // calculate which tiles are obsolete and remove them
    // fetchedTileID are remote ids
    const toRemove = [...fetchedTileIDs].filter(
      (x) => !this.visibleTileIds.has(x),
    );

    this.removeTiles(toRemove);
    this.fetchNewTiles(toFetch);
  }

  /**
   * Remove obsolete tiles
   *
   * @param toRemoveIds: An array of tile ids to remove from the list of fetched tiles.
   */
  removeTiles(toRemoveIds) {
    // if there's nothing to remove, don't bother doing anything
    if (!toRemoveIds.length) {
      return;
    }

    if (!this.areAllVisibleTilesLoaded()) {
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

  /*
   * The local tile identifier.
   * @param  {array}  tile  Contains `[zoomLevel, xPos, yPos]`.
   * @return  {string}  Remote ID string
   */
  tileToLocalId(tile) {
    // tile contains
    return tile.join('.');
  }

  /**
   * The tile identifier used on the server.
   * @param   {array}  tile  Contains `[zoomLevel, xPos, yPos]`.
   * @return  {string}  Remote ID string
   */
  tileToRemoteId(tile) {
    return tile.join('.');
  }

  localToRemoteId(remoteId) {
    const idParts = remoteId.split('.');
    return idParts.slice(0, idParts.length - 1).join('.');
  }

  calculateZoomLevel() {
    const xZoomLevel = tileProxy.calculateZoomLevel(
      this._xScale,
      this.minX,
      this.maxX,
    );
    const yZoomLevel = tileProxy.calculateZoomLevel(
      this._xScale,
      this.minY,
      this.maxY,
    );

    let zoomLevel = Math.min(Math.max(xZoomLevel, yZoomLevel), this.maxZoom);

    if (this.options.maxZoom) {
      if (this.options.maxZoom >= 0) {
        zoomLevel = Math.min(this.options.maxZoom, zoomLevel);
      } else {
        console.error('Invalid maxZoom on track:', this);
      }
    }

    return zoomLevel;
  }

  calculateVisibleTiles() {
    // if we don't know anything about this dataset, no point
    // in trying to get tiles

    this.zoomLevel = this.calculateZoomLevel();

    this.xTiles = tileProxy.calculateTiles(
      this.zoomLevel,
      this._xScale,
      this.minX,
      this.maxX,
      this.maxZoom,
      this.maxWidth,
    );

    this.yTiles = tileProxy.calculateTiles(
      this.zoomLevel,
      this._yScale,
      this.minY,
      this.maxY,
      this.maxZoom,
      this.maxWidth,
    );

    const rows = this.xTiles;
    const cols = this.yTiles;
    const zoomLevel = this.zoomLevel;

    // if we're mirroring tiles, then we only need tiles along the diagonal
    const tiles = [];
    // console.log('this.options:', this.options);

    // calculate the ids of the tiles that should be visible
    for (let i = 0; i < rows.length; i++) {
      for (let j = 0; j < cols.length; j++) {
        const newTile = [zoomLevel, rows[i], cols[j]];

        tiles.push(newTile);
      }
    }

    this.setVisibleTiles(tiles);
  }

  zoomed(newXScale, newYScale, k, tx, ty) {
    super.zoomed(newXScale, newYScale);

    this.xScale(newXScale);
    this.yScale(newYScale);

    this.pMain.position.x = tx; // translateX;
    this.pMain.position.y = ty; // translateY;

    this.pMain.scale.x = k; // scaleX;
    this.pMain.scale.y = k; // scaleY;

    this.refreshTilesDebounced();
    this.draw();
  }

  setPosition(newPosition) {
    super.setPosition(newPosition);
  }

  setDimensions(newDimensions) {
    super.setDimensions(newDimensions);
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
    }
    return this.scale.minValue;
  }

  maxValue(_) {
    if (_) {
      this.scale.maxValue = _;
    }
    return this.scale.maxValue;
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

  /**
   * Get the tile's position in its coordinate system.
   */
  getTilePosAndDimensions(zoomLevel, tilePos) {
    const tileWidth = this.maxWidth / 2 ** zoomLevel;
    const tileHeight = tileWidth;

    const tileX = this.minX + tilePos[0] * tileWidth;
    const tileY = this.minY + tilePos[1] * tileHeight;

    return {
      tileX,
      tileY,
      tileWidth,
      tileHeight,
    };
  }

  setSpriteProperties(sprite, zoomLevel, tilePos) {
    const {
      tileX,
      tileY,
      tileWidth,
      tileHeight,
    } = this.getTilePosAndDimensions(zoomLevel, tilePos);

    sprite.x = this._refXScale(tileX);
    sprite.y = this._refYScale(tileY);

    const tileEndX = tileX + tileWidth;
    const tileEndY = tileY + tileHeight;

    sprite.width = this._refXScale(tileEndX) - this._refXScale(tileX);
    sprite.height = this._refYScale(tileEndY) - this._refYScale(tileY);
  }

  initTile(tile) {
    // create the tile
    // should be overwritten by child classes
    const texture = new GLOBALS.PIXI.Texture(
      new GLOBALS.PIXI.BaseTexture(tile.tileData.img),
    );
    const sprite = new GLOBALS.PIXI.Sprite(texture);

    const graphics = tile.graphics;

    tile.sprite = sprite;

    this.setSpriteProperties(
      tile.sprite,
      tile.tileData.zoomLevel,
      tile.tileData.tilePos,
    );

    graphics.removeChildren();
    graphics.addChild(tile.sprite);
  }

  updateTile(tile) {
    // console.log("ERROR: unimplemented updateTile:", this);
  }

  destroyTile(tile) {
    // remove all data structures needed to draw this tile
  }

  /**
   * Add graphics for tiles that have no graphics
   */
  addMissingGraphics() {
    const fetchedTileIDs = Object.keys(this.fetchedTiles);

    for (let i = 0; i < fetchedTileIDs.length; i++) {
      if (!(fetchedTileIDs[i] in this.tileGraphics)) {
        const newGraphics = new GLOBALS.PIXI.Graphics();
        this.pMain.addChild(newGraphics);

        this.fetchedTiles[fetchedTileIDs[i]].graphics = newGraphics;
        this.initTile(this.fetchedTiles[fetchedTileIDs[i]]);

        this.tileGraphics[fetchedTileIDs[i]] = newGraphics;
      }
    }
  }

  /**
   * Change the graphics for existing tiles
   */
  updateExistingGraphics() {
    const fetchedTileIDs = Object.keys(this.fetchedTiles);

    for (let i = 0; i < fetchedTileIDs.length; i++) {
      this.updateTile(this.fetchedTiles[fetchedTileIDs[i]]);
    }
  }

  /**
   * Make sure that we have a one to one mapping between tiles
   * and graphics objects
   */
  synchronizeTilesAndGraphics() {
    // keep track of which tiles are visible at the moment
    this.addMissingGraphics();
    this.updateExistingGraphics();
  }

  /**
   * Extract drawable data from a tile loaded by a generic tile loader
   *
   * @param tile: A tile returned by a TiledArea.
   * @param dataLoader: A function for extracting drawable data from a tile. This
   *                    usually means differentiating the between dense and sparse
   *                    tiles and putting the data into an array.
   */
  loadTileData(tile, dataLoader) {
    // see if the data is already cached
    let loadedTileData = this.lruCache.get(tile.tileId);

    // if not, load it and put it in the cache
    if (!loadedTileData) {
      loadedTileData = dataLoader(tile.data, tile.type);
      this.lruCache.put(tile.tileId, loadedTileData);
    }

    return loadedTileData;
  }

  /**
   * Get the url used to fetch the tile data
   */
  getTileUrl(tileZxy) {
    const serverPrefixes = ['a', 'b', 'c'];
    const serverPrefixIndex = Math.floor(Math.random() * serverPrefixes.length);
    const src = `https://${serverPrefixes[serverPrefixIndex]}.tile.openstreetmap.org/${tileZxy[0]}/${tileZxy[1]}/${tileZxy[2]}.png`;

    return src;
  }

  fetchNewTiles(toFetch) {
    if (toFetch.length > 0) {
      const toFetchList = [...new Set(toFetch.map((x) => x.remoteId))];

      for (const tileId of toFetchList) {
        const parts = tileId.split('.');
        const src = this.getTileUrl(parts);

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
            tileSrc: src,
          };

          this.receivedTiles(loadedTiles);
        };
      }
    }
  }

  /**
   * We've gotten a bunch of tiles from the server in
   * response to a request from fetchTiles.
   */
  receivedTiles(loadedTiles) {
    for (let i = 0; i < this.visibleTiles.length; i++) {
      const tileId = this.visibleTiles[i].tileId;

      if (!loadedTiles[this.visibleTiles[i].remoteId]) continue;

      if (this.visibleTiles[i].remoteId in loadedTiles) {
        if (!(tileId in this.fetchedTiles)) {
          // this tile may have graphics associated with it
          this.fetchedTiles[tileId] = this.visibleTiles[i];
        }

        this.fetchedTiles[tileId].tileData =
          loadedTiles[this.visibleTiles[i].remoteId];
      }
    }

    for (const key in loadedTiles) {
      if (loadedTiles[key]) {
        if (this.fetching.has(key)) {
          this.fetching.delete(key);
        }
      }
    }

    this.synchronizeTilesAndGraphics();

    // Mainly called to remove old unnecessary tiles
    this.refreshTiles();

    // we need to draw when we receive new data
    this.draw();

    // Let HiGlass know we need to re-render
    this.animate();
  }

  draw() {
    if (this.delayDrawing) return;

    super.draw();
  }

  /**
   * Draw a tile on some graphics
   */
  drawTile() {}

  refScalesChanged(refXScale, refYScale) {
    super.refScalesChanged(refXScale, refYScale);

    for (const uid in this.fetchedTiles) {
      const tile = this.fetchedTiles[uid];

      if (tile.sprite) {
        this.setSpriteProperties(
          tile.sprite,
          tile.tileData.zoomLevel,
          tile.tileData.tilePos,
        );
      } else {
        // console.log('skipping...', tile.tileId);
      }
    }
  }
}

export default OSMTilesTrack;
