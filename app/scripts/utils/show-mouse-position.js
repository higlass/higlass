import * as PIXI from 'pixi.js';

import { pubSub } from '../services';

import { hexStrToInt } from './';

const COLOR = 0xaaaaaa;
const ALPHA = 1.0;

const showMousePosition = (
  pubSubs,
  options,
  getScales,
  getPosition,
  getDimensions,
  isFlipped,
  is2d
) => {
  pubSub.publish('app.animateOnMouseMove', true);

  const color = options.mousePositionColor
    ? hexStrToInt(options.mousePositionColor)
    : COLOR;

  const alpha = options.mousePositionAlpha || ALPHA;

  // Graphics for cursor position
  const graphics = new PIXI.Graphics();

  const drawMousePosition = (mousePos, isHorizontal, isNoClear) => {
    if (!isNoClear) graphics.clear();

    graphics.lineStyle(1, color, alpha);

    if (isHorizontal) {
      const addition = is2d ? getPosition()[0] : 0;
      graphics.moveTo(0, mousePos);
      graphics.lineTo(getDimensions()[0] + addition, mousePos);
    } else {
      const addition = is2d ? getPosition()[1] : 0;
      graphics.moveTo(mousePos, 0);
      graphics.lineTo(mousePos, getDimensions()[1] + addition);
    }
  };

  /**
   * Mouse move handler
   *
   * @param  {Object}  e  Event object.
   */
  const mouseMoveHandler = (event) => {
    const x = event.isFromVerticalTrack
      ? event.dataY
      : event.dataX;

    const y = event.isFromVerticalTrack
      ? event.dataY
      : event.isFrom2dTrack ? event.dataY : event.dataX;

    const offset = is2d ? getPosition() : [0, 0];

    const mousePos = isFlipped()
      ? getScales()[0](y) + offset[1]
      : getScales()[0](x) + offset[0];

    drawMousePosition(mousePos);

    if (is2d) drawMousePosition(getScales()[1](y) + offset[1], true, true);
  };

  pubSubs.push(pubSub.subscribe('app.mouseMove', mouseMoveHandler));

  return graphics;
};

const setupShowMousePosition = (context, is2d = false) => {
  const scene = is2d ? context.pMasked : context.pMain;
  const getScales = function getScales() {
    return [this.xScale(), this.yScale()];
  };
  scene.addChild(showMousePosition(
    context.pubSubs,
    context.options,
    getScales.bind(context),
    context.getPosition.bind(context),
    context.getDimensions.bind(context),
    context.getProp('flipText'),
    is2d,
  ));
};

export default setupShowMousePosition;
