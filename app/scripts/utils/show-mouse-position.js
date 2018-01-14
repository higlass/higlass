import * as PIXI from 'pixi.js';

import { pubSub } from '../services';

import { hexStrToInt } from './';

const COLOR = 0xaaaaaa;
const ALPHA = 1.0;

const showMousePosition = (
  animate, pubSubs, options, getPosition, getDimensions, isFlipped
) => {
  const color = options.mousePositionColor
    ? hexStrToInt(options.mousePositionColor)
    : COLOR;

  const alpha = options.mousePositionAlpha || ALPHA;

  // Graphics for cursor position
  const graphics = new PIXI.Graphics();

  const drawMousePosition = (mousePos) => {
    const dim = getDimensions();

    graphics.clear();
    graphics.lineStyle(1, color, alpha);
    graphics.moveTo(mousePos, 0);
    graphics.lineTo(mousePos, getDimensions()[1]);
    console.log('Drawn', color, mousePos, dim[1]);
    animate();
  };

  /**
   * Mouse move handler
   *
   * @param  {Object}  e  Event object.
   */
  const mouseMoveHandler = (event) => {
    const mousePos = isFlipped
      ? event.y - getPosition()[1]
      : event.x - getPosition()[0];
    drawMousePosition(mousePos);
  };

  pubSubs.push(pubSub.subscribe('app.mouseMove', mouseMoveHandler));

  return graphics;
};

export default showMousePosition;
