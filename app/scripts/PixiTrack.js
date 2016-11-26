import {Track} from './Track.js';
//import {LRUCache} from './lru.js';

export class PixiTrack extends Track {
    constructor(scene) {
        /**
         * @param scene: A PIXI.js scene to draw everything to.
         * @param xScale: A scale for placing points (can be null if this is vertical track)
         * @param yScale: A scale for placing graphics (can be null if this is a horizontal track)
         */
        super();

        // the PIXI drawing areas
        // pMain will have transforms applied to it as users scroll to and fro
        this.scene = scene;
        this.pMain = new PIXI.Graphics();

        console.log("ADDING CHILD");
        this.scene.addChild(this.pMain);

        // the graphics that have already been drawn for this track
        this.tileGraphics = {};  

        this.position = [0,0];
        this.dimensions = [0,0];

        // a cache to store loaded tile data
        /*
        this.MAX_CACHE_SIZE = 100;
        this.lruCache = new LRUCache(this.MAX_CACHE_SIZE); // cache the tile data for recently used tiles
        */
    }

    setPosition(newPosition) {
        this.position = newPosition;

        this.draw();
    }

    setDimensions(newDimensions) {
        this.dimensions = newDimensions;

        this.draw();
    }

    synchronizeTilesAndGraphics(tiles) {
        /**
         * Make sure that we have a one to one mapping between tiles
         * and graphics objects
         *
         * @param {tiles} An array of tiles with data in raw form 
         *                (needs to be loaded eventually)
         */

        // keep track of which tiles are visible at the moment
        let shownTiles = {};

        // make sure all the tiles have graphics
        for (let i = 0; i < tiles.length; i++) {
            // the tile already has a graphics object of its own, redraw it
            // this can be overriden by ScalablePixiTracks which don't need to
            // redraw already drawn tracks (just apply a transform
            if (tiles[i].tileId in this.tileGraphics)
                this.drawTile(tiles[i], this.tileGraphics[tiles[i].tileId]);
            else {
                // no graphics for this tile, create it
                let newGraphics = new PIXI.Graphics();
                this.drawTile(tiles[i], newGraphics);
                this.pMain.addChild(newGraphics);
                this.tileGraphics[tiles[i].tileId] = newGraphics;
            }

            shownTiles[tiles[i].tileId] = true;
        }

        // make sure all of the graphics correspond to tiles
        // otherwise we remove them
        for (let tileIdStr in this.tileGraphics) {
            if (!(tileIdStr in shownTiles)) {
                this.pMain.removeChild(d.tileGraphics[tileIdStr]);
                delete this.tileGraphics[tileIdStr];
            }
        }

    }

    destructor() {
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
        let graphics = this.pMain;

        graphics.lineStyle(0, 0x0000FF, 1);
        graphics.beginFill(0xFF700B, 1);

        console.log('drawing a rectangle to...', this.position[0], this.position[1],
                    'width:', this.dimensions[0], this.dimensions[1]);
        this.pMain.drawRect(this.position[0], this.position[1], 
                            this.dimensions[0], this.dimensions[1]);
    }
}
