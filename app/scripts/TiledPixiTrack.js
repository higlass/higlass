import {ZOOM_DEBOUNCE} from './config.js';
import debounce from './debounce.js';
import {PixiTrack} from './PixiTrack.js';
import {tileProxy} from './TileProxy.js';
import {median} from 'd3-array';
import slugid from 'slugid';
//import {LRUCache} from './lru.js';

export class TiledPixiTrack extends PixiTrack {
    /**
     * A track that must pull remote tiles
     */
    constructor(scene, server, tilesetUid, handleTilesetInfoReceived, options, animate) {
        /**
         * @param scene: A PIXI.js scene to draw everything to.
         * @param server: The server to pull tiles from.
         * @param tilesetUid: The data set to get the tiles from the server
         */
        super(scene, options);

        // the tiles which should be visible (although they're not necessarily fetched)
        this.visibleTiles = new Set();
        this.visibleTileIds = new Set();

        // the tiles we already have requests out for
        this.fetching = new Set();
        this.scale = {};

        // tiles we have fetched and ready to be rendered
        this.fetchedTiles = {};

        let tilesetInfo = null;

        this.tilesetUid = tilesetUid;
        this.tilesetServer = server;
        this.tilesetInfoLoading = true;

        // the graphics that have already been drawn for this track
        this.tileGraphics = {};

        this.maxZoom = 0;
        this.medianVisibleValue = null;

        this.animate = animate;

        // store the server and tileset uid so they can be used in draw()
        // if the tileset info is not found
        this.server = server;
        this.tilesetUid = tilesetUid;

        if (server && tilesetUid) {
            tileProxy.trackInfo(server, tilesetUid, tilesetInfo => {
                // console.log('tilesetInfo:', tilesetInfo);
                this.tilesetInfo = tilesetInfo[tilesetUid];
                this.tilesetInfoLoading = false;

                if ('error' in this.tilesetInfo) {
                    // no tileset info for this track
                    this.tilesetInfo = null;
                    this.draw();
                    return;
                }

                this.maxZoom = +this.tilesetInfo['max_zoom'];

                if (this.options && this.options.maxZoom) {
                    if (this.options.maxZoom >= 0)
                        this.maxZoom = Math.min(this.options.maxZoom, this.maxZoom);
                    else
                        console.error("Invalid maxZoom on track:", this);
                }

                this.refreshTiles();

                if (handleTilesetInfoReceived)
                    handleTilesetInfoReceived(tilesetInfo[tilesetUid]);

                if (!this.options)
                    this.options = {};

                this.options.name = this.options.name ? this.options.name : tilesetInfo[tilesetUid].name;

                this.draw();
            });
        }

        this.uuid = slugid.nice();

        this.refreshTilesDebounced = debounce(
            this.refreshTiles.bind(this), ZOOM_DEBOUNCE
        );

        this.trackNotFoundText = new PIXI.Text('',
                {fontSize: "12px", fontFamily: "Arial", fill: "black"});

        this.pLabel.addChild(this.trackNotFoundText);
    }

    rerender(options) {
        super.rerender(options);

        if (!this.tilesetInfo)
            return;

        this.maxZoom = +this.tilesetInfo['max_zoom'];

        if (this.options && this.options.maxZoom) {
            if (this.options.maxZoom >= 0)
                this.maxZoom = Math.min(this.options.maxZoom, this.maxZoom);
            else
                console.error("Invalid maxZoom on track:", this);
        }
    }


    visibleAndFetchedIds() {
        /**
         * Return the set of ids of all tiles which are both visible and fetched.
         */

        let ret = Object.keys(this.fetchedTiles).filter(x => this.visibleTileIds.has(x));
        return ret;
    }

    visibleAndFetchedTiles() {
        let ids = this.visibleAndFetchedIds();

        return ids.map(x => this.fetchedTiles[x]);
    }

    setVisibleTiles(tilePositions) {
        /**
         * Set which tiles are visible right now.
         *
         * @param tiles: A set of tiles which will be considered the currently visible
         * tile positions.
         */
        this.visibleTiles = tilePositions.map(x => {
            return {
                tileId: this.tileToLocalId(x),
                remoteId: this.tileToRemoteId(x),
                mirrored: x.mirrored
            }
        });

        this.visibleTileIds = new Set(this.visibleTiles.map(x => x.tileId));
    }

    refreshTiles() {
        if (!this.tilesetInfo)
            return;

        this.calculateVisibleTiles();

        // tiles that are fetched
        let fetchedTileIDs = new Set(Object.keys(this.fetchedTiles));

        // fetch the tiles that should be visible but haven't been fetched
        // and aren't in the process of being fetched
        let toFetch = [...this.visibleTiles].filter(x => !this.fetching.has(x.remoteId) && !fetchedTileIDs.has(x.tileId))

        for (let i = 0; i < toFetch.length; i++)
            this.fetching.add(toFetch[i].remoteId);

        // calculate which tiles are obsolete and remove them
        // fetchedTileID are remote ids
        let toRemove = [...fetchedTileIDs].filter(x => !this.visibleTileIds.has(x));


        this.removeTiles(toRemove);
        this.fetchNewTiles(toFetch);
    }

    parentInFetched(tile) {
        let uid = tile.tileData.tilesetUid;
        let zl = tile.tileData.zoomLevel;
        let pos = tile.tileData.tilePos;

        while (zl > 0) {
            zl -= 1;
            pos = pos.map(x => Math.floor(x / 2));

            let parentId = uid + '.' + zl + '.' + pos.join('.');
            if (parentId in this.fetchedTiles)
                return true

        }

        return false;
    }

    parentTileId(tile) {
        let parentZoomLevel = tile.tileData.zoomLevel - 1;
        let parentPos = tile.tileData.tilePos.map(x => Math.floor(x / 2));
        let parentUid = tile.tileData.tilesetUid;

        return parentUid + '.' + parentZoomLevel + '.' + parentPos.join('.')
    }

    removeTiles(toRemoveIds) {
        /**
         * Remove obsolete tiles
         *
         * @param toRemoveIds: An array of tile ids to remove from the list of fetched tiles.
         */

        // if there's nothing to remove, don't bother doing anything
        if (!toRemoveIds.length)
            return;

        if (!this.areAllVisibleTilesLoaded())
            return;

        toRemoveIds.forEach(x => {
            let tileIdStr = x;
            this.destroyTile(this.fetchedTiles[tileIdStr]);

            if (tileIdStr in this.tileGraphics) {
                this.pMain.removeChild(this.tileGraphics[tileIdStr]);
                delete this.tileGraphics[tileIdStr]
            }

            delete this.fetchedTiles[tileIdStr];
        })

        this.synchronizeTilesAndGraphics();
        this.draw();
    }

    zoomed(newXScale, newYScale, k=1, tx=0, ty=0) {
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

        //this.draw();
    }

    setDimensions(newDimensions) {
        super.setDimensions(newDimensions);

        //this.draw();
    }

    areAllVisibleTilesLoaded() {
        /**
         * Check to see if all the visible tiles are loaded.
         *
         * If they are, remove all other tiles.
         */
        // tiles that are visible

        // tiles that are fetched
        let fetchedTileIDs = new Set(Object.keys(this.fetchedTiles));

        //console.log('this.fetchedTiles:', this.fetchedTiles);
        let visibleTileIdsList = [...this.visibleTileIds];

        //console.log('fetchedTileIDs:', fetchedTileIDs);
        //console.log('visibleTileIdsList:', visibleTileIdsList);

        for (let i = 0; i < visibleTileIdsList.length; i++) {
            if (!fetchedTileIDs.has(visibleTileIdsList[i] ))
                return false;
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
        if (_)
            this.scale.minValue = _;
        else
            return this.scale.minValue;
    }

    maxValue(_) {
        if (_)
            this.scale.maxValue = _;
        else
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


    initTile(tile) {
        // create the tile
        // should be overwritten by child classes
        //console.log("ERROR: unimplemented createTile:", this);
        this.scale.minRawValue = this.minVisibleValue();
        this.scale.maxRawValue = this.maxVisibleValue();

        this.scale.minValue = this.scale.minRawValue;
        this.scale.maxValue = this.scale.maxRawValue;
    }

    updateTile(tile) {
        //console.log("ERROR: unimplemented updateTile:", this);
    }

    destroyTile(tile) {
        // remove all data structures needed to draw this tile
    }


    addMissingGraphics() {
        /**
         * Add graphics for tiles that have no graphics
         */
        let fetchedTileIDs = Object.keys(this.fetchedTiles);
        let added = false;

        for (let i = 0; i < fetchedTileIDs.length; i++) {
            if (!(fetchedTileIDs[i] in this.tileGraphics)) {
                let newGraphics = new PIXI.Graphics();
                //console.log('adding:', fetchedTileIDs[i]);
                this.pMain.addChild(newGraphics);

                this.fetchedTiles[fetchedTileIDs[i]].graphics = newGraphics;
                //console.log('fetchedTiles:', this.fetchedTiles[fetchedTileIDs[i]]);
                this.initTile(this.fetchedTiles[fetchedTileIDs[i]]);

                //console.log('adding graphics...', fetchedTileIDs[i]);
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
        let fetchedTileIDs = Object.keys(this.fetchedTiles);

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
        //this.removeOldGraphics();
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
            let toFetchList = [...(new Set(toFetch.map(x => x.remoteId)))];
            //console.log('fetching:', toFetchList.join(' '));
            // tileProxy.fetchTiles(this.tilesetServer, toFetchList, this.receivedTiles.bind(this));

            tileProxy.fetchTilesDebounced({
                id: this.uuid,
                server: this.tilesetServer,
                done: this.receivedTiles.bind(this),
                ids: toFetchList
            });
        }
    }

    receivedTiles(loadedTiles) {
        /**
         * We've gotten a bunch of tiles from the server in
         * response to a request from fetchTiles.
         */
        //console.log('received:', loadedTiles);
        for (let i = 0; i < this.visibleTiles.length; i++) {
            let tileId = this.visibleTiles[i].tileId;

            if (!loadedTiles[this.visibleTiles[i].remoteId])
                continue;


            if (this.visibleTiles[i].remoteId in loadedTiles) {
                if (!(tileId in this.fetchedTiles)) {
                    // this tile may have graphics associated with it
                    this.fetchedTiles[tileId] = this.visibleTiles[i];
                }



                this.fetchedTiles[tileId].tileData = loadedTiles[this.visibleTiles[i].remoteId];
            }
        }

        for (let key in loadedTiles) {
            if (loadedTiles[key])
                if (this.fetching.has(key))
                    this.fetching.delete(key);

        }


        this.synchronizeTilesAndGraphics();

        /*
         * Mainly called to remove old unnecessary tiles
         */
        this.refreshTiles();

        if (this.options.valueScaling)
            this.calculateMedianVisibleValue();

        // we need to draw when we receive new data
        this.draw();

        // Let HiGlass know we need to re-render
        this.animate();
    }


    draw() {
        if (!this.tilesetInfo) {
            if (this.tilesetInfoLoading) {
                this.trackNotFoundText.text = 'Loading...';
            } else {
                this.trackNotFoundText.text = "Tileset info not found. Server: [" +
                    this.server +
                    "] tilesetUid: [" + this.tilesetUid + "]";
            }

            this.trackNotFoundText.x = this.position[0];
            this.trackNotFoundText.y = this.position[1];

            /*
            if (this.flipText)
                this.trackNotFoundText.scale.x = -1;
            */

            this.trackNotFoundText.visible = true;
        } else {
            this.trackNotFoundText.visible = false;
        }

        super.draw();

        for (let uid in this.fetchedTiles)
            this.drawTile(this.fetchedTiles[uid]);
    }

    drawTile(tileData, graphics) {
        /**
         * Draw a tile on some graphics
         */

    }

    calculateMedianVisibleValue() {
        if (this.areAllVisibleTilesLoaded()) {
            this.allTilesLoaded();
        }

         let visibleAndFetchedIds = this.visibleAndFetchedIds();

         if (visibleAndFetchedIds.length == 0) {
             visibleAndFetchedIds = Object.keys(this.fetchedTiles);
         }

         let values = [].concat.apply([], visibleAndFetchedIds.filter(x => this.fetchedTiles[x].tileData.dense).map(x => Array.from(this.fetchedTiles[x].tileData.dense))).filter(x => x > 0);

         this.medianVisibleValue = median(values);

    }

    allVisibleValues() {
         return [].concat.apply([], this.visibleAndFetchedIds().map(x => Array.from(this.fetchedTiles[x].tileData.dense)));
    }

    minVisibleValue() {
         let visibleAndFetchedIds = this.visibleAndFetchedIds();

         if (visibleAndFetchedIds.length == 0) {
             visibleAndFetchedIds = Object.keys(this.fetchedTiles);
         }

         let min = Math.min.apply(null, visibleAndFetchedIds.map(x => this.fetchedTiles[x].tileData.minNonZero));

         /*
         if (!isFinite(min)) {
            console.log('td:', this.visibleAndFetchedIds().map(x => this.fetchedTiles[x].tileData));
         }
         */

         if (min == Number.MAX_SAFE_INTEGER)
             min = 0;

         return min;
    }

    maxVisibleValue() {
         let visibleAndFetchedIds = this.visibleAndFetchedIds();

         if (visibleAndFetchedIds.length == 0) {
             visibleAndFetchedIds = Object.keys(this.fetchedTiles);
         }

         let max = Math.max.apply(null, visibleAndFetchedIds.map(x => this.fetchedTiles[x].tileData.maxNonZero));

         if (max == Number.MIN_SAFE_INTEGER)
             max = 1;
         return max;
    }

}
