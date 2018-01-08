import {mix, Mixin} from 'mixwith';

import PixiTrack from './PixiTrack.js';
import { colorToHex } from './utils';

import { pubSub } from './services';

const MOUSEOVER_RADIUS = 4;

export const HorizontalRuleMixin = Mixin((superclass) => class extends superclass {
  drawHorizontalRule(graphics) {
    const strokeWidth = 1;

    let stroke = colorToHex('black');

    if (this.highlighted) {
      stroke = colorToHex('red');
    }
    console.log('stroke:', stroke);

    graphics.lineStyle(2, stroke, 1);

    let pos = 0;

    let dashLength = 5;
    let dashGap = 3;

    // console.log('this._yScale.range()', this._yScale.range());

    while (pos < this.dimensions[0]) {
      graphics.moveTo(pos, this._yScale(this.yPosition));
      graphics.lineTo(pos + dashLength, this._yScale(this.yPosition));

      pos += dashLength + dashGap;
    }
  }
});

export class HorizontalRule extends mix(PixiTrack).with(HorizontalRuleMixin) {
  constructor(stage, yPosition, options, animate) {
    super(stage, options);

    this.pubSubs.push(pubSub.subscribe('app.mouseMove', this.mouseMoveHandler.bind(this)));

    this.highlighted = false;
    this.yPosition = yPosition;
    this.animate = animate;
  }

  mouseMoveHandler(mousePos) {
    if (mousePos.x > this.position[0] && mousePos.x < this.dimensions[0] &&
        mousePos.y > this.position[1] && mousePos.y < this.dimensions[1]) {
      if (Math.abs(mousePos.y - this.position[1] - this._yScale(this.yPosition)) < MOUSEOVER_RADIUS) {
        console.log('highlighted');
        this.highlighted = true;
        this.draw();
        return;
      }
    } else {

    }

    console.log('unhighlighted')
    this.highlighted = false;
    this.draw();
  }

  draw() {
    const graphics = this.pMain; 
    graphics.clear();

    this.drawHorizontalRule(graphics);
    this.animate();
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

export default HorizontalRule;
