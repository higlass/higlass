import { mix, Mixin } from './mixwith';

import PixiTrack from './PixiTrack';
import RuleMixin from './RuleMixin';

import { colorToHex } from './utils';

export const VerticalRuleMixin = Mixin(
  (superclass) =>
    class extends superclass {
      drawVerticalRule(graphics) {
        let stroke = colorToHex(this.options.color || 'black');

        if (this.highlighted) {
          stroke = colorToHex('red');
        }

        graphics.lineStyle(this.strokeWidth, stroke, this.strokeOpacity);

        let pos = 0;

        // console.log('this.position', this.position);
        // console.log('this._xScale.range()', this._xScale.range());

        while (pos < this.dimensions[1]) {
          graphics.moveTo(this._xScale(this.xPosition), pos);
          graphics.lineTo(this._xScale(this.xPosition), pos + this.dashLength);

          pos += this.dashLength + this.dashGap;
        }
      }

      isMouseOverVerticalLine(mousePos) {
        return (
          Math.abs(
            mousePos.x - this.position[0] - this._xScale(this.xPosition),
          ) < this.MOUSEOVER_RADIUS
        );
      }
    },
);

export default class VerticalRule extends mix(PixiTrack).with(
  RuleMixin,
  VerticalRuleMixin,
) {
  constructor(context, options) {
    super(context, options);

    this.xPosition = context.xPosition;

    this.strokeWidth = 2;
    this.strokeOpacity = 1;
    this.dashLength = 5;
    this.dashGap = 3;
  }

  draw() {
    const graphics = this.pMain;
    graphics.clear();

    this.drawVerticalRule(graphics);
    this.animate();
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
    output.setAttribute('class', 'vertical-rule');
    output.setAttribute(
      'transform',
      `translate(${this.position[0]},${this.position[1]})`,
    );

    track.appendChild(output);

    const stroke = this.options.color || 'black';

    const line = document.createElement('line');
    line.setAttribute('stroke', stroke);
    line.setAttribute('stroke-width', this.strokeWidth);
    line.setAttribute('stroke-dasharray', `${this.dashLength} ${this.dashGap}`);
    line.setAttribute('x1', this._xScale(this.xPosition));
    line.setAttribute('y1', 0);
    line.setAttribute('x2', this._xScale(this.xPosition));
    line.setAttribute('y2', this.dimensions[1]);

    output.appendChild(line);

    return [base, track];
  }

  mouseMoveHandler(mousePos) {
    this.highlighted =
      this.isWithin(mousePos.x, mousePos.y) &&
      this.isMouseOverVerticalLine(mousePos);

    this.draw();
  }
}
