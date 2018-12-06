import { colorToHex } from './utils';
import { mix } from './mixwith';

import PixiTrack from './PixiTrack';
import RuleMixin from './RuleMixin';
import { HorizontalRuleMixin } from './HorizontalRule';
import { VerticalRuleMixin } from './VerticalRule';

class CrossRule extends mix(PixiTrack).with(RuleMixin, VerticalRuleMixin) {
  constructor(context, options) {
    super(context, options);
    const { x, y } = context;

    this.xPosition = x;
    this.yPosition = y;
  }

  draw() {
    const graphics = this.pMain;
    graphics.clear();

    this.drawHorizontalRule(graphics);
    this.drawVerticalRule(graphics);
  }

  mouseMoveHandler(mousePos) {
    this.highlighted = (
      this.isWithin(mousePos.x, mousePos.y)
      && (
        this.isMouseOverHorizontalLine(mousePos)
        || this.isMouseOverVerticalLine(mousePos)
      )
    );

    this.draw();
  }

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
    return Math.abs(mousePos.y - this.position[1] - this._yScale(this.yPosition))
      < this.MOUSEOVER_RADIUS;
  }
}

export default CrossRule;
