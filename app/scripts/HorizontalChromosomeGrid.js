import Chromosome2DGrid from './Chromosome2DGrid';

import { colorToHex } from './utils';

class HorizontalChromosomeGrid extends Chromosome2DGrid {
  drawLines() {
    const graphics = this.lineGraphics;
    const strokeColor = colorToHex(this.options.lineStrokeColor ? this.options.lineStrokeColor : 'blue');

    const strokeWidth = this.options.lineStrokeWidth ? this.options.lineStrokeWidth : 1;

    graphics.clear();
    graphics.lineStyle(strokeWidth, strokeColor, 1.0);

    graphics.moveTo(this._xScale(0), 0);
    graphics.lineTo(this._xScale(0), this.dimensions[1]);

    for (let i = 0; i < this.chromInfo.cumPositions.length; i++) {
      const chrPos = this.chromInfo.cumPositions[i];
      const chrEnd = chrPos.pos + +this.chromInfo.chromLengths[chrPos.chr] + 1;

      graphics.moveTo(this._xScale(chrEnd), 0);
      graphics.lineTo(this._xScale(chrEnd), this.dimensions[1]);
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

    base.setAttribute('id', 'HorizontalChromosomeGrid');

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

      // draw vertical lines (all start at y=0)
      const line = document.createElement('line');

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

export default HorizontalChromosomeGrid;
