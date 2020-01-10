import { mix, Mixin } from './mixwith';

import PixiTrack from './PixiTrack';
import RuleMixin from './RuleMixin';

import { colorToHex } from './utils';

export const VerticalRuleMixin = Mixin(superclass => class extends superclass {
  drawVerticalRule(graphics) {
    let stroke = colorToHex('black');

    if (this.highlighted) {
      stroke = colorToHex('red');
    }

    graphics.lineStyle(2, stroke, 1);

    let pos = 0;

    const dashLength = 5;
    const dashGap = 3;

    // console.log('this.position', this.position);
    // console.log('this._xScale.range()', this._xScale.range());

    while (pos < this.dimensions[1]) {
      graphics.moveTo(this._xScale(this.xPosition), pos);
      graphics.lineTo(this._xScale(this.xPosition), pos + dashLength);

      pos += dashLength + dashGap;
    }
  }

  isMouseOverVerticalLine(mousePos) {
    return Math.abs(
      mousePos.x - this.position[0] - this._xScale(this.xPosition)
    ) < this.MOUSEOVER_RADIUS;
  }
});

export default class VerticalRule extends mix(PixiTrack).with(RuleMixin, VerticalRuleMixin) {
  constructor(context, options) {
    super(context, options);

    this.xPosition = context.xPosition;
  }

  draw() {
    const graphics = this.pMain;
    graphics.clear();

    this.drawVerticalRule(graphics);
    this.animate();
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
    output.setAttribute('transform',
      `translate(${this.position[0]},${this.position[1]})`);

    track.appendChild(output);

    let stroke = 'black';
    if (this.highlighted) {
      stroke = 'red';
    }

    const line = document.createElement('line');
    line.setAttribute('stroke', stroke);
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-dasharray', '5 3');
    line.setAttribute('x1', this._xScale(this.xPosition));
    line.setAttribute('y1', 0);
    line.setAttribute('x2', this._xScale(this.xPosition));
    line.setAttribute('y2', this.dimensions[1]);

    output.appendChild(line);

    return [base, track];
  }

  mouseMoveHandler(mousePos) {
    this.highlighted = (
      this.isWithin(mousePos.x, mousePos.y)
      && this.isMouseOverVerticalLine(mousePos)
    );

    this.draw();
  }
}
