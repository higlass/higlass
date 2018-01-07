import { mix, Mixin } from 'mixwith';

import PixiTrack from './PixiTrack.js';
import { colorToHex } from './utils';

import {HorizontalRuleMixin} from './HorizontalRule.js';
import {VerticalRuleMixin} from './VerticalRule.js';

export class CrossRule extends mix(PixiTrack).with(HorizontalRuleMixin, VerticalRuleMixin) {
  constructor(stage, xPosition, yPosition, options) {
    super(stage, options);

    this.xPosition = xPosition;
    this.yPosition = yPosition;
  }

  draw() {
    const graphics = this.pMain; 
    graphics.clear();

    this.drawHorizontalRule(graphics);
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

export default CrossRule;
