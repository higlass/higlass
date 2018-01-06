import PixiTrack from './PixiTrack.js';
import { colorToHex } from './utils';

export class HorizontalRule extends PixiTrack {
  constructor(stage, yPosition, options) {
    super(stage, options);

    this.yPosition = yPosition;
  }

  draw() {
    const graphics = this.pMain; 
    graphics.clear();

    const strokeWidth = 1;
    const stroke = colorToHex('black');

    graphics.lineStyle(2, stroke, 1);

    let pos = 0;

    let dashLength = 5;
    let dashGap = 3;

    console.log('this._yScale.range()', this._yScale.range());

    while (pos < this.dimensions[0]) {
      graphics.moveTo(pos, this._yScale(this.yPosition));
      graphics.lineTo(pos + dashLength, this._yScale(this.yPosition));

      pos += dashLength + dashGap;
    }
  }

  setPosition(newPosition) {
    super.setPosition(newPosition);

    //console.log('position', this.position);
    this.pMain.position.x = this.position[0];
    this.pMain.position.y = this.position[1];
  }

  zoomed(newXScale, newYScale, k, tx, ty) {
    super.zoomed(newXScale, newYScale);

    this.draw();
  }
}

export default HorizontalRule;
