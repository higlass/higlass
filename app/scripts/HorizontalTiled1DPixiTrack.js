import {Tiled1DPixiTrack} from './Tiled1DPixiTrack.js';
import {tileProxy} from './TileProxy.js';

export class HorizontalTiled1DPixiTrack extends Tiled1DPixiTrack {
    constructor(scene, server, uid) {
        super(scene, server, uid);

    }

    calculateZoomLevel() {
        let xZoomLevel = tileProxy.calculateZoomLevel(this._xScale,
                                                      this.tilesetInfo.min_pos[0],
                                                      this.tilesetInfo.max_pos[0]);

        let zoomLevel = Math.min(xZoomLevel, this.maxZoom);

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

    zoomed(newXScale, newYScale) {
        super.zoomed(newXScale, newYScale);

        // we only scale along 1 dimension
        let scaleX = (newXScale(1) - newXScale(0))/ (this._refXScale(1) - this._refXScale(0));
        let scaleY = 1;

        let translateX = (newXScale(0) + this.position[0]) - this._refXScale(0) * scaleX;
        let translateY = this.position[1];

        this.pMain.position.x = translateX;
        this.pMain.position.y = translateY;

        this.pMain.scale.x = scaleX;
        this.pMain.scale.y = scaleY;
    }
}
