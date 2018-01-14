import * as PIXI from 'pixi.js';

import { pubSub } from '../services';

import { hexStrToInt } from './';

const COLOR = 0xaaaaaa;
const ALPHA = 1.0;

const showMousePosition = (
  pubSubs, options, getPosition, getDimensions, isFlipped, is2D, isAbsPos
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
      const addition = is2D ? getPosition()[0] : 0;
      graphics.moveTo(0, mousePos);
      graphics.lineTo(getDimensions()[0] + addition, mousePos);
    } else {
      const addition = is2D ? getPosition()[1] : 0;
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
    const offset = isAbsPos ? [0, 0] : getPosition();
    const mousePos = isFlipped()
      ? event.y - offset[1]
      : event.x - offset[0];
    drawMousePosition(mousePos);
    if (is2D) drawMousePosition(event.y - offset[1], true, true);
  };

  pubSubs.push(pubSub.subscribe('app.mouseMove', mouseMoveHandler));

  return graphics;
};

const setupShowMousePosition = (context, is2D = false, isAbsPos = false) => {
  const scene = is2D ? context.pMasked : context.pMain;
  scene.addChild(showMousePosition(
    context.pubSubs,
    context.options,
    context.getPosition.bind(context),
    context.getDimensions.bind(context),
    context.getProp('flipText'),
    is2D,
    isAbsPos,
    context.options.name
  ));
};

export default setupShowMousePosition;
