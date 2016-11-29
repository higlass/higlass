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

        let trackInfo = tileProxy.trackInfo(server, tilesetUid);
    }

}
