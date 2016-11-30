import {Tiled2DPixiTrack} from './Tiled2DPixiTrack.js';
import {tileProxy} from './TileProxy.js';
import {workerSetPix} from './worker.js';
//import {LRUCache} from './lru.js';

export class HeatmapTiledPixiTrack extends Tiled2DPixiTrack {
    constructor(scene, server, uid) {
        /**
         * @param scene: A PIXI.js scene to draw everything to.
         * @param server: The server to pull tiles from.
         * @param uid: The data set to get the tiles from the server
         */
        super(scene, server, uid);
    }


    refreshTiles() {
        super.refreshTiles();

    }

    drawTile(tileData, graphics) {
        console.log('heatmap drawing...', tileData);
        let pixData = workerSetPix(tileData.dense.length, tileData.dense, tileData.min_value, tileData.max_value);

        console.log('pixData:', pixData);
    }
}
