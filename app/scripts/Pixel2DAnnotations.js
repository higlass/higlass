import { color } from 'd3-color';
import * as PIXI from 'pixi.js';

import PixiTrack from './PixiTrack';

class Pixel2DAnnotations extends PixiTrack {
  constructor(scene, chromInfoPath, options) {
    super(scene, options);

    this.drawnRects = new Set();

    this.g1 = new PIXI.Graphics();
    this.g2 = new PIXI.Graphics();
    this.g3 = new PIXI.Graphics();

    this.pMain.addChild(this.g1);
    this.pMain.addChild(this.g2);
    this.pMain.addChild(this.g3);

    this.drawnLabels = [];
  }

  draw() {
    this.drawnRects.clear();

    const minRectWidth = this.options.minRectWidth
      ? this.options.minRectWidth : 10;
    const minRectHeight = this.options.minRectWidth
      ? this.options.minRectHeight : 10;

    super.draw();
    // const graphics = this.pMain;

    this.g1.clear();
    this.g2.clear();
    this.g3.clear();

    if (this.label) this.g3.removeChild(this.label);

    // Regions have to follow the following form:
    // fromX, toX, fromY, toY, fill, stroke, min-width, min-height
    this.options.regions.forEach((region, index) => {
      const fill = color(region[4]);
      let stroke = color(region[5]);

      if (!stroke) stroke = fill;

      const fillHex = PIXI.utils.rgb2hex(
        [fill.r / 255.0, fill.g / 255.0, fill.b / 255.0],
      );
      const strokeHex = PIXI.utils.rgb2hex(
        [stroke.r / 255.0, stroke.g / 255.0, stroke.b / 255.0],
      );

      this.g1.lineStyle(6, 0xFFFFFF, 1);
      this.g1.beginFill(fillHex, fill.opacity);

      this.g2.lineStyle(2, strokeHex, stroke.opacity);
      this.g2.beginFill(fillHex, fill.opacity);

      this.g3.lineStyle(2, strokeHex, 1);
      this.g3.beginFill(strokeHex, 1);

      let startX = this._xScale(+region[0]);
      const endX = this._xScale(+region[1]);

      let startY = this._yScale(+region[2]);
      const endY = this._yScale(+region[3]);

      let width = endX - startX;
      let height = endY - startY;

      const _minRectWidth = typeof region[6] !== 'undefined'
        ? region[6] : minRectWidth;
      const _minRectHeight = typeof region[7] !== 'undefined'
        ? region[7] : minRectHeight;

      if (width < _minRectWidth) {
        // this region is too small to draw so center it on the location
        // where it would be drawn
        startX = ((startX + endX) / 2) - (_minRectWidth / 2);
        width = _minRectWidth;
      }

      if (height < _minRectHeight) {
        startY = ((startY + endY) / 2) - (_minRectHeight / 2);
        height = _minRectHeight;
      }

      if (region[8]) {
        this.g1.drawRect(startX - 8, startY - 8, 16, 16);
      }

      this.g1.drawRect(startX, startY, width, height);
      this.g2.drawRect(startX, startY, width, height);
      this.g3.drawRect(startX - 8, startY - 8, 16, 16);

      if (region[8]) {
        this.g3.drawRect(startX - 8, startY - 8, 16, 16);
        if (!this.drawnLabels[index]) {
          this.drawnLabels[index] = new PIXI.Text(
            region[8],
            {
              fontFamily: 'Arial',
              fontSize: 16,
              fill: 0xFFFFFF,
              align: 'center'
            }
          );
          this.g3.addChild(this.drawnLabels[index]);
        }
        this.drawnLabels[index].x = startX - 6;
        this.drawnLabels[index].y = startY - 9;
      }
    });
  }

  setPosition(newPosition) {
    super.setPosition(newPosition);

    this.pMain.position.y = this.position[1];
    this.pMain.position.x = this.position[0];
  }

  zoomed(newXScale, newYScale) {
    this.xScale(newXScale);
    this.yScale(newYScale);

    this.draw();
  }
}

export default Pixel2DAnnotations;
