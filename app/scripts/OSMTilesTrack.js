import slugid from 'slugid';
import * as PIXI from 'pixi.js';

import PixiTrack from './PixiTrack';

// Services
import { tileProxy } from './services';

// Utils
import { debounce } from './utils';

// Configs
import { ZOOM_DEBOUNCE } from './configs';

class OSMTilesTrack extends PixiTrack {
  /**
   * A track that must pull remote tiles
   *
   * @param scene: A PIXI.js scene to draw everything to.
   * @param server: The server to pull tiles from.
   * @param tilesetUid: The data set to get the tiles from the server
   */
  constructor(scene, options, animate) {
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

    let minPos = 0;
    let maxPos = 3120000000;


    if (this.options && this.options.minPos) { minPos = +this.options.minPos; }
    if (this.options && this.options.maxPos) { maxPos = +this.options.maxPos; }


    this.minPos = [minPos, minPos];
    this.maxPos = [maxPos, maxPos];
    this.maxZoom = 19;
    this.maxWidth = maxPos;
    this.animate = animate;

    this.uuid = slugid.nice();
    this.refreshTilesDebounced = debounce(this.refreshTiles.bind(this), ZOOM_DEBOUNCE);
  }

  rerender(options) {
    super.rerender(options);

    if (!this.tilesetInfo) {}
  }

  visibleAndFetchedIds() {
    /**
         * Return the set of ids of all tiles which are both visible and fetched.
         */

    const ret = Object.keys(this.fetchedTiles).filter(x => this.visibleTileIds.has(x));
    return ret;
  }

  visibleAndFetchedTiles() {
    const ids = this.visibleAndFetchedIds();

    return ids.map(x => this.fetchedTiles[x]);
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
      mirrored: x.mirrored,
    }));

    this.visibleTileIds = new Set(this.visibleTiles.map(x => x.tileId));
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
    const toFetch = [...this.visibleTiles].filter(x => !this.fetching.has(x.remoteId) && !fetchedTileIDs.has(x.tileId));

    for (let i = 0; i < toFetch.length; i++) { this.fetching.add(toFetch[i].remoteId); }

    // calculate which tiles are obsolete and remove them
    // fetchedTileID are remote ids
    const toRemove = [...fetchedTileIDs].filter(x => !this.visibleTileIds.has(x));


    this.removeTiles(toRemove);
    this.fetchNewTiles(toFetch);
  }

  removeTiles(toRemoveIds) {
    /**
         * Remove obsolete tiles
         *
         * @param toRemoveIds: An array of tile ids to remove from the list of fetched tiles.
         */

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

  tileToLocalId(tile) {
    /*
         * The local tile identifier
         */

    // tile contains [zoomLevel, xPos, yPos]
    return tile.join('.');
  }

  tileToRemoteId(tile) {
    /**
         * The tile identifier used on the server
         */

    // tile contains [zoomLevel, xPos, yPos]
    return tile.join('.');
  }

  localToRemoteId(remoteId) {
    const idParts = remoteId.split('.');
    return idParts.slice(0, idParts.length - 1).join('.');
  }

  calculateZoomLevel() {
    const xZoomLevel = tileProxy.calculateZoomLevel(this._xScale,
      this.minPos[0],
      this.maxPos[0]);
    const yZoomLevel = tileProxy.calculateZoomLevel(this._xScale,
      this.minPos[1],
      this.maxPos[1]);

    let zoomLevel = Math.max(xZoomLevel, yZoomLevel);
    zoomLevel = Math.min(zoomLevel, this.maxZoom);

    if (this.options && this.options.maxZoom) {
      if (this.options.maxZoom >= 0) { zoomLevel = Math.min(this.options.maxZoom, zoomLevel); } else { console.error('Invalid maxZoom on track:', this); }
    }

    return zoomLevel;
  }

  calculateVisibleTiles(mirrorTiles = true) {
    // if we don't know anything about this dataset, no point
    // in trying to get tiles

    this.zoomLevel = this.calculateZoomLevel();


    // this.zoomLevel = 0;

    this.xTiles = tileProxy.calculateTiles(this.zoomLevel, this._xScale,
      this.minPos[0],
      this.maxPos[0],
      this.maxZoom,
      this.maxWidth);

    this.yTiles = tileProxy.calculateTiles(this.zoomLevel, this._yScale,
      this.minPos[1],
      this.maxPos[1],
      this.maxZoom,
      this.maxWidth);

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

  /*
    zoomed(newXScale, newYScale, k=1, tx=0, ty=0) {
        this.xScale(newXScale);
        this.yScale(newYScale);

        this.refreshTilesDebounced();

        this.pMobile.position.x = tx;
        this.pMobile.position.y = this.position[1];

        this.pMobile.scale.x = k;
        this.pMobile.scale.y = 1;
    }
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

  setPosition(newPosition) {
    super.setPosition(newPosition);

    // this.draw();
  }

  setDimensions(newDimensions) {
    super.setDimensions(newDimensions);

    // this.draw();
  }

  areAllVisibleTilesLoaded() {
    /**
         * Check to see if all the visible tiles are loaded.
         *
         * If they are, remove all other tiles.
         */
    // tiles that are visible

    // tiles that are fetched
    const fetchedTileIDs = new Set(Object.keys(this.fetchedTiles));

    // console.log('this.fetchedTiles:', this.fetchedTiles);
    const visibleTileIdsList = [...this.visibleTileIds];

    // console.log('fetchedTileIDs:', fetchedTileIDs);
    // console.log('visibleTileIdsList:', visibleTileIdsList);

    for (let i = 0; i < visibleTileIdsList.length; i++) {
      if (!fetchedTileIDs.has(visibleTileIdsList[i])) { return false; }
    }

    return true;
  }

  allTilesLoaded() {
    /**
         * Function is called when all tiles that should be visible have
         * been received.
         */
  }

  minValue(_) {
    if (_) { this.scale.minValue = _; } else { return this.scale.minValue; }
  }

  maxValue(_) {
    if (_) { this.scale.maxValue = _; } else { return this.scale.maxValue; }
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

  getTilePosAndDimensions(zoomLevel, tilePos) {
    /**
         * Get the tile's position in its coordinate system.
         */
    let xTilePos = tilePos[0],
      yTilePos = tilePos[1];

    const totalWidth = this.maxPos[0] - this.minPos[0];
    const totalHeight = this.maxPos[0] - this.minPos[0];

    const minX = 0;
    const minY = 0;

    const tileWidth = totalWidth / Math.pow(2, zoomLevel);
    const tileHeight = totalHeight / Math.pow(2, zoomLevel);

    const tileX = minX + xTilePos * tileWidth;
    const tileY = minY + yTilePos * tileHeight;

    return { tileX,
      tileY,
      tileWidth,
      tileHeight };
  }

  setSpriteProperties(sprite, zoomLevel, tilePos) {
    const { tileX, tileY, tileWidth, tileHeight } = this.getTilePosAndDimensions(zoomLevel, tilePos);

    sprite.x = this._refXScale(tileX);
    sprite.y = this._refYScale(tileY);

    const tileEndX = tileX + tileWidth;
    const tileEndY = tileY + tileHeight;

    const spriteWidth = this._refXScale(tileEndX) - this._refXScale(tileX);
    const spriteHeight = this._refYScale(tileEndY) - this._refYScale(tileY);

    sprite.width = this._refXScale(tileEndX) - this._refXScale(tileX);
    sprite.height = this._refYScale(tileEndY) - this._refYScale(tileY);
  }

  initTile(tile) {
    // create the tile
    // should be overwritten by child classes
    // console.log("ERROR: unimplemented createTile:", this);
    const texture = new PIXI.Texture(new PIXI.BaseTexture(tile.tileData.img));
    const sprite = new PIXI.Sprite(texture);
    // console.log('tile.tileSrc:', tile);
    // let sprite = new PIXI.Sprite.fromImage(tile.tileSrc);

    const graphics = tile.graphics;

    const pos = tile.tileId.split('.').map(x => +x);

    tile.sprite = sprite;

    this.setSpriteProperties(tile.sprite, tile.tileData.zoomLevel, tile.tileData.tilePos);

    graphics.removeChildren();
    graphics.addChild(tile.sprite);
  }

  updateTile(tile) {
    // console.log("ERROR: unimplemented updateTile:", this);
  }

  destroyTile(tile) {
    // remove all data structures needed to draw this tile
  }


  addMissingGraphics() {
    /**
         * Add graphics for tiles that have no graphics
         */
    const fetchedTileIDs = Object.keys(this.fetchedTiles);
    let added = false;

    for (let i = 0; i < fetchedTileIDs.length; i++) {
      if (!(fetchedTileIDs[i] in this.tileGraphics)) {
        const newGraphics = new PIXI.Graphics();
        // console.log('adding:', fetchedTileIDs[i]);
        this.pMain.addChild(newGraphics);

        this.fetchedTiles[fetchedTileIDs[i]].graphics = newGraphics;
        // console.log('fetchedTiles:', this.fetchedTiles[fetchedTileIDs[i]]);
        this.initTile(this.fetchedTiles[fetchedTileIDs[i]]);

        // console.log('adding graphics...', fetchedTileIDs[i]);
        this.tileGraphics[fetchedTileIDs[i]] = newGraphics;
        added = true;
      }
    }

    /*
        if (added)
            this.draw();
        */
  }

  updateExistingGraphics() {
    /**
         * Change the graphics for existing tiles
         */
    const fetchedTileIDs = Object.keys(this.fetchedTiles);

    for (let i = 0; i < fetchedTileIDs.length; i++) {
      this.updateTile(this.fetchedTiles[fetchedTileIDs[i]]);
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
    this.updateExistingGraphics();
    // this.removeOldGraphics();
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

  getTileUrl(tileZxy) {
    /**
         * Get the url used to fetch the tile data
         */
    const serverPrefixes = ['a', 'b', 'c'];
    const serverPrefixIndex = Math.floor(Math.random() * serverPrefixes.length);
    const src = `http://${serverPrefixes[serverPrefixIndex]}.tile.openstreetmap.org/${tileZxy[0]}/${tileZxy[1]}/${tileZxy[2]}.png`;

    return src;
  }

  fetchNewTiles(toFetch) {
    if (toFetch.length > 0) {
      const toFetchList = [...(new Set(toFetch.map(x => x.remoteId)))];
      // console.log('xs:', toFetch);
      // console.log('fetching:', toFetchList.join(' '));

      // http://a.tile.openstreetmap.org/z/x/y.png
      //
      // tileProxy.fetchTiles(this.tilesetServer, toFetchList, this.receivedTiles.bind(this));

      /*
            tileProxy.fetchTilesDebounced({
                id: this.uuid,
                server: this.tilesetServer,
                done: this.receivedTiles.bind(this),
                ids: toFetchList
            });
            */


      for (const tileId of toFetchList) {
        const parts = tileId.split('.');
        const src = this.getTileUrl(parts);

        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = src;

        img.onload = () => {
          const loadedTiles = {};
          loadedTiles[tileId] = { tileId,
            img,
            zoomLevel: +parts[0],
            tilePos: [+parts[1], +parts[2]],
            tileSrc: src };

          this.receivedTiles(loadedTiles);
        };
      }
      // for (let tileId
      // let img = new Image();
      // img.src = "http://a.tile.openstreetmap.org/
    }
  }

  receivedTiles(loadedTiles) {
    /**
         * We've gotten a bunch of tiles from the server in
         * response to a request from fetchTiles.
         */
    // console.log('received:', loadedTiles);
    for (let i = 0; i < this.visibleTiles.length; i++) {
      const tileId = this.visibleTiles[i].tileId;

      if (!loadedTiles[this.visibleTiles[i].remoteId]) { continue; }


      if (this.visibleTiles[i].remoteId in loadedTiles) {
        if (!(tileId in this.fetchedTiles)) {
          // this tile may have graphics associated with it
          this.fetchedTiles[tileId] = this.visibleTiles[i];
        }


        this.fetchedTiles[tileId].tileData = loadedTiles[this.visibleTiles[i].remoteId];
      }
    }

    for (const key in loadedTiles) {
      if (loadedTiles[key]) {
        if (this.fetching.has(key)) { this.fetching.delete(key); }
      }
    }


    this.synchronizeTilesAndGraphics();

    /*
         * Mainly called to remove old unnecessary tiles
         */
    this.refreshTiles();

    // we need to draw when we receive new data
    this.draw();

    // Let HiGlass know we need to re-render
    this.animate();
  }


  draw() {
    if (this.delayDrawing) { return; }

    super.draw();

    for (const uid in this.fetchedTiles) { this.drawTile(this.fetchedTiles[uid]); }

    // this.animate();
  }

  drawTile(tileData, graphics) {
    /**
         * Draw a tile on some graphics
         */

  }

  refScalesChanged(refXScale, refYScale) {
    super.refScalesChanged(refXScale, refYScale);

    for (const uid in this.fetchedTiles) {
      const tile = this.fetchedTiles[uid];

      if (tile.sprite) {
        this.setSpriteProperties(tile.sprite, tile.tileData.zoomLevel, tile.tileData.tilePos);
      } else {
        // console.log('skipping...', tile.tileId);
      }
    }
  }
}

export default OSMTilesTrack;
