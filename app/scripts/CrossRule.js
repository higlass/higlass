import { mix, Mixin } from 'mixwith';

import PixiTrack from './PixiTrack.js';
import { colorToHex } from './utils';

import { RuleMixin } from './RuleMixin';
import { HorizontalRuleMixin } from './HorizontalRule.js';
import { VerticalRuleMixin } from './VerticalRule.js';

export class CrossRule extends mix(PixiTrack).with(RuleMixin, HorizontalRuleMixin, VerticalRuleMixin) {
  constructor(stage, xPosition, yPosition, options, animate) {
    super(stage, options, animate);

    this.xPosition = xPosition;
    this.yPosition = yPosition;
  }

  draw() {
    const graphics = this.pMain; 
    graphics.clear();

    this.drawHorizontalRule(graphics);
    this.drawVerticalRule(graphics);
  }

  mouseMoveHandler(mousePos) {
    if (this.isPointInsideTrack(mousePos.x, mousePos.y) &&
      this.isMouseOverHorizontalLine(mousePos) || this.isMouseOverVerticalLine(mousePos)) {
        this.highlighted = true;
        this.draw();
        return;
    }

    this.highlighted = false;
    this.draw();
  }
}

export default CrossRule;
