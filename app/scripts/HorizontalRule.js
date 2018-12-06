import { mix, Mixin } from './mixwith';

import PixiTrack from './PixiTrack';
import RuleMixin from './RuleMixin';

import { colorToHex } from './utils';

export const HorizontalRuleMixin = Mixin(superclass => class extends superclass {
  drawHorizontalRule(graphics) {
    const strokeWidth = 1;

    let stroke = colorToHex('black');

    if (this.highlighted) {
      stroke = colorToHex('red');
    }

    graphics.lineStyle(2, stroke, 1);

    let pos = 0;

    const dashLength = 5;
    const dashGap = 3;

    // console.log('this._yScale.range()', this._yScale.range());

    while (pos < this.dimensions[0]) {
      graphics.moveTo(pos, this._yScale(this.yPosition));
      graphics.lineTo(pos + dashLength, this._yScale(this.yPosition));

      pos += dashLength + dashGap;
    }
  }

  isMouseOverHorizontalLine(mousePos) {
    if (
      Math.abs(mousePos.y - this.position[1] - this._yScale(this.yPosition)) < this.MOUSEOVER_RADIUS
    ) {
      return true;
    }
    return false;
  }
});

class HorizontalRule extends mix(PixiTrack).with(RuleMixin, HorizontalRuleMixin) {
  constructor(pubSub, stage, yPosition, options, animate) {
    super(pubSub, stage, options, animate);

    this.yPosition = yPosition;
  }


  mouseMoveHandler(mousePos) {
    if (this.isWithin(mousePos.x, mousePos.y)
      && this.isMouseOverHorizontalLine(mousePos)) {
      this.highlighted = true;
      this.draw();
      return;
    }

    this.highlighted = false;
    this.draw();
  }

  draw() {
    const graphics = this.pMain;
    graphics.clear();

    this.drawHorizontalRule(graphics);
    this.animate();
  }
}

export default HorizontalRule;
