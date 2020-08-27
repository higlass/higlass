import { mix, Mixin } from './mixwith';

import PixiTrack from './PixiTrack';
import RuleMixin from './RuleMixin';

import { colorToHex } from './utils';

export const HorizontalRuleMixin = Mixin(
  (superclass) =>
    class extends superclass {
      drawHorizontalRule(graphics) {
        let stroke = colorToHex(this.options.color || 'black');

        if (this.highlighted) {
          stroke = colorToHex('red');
        }

        graphics.lineStyle(this.strokeWidth, stroke, this.strokeOpacity);

        let pos = 0;

        while (pos < this.dimensions[0]) {
          graphics.moveTo(pos, this._yScale(this.yPosition));
          graphics.lineTo(pos + this.dashLength, this._yScale(this.yPosition));

          pos += this.dashLength + this.dashGap;
        }
      }

      isMouseOverHorizontalLine(mousePos) {
        if (
          Math.abs(
            mousePos.y - this.position[1] - this._yScale(this.yPosition),
          ) < this.MOUSEOVER_RADIUS
        ) {
          return true;
        }
        return false;
      }
    },
);

class HorizontalRule extends mix(PixiTrack).with(
  RuleMixin,
  HorizontalRuleMixin,
) {
  constructor(context, options) {
    super(context, options);

    this.yPosition = context.yPosition;

    this.strokeWidth = 2;
    this.strokeOpacity = 1;
    this.dashLength = 5;
    this.dashGap = 3;
  }

  mouseMoveHandler(mousePos) {
    if (
      this.isWithin(mousePos.x, mousePos.y) &&
      this.isMouseOverHorizontalLine(mousePos)
    ) {
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
    output.setAttribute('class', 'horizontal-rule');
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
    line.setAttribute('x1', 0);
    line.setAttribute('y1', this._yScale(this.yPosition));
    line.setAttribute('x2', this.dimensions[0]);
    line.setAttribute('y2', this._yScale(this.yPosition));

    output.appendChild(line);

    return [base, track];
  }
}

export default HorizontalRule;
