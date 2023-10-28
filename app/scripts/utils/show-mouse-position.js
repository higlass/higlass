import { globalPubSub } from 'pub-sub-es';

import hexStrToInt from './hex-string-to-int';

// Configs
import { GLOBALS } from '../configs';

const COLOR = 0xaaaaaa;
const ALPHA = 1.0;

/**
 * @typedef MouseTrackOptions
 * @property {string=} mousePositionColor - Color of the mouse position.
 * @property {number=} mousePositionAlpha - Alpha of the mouse position.
 */

/**
 * Actual interface for initializing to show the mouse location
 *
 * @param {import('pub-sub-es').PubSub} pubSub - PubSub service.
 * @param {Array<import('pub-sub-es').Subscription>} pubSubs - Subscribed PubSub events.
 * @param {MouseTrackOptions} options - Track options.
 * @param {() => [import('../types').Scale, import('../types').Scale]} getScales - Getter for the track's X and Y scales.
 * @param {() => [number, number]} getPosition - Getter for the track's position.
 * @param {() => [number, number]} getDimensions - Getter for the track's dimensions.
 * @param {() => boolean} getIsFlipped - Getter determining if a track has been
 *   flipped from horizontal to vertical.
 * @param {boolean} is2d - If `true` draw both dimensions of the mouse location.
 * @param {boolean} isGlobal - If `true` local and global events will trigger
 *   the mouse position drawing.
 * @return {import('pixi.js').Graphics} - PIXI graphics the mouse location is drawn on.
 */
const showMousePosition = (
  pubSub,
  pubSubs,
  options,
  getScales,
  getPosition,
  getDimensions,
  getIsFlipped,
  is2d,
  isGlobal,
) => {
  pubSub.publish('app.animateOnMouseMove', true);

  const color = options.mousePositionColor
    ? hexStrToInt(options.mousePositionColor)
    : COLOR;

  const alpha = options.mousePositionAlpha || ALPHA;

  // Graphics for cursor position
  const graphics = new GLOBALS.PIXI.Graphics();

  // This clears the mouse position graphics, i.e., the mouse position will not
  // be visible afterwards.
  const clearGraphics = () => {
    graphics.clear();
  };

  /**
   * Draw 1D mouse location (cross) hair onto the PIXI graphics.
   *
   * @param {number} mousePos - One dimension of the mouse location (integer).
   * @param {boolean=} isHorizontal - If `true` the dimension to be drawn is
   *   horizontal.
   * @param  {boolean=}   isNoClear  If `true` do not clear the graphics.
   * @return {void}
   */
  const drawMousePosition = (mousePos, isHorizontal, isNoClear) => {
    if (!isNoClear) clearGraphics();

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
   * @typedef NoHoveredTracksEvent
   * @property {true} noHoveredTracks - If `true` no tracks are hovered.
   * @property {false=} isFromVerticalTrack - If `true` the event is from a vertical track.
   */

  /**
   * @typedef TrackEvent
   * @property {false=} noHoveredTracks - If `true` no tracks are hovered.
   * @property {boolean} isFromVerticalTrack - If `true` the event is from a vertical track.
   * @property {boolean} isFrom2dTrack - If `true` the event is from a 2D track.
   * @property {number} dataY - Y position of the mouse.
   * @property {number} dataX - X position of the mouse.
   */

  /**
   * Mouse move handler
   *
   * @param {Event & (NoHoveredTracksEvent | TrackEvent)} event - Event object.
   */
  const mouseMoveHandler = (event) => {
    if (event.noHoveredTracks) {
      clearGraphics();
      return graphics;
    }

    let x;
    let y;
    if (event.isFromVerticalTrack) {
      x = event.dataY;
      y = event.dataY;
    } else {
      x = event.dataX;
      y = event.isFrom2dTrack ? event.dataY : event.dataX;
    }

    // 2d or central tracks are not offset and rather rely on a mask, i.e., the
    // top left *visible* position is *not* [0,0] but given by `getPosition()`.
    const offset = is2d ? getPosition() : [0, 0];

    // `getIsFlipped()` is `true` when a horizontal track has been flipped by 90
    // degree, i.e., is a vertical track.
    const mousePos = getIsFlipped()
      ? getScales()[0](y) + offset[1]
      : getScales()[0](x) + offset[0];

    drawMousePosition(mousePos);

    // Also draw the second dimension
    if (is2d) drawMousePosition(getScales()[1](y) + offset[1], true, true);

    return graphics;
  };

  pubSubs.push(pubSub.subscribe('app.mouseMove', mouseMoveHandler));
  pubSubs.push(pubSub.subscribe('app.mouseLeave', clearGraphics));
  pubSubs.push(pubSub.subscribe('blur', clearGraphics));

  if (isGlobal) {
    pubSubs.push(globalPubSub.subscribe('higlass.mouseMove', mouseMoveHandler));
  }

  return graphics;
};

/**
 * @typedef ClassContext
 * @property {import('pixi.js').Container=} pForeground
 * @property {import('pixi.js').Container=} pMasked
 * @property {import('pixi.js').Container=} pMain
 * @property {() => import('../types').Scale} xScale
 * @property {() => import('../types').Scale} yScale
 * @property {() => [number, number]} getPosition
 * @property {() => [number, number]} getDimensions
 * @property {import('pub-sub-es').PubSub} pubSub
 * @property {Array<import('pub-sub-es').Subscription>} pubSubs
 * @property {(prop: 'flipText') => () => boolean} getProp
 * @property {{}} options
 */

/**
 * Public API for showing the mouse location.
 *
 * @description
 * This is just a convenience wrapper to avoid code duplication.
 * `showMousePosition` is the actual function and could be called from within
 * each class as well.
 *
 * @param {ClassContext} context - Class context, i.e., `this`.
 * @param {Boolean} is2d - If `true` both dimensions of the mouse location
 *   should be shown. E.g., on a central track.
 * @param {Boolean} isGlobal - If `true` local and global events will trigger
 *   the mouse position drawing.
 * @return {Function} - Method to remove graphics showing the mouse location.
 */
const setupShowMousePosition = (context, is2d = false, isGlobal = false) => {
  const scene = is2d ? context.pMasked : context.pForeground || context.pMain;
  if (!scene) {
    throw new Error(
      'setupShowMousePosition: No scene found. Please make sure to call this method after the scene has been initialized.',
    );
  }
  /** @type {() => [import('../types').Scale, import('../types').Scale]} */
  const getScales = () => [context.xScale(), context.yScale()];

  const graphics = showMousePosition(
    context.pubSub,
    context.pubSubs,
    context.options,
    getScales,
    context.getPosition.bind(context),
    context.getDimensions.bind(context),
    context.getProp('flipText'),
    is2d,
    isGlobal,
  );

  scene.addChild(graphics);

  return () => {
    scene.removeChild(graphics);
  };
};

export default setupShowMousePosition;
