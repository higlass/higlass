// @ts-nocheck
import { color } from 'd3-color';
import PixiTrack from './PixiTrack';

// Maximum delay in ms between mousedown and mouseup that is registered as a
// click. Note we need to use mousedown and mouseup as PIXI doesn't recognize
// click events with out current setup. Since most UIs treat long clicks as
// either something special or a cancelation we follow best practices and
// implement a threshold on the delay as well.
import { GLOBALS, MAX_CLICK_DELAY } from './configs';

class Annotations1dTrack extends PixiTrack {
  constructor(context, options, isVertical) {
    super(context, options);

    this.pubSub = context.pubSub;
    this.options = options;
    this.isVertical = isVertical;

    this.rects = {};

    this.defaultColor = color('red');
  }

  draw() {
    const globalMinRectWidth =
      typeof this.options.minRectWidth !== 'undefined'
        ? this.options.minRectWidth
        : 10;

    const globalFill =
      typeof this.options.fill !== 'undefined'
        ? color(this.options.fill)
        : this.defaultColor;

    const globalFillOpacity =
      typeof this.options.fillOpacity !== 'undefined'
        ? +this.options.fillOpacity
        : 0.2;

    const globalStroke =
      typeof this.options.stroke !== 'undefined'
        ? color(this.options.stroke)
        : this.defaultColor;

    const globalStrokeWidth =
      typeof this.options.strokeWidth !== 'undefined'
        ? +this.options.strokeWidth
        : 1;

    const globalStrokeOpacity =
      typeof this.options.strokeOpacity !== 'undefined'
        ? +this.options.strokeOpacity
        : 0;

    let strokePos;
    if (this.options.strokePos && this.options.strokePos.length) {
      strokePos = Array.isArray(this.options.strokePos)
        ? this.options.strokePos
        : [this.options.strokePos];
    }

    super.draw();
    const graphics = this.pMain;
    graphics.clear();

    // The time stamp is used to keep track which rectangles have been drawn per
    // draw call. Each rectangle previously drawn that is not visible anymore
    // (i.e., is not drawn in the current draw call) will be removed at the end
    // by checking against the time stamp.
    const timeStamp = performance.now();

    // Regions have to follow the following form:
    // start, end, fill, stroke, fillOpacity, strokeOpcaity, min-size
    // If `color-line` is not given, `color-fill` is used
    this.options.regions.forEach((region) => {
      const id = `${region[0]}-${region[1]}`;

      if (!this.rects[id]) {
        this.rects[id] = { graphics: new GLOBALS.PIXI.Graphics() };
        graphics.addChild(this.rects[id].graphics);
      }

      this.rects[id].timeStamp = timeStamp;

      const fill = color(region[2]) || globalFill;
      let stroke = color(region[3]) || globalStroke;

      if (!stroke) {
        stroke = fill;
      }

      const fillHex = GLOBALS.PIXI.utils.rgb2hex([
        fill.r / 255.0,
        fill.g / 255.0,
        fill.b / 255.0,
      ]);
      const strokeHex = GLOBALS.PIXI.utils.rgb2hex([
        stroke.r / 255.0,
        stroke.g / 255.0,
        stroke.b / 255.0,
      ]);

      if (strokePos) {
        graphics.lineStyle(1, strokeHex, 0);
        graphics.beginFill(strokeHex, +region[5] || globalStrokeOpacity);
      } else {
        graphics.lineStyle(
          globalStrokeWidth,
          strokeHex,
          +region[5] || globalStrokeOpacity,
        );
        graphics.beginFill(fillHex, +region[4] || globalFillOpacity);
      }

      const scale = this.isVertical ? this._yScale : this._xScale;

      let start = scale(+region[0]);
      const end = scale(+region[1]);

      let width = end - start;

      const minRectWidth =
        typeof region[6] !== 'undefined' ? region[6] : globalMinRectWidth;

      if (width < minRectWidth) {
        // this region is too small to draw so center it on the location
        // where it would be drawn
        start = (start + end) / 2 - minRectWidth / 2;
        width = minRectWidth;
      }

      if (strokePos) {
        graphics.lineStyle(1, strokeHex, 0);
        graphics.beginFill(strokeHex, +region[5] || globalStrokeOpacity);

        strokePos.forEach((pos) => {
          if (pos === 'top' || pos === 'around') {
            if (this.isVertical) {
              graphics.drawRect(0, start, globalStrokeWidth, width);
            } else {
              graphics.drawRect(start, 0, width, globalStrokeWidth);
            }
          }

          if (pos === 'right' || pos === 'around') {
            if (this.isVertical) {
              graphics.drawRect(
                0,
                start,
                this.dimensions[0],
                globalStrokeWidth,
              );
            } else {
              graphics.drawRect(
                start,
                0,
                globalStrokeWidth,
                this.dimensions[1],
              );
            }
          }

          if (pos === 'bottom' || pos === 'around') {
            if (this.isVertical) {
              graphics.drawRect(
                this.dimensions[0] - globalStrokeWidth,
                start,
                globalStrokeWidth,
                width,
              );
            } else {
              graphics.drawRect(
                start,
                this.dimensions[1] - globalStrokeWidth,
                width,
                globalStrokeWidth,
              );
            }
          }

          if (pos === 'left' || pos === 'around') {
            if (this.isVertical) {
              graphics.drawRect(
                0,
                start + width - globalStrokeWidth,
                this.dimensions[0],
                globalStrokeWidth,
              );
            } else {
              graphics.drawRect(
                start + width - globalStrokeWidth,
                0,
                globalStrokeWidth,
                this.dimensions[1],
              );
            }
          }
        });
      } else {
        graphics.lineStyle(
          globalStrokeWidth,
          strokeHex,
          +region[5] || globalStrokeOpacity,
        );
      }

      // Make annotation clickable
      this.rects[id].graphics.clear();
      this.rects[id].graphics.interactive = true;
      this.rects[id].graphics.buttonMode = true;

      graphics.beginFill(fillHex, +region[4] || globalFillOpacity);
      if (this.isVertical) {
        graphics.drawRect(0, start, this.dimensions[0], width);
        this.rects[id].graphics.hitArea = new GLOBALS.PIXI.Rectangle(
          0,
          start,
          this.dimensions[0],
          width,
        );
      } else {
        graphics.drawRect(start, 0, width, this.dimensions[1]);
        this.rects[id].graphics.hitArea = new GLOBALS.PIXI.Rectangle(
          start,
          0,
          width,
          this.dimensions[1],
        );
      }

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

    // Remove outdated rects, i.e., rects whose time stamp is not the current
    // time stamp stored above.
    Object.values(this.rects)
      .filter((rect) => rect.timeStamp !== timeStamp)
      .forEach((rect) => graphics.removeChild(rect.graphics));
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

export default Annotations1dTrack;
