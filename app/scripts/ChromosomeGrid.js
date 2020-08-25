import PixiTrack from './PixiTrack';
import ChromosomeInfo from './ChromosomeInfo';
import SearchField from './SearchField';

import { colorToHex } from './utils';

// Configs
import { GLOBALS } from './configs';

class ChromosomeGrid extends PixiTrack {
  constructor(context, options) {
    super(context, options);
    const {
      chromInfoPath,
      dataConfig,
      animate,
      pubSub,
      orientation = '2d',
      isOverlay = false,
    } = context;

    this.searchField = null;
    this.chromInfo = null;
    this.animate = animate;
    this.orientation = orientation;
    this.isOverlay = isOverlay;

    let chromSizesPath = chromInfoPath;

    if (!chromSizesPath) {
      chromSizesPath = `${dataConfig.server}/chrom-sizes/?id=${dataConfig.tilesetUid}`;
    }

    ChromosomeInfo(
      chromSizesPath,
      (newChromInfo) => {
        this.chromInfo = newChromInfo;

        this.searchField = new SearchField(this.chromInfo);

        this.texts = [];
        this.lineGraphics = new GLOBALS.PIXI.Graphics();
        this.lineGraphics1dH = new GLOBALS.PIXI.Graphics();
        this.lineGraphics1dV = new GLOBALS.PIXI.Graphics();
        this.lineGraphics2d = new GLOBALS.PIXI.Graphics();
        this.mask1dH = new GLOBALS.PIXI.Graphics();
        this.mask1dV = new GLOBALS.PIXI.Graphics();
        this.mask2d = new GLOBALS.PIXI.Graphics();

        this.lineGraphics.addChild(this.lineGraphics1dH);
        this.lineGraphics1dH.addChild(this.mask1dH);
        this.lineGraphics.addChild(this.lineGraphics1dV);
        this.lineGraphics1dV.addChild(this.mask1dV);
        this.lineGraphics.addChild(this.lineGraphics2d);
        this.lineGraphics2d.addChild(this.mask2d);
        this.pMain.addChild(this.lineGraphics);

        this.draw();
        this.animate();
      },
      pubSub,
    );
  }

  drawLines(orientation = this.orientation, left = 0, top = 0) {
    let graphics = this.lineGraphics;

    if (this.isOverlay && orientation === '1d-horizontal') {
      graphics = this.lineGraphics1dH;
    }

    if (this.isOverlay && orientation === '1d-vertical') {
      graphics = this.lineGraphics1dV;
    }

    if (this.isOverlay && orientation === '2d') {
      graphics = this.lineGraphics2d;
    }

    const strokeColor = colorToHex(
      this.options.lineStrokeColor ? this.options.lineStrokeColor : 'blue',
    );

    const strokeWidth = this.options.lineStrokeWidth
      ? this.options.lineStrokeWidth
      : 1;

    graphics.lineStyle(strokeWidth, strokeColor, 1.0);

    // Vertical lines
    if (orientation === '2d' || orientation === '1d-horizontal') {
      graphics.moveTo(this._xScale(0) + left, top);
      graphics.lineTo(this._xScale(0) + left, this.dimensions[1] + top);
    }

    // Horizontal lines
    if (orientation === '2d' || orientation === '1d-vertical') {
      graphics.moveTo(left, this._yScale(0) + top);
      graphics.lineTo(this.dimensions[0] + left, this._yScale(0) + top);
    }

    for (let i = 0; i < this.chromInfo.cumPositions.length; i++) {
      const chrPos = this.chromInfo.cumPositions[i];
      const chrEnd = chrPos.pos + +this.chromInfo.chromLengths[chrPos.chr] + 1;

      // Vertical lines
      if (orientation === '2d' || orientation === '1d-horizontal') {
        graphics.moveTo(this._xScale(chrEnd) + left, top);
        graphics.lineTo(this._xScale(chrEnd) + left, this.dimensions[1] + top);
      }

      // Horizontal lines
      if (orientation === '2d' || orientation === '1d-vertical') {
        graphics.moveTo(left, this._yScale(chrEnd) + top);
        graphics.lineTo(this.dimensions[0] + left, this._yScale(chrEnd) + top);
      }
    }
  }

  draw() {
    if (!this.texts) {
      return;
    }

    if (!this.searchField) {
      return;
    }

    this.lineGraphics.clear();

    if (this.isOverlay) {
      this.lineGraphics1dH.clear();
      this.lineGraphics1dV.clear();
      this.lineGraphics2d.clear();
      this.mask1dH.clear();
      this.mask1dV.clear();
      this.mask2d.clear();
      this.mask1dH.beginFill(0xffffff);
      this.mask1dV.beginFill(0xffffff);
      this.mask2d.beginFill(0xff0000);

      for (let i = 0; i < this.options.orientationsAndPositions.length; i++) {
        const orientation = this.options.orientationsAndPositions[i]
          .orientation;
        const {
          left,
          top,
          width,
          height,
        } = this.options.orientationsAndPositions[i].position;

        if (orientation === '1d-horizontal') {
          this.mask1dH.drawRect(left, top, width, height);
        }

        if (orientation === '1d-vertical') {
          this.mask1dV.drawRect(left, top, width, height);
        }

        if (orientation === '2d') {
          this.mask2d.drawRect(left, top, width, height);
        }

        this.drawLines(orientation, left, top);
      }

      this.lineGraphics1dH.mask = this.mask1dH;
      this.lineGraphics1dV.mask = this.mask1dV;
      this.lineGraphics2d.mask = this.mask2d;
    } else {
      this.drawLines();
    }
  }

  setPosition(newPosition) {
    super.setPosition(newPosition);

    [this.pMain.position.x, this.pMain.position.y] = this.position;
  }

  zoomed(newXScale, newYScale) {
    this.xScale(newXScale);
    this.yScale(newYScale);

    this.draw();
  }

  createSvgLine(x1, x2, y1, y2, stroke, strokeWidth) {
    const line = document.createElement('line');

    line.setAttribute('x1', x1);
    line.setAttribute('x2', x2);

    line.setAttribute('y1', y1);
    line.setAttribute('y2', y2);

    line.setAttribute('stroke', stroke);
    line.setAttribute('stroke-width', strokeWidth);

    return line;
  }

  drawLinesSvg(output, orientation, width, height, left = 0, top = 0) {
    const strokeColor = this.options.lineStrokeColor
      ? this.options.lineStrokeColor
      : 'blue';
    const strokeWidth = this.options.lineStrokeWidth;

    // First horizontal line
    if (orientation === '2d' || orientation === '1d-vertical') {
      const y = this._yScale(0);
      if (y > 0 && y < top + height) {
        output.appendChild(
          this.createSvgLine(
            left,
            width + left,
            y + top,
            y + top,
            strokeColor,
            strokeWidth,
          ),
        );
      }
    }

    // First vertical line
    if (orientation === '2d' || orientation === '1d-horizontal') {
      const x = this._xScale(0);
      if (x > 0 && x < left + width) {
        output.appendChild(
          this.createSvgLine(
            x + left,
            x + left,
            top,
            height + top,
            strokeColor,
            strokeWidth,
          ),
        );
      }
    }

    for (let i = 0; i < this.chromInfo.cumPositions.length; i++) {
      const chrPos = this.chromInfo.cumPositions[i];
      const chrEnd = chrPos.pos + +this.chromInfo.chromLengths[chrPos.chr] + 1;

      if (orientation === '2d' || orientation === '1d-vertical') {
        const y = this._yScale(chrEnd);
        if (y > 0 && y < top + height) {
          output.appendChild(
            this.createSvgLine(
              left,
              width + left,
              y + top,
              y + top,
              strokeColor,
              strokeWidth,
            ),
          );
        }
      }

      if (orientation === '2d' || orientation === '1d-horizontal') {
        const x = this._xScale(chrEnd);
        if (x > 0 && x < left + width) {
          output.appendChild(
            this.createSvgLine(
              x + left,
              x + left,
              top,
              height + top,
              strokeColor,
              strokeWidth,
            ),
          );
        }
      }
    }
  }

  exportSVG() {
    let track = null;
    let base = null;

    if (super.exportSVG) {
      [base, track] = super.exportSVG();
    } else {
      base = document.createElement('g');
      track = base;
    }
    const output = document.createElement('g');
    track.appendChild(output);

    base.setAttribute('id', 'ChromosomeGrid');

    output.setAttribute(
      'transform',
      `translate(${this.position[0]},${this.position[1]})`,
    );

    if (!this.chromInfo) {
      // we haven't received the chromosome info yet
      return [base, track];
    }

    if (this.isOverlay) {
      for (let i = 0; i < this.options.orientationsAndPositions.length; i++) {
        const orientation = this.options.orientationsAndPositions[i]
          .orientation;
        const {
          left,
          top,
          width,
          height,
        } = this.options.orientationsAndPositions[i].position;
        this.drawLinesSvg(output, orientation, width, height, left, top);
      }
    } else {
      this.drawLinesSvg(output, this.orientation, ...this.dimensions);
    }

    return [base, track];
  }
}

export default ChromosomeGrid;
