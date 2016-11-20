import {Track} from './Track.js';
import {LRUCache} from './lru.js';

export class PixiTrack extends Track {
    constructor(stage, xScale, yScale, dims) {
        /**
         * @param stage: A PIXI.js stage to draw everything to.
         * @param xScale: A scale for placing points (can be null if this is vertical track)
         * @param yScale: A scale for placing graphics (can be null if this is a horizontal track)
         */
        super(xScale, yScale, dims);

        // the PIXI drawing areas
        // pMain will have transforms applied to it as users scroll to and fro
        this.stage = stage;
        this.pMain = new PIXI.Graphics();
        this.stage.addChild(this.pMain);

        // the graphics that have already been drawn for this track
        this.tileGraphics = {};  

        // a cache to store loaded tile data
        this.MAX_CACHE_SIZE = 100;
        this.lruCache = new LRUCache(this.MAX_CACHE_SIZE); // cache the tile data for recently used tiles
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
}
