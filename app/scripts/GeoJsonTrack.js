import { geoMercator } from 'd3-geo';

// Components
import Annotations2dTrack from './Annotations2dTrack';

// Utils
import { colorToHex } from './utils';

class GeoJsonTrack extends Annotations2dTrack {
  constructor(scene, dataConfig, handleTilesetInfoReceived, option, animate) {
    super(scene, dataConfig, handleTilesetInfoReceived, option, animate);

    switch (this.options.projection) {
      case 'mercator':
      default:
        this.projection = geoMercator();
        break;
    }

    this.updateProjection();
  }

  /* --------------------------- Getter / Setter ---------------------------- */

  drawTile(tile) {
    if (!tile.graphics) return;

    const graphics = tile.graphics;
    graphics.clear();

    const stroke = colorToHex(this.options.rectangleDomainStrokeColor || 'black');
    const fill = colorToHex(this.options.rectangleDomainFillColor || 'grey');

    graphics.lineStyle(
      typeof this.options.rectangleDomainStrokeWidth !== 'undefined'
        ? this.options.rectangleDomainStrokeWidth
        : 1,
      stroke,
      typeof this.options.rectangleDomainStrokeOpacity !== 'undefined'
        ? this.options.rectangleDomainStrokeOpacity
        : 1,
    );
    graphics.beginFill(
      fill,
      typeof this.options.rectangleDomainFillOpacity !== 'undefined'
        ? this.options.rectangleDomainFillOpacity
        : 0.4,
    );

    graphics.alpha = this.options.rectangleDomainOpacity || 0.5;

    if (!tile.tileData.length) return;

    tile.tileData
      .filter(td => !(td.uid in this.drawnRects))
      .forEach((td) => {
        const [startX, startY] = this.projection([td.xStart, td.yStart]);
        const [endX, endY] = this.projection([td.xEnd, td.yEnd]);

        const uid = td.uid;

        const width = endX - startX;
        const height = endY - startY;

        let drawnRect = {
          x: startX,
          y: startY,
          width,
          height
        };

        if (this.options.minSquareSize) {
          if (
            width < this.options.minSquareSize
            || height < this.options.minSquareSize
          ) {
            drawnRect = {
              x: (startX + endX) / 2,
              y: (startY + endY) / 2,
              width: this.options.minSquareSize,
              height: this.options.minSquareSize
            };
          }
        }

        this.drawnRects[uid] = drawnRect;

        graphics.drawRect(
          drawnRect.x, drawnRect.y, drawnRect.width, drawnRect.height
        );
      });
  }

  /**
   * Update the X,Y translator function. This is needed to adjust the scale
   *   and translation after pan&zoom. Currently only supported for geometric
   *   scales.
   */
  updateProjection() {
    this.projection
      .scale((this._xScale(180) - this._xScale(-180)) / 2 / Math.PI)
      .translate([this._xScale(0), this._yScale(0)]);
  }

  zoomed(newXScale, newYScale) {
    this.xScale(newXScale);
    this.yScale(newYScale);

    this.updateProjection();
    this.refreshTiles();
    this.draw();
  }
}

export default GeoJsonTrack;
