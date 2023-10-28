// @ts-nocheck
import { color } from 'd3-color';

import PixiTrack from './PixiTrack';
import ChromosomeInfo from './ChromosomeInfo';

// Configs
import { GLOBALS } from './configs';

// Maximum delay in ms between mousedown and mouseup that is registered as a
// click. Note we need to use mousedown and mouseup as PIXI doesn't recognize
// click events with our current setup. Since most UIs treat long clicks as
// either something special or a cancelation we follow best practices and
// implement a threshold on the delay as well.
const MAX_CLICK_DELAY = 300;

class Chromosome2DAnnotations extends PixiTrack {
  constructor(context, options) {
    super(context, options);
    const { chromInfoPath, pubSub } = context;

    this.pubSub = pubSub;
    this.rects = {};

    ChromosomeInfo(
      chromInfoPath,
      (newChromInfo) => {
        this.chromInfo = newChromInfo;
        this.draw();
      },
      this.pubSub,
    );
  }

  draw() {
    if (!this.chromInfo) {
      return;
    }

    const minRectWidth = this.options.minRectWidth
      ? this.options.minRectWidth
      : 10;
    const minRectHeight = this.options.minRectWidth
      ? this.options.minRectHeight
      : 10;

    super.draw();
    const graphics = this.pMain;
    graphics.clear();

    // The time stamp is used to keep track which rectangles have been drawn per
    // draw call. Each rectangle previously drawn that is not visible anymore
    // (i.e., is not drawn in the current draw call) will be removed at the end
    // by checking against the time stamp.
    const timeStamp = performance.now();

    // Regions have to follow the following form:
    // chrom1, start1, end1, chrom2, start2, end2, color-fill, color-line, min-width, min-height
    // If `color-line` is not given, `color-fill` is used
    this.options.regions.forEach((region) => {
      const id = region.slice(0, 6).join('-');

      if (!this.rects[id]) {
        this.rects[id] = { graphics: new GLOBALS.PIXI.Graphics() };
        graphics.addChild(this.rects[id].graphics);
      }

      this.rects[id].timeStamp = timeStamp;

      const colorFill = color(region[6]);
      let colorLine = color(region[7]);

      if (!colorLine) {
        colorLine = colorFill;
      }

      const colorFillHex = GLOBALS.PIXI.utils.rgb2hex([
        colorFill.r / 255.0,
        colorFill.g / 255.0,
        colorFill.b / 255.0,
      ]);
      const colorLineHex = GLOBALS.PIXI.utils.rgb2hex([
        colorLine.r / 255.0,
        colorLine.g / 255.0,
        colorLine.b / 255.0,
      ]);

      graphics.lineStyle(1, colorLineHex, colorLine.opacity);
      graphics.beginFill(colorFillHex, colorFill.opacity);

      // console.log('region:', region);
      let startX = this._xScale(
        this.chromInfo.chrPositions[region[0]].pos + +region[1],
      );
      const endX = this._xScale(
        this.chromInfo.chrPositions[region[0]].pos + +region[2],
      );

      let startY = this._yScale(
        this.chromInfo.chrPositions[region[3]].pos + +region[4],
      );
      const endY = this._yScale(
        this.chromInfo.chrPositions[region[3]].pos + +region[5],
      );

      let width = endX - startX;
      let height = endY - startY;

      const _minRectWidth =
        typeof region[8] !== 'undefined' ? region[8] : minRectWidth;
      const _minRectHeight =
        typeof region[9] !== 'undefined' ? region[9] : minRectHeight;

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

      // Make annotation clickable
      this.rects[id].graphics.clear();
      this.rects[id].graphics.interactive = true;
      this.rects[id].graphics.buttonMode = true;
      this.rects[id].graphics.hitArea = new GLOBALS.PIXI.Rectangle(
        startX,
        startY,
        width,
        height,
      );

      this.rects[id].graphics.mousedown = () => {
        this.rects[id].mouseDownTime = performance.now();
      };

      this.rects[id].graphics.mouseup = (event) => {
        if (
          performance.now() - this.rects[id].mouseDownTime <
          MAX_CLICK_DELAY
        ) {
          this.pubSub.publish('app.click', {
            type: 'annotation',
            event,
            payload: region,
          });
        }
      };
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

export default Chromosome2DAnnotations;
