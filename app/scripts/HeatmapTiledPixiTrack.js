import {TiledPixiTrack} from './TiledPixiTrack.js';
//import {LRUCache} from './lru.js';

export class HeatmapTiledPixiTrack extends TiledPixiTrack {
    constructor(scene, server, uid) {
        /**
         * @param scene: A PIXI.js scene to draw everything to.
         * @param server: The server to pull tiles from.
         * @param uid: The data set to get the tiles from the server
         */
        super(scene, server, uid);

    }

}
