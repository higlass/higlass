import {Tiled1DPixiTrack} from './Tiled1DPixiTrack';
import {tileProxy} from './TileProxy';

export class HorizontalTiled1DPixiTrack extends Tiled1DPixiTrack {
    constructor(scene, server, uid, handleTilesetInfoReceived, options, animate) {
        super(scene, server, uid, handleTilesetInfoReceived, options, animate);
    }

    calculateZoomLevel() {
        // offset by 2 because 1D tiles are more dense than 2D tiles
        // 1024 points per tile vs 256 for 2D tiles
        let xZoomLevel = tileProxy.calculateZoomLevel(this._xScale,
                                                      this.tilesetInfo.min_pos[0],
                                                      this.tilesetInfo.max_pos[0]) - 2;

        let zoomLevel = Math.min(xZoomLevel, this.maxZoom);
        zoomLevel = Math.max(zoomLevel, 0);

        return zoomLevel
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
