import { mix } from 'mixwith';

import PixiTrack from './PixiTrack';

import { RuleMixin } from './RuleMixin';
import { HorizontalRuleMixin } from './HorizontalRule';
import { VerticalRuleMixin } from './VerticalRule';

class CrossRule extends mix(PixiTrack).with(RuleMixin, HorizontalRuleMixin, VerticalRuleMixin) {
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
