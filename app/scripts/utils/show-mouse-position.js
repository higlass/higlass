import * as PIXI from 'pixi.js';

import { pubSub } from '../services';

import { hexStrToInt } from './';

const COLOR = 0xaaaaaa;
const ALPHA = 1.0;

const showMousePosition = (
  pubSubs, options, getPosition, getDimensions, isFlipped
) => {
  pubSub.publish('app.animateOnMouseMove', true);

  const color = options.mousePositionColor
    ? hexStrToInt(options.mousePositionColor)
    : COLOR;

  const alpha = options.mousePositionAlpha || ALPHA;

  // Graphics for cursor position
  const graphics = new PIXI.Graphics();

  const drawMousePosition = (mousePos) => {
    graphics.clear();
    graphics.lineStyle(1, color, alpha);
    graphics.moveTo(mousePos, 0);
    graphics.lineTo(mousePos, getDimensions()[1]);
  };

  /**
   * Mouse move handler
   *
   * @param  {Object}  e  Event object.
   */
  const mouseMoveHandler = (event) => {
    const mousePos = isFlipped()
      ? event.y - getPosition()[1]
      : event.x - getPosition()[0];
    drawMousePosition(mousePos);
  };

  pubSubs.push(pubSub.subscribe('app.mouseMove', mouseMoveHandler));

  return graphics;
};

const setupShowMousePosition = (context) => {
  context.pMain.addChild(showMousePosition(
    context.pubSubs,
    context.options,
    context.getPosition.bind(context),
    context.getDimensions.bind(context),
    context.getProp('flipText')
  ));
};

export default setupShowMousePosition;
