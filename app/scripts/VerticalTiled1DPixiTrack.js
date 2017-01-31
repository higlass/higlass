import {Tiled1DPixiTrack} from './Tiled1DPixiTrack.js';
import {tileProxy} from './TileProxy.js';

export class VerticalTiled1DPixiTrack extends Tiled1DPixiTrack {
    constructor(scene, server, uid, handleTilesetInfoReceived, options, animate) {
        super(scene, server, uid, handleTilesetInfoReceived, options, animate);

    }

    calculateZoomLevel() {
        let yZoomLevel = tileProxy.calculateZoomLevel(this._yScale,
                                                      this.tilesetInfo.min_pos[0],
                                                      this.tilesetInfo.max_pos[0]);

        let zoomLevel = Math.min(yZoomLevel, this.maxZoom);

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
        return this._yScale;
    }

    zoomed(newXScale, newYScale) {
        super.zoomed(newXScale, newYScale);

        // we only scale along 1 dimension
        let scaleX = 1;
        let scaleY = (newYScale(1) - newYScale(0))/ (this._refYScale(1) - this._refYScale(0));

        let translateX = this.position[0];
        let translateY = (newYScale(0) + this.position[1]) - this._refYScale(1) * scaleY;

        this.pMain.position.x = translateX;
        this.pMain.position.y = translateY;

        this.pMain.scale.x = scaleX;
        this.pMain.scale.y = scaleY;
    }
}
