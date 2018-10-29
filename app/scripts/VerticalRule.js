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

    // console.log('this._yScale.range()', this._yScale.range());

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
  constructor(stage, xPosition, options, animate) {
    super(stage, options, animate);

    this.xPosition = xPosition;
  }

  exportSVG() {
    const output = document.createElement('g');
    output.setAttribute('transform',
      `translate(${this.position[0]},${this.position[1]})`);
    
    const verticalLine = document.createElement('line');
    verticalLine.setAttribute('x1', this._xScale(this.xPosition));
    verticalLine.setAttribute('y1', 0);
    verticalLine.setAttribute('x2', this._xScale(this.xPosition))
    verticalLine.setAttribute('y2', this.dimensions[1]);
    verticalLine.setAttribute('stroke', 'black');
    verticalLine.setAttribute('stroke-width', '2');
    verticalLine.setAttribute('stroke-dasharray', '5 3')
    output.appendChild(verticalLine);
    
    return [output];
  }

  draw() {
    const graphics = this.pMain;
    graphics.clear();

    this.drawVerticalRule(graphics);
    this.animate();
  }

  mouseMoveHandler(mousePos) {
    this.highlighted = (
      this.isWithin(mousePos.x, mousePos.y)
      && this.isMouseOverVerticalLine(mousePos)
    );

    this.draw();
  }
}
