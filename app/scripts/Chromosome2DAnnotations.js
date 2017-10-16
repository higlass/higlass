import { color } from 'd3-color';
import * as PIXI from 'pixi.js';

import { PixiTrack } from './PixiTrack';
import { ChromosomeInfo } from './ChromosomeInfo';

export class Chromosome2DAnnotations extends PixiTrack {
  constructor(scene, chromInfoPath, options) {
    super(scene, options);

    this.drawnRects = new Set();

    ChromosomeInfo(chromInfoPath, (newChromInfo) => {
      this.chromInfo = newChromInfo;
      this.draw();
    });
  }

  draw() {
    if (!this.chromInfo) { return; }

    this.drawnRects.clear();

    const minRectWidth = this.options.minRectWidth ? this.options.minRectWidth : 10;
    const minRectHeight = this.options.minRectWidth ? this.options.minRectHeight : 10;

    super.draw();
    const graphics = this.pMain;
    graphics.clear();

    // Regions have to follow the following form:
    // chrom1, start1, end1, chrom2, start2, end2, color-fill, color-line, min-width, min-height
    // If `color-line` is not given, `color-fill` is used
    for (const region of this.options.regions) {
      const colorFill = color(region[6]);
      let colorLine = color(region[7]);

      if (!colorLine) { colorLine = colorFill; }

      const colorFillHex = PIXI.utils.rgb2hex(
        [colorFill.r / 255.0, colorFill.g / 255.0, colorFill.b / 255.0],
      );
      const colorLineHex = PIXI.utils.rgb2hex(
        [colorLine.r / 255.0, colorLine.g / 255.0, colorLine.b / 255.0],
      );

      graphics.lineStyle(1, colorLineHex, colorLine.opacity);
      graphics.beginFill(colorFillHex, colorFill.opacity);

      // console.log('region:', region);
      let startX = this._xScale(this.chromInfo.chrPositions[region[0]].pos + +region[1]);
      const endX = this._xScale(this.chromInfo.chrPositions[region[0]].pos + +region[2]);

      let startY = this._yScale(this.chromInfo.chrPositions[region[3]].pos + +region[4]);
      const endY = this._yScale(this.chromInfo.chrPositions[region[3]].pos + +region[5]);

      let width = endX - startX;
      let height = endY - startY;

      const _minRectWidth = typeof region[8] !== 'undefined' ? region[8] : minRectWidth;
      const _minRectHeight = typeof region[9] !== 'undefined' ? region[9] : minRectWidth;

      if (width < _minRectWidth) {
        // this region is too small to draw so center it on the location
        // where it would be drawn
        startX = (startX + endX) / 2 - _minRectWidth / 2;
        width = _minRectWidth;
      }

      if (height < _minRectHeight) {
        startY = (startY + endY) / 2 - _minRectHeight / 2;
        height = _minRectHeight;
      }

      graphics.drawRect(startX, startY, width, height);
    }
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

export default Chromosome2DAnnotations;
