import { mix, Mixin } from 'mixwith';

import PixiTrack from './PixiTrack.js';
import { colorToHex } from './utils';

export const VerticalRuleMixin = Mixin((superclass) => class extends superclass {
  drawVerticalRule(graphics) {
    const strokeWidth = 1;
    const stroke = colorToHex('black');

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
});

export class VerticalRule extends mix(PixiTrack).with(VerticalRuleMixin) {
  constructor(stage, xPosition, options) {
    super(stage, options);

    this.xPosition = xPosition;
  }

  draw() {
    const graphics = this.pMain; 
    graphics.clear();

    this.drawVerticalRule(graphics);
  }

  setPosition(newPosition) {
    super.setPosition(newPosition);

    // console.log('position', this.position);
    this.pMain.position.x = this.position[0];
    this.pMain.position.y = this.position[1];
  }

  zoomed(newXScale, newYScale, k, tx, ty) {
    super.zoomed(newXScale, newYScale);

    this.draw();
  }
}

export default VerticalRule;
