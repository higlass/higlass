import { format } from 'd3-format';

// Configs
import { GLOBALS, THEME_DARK } from './configs';

import { colorToHex } from './utils';

const TICK_HEIGHT = 40;
const TICK_MARGIN = 0;
const TICK_LENGTH = 5;
const TICK_LABEL_MARGIN = 4;

class AxisPixi {
  constructor(track) {
    this.pAxis = new GLOBALS.PIXI.Graphics();
    this.track = track;

    this.axisTexts = [];
    this.axisTextFontFamily = 'Arial';
    this.axisTextFontSize = 10;
  }

  startAxis(axisHeight) {
    const graphics = this.pAxis;

    graphics.clear();
    graphics.lineStyle(
      1,
      this.track.getTheme() === THEME_DARK ? colorToHex('#ffffff') : 0x000000,
      1,
    );

    // draw the axis line
    graphics.moveTo(0, 0);
    graphics.lineTo(0, axisHeight);
  }

  createAxisTexts(valueScale, axisHeight) {
    this.tickValues = this.calculateAxisTickValues(valueScale, axisHeight);
    let i = 0;

    const color = this.track.getTheme() === THEME_DARK ? 'white' : 'black';

    if (
      !this.track.options ||
      !this.track.options.axisLabelFormatting ||
      this.track.options.axisLabelFormatting === 'scientific'
    ) {
      this.tickFormat = format('.2');
    } else {
      this.tickFormat = (x) => x;
    }

    while (i < this.tickValues.length) {
      const tick = this.tickValues[i];

      while (this.axisTexts.length <= i) {
        const newText = new GLOBALS.PIXI.Text(tick, {
          fontSize: `${this.axisTextFontSize}px`,
          fontFamily: this.axisTextFontFamily,
          fill: color,
        });
        this.axisTexts.push(newText);

        this.pAxis.addChild(newText);
      }

      this.axisTexts[i].text = this.tickFormat(tick);
      this.axisTexts[i].anchor.y = 0.5;
      this.axisTexts[i].anchor.x = 0.5;
      i++;
    }

    while (this.axisTexts.length > this.tickValues.length) {
      const lastText = this.axisTexts.pop();
      this.pAxis.removeChild(lastText);
      lastText.destroy(true);
    }
  }

  calculateAxisTickValues(valueScale, axisHeight) {
    const tickCount = Math.max(Math.ceil(axisHeight / TICK_HEIGHT), 1);

    // create scale ticks but not all the way to the top
    // tick values have not been formatted here
    let tickValues = valueScale.ticks(tickCount);

    if (tickValues.length < 1) {
      tickValues = valueScale.ticks(tickCount + 1);

      if (tickValues.length > 1) {
        // sometimes the ticks function will return 0 and then 2
        // if it didn't return enough previously, we probably only want a single
        // tick
        tickValues = [tickValues[0]];
      }
    }

    return tickValues;
  }

  drawAxisLeft(valueScale, axisHeight) {
    // Draw a left-oriented axis (ticks pointing to the right)
    this.startAxis(axisHeight);
    this.createAxisTexts(valueScale, axisHeight);

    const graphics = this.pAxis;

    if (this.track.getTheme() === THEME_DARK) {
      graphics.lineStyle(
        graphics.lineWidth || graphics._lineStyle.width,
        colorToHex('#ffffff'),
      );
    }

    // draw the top, potentially unlabelled, ticke
    graphics.moveTo(0, 0);
    graphics.lineTo(-(TICK_MARGIN + TICK_LENGTH), 0);

    graphics.moveTo(0, axisHeight);
    graphics.lineTo(-(TICK_MARGIN + TICK_LENGTH), axisHeight);

    for (let i = 0; i < this.axisTexts.length; i++) {
      const tick = this.tickValues[i];

      // draw ticks to the left of the axis
      this.axisTexts[i].x = -(
        TICK_MARGIN +
        TICK_LENGTH +
        TICK_LABEL_MARGIN +
        this.axisTexts[i].width / 2
      );
      this.axisTexts[i].y = valueScale(tick);

      graphics.moveTo(-TICK_MARGIN, valueScale(tick));
      graphics.lineTo(-(TICK_MARGIN + TICK_LENGTH), valueScale(tick));

      if (this.track && this.track.flipText) {
        this.axisTexts[i].scale.x = -1;
      }
    }

    this.hideOverlappingAxisLabels();
  }

  drawAxisRight(valueScale, axisHeight) {
    // Draw a right-oriented axis (ticks pointint to the left)
    this.startAxis(axisHeight);
    this.createAxisTexts(valueScale, axisHeight);

    const graphics = this.pAxis;

    if (this.track.getTheme() === THEME_DARK) {
      graphics.lineStyle(
        graphics.lineWidth || graphics._lineStyle.width,
        colorToHex('#ffffff'),
      );
    }

    // draw the top, potentially unlabelled, ticke
    graphics.moveTo(0, 0);
    graphics.lineTo(TICK_MARGIN + TICK_LENGTH, 0);

    graphics.moveTo(0, axisHeight);
    graphics.lineTo(TICK_MARGIN + TICK_LENGTH, axisHeight);

    for (let i = 0; i < this.axisTexts.length; i++) {
      const tick = this.tickValues[i];

      this.axisTexts[i].x =
        TICK_MARGIN +
        TICK_LENGTH +
        TICK_LABEL_MARGIN +
        this.axisTexts[i].width / 2;
      this.axisTexts[i].y = valueScale(tick);

      graphics.moveTo(TICK_MARGIN, valueScale(tick));
      graphics.lineTo(TICK_MARGIN + TICK_LENGTH, valueScale(tick));

      if (this.track && this.track.flipText) {
        this.axisTexts[i].scale.x = -1;
      }
    }

    this.hideOverlappingAxisLabels();
  }

  hideOverlappingAxisLabels() {
    // show all tick marks initially
    for (let i = this.axisTexts.length - 1; i >= 0; i--) {
      this.axisTexts[i].visible = true;
    }

    for (let i = this.axisTexts.length - 1; i >= 0; i--) {
      // if this tick mark is invisible, it's not going to
      // overlap with any others
      if (!this.axisTexts[i].visible) {
        continue;
      }

      let j = i - 1;

      while (j >= 0) {
        // go through and hide all overlapping tick marks
        if (
          this.axisTexts[i].y + this.axisTexts[i].height / 2 >
          this.axisTexts[j].y - this.axisTexts[j].height / 2
        ) {
          this.axisTexts[j].visible = false;
        } else {
          // because the tick marks are ordered from top to bottom, if this
          // one doesn't overlap, then the ones below it won't either, so
          // we can stop looking
          break;
        }

        j -= 1;
      }
    }
  }

  exportVerticalAxis(axisHeight) {
    const gAxis = document.createElement('g');
    gAxis.setAttribute('class', 'axis-vertical');

    let stroke = 'black';

    if (this.track && this.track.options.lineStrokeColor) {
      stroke = this.track.options.lineStrokeColor;
    }
    // TODO: On the canvas, there is no vertical line beside the scale,
    // but it also has the draggable control to the right.
    // Confirm that this difference between SVG and Canvas is intentional,
    // and if not, remove this.
    if (this.track.getTheme() === THEME_DARK) stroke = '#cccccc';

    const line = document.createElement('path');

    line.setAttribute('fill', 'transparent');
    line.setAttribute('stroke', stroke);
    line.setAttribute('id', 'axis-line');

    line.setAttribute('d', `M0,0 L0,${axisHeight}`);

    gAxis.appendChild(line);

    return gAxis;
  }

  createAxisSVGLine() {
    // factor out the styling for axis lines
    let stroke = 'black';

    if (this.track && this.track.options.lineStrokeColor) {
      stroke = this.track.options.lineStrokeColor;
    }

    if (this.track.getTheme() === THEME_DARK) stroke = '#cccccc';

    const line = document.createElement('path');
    line.setAttribute('id', 'tick-mark');
    line.setAttribute('fill', 'transparent');
    line.setAttribute('stroke', stroke);

    return line;
  }

  createAxisSVGText(text) {
    // factor out the creation of axis texts
    const t = document.createElement('text');

    t.innerHTML = text;
    t.setAttribute('id', 'axis-text');
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('font-family', this.axisTextFontFamily);
    t.setAttribute('font-size', this.axisTextFontSize);
    t.setAttribute('dy', this.axisTextFontSize / 2 - 2);

    return t;
  }

  exportAxisLeftSVG(valueScale, axisHeight) {
    const gAxis = this.exportVerticalAxis(axisHeight);

    const topTickLine = this.createAxisSVGLine();
    gAxis.appendChild(topTickLine);
    topTickLine.setAttribute('d', `M0,0 L${+(TICK_MARGIN + TICK_LENGTH)},0`);

    const bottomTickLine = this.createAxisSVGLine();
    gAxis.appendChild(bottomTickLine);
    bottomTickLine.setAttribute(
      'd',
      `M0,${axisHeight} L${+(TICK_MARGIN + TICK_LENGTH)},${axisHeight}`,
    );

    for (let i = 0; i < this.axisTexts.length; i++) {
      const tick = this.tickValues[i];
      const text = this.axisTexts[i];

      const tickLine = this.createAxisSVGLine();

      gAxis.appendChild(tickLine);

      tickLine.setAttribute(
        'd',
        `M${+TICK_MARGIN},${valueScale(tick)} L${+(
          TICK_MARGIN + TICK_LENGTH
        )},${valueScale(tick)}`,
      );

      const g = document.createElement('g');
      gAxis.appendChild(g);
      if (text.visible) {
        const t = this.createAxisSVGText(text.text);
        g.appendChild(t);
      }

      g.setAttribute(
        'transform',
        `translate(${text.position.x},${text.position.y})
             scale(${text.scale.x},${text.scale.y})`,
      );
    }

    return gAxis;
  }

  exportAxisRightSVG(valueScale, axisHeight) {
    const gAxis = this.exportVerticalAxis(axisHeight);

    const topTickLine = this.createAxisSVGLine();
    gAxis.appendChild(topTickLine);
    topTickLine.setAttribute('d', `M0,0 L${-(TICK_MARGIN + TICK_LENGTH)},0`);

    const bottomTickLine = this.createAxisSVGLine();
    gAxis.appendChild(bottomTickLine);
    bottomTickLine.setAttribute(
      'd',
      `M0,${axisHeight} L${-(TICK_MARGIN + TICK_LENGTH)},${axisHeight}`,
    );

    for (let i = 0; i < this.axisTexts.length; i++) {
      const tick = this.tickValues[i];
      const text = this.axisTexts[i];

      const tickLine = this.createAxisSVGLine();

      gAxis.appendChild(tickLine);

      tickLine.setAttribute(
        'd',
        `M${-TICK_MARGIN},${valueScale(tick)} L${-(
          TICK_MARGIN + TICK_LENGTH
        )},${valueScale(tick)}`,
      );

      const g = document.createElement('g');
      gAxis.appendChild(g);

      if (text.visible) {
        const t = this.createAxisSVGText(text.text);
        g.appendChild(t);
      }

      g.setAttribute(
        'transform',
        `translate(${text.position.x},${text.position.y})
             scale(${text.scale.x},${text.scale.y})`,
      );
    }

    return gAxis;
  }

  clearAxis() {
    const graphics = this.pAxis;
    while (this.axisTexts.length) {
      const axisText = this.axisTexts.pop();
      graphics.removeChild(axisText);
    }

    graphics.clear();
  }
}

export default AxisPixi;
