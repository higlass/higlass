// @ts-nocheck
import boxIntersect from 'box-intersect';
import { scaleLinear } from 'd3-scale';
import { format, precisionPrefix, formatPrefix } from 'd3-format';

import PixiTrack from './PixiTrack';
import ChromosomeInfo from './ChromosomeInfo';
import SearchField from './SearchField';

import {
  absToChr,
  colorToHex,
  pixiTextToSvg,
  showMousePosition,
  svgLine,
} from './utils';

import { GLOBALS, THEME_DARK } from './configs';

const TICK_WIDTH = 200;
const TICK_HEIGHT = 6;
const TICK_TEXT_SEPARATION = 2;
const TICK_COLOR = 0x777777;

class HorizontalChromosomeLabels extends PixiTrack {
  constructor(context, options) {
    super(context, options);
    const { dataConfig, animate, chromInfoPath, isShowGlobalMousePosition } =
      context;

    this.searchField = null;
    this.chromInfo = null;
    this.dataConfig = dataConfig;

    this.pTicks = new GLOBALS.PIXI.Graphics();
    this.pMain.addChild(this.pTicks);

    this.gTicks = {};
    this.tickTexts = {};

    this.options = options;
    this.isShowGlobalMousePosition = isShowGlobalMousePosition;

    this.textFontSize = 12;
    this.textFontFamily = 'Arial';
    this.textFontColor = '#808080';
    this.textStrokeColor =
      this.getTheme() === THEME_DARK ? '#000000' : '#ffffff';
    this.pixiTextConfig = {
      fontSize: +this.options.fontSize
        ? `${+this.options.fontSize}px`
        : `${this.textFontSize}px`,
      fontFamily: this.textFontFamily,
      fill: this.options.color || this.textFontColor,
      lineJoin: 'round',
      stroke: this.options.stroke || this.textStrokeColor,
      strokeThickness: 2,
    };
    this.stroke = colorToHex(this.pixiTextConfig.stroke);

    // text objects to use if the tick style is "bounds", meaning
    // we only draw two ticks on the left and the right of the screen

    this.tickWidth = TICK_WIDTH;
    this.tickHeight = TICK_HEIGHT;
    this.tickTextSeparation = TICK_TEXT_SEPARATION;
    this.tickColor = this.options.tickColor
      ? colorToHex(this.options.tickColor)
      : TICK_COLOR;

    this.animate = animate;

    this.pubSubs = [];

    if (this.options.showMousePosition && !this.hideMousePosition) {
      this.hideMousePosition = showMousePosition(
        this,
        this.is2d,
        this.isShowGlobalMousePosition(),
      );
    }

    let chromSizesPath = chromInfoPath;

    if (!chromSizesPath) {
      chromSizesPath = `${dataConfig.server}/chrom-sizes/?id=${dataConfig.tilesetUid}`;
    }

    ChromosomeInfo(
      chromSizesPath,
      (newChromInfo) => {
        this.chromInfo = newChromInfo;

        this.searchField = new SearchField(this.chromInfo);

        this.rerender(this.options, true);
        this.draw();
        this.animate();
      },
      this.pubSub,
    );
  }

  initBoundsTicks() {
    if (this.pTicks) {
      this.pMain.removeChild(this.pTicks);
      this.pTicks = null;
    }

    if (!this.gBoundTicks) {
      this.gBoundTicks = new GLOBALS.PIXI.Graphics();

      this.leftBoundTick = new GLOBALS.PIXI.Text('', this.pixiTextConfig);
      this.rightBoundTick = new GLOBALS.PIXI.Text('', this.pixiTextConfig);

      this.gBoundTicks.addChild(this.leftBoundTick);
      this.gBoundTicks.addChild(this.rightBoundTick);

      this.pMain.addChild(this.gBoundTicks);
    }

    this.texts = [];
  }

  initChromLabels() {
    if (!this.chromInfo) return;

    if (this.gBoundTicks) {
      this.pMain.removeChild(this.gBoundTicks);
      this.gBoundTicks = null;
    }

    if (!this.pTicks) {
      this.pTicks = new GLOBALS.PIXI.Graphics();
      this.pMain.addChild(this.pTicks);
    }

    this.texts = [];
    this.pTicks.removeChildren();

    for (let i = 0; i < this.chromInfo.cumPositions.length; i++) {
      const chromName = this.chromInfo.cumPositions[i].chr;
      this.gTicks[chromName] = new GLOBALS.PIXI.Graphics();

      // create the array that will store tick TEXT objects
      if (!this.tickTexts[chromName]) this.tickTexts[chromName] = [];

      const text = new GLOBALS.PIXI.Text(chromName, this.pixiTextConfig);

      // give each string a random hash so that some get hidden
      // when there's overlaps
      text.hashValue = Math.random();

      this.pTicks.addChild(text);
      this.pTicks.addChild(this.gTicks[chromName]);

      this.texts.push(text);
    }
  }

  rerender(options, force) {
    const strOptions = JSON.stringify(options);

    if (!force && strOptions === this.prevOptions) return;

    this.prevOptions = strOptions;
    this.options = options;
    this.tickTexts = {};

    this.pixiTextConfig.fontSize = +this.options.fontSize
      ? `${+this.options.fontSize}px`
      : this.pixiTextConfig.fontSize;
    this.pixiTextConfig.fill = this.options.color || this.pixiTextConfig.fill;
    this.pixiTextConfig.stroke =
      this.options.stroke || this.pixiTextConfig.stroke;
    this.stroke = colorToHex(this.pixiTextConfig.stroke);

    this.tickColor = this.options.tickColor
      ? colorToHex(this.options.tickColor)
      : TICK_COLOR;

    if (this.options.tickPositions === 'ends') {
      this.initBoundsTicks();
    } else {
      this.initChromLabels();
    }

    super.rerender(options, force);

    if (this.options.showMousePosition && !this.hideMousePosition) {
      this.hideMousePosition = showMousePosition(
        this,
        this.is2d,
        this.isShowGlobalMousePosition(),
      );
    }

    if (!this.options.showMousePosition && this.hideMousePosition) {
      this.hideMousePosition();
      this.hideMousePosition = undefined;
    }
  }

  formatTick(pos) {
    const domain = this._xScale.domain();

    const viewWidth = domain[1] - domain[0];

    const p = precisionPrefix(pos, viewWidth);

    const fPlain = format(',');
    const fPrecision = formatPrefix(`,.${p}`, viewWidth);
    let f = fPlain;

    if (this.options.tickFormat === 'si') {
      f = fPrecision;
    } else if (this.options.tickFormat === 'plain') {
      f = fPlain;
    } else if (this.options.tickPositions === 'ends') {
      // if no format is specified but tickPositions are at 'ends'
      // then use precision format
      f = fPrecision;
    }

    return f(pos);
  }

  drawBoundsTicks(x1, x2) {
    const graphics = this.gBoundTicks;
    graphics.clear();
    graphics.lineStyle(1, 0);

    // determine the stard and end positions of tick lines along the vertical axis
    const lineYStart = this.options.reverseOrientation ? 0 : this.dimensions[1];
    const lineYEnd = this.options.reverseOrientation
      ? this.tickHeight
      : this.dimensions[1] - this.tickHeight;

    // left tick
    // line is offset by one because it's right on the edge of the
    // visible region and we want to get the full width
    graphics.moveTo(1, lineYStart);
    graphics.lineTo(1, lineYEnd);

    // right tick
    graphics.moveTo(this.dimensions[0] - 1, lineYStart);
    graphics.lineTo(this.dimensions[0] - 1, lineYEnd);

    // we want to control the precision of the tick labels
    // so that we don't end up with labels like 15.123131M
    this.leftBoundTick.x = 0;
    this.leftBoundTick.y = this.options.reverseOrientation
      ? lineYEnd + this.tickTextSeparation
      : lineYEnd - this.tickTextSeparation;
    this.leftBoundTick.text = `${x1[0]}: ${this.formatTick(x1[1])}`;
    this.leftBoundTick.anchor.y = this.options.reverseOrientation ? 0 : 1;

    this.rightBoundTick.x = this.dimensions[0];
    this.rightBoundTick.text = `${x2[0]}: ${this.formatTick(x2[1])}`;
    this.rightBoundTick.y = this.options.reverseOrientation
      ? lineYEnd + this.tickTextSeparation
      : lineYEnd - this.tickTextSeparation;
    this.rightBoundTick.anchor.y = this.options.reverseOrientation ? 0 : 1;

    this.rightBoundTick.anchor.x = 1;

    if (this.flipText) {
      // this means this track is displayed vertically, so update the anchor and scale of labels to make them readable!
      this.leftBoundTick.scale.x = -1;
      this.leftBoundTick.anchor.x = 1;
      this.rightBoundTick.scale.x = -1;
      this.rightBoundTick.anchor.x = 0;
    }

    // line is offset by one because it's right on the edge of the
    // visible region and we want to get the full width
    this.leftBoundTick.tickLine = [
      1,
      this.dimensions[1],
      1,
      this.dimensions[1] - this.tickHeight,
    ];
    this.rightBoundTick.tickLine = [
      this.dimensions[0] - 1,
      this.dimensions[1],
      this.dimensions[0] - 1,
      this.dimensions[1] - this.tickHeight,
    ];

    this.tickTexts = {};
    this.tickTexts.all = [this.leftBoundTick, this.rightBoundTick];
    // this.rightBoundTick
  }

  drawTicks(cumPos) {
    const graphics = this.gTicks[cumPos.chr];

    graphics.visible = true;

    // clear graphics *and* ticktexts otherwise the two are out of sync!
    graphics.clear();

    const chromLen = +this.chromInfo.chromLengths[cumPos.chr];

    const vpLeft = Math.max(this._xScale(cumPos.pos), 0);
    const vpRight = Math.min(
      this._xScale(cumPos.pos + chromLen),
      this.dimensions[0],
    );

    const numTicks = (vpRight - vpLeft) / this.tickWidth;

    // what is the domain of this chromosome that is visible?
    const xScale = scaleLinear()
      .domain([
        Math.max(1, this._xScale.invert(0) - cumPos.pos),
        Math.min(
          chromLen,
          this._xScale.invert(this.dimensions[0]) - cumPos.pos,
        ),
      ])
      .range(vpLeft, vpRight);

    // calculate a certain number of ticks
    const ticks = xScale
      .ticks(numTicks)
      .filter((tick) => Number.isInteger(tick));

    // not sure why we're separating these out by chromosome, but ok
    const tickTexts = this.tickTexts[cumPos.chr];

    const tickHeight = this.options.fontIsLeftAligned
      ? (+this.options.fontSize || this.textFontSize) / 2
      : this.tickHeight;

    const flipTextSign = this.flipText ? -1 : 1;

    const xPadding = this.options.fontIsLeftAligned ? flipTextSign * 4 : 0;

    let yPadding = this.options.fontIsLeftAligned
      ? 0
      : tickHeight + this.tickTextSeparation;

    if (this.options.reverseOrientation) {
      yPadding = this.dimensions[1] - yPadding;
    }

    // these two loops reuse existing text objects so that
    // we're not constantly recreating texts that already
    // exist
    while (tickTexts.length < ticks.length) {
      const newText = new GLOBALS.PIXI.Text('', this.pixiTextConfig);
      tickTexts.push(newText);
      this.gTicks[cumPos.chr].addChild(newText);
    }

    while (tickTexts.length > ticks.length) {
      const text = tickTexts.pop();
      this.gTicks[cumPos.chr].removeChild(text);
    }

    let i = 0;
    while (i < ticks.length) {
      tickTexts[i].visible = true;

      tickTexts[i].anchor.x = this.options.fontIsLeftAligned ? 0 : 0.5;
      tickTexts[i].anchor.y = this.options.reverseOrientation ? 0 : 1;

      if (this.flipText) tickTexts[i].scale.x = -1;

      // draw the tick labels
      tickTexts[i].x = this._xScale(cumPos.pos + ticks[i]) + xPadding;
      tickTexts[i].y = this.dimensions[1] - yPadding;

      tickTexts[i].text =
        ticks[i] === 0
          ? `${cumPos.chr}: 1`
          : `${cumPos.chr}: ${this.formatTick(ticks[i])}`;

      const x = this._xScale(cumPos.pos + ticks[i]);

      // store the position of the tick line so that it can
      // be used in the export function
      tickTexts[i].tickLine = [
        x - 1,
        this.dimensions[1],
        x - 1,
        this.dimensions[1] - tickHeight - 1,
      ];

      // draw outline
      const lineYStart = this.options.reverseOrientation
        ? 0
        : this.dimensions[1];
      const lineYEnd = this.options.reverseOrientation
        ? tickHeight
        : this.dimensions[1] - tickHeight;
      graphics.lineStyle(1, this.stroke);
      graphics.moveTo(x - 1, lineYStart);
      graphics.lineTo(x - 1, lineYEnd - 1);
      if (this.options.fontIsLeftAligned) {
        graphics.lineTo(x + 2 * flipTextSign + 1 * flipTextSign, lineYEnd - 1);
        graphics.lineTo(x + 2 * flipTextSign + 1 * flipTextSign, lineYEnd + 1);
        graphics.lineTo(x + 1, lineYEnd + 1);
      } else {
        graphics.lineTo(x + 1, lineYEnd - 1);
      }
      graphics.lineTo(x + 1, lineYStart);

      // draw the tick lines
      graphics.lineStyle(1, this.tickColor);
      graphics.moveTo(x, lineYStart);
      graphics.lineTo(x, lineYEnd);

      if (this.options.fontIsLeftAligned) {
        graphics.lineTo(x + 2 * flipTextSign, lineYEnd);
      }

      i += 1;
    }

    while (i < tickTexts.length) {
      // we don't need this text so we'll turn it off for now
      tickTexts[i].visible = false;

      i += 1;
    }

    return ticks.length;
  }

  draw() {
    this.allTexts = [];

    if (!this.texts || !this.searchField) return;

    const x1 = absToChr(this._xScale.domain()[0], this.chromInfo);
    const x2 = absToChr(this._xScale.domain()[1], this.chromInfo);

    if (!x1 || !x2) {
      console.warn('Empty chromInfo:', this.dataConfig, this.chromInfo);
      return;
    }

    if (this.options.tickPositions === 'ends') {
      if (!this.gBoundTicks) return;

      this.gBoundTicks.visible = true;

      this.drawBoundsTicks(x1, x2);

      return;
    }

    if (!this.pTicks) {
      // options.tickPositiosn was probably just changed to 'even'
      // and initChromLabels hasn't been called yet
      return;
    }

    for (let i = 0; i < this.texts.length; i++) {
      this.texts[i].visible = false;
      this.gTicks[this.chromInfo.cumPositions[i].chr].visible = false;
    }

    let yPadding = this.options.fontIsLeftAligned
      ? 0
      : this.tickHeight + this.tickTextSeparation;

    if (this.options.reverseOrientation) {
      yPadding = this.dimensions[1] - yPadding;
    }

    // hide all the chromosome labels in preparation for drawing
    // new ones
    Object.keys(this.chromInfo.chrPositions).forEach((chrom) => {
      if (this.tickTexts[chrom]) {
        for (let j = 0; j < this.tickTexts[chrom].length; j++) {
          this.tickTexts[chrom][j].visible = false;
        }
      }
    });

    // iterate over each chromosome
    for (let i = x1[3]; i <= x2[3]; i++) {
      const xCumPos = this.chromInfo.cumPositions[i];

      const midX = xCumPos.pos + this.chromInfo.chromLengths[xCumPos.chr] / 2;

      const viewportMidX = this._xScale(midX);

      // This is ONLY the bare chromosome name. Not the tick label!
      const text = this.texts[i];

      text.anchor.x = this.options.fontIsLeftAligned ? 0 : 0.5;
      text.anchor.y = this.options.reverseOrientation ? 0 : 1;
      text.x = viewportMidX;
      text.y = this.dimensions[1] - yPadding;
      text.updateTransform();

      if (this.flipText) text.scale.x = -1;

      const numTicksDrawn = this.drawTicks(xCumPos);

      // only show chromsome labels if there's no ticks drawn
      text.visible = numTicksDrawn <= 0;

      this.allTexts.push({
        importance: text.hashValue,
        text,
        caption: null,
      });
    }

    // define the edge chromosome which are visible
    this.hideOverlaps(this.allTexts);
  }

  hideOverlaps(allTexts) {
    let allBoxes = []; // store the bounding boxes of the text objects so we can
    // calculate overlaps
    allBoxes = allTexts.map(({ text }, i) => {
      text.updateTransform();
      const b = text.getBounds();
      const box = [b.x, b.y, b.x + b.width, b.y + b.height];

      return box;
    });

    boxIntersect(allBoxes, (i, j) => {
      if (allTexts[i].importance > allTexts[j].importance) {
        allTexts[j].text.visible = false;
      } else {
        allTexts[i].text.visible = false;
      }
    });
  }

  setPosition(newPosition) {
    super.setPosition(newPosition);

    [this.pMain.position.x, this.pMain.position.y] = this.position;
  }

  zoomed(newXScale, newYScale) {
    this.xScale(newXScale);
    this.yScale(newYScale);

    this.draw();
  }

  exportSVG() {
    let track = null;
    let base = null;

    if (super.exportSVG) {
      [base, track] = super.exportSVG();
    } else {
      base = document.createElement('g');
      track = base;
    }
    base.setAttribute('class', 'chromosome-labels');

    const output = document.createElement('g');
    track.appendChild(output);

    output.setAttribute(
      'transform',
      `translate(${this.position[0]},${this.position[1]})`,
    );

    this.allTexts
      .filter((text) => text.text.visible)
      .forEach((text) => {
        const g = pixiTextToSvg(text.text);
        output.appendChild(g);
      });

    Object.values(this.tickTexts).forEach((texts) => {
      texts
        .filter((x) => x.visible)
        .forEach((text) => {
          let g = pixiTextToSvg(text);
          output.appendChild(g);
          g = svgLine(
            text.x,
            this.options.reverseOrientation ? 0 : this.dimensions[1],
            text.x,
            this.options.reverseOrientation
              ? this.tickHeight
              : this.dimensions[1] - this.tickHeight,
            1,
            this.tickColor,
          );

          const line = document.createElement('line');

          line.setAttribute('x1', text.tickLine[0]);
          line.setAttribute('y1', text.tickLine[1]);
          line.setAttribute('x2', text.tickLine[2]);
          line.setAttribute('y2', text.tickLine[3]);
          line.setAttribute('style', 'stroke: grey');

          output.appendChild(g);
          output.appendChild(line);
        });
    });

    return [base, track];
  }
}

export default HorizontalChromosomeLabels;
