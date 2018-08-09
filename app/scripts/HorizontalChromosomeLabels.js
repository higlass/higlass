import boxIntersect from 'box-intersect';
import { scaleLinear } from 'd3-scale';
import * as PIXI from 'pixi.js';

import PixiTrack from './PixiTrack';
import ChromosomeInfo from './ChromosomeInfo';
import SearchField from './SearchField';

import {
  absToChr,
  colorToHex,
  pixiTextToSvg,
  showMousePosition,
  svgLine
} from './utils';

const TICK_WIDTH = 200;
const TICK_HEIGHT = 6;
const TICK_TEXT_SEPARATION = 2;
const TICK_COLOR = 0x777777;

class HorizontalChromosomeLabels extends PixiTrack {
  constructor(
    scene,
    dataConfig,
    handleTilesetInfoReceived,
    options,
    animate,
    chromInfoPath
  ) {
    super(scene, options);

    this.searchField = null;
    this.chromInfo = null;
    this.dataConfig = dataConfig;

    this.pTicks = new PIXI.Graphics();
    this.pMain.addChild(this.pTicks);

    this.gTicks = {};
    this.tickTexts = {};

    this.options = options;

    this.textFontSize = 12;
    this.textFontFamily = 'Arial';
    this.textFontColor = '#777777';
    this.pixiTextConfig = {
      fontSize: +this.options.fontSize
        ? `${+this.options.fontSize}px`
        : `${this.textFontSize}px`,
      fontFamily: this.textFontFamily,
      fill: this.options.color || this.textFontColor,
      lineJoin: 'round',
      stroke: '#ffffff',
      strokeThickness: 1
    };

    this.tickWidth = TICK_WIDTH;
    this.tickHeight = TICK_HEIGHT;
    this.tickTextSeparation = TICK_TEXT_SEPARATION;
    this.tickColor = this.options.tickColor
      ? colorToHex(this.options.tickColor)
      : TICK_COLOR;

    this.animate = animate;

    this.pubSubs = [];

    if (this.options.showMousePosition && !this.hideMousePosition) {
      this.hideMousePosition = showMousePosition(this, this.is2d);
    }

    let chromSizesPath = chromInfoPath;

    if (!chromSizesPath) {
      chromSizesPath = `${dataConfig.server}/chrom-sizes/?id=${dataConfig.tilesetUid}`;
    }

    ChromosomeInfo(chromSizesPath, (newChromInfo) => {
      this.chromInfo = newChromInfo;

      this.searchField = new SearchField(this.chromInfo);

      this.texts = [];

      this.drawChromLabels();

      this.draw();
      this.animate();
    });
  }

  drawChromLabels() {
    if (!this.chromInfo) return;

    this.texts = [];
    this.pTicks.removeChildren();

    for (let i = 0; i < this.chromInfo.cumPositions.length; i++) {
      const textStr = this.chromInfo.cumPositions[i].chr;
      this.gTicks[textStr] = new PIXI.Graphics();

      // create the array that will store tick TEXT objects
      if (!this.tickTexts[textStr]) { this.tickTexts[textStr] = []; }

      const text = new PIXI.Text(textStr, this.pixiTextConfig);

      // This seems to be unnecessary
      // text.anchor.x = 0;
      // text.anchor.y = 1;
      // text.visible = false;

      // give each string a random hash so that some get hidden
      // when there's overlaps
      text.hashValue = Math.random();

      this.pTicks.addChild(text);
      this.pTicks.addChild(this.gTicks[textStr]);

      this.texts.push(text);
    }
  }

  rerender(options, force) {
    const strOptions = JSON.stringify(options);

    if (!force && strOptions === this.prevOptions) return;

    this.prevOptions = strOptions;
    this.options = options;

    this.pixiTextConfig = {
      fontSize: +this.options.fontSize
        ? `${+this.options.fontSize}px`
        : this.pixiTextConfig.fontSize,
      fill: this.options.color || this.pixiTextConfig.fill
    };

    this.tickColor = this.options.tickColor
      ? colorToHex(this.options.tickColor)
      : TICK_COLOR;

    this.drawChromLabels();

    super.rerender(options, force);

    if (this.options.showMousePosition && !this.hideMousePosition) {
      this.hideMousePosition = showMousePosition(this, this.is2d);
    }

    if (!this.options.showMousePosition && this.hideMousePosition) {
      this.hideMousePosition();
      this.hideMousePosition = undefined;
    }
  }

  drawTicks(cumPos) {
    const graphics = this.gTicks[cumPos.chr];

    graphics.visible = true;
    graphics.clear();

    const chromLen = +this.chromInfo.chromLengths[cumPos.chr];

    const vpLeft = Math.max(this._xScale(cumPos.pos), 0);
    const vpRight = Math.min(
      this._xScale(cumPos.pos + chromLen), this.dimensions[0]
    );

    const numTicks = (vpRight - vpLeft) / this.tickWidth;

    // what is the domain of this chromosome that is visible?
    const xScale = scaleLinear()
      .domain([
        Math.max(1, this._xScale.invert(0) - cumPos.pos),
        Math.min(chromLen, this._xScale.invert(this.dimensions[0]) - cumPos.pos)
      ])
      .range(vpLeft, vpRight);

    // calculate a certain number of ticks
    const ticks = xScale.ticks(numTicks);
    const tickFormat = xScale.tickFormat(numTicks);
    const tickTexts = this.tickTexts[cumPos.chr];

    const tickHeight = this.options.fontIsLeftAligned
      ? ((+this.options.fontSize || this.textFontSize) / 2)
      : this.tickHeight;

    const flipTextSign = this.flipText ? -1 : 1;

    const xPadding = this.options.fontIsLeftAligned
      ? flipTextSign * 4
      : 0;

    const yPadding = this.options.fontIsLeftAligned
      ? 0
      : tickHeight + this.tickTextSeparation;

    while (tickTexts.length <= ticks.length) {
      const newText = new PIXI.Text('', this.pixiTextConfig);
      tickTexts.push(newText);
      this.gTicks[cumPos.chr].addChild(newText);
    }

    let i = 0;
    while (i < ticks.length) {
      tickTexts[i].visible = true;

      tickTexts[i].anchor.x = this.options.fontIsLeftAligned ? 0 : 0.5;
      tickTexts[i].anchor.y = 1;

      if (this.flipText) tickTexts[i].scale.x = -1;

      // draw the tick labels
      tickTexts[i].x = this._xScale(cumPos.pos + ticks[i]) + xPadding;
      tickTexts[i].y = this.dimensions[1] - yPadding;

      tickTexts[i].text = ticks[i] === 0
        ? `${cumPos.chr}: 1`
        : `${cumPos.chr}: ${tickFormat(ticks[i])}`;

      graphics.lineStyle(1, this.tickColor);

      const x = this._xScale(cumPos.pos + ticks[i]);

      // draw the tick lines
      graphics.moveTo(x, this.dimensions[1]);
      graphics.lineTo(x, this.dimensions[1] - tickHeight);

      if (this.options.fontIsLeftAligned) {
        graphics.lineTo(
          x + (2 * flipTextSign),
          this.dimensions[1] - tickHeight
        );
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

    for (let i = 0; i < this.texts.length; i++) {
      this.texts[i].visible = false;
      this.gTicks[this.chromInfo.cumPositions[i].chr].visible = false;
    }

    const yPadding = this.options.fontIsLeftAligned
      ? 0
      : this.tickHeight + this.tickTextSeparation;

    // iterate over each chromosome
    for (let i = x1[3]; i <= x2[3]; i++) {
      const xCumPos = this.chromInfo.cumPositions[i];

      const midX = xCumPos.pos + (this.chromInfo.chromLengths[xCumPos.chr] / 2);

      const viewportMidX = this._xScale(midX);

      const text = this.texts[i];

      text.anchor.x = this.options.fontIsLeftAligned ? 0 : 0.5;
      text.anchor.y = 1;
      text.x = viewportMidX;
      text.y = this.dimensions[1] - yPadding;
      text.updateTransform();

      if (this.flipText) text.scale.x = -1;

      const numTicksDrawn = this.drawTicks(xCumPos);

      // only show chromsome labels if there's no ticks drawn
      text.visible = numTicksDrawn <= 0;

      this.allTexts.push({
        importance: this.texts[i].hashValue,
        text: this.texts[i],
        caption: null
      });
    }

    // define the edge chromosome which are visible
    this.hideOverlaps(this.allTexts);
  }

  hideOverlaps(allTexts) {
    let allBoxes = []; // store the bounding boxes of the text objects so we can
    // calculate overlaps
    allBoxes = allTexts.map((val) => {
      const text = val.text;
      text.updateTransform();
      const b = text.getBounds();
      const box = [b.x, b.y, b.x + b.width, b.y + b.height];

      return box;
    });

    boxIntersect(allBoxes, (i, j) => {
      if (allTexts[i].importance > allTexts[j].importance) {
        allTexts[j].text.visible = 0;
      } else {
        allTexts[i].text.visible = 0;
      }
    });
  }

  setPosition(newPosition) {
    super.setPosition(newPosition);

    this.pMain.position.y = this.position[1];
    this.pMain.position.x = this.position[0];
  }

  zoomed(newXScale, newYScale) {
    this.xScale(newXScale);
    this.yScale(newYScale);

    this.draw();
  }

  refreshTiles() {
    // dummy function that is called by LeftTrackModifier
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

    output.setAttribute('transform',
      `translate(${this.position[0]},${this.position[1]})`);

    this.allTexts
      .filter(text => text.text.visible)
      .forEach((text) => {
        const g = pixiTextToSvg(text.text);
        output.appendChild(g);
      });

    Object.values(this.tickTexts)
      .filter(text => text.visible)
      .forEach((text) => {
        let g = pixiTextToSvg(text);
        output.appendChild(g);

        g = svgLine(
          text.x,
          this.dimensions[1],
          text.x,
          this.dimensions[1] - this.tickHeight,
          1,
          this.tickColor,
        );

        output.appendChild(g);
      });

    return [base, track];
  }
}

export default HorizontalChromosomeLabels;
