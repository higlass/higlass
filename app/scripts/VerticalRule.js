import { mix, Mixin } from 'mixwith';

import PixiTrack from './PixiTrack.js';
import { colorToHex } from './utils';
import { RuleMixin } from './RuleMixin';

export const VerticalRuleMixin = Mixin((superclass) => class extends superclass {
  drawVerticalRule(graphics) {
    const strokeWidth = 1;
    let stroke = colorToHex('black');

    if (this.highlighted) {
      stroke = colorToHex('red');
    }

    graphics.lineStyle(2, stroke, 1);

    let pos = 0;

    let dashLength = 5;
    let dashGap = 3;

    // console.log('this._yScale.range()', this._yScale.range());

    while (pos < this.dimensions[1]) {
      graphics.moveTo(this._xScale(this.xPosition), pos);
      graphics.lineTo(this._xScale(this.xPosition), pos + dashLength);

      pos += dashLength + dashGap;
    }
  }

  isMouseOverVerticalLine(mousePos) {
      if (Math.abs(mousePos.x - this.position[0] - this._xScale(this.xPosition)) < this.MOUSEOVER_RADIUS) {
        return true;
      }
    return false;
  }
});

export class VerticalRule extends mix(PixiTrack).with(RuleMixin, VerticalRuleMixin) {
  constructor(stage, xPosition, options, animate) {
    super(stage, options, animate);

    this.xPosition = xPosition;
  }

  draw() {
    const graphics = this.pMain; 
    graphics.clear();

    this.drawVerticalRule(graphics);
    this.animate();
  }

  mouseMoveHandler(mousePos) {
    if (this.isPointInsideTrack(mousePos.x, mousePos.y) &&
      this.isMouseOverVerticalLine(mousePos)) {
        this.highlighted = true;
        this.draw();
        return;
    }

    this.highlighted = false;
    this.draw();
  }
}

export default VerticalRule;
