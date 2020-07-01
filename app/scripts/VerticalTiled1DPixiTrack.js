import Tiled1DPixiTrack from './Tiled1DPixiTrack';

import { tileProxy } from './services';

class VerticalTiled1DPixiTrack extends Tiled1DPixiTrack {
  calculateZoomLevel() {
    const yZoomLevel = tileProxy.calculateZoomLevel(
      this._yScale,
      this.tilesetInfo.min_pos[0],
      this.tilesetInfo.max_pos[0],
    );

    const zoomLevel = Math.min(yZoomLevel, this.maxZoom);

    return zoomLevel;
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
    const scaleX = 1;
    const scaleY =
      (newYScale(1) - newYScale(0)) / (this._refYScale(1) - this._refYScale(0));

    const translateX = this.position[0];
    const translateY =
      newYScale(0) + this.position[1] - this._refYScale(1) * scaleY;

    this.pMain.position.x = translateX;
    this.pMain.position.y = translateY;

    this.pMain.scale.x = scaleX;
    this.pMain.scale.y = scaleY;
  }
}

export default VerticalTiled1DPixiTrack;
