import * as PIXI from 'pixi.js';

import PixiTrack from './PixiTrack';
import ChromosomeInfo from './ChromosomeInfo';
import SearchField from './SearchField';

import { colorToHex } from './utils';

class Chromosome2DGrid extends PixiTrack {
  constructor(context, options) {
    super(context, options);
    const {
      chromInfoPath, dataConfig, animate, pubSub
    } = context;

    this.searchField = null;
    this.chromInfo = null;
    this.animate = animate;

    let chromSizesPath = chromInfoPath;

    if (!chromSizesPath) {
      chromSizesPath = `${dataConfig.server}/chrom-sizes/?id=${dataConfig.tilesetUid}`;
    }

    ChromosomeInfo(chromSizesPath, (newChromInfo) => {
      this.chromInfo = newChromInfo;

      this.searchField = new SearchField(this.chromInfo);

      this.texts = [];
      this.lineGraphics = new PIXI.Graphics();

      this.pMain.addChild(this.lineGraphics);

      this.draw();
      this.animate();
    }, pubSub);
  }

  drawLines() {
    const graphics = this.lineGraphics;
    const strokeColor = colorToHex(this.options.lineStrokeColor ? this.options.lineStrokeColor : 'blue');

    const strokeWidth = this.options.lineStrokeWidth ? this.options.lineStrokeWidth : 1;

    graphics.clear();
    graphics.lineStyle(strokeWidth, strokeColor, 1.0);

    graphics.moveTo(this._xScale(0), 0);
    graphics.lineTo(this._xScale(0), this.dimensions[1]);

    graphics.moveTo(0, this._yScale(0));
    graphics.lineTo(this.dimensions[0], this._yScale(0));

    for (let i = 0; i < this.chromInfo.cumPositions.length; i++) {
      const chrPos = this.chromInfo.cumPositions[i];
      const chrEnd = chrPos.pos + +this.chromInfo.chromLengths[chrPos.chr] + 1;

      graphics.moveTo(0, this._yScale(chrEnd));
      graphics.lineTo(this.dimensions[0], this._yScale(chrEnd));

      graphics.moveTo(this._xScale(chrEnd), 0);
      graphics.lineTo(this._xScale(chrEnd), this.dimensions[1]);
    }
  }

  draw() {
    if (!this.texts) { return; }

    if (!this.searchField) { return; }

    this.drawLines();
  }

  setPosition(newPosition) {
    super.setPosition(newPosition);

    ([this.pMain.position.x, this.pMain.position.y] = this.position);
  }

  zoomed(newXScale, newYScale) {
    this.xScale(newXScale);
    this.yScale(newYScale);

    this.draw();
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

    base.setAttribute('id', 'Chromosome2DGrid');

    output.setAttribute('transform',
      `translate(${this.position[0]},${this.position[1]})`);

    if (!this.chromInfo) {
    // we haven't received the chromosome info yet
      return [base, track];
    }

    const strokeColor = this.options.gridStrokeColor ? this.options.gridStrokeColor : 'blue';
    const strokeWidth = this.options.gridStrokeWidth;

    for (let i = 0; i < this.chromInfo.cumPositions.length; i++) {
      const chrPos = this.chromInfo.cumPositions[i];
      const chrEnd = chrPos.pos + +this.chromInfo.chromLengths[chrPos.chr] + 1;

      let line = document.createElement('line');

      // draw horizontal lines (all start at x=0)
      line.setAttribute('x1', 0);
      line.setAttribute('x2', this.dimensions[0]);

      line.setAttribute('y1', this._yScale(chrEnd));
      line.setAttribute('y2', this._yScale(chrEnd));

      line.setAttribute('stroke', strokeColor);
      line.setAttribute('stroke-width', strokeWidth);

      output.appendChild(line);

      // draw vertical lines (all start at y=0)
      line = document.createElement('line');

      // draw horizontal lines (all start at x=0)
      line.setAttribute('x1', this._xScale(chrEnd));
      line.setAttribute('x2', this._xScale(chrEnd));

      line.setAttribute('y1', 0);
      line.setAttribute('y1', this.dimensions[1]);

      line.setAttribute('stroke', strokeColor);
      line.setAttribute('stroke-width', strokeWidth);

      output.appendChild(line);
    }

    return [base, track];
  }
}

export default Chromosome2DGrid;
