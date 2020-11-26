import { colorToHex } from './utils';
import { mix } from './mixwith';

import PixiTrack from './PixiTrack';
import RuleMixin from './RuleMixin';
import { VerticalRuleMixin } from './VerticalRule';

class CrossRule extends mix(PixiTrack).with(RuleMixin, VerticalRuleMixin) {
  constructor(context, options) {
    super(context, options);
    const { x, y } = context;

    this.xPosition = x;
    this.yPosition = y;

    this.strokeWidth = 2;
    this.strokeOpacity = 1;
    this.dashLength = 5;
    this.dashGap = 3;
  }

  draw() {
    const graphics = this.pMain;
    graphics.clear();

    this.drawHorizontalRule(graphics);
    this.drawVerticalRule(graphics);
  }

  mouseMoveHandler(mousePos) {
    this.highlighted =
      this.isWithin(mousePos.x, mousePos.y) &&
      (this.isMouseOverHorizontalLine(mousePos) ||
        this.isMouseOverVerticalLine(mousePos));

    this.draw();
  }

  drawHorizontalRule(graphics) {
    let stroke = colorToHex(this.options.color || 'black');

    if (this.highlighted) {
      stroke = colorToHex('red');
    }

    graphics.lineStyle(this.strokeWidth, stroke, this.strokeOpacity);

    let pos = 0;

    // console.log('this._yScale.range()', this._yScale.range());

    while (pos < this.dimensions[0]) {
      graphics.moveTo(pos, this._yScale(this.yPosition));
      graphics.lineTo(pos + this.dashLength, this._yScale(this.yPosition));

      pos += this.dashLength + this.dashGap;
    }
  }

  isMouseOverHorizontalLine(mousePos) {
    return (
      Math.abs(mousePos.y - this.position[1] - this._yScale(this.yPosition)) <
      this.MOUSEOVER_RADIUS
    );
  }

  /**
   * Export an SVG representation of this track
   *
   * @returns {Array} The two returned DOM nodes are both SVG
   * elements [base,track]. Base is a parent which contains track as a
   * child. Track is clipped with a clipping rectangle contained in base.
   *
   */
  exportSVG() {
    let track = null;
    let base = null;

    if (super.exportSVG) {
      [base, track] = super.exportSVG();
    } else {
      base = document.createElement('g');
      track = base;
    }
    const output = document.createElement('g');
    output.setAttribute('class', 'cross-rule');
    output.setAttribute(
      'transform',
      `translate(${this.position[0]},${this.position[1]})`,
    );

    track.appendChild(output);

    const stroke = this.options.color || 'black';

    const verticalLine = document.createElement('line');
    verticalLine.setAttribute('stroke', stroke);
    verticalLine.setAttribute('stroke-width', this.strokeWidth);
    verticalLine.setAttribute(
      'stroke-dasharray',
      `${this.dashLength} ${this.dashGap}`,
    );
    verticalLine.setAttribute('x1', this._xScale(this.xPosition));
    verticalLine.setAttribute('y1', 0);
    verticalLine.setAttribute('x2', this._xScale(this.xPosition));
    verticalLine.setAttribute('y2', this.dimensions[1]);

    const horizontalLine = document.createElement('line');
    horizontalLine.setAttribute('stroke', stroke);
    horizontalLine.setAttribute('stroke-width', this.strokeWidth);
    horizontalLine.setAttribute(
      'stroke-dasharray',
      `${this.dashLength} ${this.dashGap}`,
    );
    horizontalLine.setAttribute('x1', 0);
    horizontalLine.setAttribute('y1', this._yScale(this.yPosition));
    horizontalLine.setAttribute('x2', this.dimensions[0]);
    horizontalLine.setAttribute('y2', this._yScale(this.yPosition));

    output.appendChild(verticalLine);
    output.appendChild(horizontalLine);

    return [base, track];
  }
}

export default CrossRule;
