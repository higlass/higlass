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

        console.log("server:", server, "tilesetUid", tilesetUid);
        console.log('tileProxy.uid', tileProxy.uid);

        let tilesetInfo = null;

        this.tilesetUid = tilesetUid;
        this.tilesetServer = server;

        // the graphics that have already been drawn for this track
        this.tileGraphics = {};  

        tileProxy.trackInfo(server, tilesetUid, tilesetInfo => {
            console.log('returned:', tilesetInfo, 'this:', this);
            this.tilesetInfo = tilesetInfo[tilesetUid];
            
            this.refreshTiles();
        });
    }

    refreshTiles() {
        if (!this.tilesetInfo)
            return;

    }

    zoomed(newXScale, newYScale) {
        this.xScale(newXScale);
        this.yScale(newYScale);

        this.refreshTiles();
    }

    setPosition(newPosition) {
        this.position = newPosition;

        this.draw();
    }

    setDimensions(newDimensions) {
        this.dimensions = newDimensions;

        this.draw();
    }

    synchronizeTilesAndGraphics() {
        /**
         * Make sure that we have a one to one mapping between tiles
         * and graphics objects
         *
         * @param {tiles} An array of tiles with data in raw form 
         *                (needs to be loaded eventually)
         */

        // keep track of which tiles are visible at the moment
        let shownTiles = {};
        let fetchedTileIDs = Object.keys(this.fetchedTiles);

        // make sure all the tiles have graphics
        for (let i = 0; i < fetchedTileIDs.length; i++) {
            // the tile already has a graphics object of its own, redraw it
            // this can be overriden by ScalablePixiTracks which don't need to
            // redraw already drawn tracks (just apply a transform
            if (fetchedTileIDs[i] in this.tileGraphics)
                this.drawTile(this.fetchedTiles[fetchedTileIDs[i]], 
                              this.tileGraphics[fetchedTileIDs[i]]);
            else {
                // no graphics for this tile, create it
                let newGraphics = new PIXI.Graphics();
                this.drawTile(this.fetchedTiles[fetchedTileIDs[i]], newGraphics);
                this.pMain.addChild(newGraphics);
                this.tileGraphics[fetchedTileIDs[i]] = newGraphics;
            }

            shownTiles[fetchedTileIDs[i]] = true;
        }

        // make sure all of the graphics correspond to tiles
        // otherwise we remove them
        for (let tileIdStr in this.tileGraphics) {
            if (!(tileIdStr in shownTiles)) {
                this.pMain.removeChild(this.tileGraphics[tileIdStr]);
                delete this.tileGraphics[tileIdStr];
            }
        }

    }

    remove() {
        /**
         * We're going to destroy this object, so we need to detach its
         * graphics from the scene
         */
        this.scene.removeChild(this.pMain);
    }

    drawTiles(tiles) {
        /**
         * Draw a set of tiles to the canvas
         * @param tiles: An array of tiles returned by a TiledArea object.
         *               Values need to be extracted.
         */

        // make sure we have graphics for the tiles
        this.synchronizeTilesAndGraphics(tiles);

        // need to set the valueScale that goes from 0 to the track Height
        console.log('tiles:', tiles);

        // need to remove graphics for tiles that are gone
        // and add graphics for tiles that are newly appeared
        
        for (let i = 0; i < tiles.length; i++) {
            //draw each tile
            this.drawTile(tiles[i]);
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

    draw() {
        /**
         * Draw all the data associated with this track
         */
        let graphics = this.pMain;

        graphics.clear();
        graphics.lineStyle(0, 0x0000FF, 1);
        graphics.beginFill(0xFF700B, 1);

        /*
        console.log('drawing a rectangle to...', this.position[0], this.position[1],
                    'width:', this.dimensions[0], this.dimensions[1]);
        */
        this.pMain.drawRect(this.position[0], this.position[1], 
                            this.dimensions[0], this.dimensions[1]);
    }

    drawTile(tileData, graphics) {
        /**
         * Draw a tile on some graphics
         */

    }
}
