import Chromosome2DGrid from './Chromosome2DGrid';

import { colorToHex } from './utils';

class VerticalChromosomeGrid extends Chromosome2DGrid {
  drawLines() {
    const graphics = this.lineGraphics;
    const strokeColor = colorToHex(this.options.lineStrokeColor ? this.options.lineStrokeColor : 'blue');

    const strokeWidth = this.options.lineStrokeWidth ? this.options.lineStrokeWidth : 1;

    graphics.clear();
    graphics.lineStyle(strokeWidth, strokeColor, 1.0);

    // Demarcation of the first chromosome
    graphics.moveTo(0, this._yScale(0));
    graphics.lineTo(this.dimensions[0], this._yScale(0));

    for (let i = 0; i < this.chromInfo.cumPositions.length; i++) {
      const chrPos = this.chromInfo.cumPositions[i];
      const chrEnd = chrPos.pos + +this.chromInfo.chromLengths[chrPos.chr] + 1;

      graphics.moveTo(0, this._yScale(chrEnd));
      graphics.lineTo(this.dimensions[0], this._yScale(chrEnd));
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

    base.setAttribute('id', 'VerticalChromosomeGrid');

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

      const line = document.createElement('line');

      line.setAttribute('x1', 0);
      line.setAttribute('x2', this.dimensions[0]);

      line.setAttribute('y1', this._yScale(chrEnd));
      line.setAttribute('y2', this._yScale(chrEnd));

      line.setAttribute('stroke', strokeColor);
      line.setAttribute('stroke-width', strokeWidth);

      output.appendChild(line);
    }

    return [base, track];
  }
}

export default VerticalChromosomeGrid;
