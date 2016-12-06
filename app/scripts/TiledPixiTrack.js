import {PixiTrack} from './PixiTrack.js';
import {tileProxy} from './TileProxy.js';
//import {LRUCache} from './lru.js';

export class TiledPixiTrack extends PixiTrack {
    /**
     * A track that must pull remote tiles
     */
    constructor(scene, server, tilesetUid) {
        /**
         * @param scene: A PIXI.js scene to draw everything to.
         * @param server: The server to pull tiles from.
         * @param tilesetUid: The data set to get the tiles from the server
         */
        super(scene);
        // the tiles which should be visible (although they're not necessarily fetched)
        this.visibleTiles = new Set();
        
        // the tiles we already have requests out for
        this.fetching = new Set();

        // tiles we have fetched and ready to be rendered
        this.fetchedTiles = {};

        let tilesetInfo = null;

        this.tilesetUid = tilesetUid;
        this.tilesetServer = server;

        // the graphics that have already been drawn for this track
        this.tileGraphics = {};  

        this.maxZoom = 0;

        tileProxy.trackInfo(server, tilesetUid, tilesetInfo => {
            console.log('tilesetInfo', tilesetInfo);
            this.tilesetInfo = tilesetInfo[tilesetUid];
            
            this.maxZoom = +this.tilesetInfo['max_zoom'];
            this.refreshTiles();
        });
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

        //console.log('visibleTiles:', tiles.map(x => x.join('/')).join(" "));
        // fetch the tiles that should be visible but haven't been fetched
        // and aren't in the process of being fetched
        let toFetch = [...this.visibleTiles].filter(x => !this.fetching.has(x.remoteId) && !fetchedTileIDs.has(x.tileId))
        //console.log('toFetch:', toFetch);
        
        for (let i = 0; i < toFetch.length; i++)
            this.fetching.add(toFetch[i].remoteId);

        // calculate which tiles are obsolete and remove them
        // fetchedTileID are remote ids
        let toRemove = [...fetchedTileIDs].filter(x => !this.visibleTileIds.has(x));

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
        if (!toRemoveIds.length)
            return;

        if (!this.areAllVisibleTilesLoaded())
            return;

        toRemoveIds.forEach(x => {
            delete this.fetchedTiles[x];
        })

        this.synchronizeTilesAndGraphics();
    }



    zoomed(newXScale, newYScale) {
        this.xScale(newXScale);
        this.yScale(newYScale);

        this.refreshTiles();
    }

    setPosition(newPosition) {
        super.setPosition(newPosition);

        this.draw();
    }

    setDimensions(newDimensions) {
        super.setDimensions(newDimensions);

        this.draw();
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
        this.visibleTileIds = this.visibleTiles.map(x => x.tileId);

        //console.log('this.visibleTileIds:', this.visibleTileIds);
        //console.log('this.fetchedTiles:', this.fetchedTiles);

        for (let i = 0; i < this.visibleTileIds.length; i++) {
            if (!fetchedTileIDs.has(this.visibleTileIds[i] ))
                return false;
        }

        return true;
    }

    initTile(tile) {
        // create the tile
        // should be overwritten by child classes
        console.log("ERROR: unimplemented createTile:", this);
    }

    updateTile(tile) {
        console.log("ERROR: unimplemented updateTile:", this);
    }

    destroyTile(tile) {
        // remove all data structures needed to draw this tile
    }


    addMissingGraphics() {
        /**
         * Add graphics for tiles that have no graphics
         */
        let fetchedTileIDs = Object.keys(this.fetchedTiles);

        for (let i = 0; i < fetchedTileIDs.length; i++) {
            if (!(fetchedTileIDs[i] in this.tileGraphics)) {
                console.log('adding...', fetchedTileIDs[i]);
                let newGraphics = new PIXI.Graphics();
                this.pMain.addChild(newGraphics);

                this.fetchedTiles[fetchedTileIDs[i]].graphics = newGraphics;
                this.initTile(this.fetchedTiles[fetchedTileIDs[i]]);

                this.tileGraphics[fetchedTileIDs[i]] = newGraphics;
            }
        }
    }

    removeOldGraphics() {
        /**
         * Remove graphics for tiles that are no longer
         * present
         */

        // only remove graphics if all visible graphics are loaded
        if (!this.areAllVisibleTilesLoaded())
            return;

        let fetchedTileIDs = new Set(Object.keys(this.fetchedTiles));

        for (let tileIdStr in this.tileGraphics) {

            if (!fetchedTileIDs.has(tileIdStr)) {
                //console.log('deleting...', tileIdStr);
                this.destroyTile(this.fetchedTiles[tileIdStr]);
                this.pMain.removeChild(this.tileGraphics[tileIdStr]);
                delete this.tileGraphics[tileIdStr];
            }
        }
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
        this.removeOldGraphics();
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
            console.log('fetching:', toFetchList.join(' '));
            tileProxy.fetchTiles(this.tilesetServer, toFetchList, this.receivedTiles.bind(this));
        }
    }

    receivedTiles(loadedTiles) {
        /**
         * We've gotten a bunch of tiles from the server in
         * response to a request from fetchTiles.
         */
        console.log('received:', loadedTiles);
        for (let i = 0; i < this.visibleTiles.length; i++) {
            let tileId = this.visibleTiles[i].tileId;


            if (this.visibleTiles[i].remoteId in loadedTiles) {
                console.log('this.visibleTiles[i]:', this.visibleTiles[i]);

                if (!(tileId in this.fetchedTiles)) {
                    // this tile may have graphics associated with it
                    this.fetchedTiles[tileId] = this.visibleTiles[i];
                }

                this.fetchedTiles[tileId].tileData = loadedTiles[this.visibleTiles[i].remoteId];
            }
        }

        for (let key in loadedTiles) {
            if (this.fetching.has(key))
                this.fetching.delete(key);

        }

        this.synchronizeTilesAndGraphics();
    }


    draw() {
        /**
         * Draw all the data associated with this track
         */
        /*
        let graphics = this.pMain;

        graphics.clear();
        graphics.lineStyle(0, 0x0000FF, 1);
        graphics.beginFill(0xFF700B, 1);
        */

        /*
        console.log('drawing a rectangle to...', this.position[0], this.position[1],
                    'width:', this.dimensions[0], this.dimensions[1]);

        this.pMain.position.x = this.position[0];
        this.pMain.position.y = this.position[1];
        */

        /*
        this.pMain.drawRect(0,0,
                            this.dimensions[0], this.dimensions[1]);
                            */
        for (let uid in this.fetchedTiles)
            this.drawTile(this.fetchedTiles[uid]);

    }

    drawTile(tileData, graphics) {
        /**
         * Draw a tile on some graphics
         */

    }
}
