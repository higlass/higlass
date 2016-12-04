import {Tiled1DPixiTrack} from './Tiled1DPixiTrack.js';
import {tileProxy} from './TileProxy.js';

export class HorizontalTiled1DPixiTrack extends Tiled1DPixiTrack {
    constructor(scene, server, uid) {
        super(scene, server, uid);

    }

    relevantScale() {
        /**
         * Which scale should we use for calculating tile positions?
         *
         * Horizontal tracks should use the xScale and vertical tracks
         * should use the yScale
         *
         * This function should be overwritten by HorizontalTiled1DPixiTrack.js
         * and VerticalTiled1DPixiTrack.js
         */
        return this._xScale;
    }

}
