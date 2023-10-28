import { scaleLinear } from 'd3-scale';
import { fake as fakePubSub } from './hocs/with-pub-sub';

// Services
import { isWithin } from './utils';

/**
 * @typedef TrackContext
 * @property {string} id - The track ID.
 * @property {import('pub-sub-es').PubSub & { __fake__?: boolean }} [pubSub] - The pub-sub channel.
 * @property {() => import('./types').Theme} [getTheme] - A function that returns the current theme.
 */

/**
 * @template T
 * @typedef {T & TrackContext} ExtendedTrackContext
 */

/** @template Options */
class Track {
  /**
   * @param {TrackContext} context
   * @param {Options} options
   */
  constructor(context, options) {
    this.context = context;

    const { id, pubSub, getTheme } = context;
    /** @type {import('pub-sub-es').PubSub} */
    this.pubSub = pubSub ?? fakePubSub;

    /** @type {string} */
    this.id = id;
    /** @type {import('./types').Scale} */
    this._xScale = scaleLinear();
    /** @type {import('./types').Scale} */
    this._yScale = scaleLinear();

    // reference scales used for tracks that can translate and scale
    // their graphics
    // They will draw their graphics on the reference scales and then translate
    // and pan them as needed
    /** @type {import('./types').Scale} */
    this._refXScale = scaleLinear();
    /** @type {import('./types').Scale} */
    this._refYScale = scaleLinear();

    /** @type {[number, number]} */
    this.position = [0, 0];
    /** @type {[number, number]} */
    this.dimensions = [1, 1];
    /** @type {Options} */
    this.options = options;
    /** @type {Array<import('pub-sub-es').Subscription>} */
    this.pubSubs = [];

    /** @type {() => (import('./types').Theme | undefined)} */
    this.getTheme = getTheme ?? (() => undefined);

    this.pubSubs.push(
      this.pubSub.subscribe(
        'app.mouseMove',
        this.defaultMouseMoveHandler.bind(this),
      ),
    );

    this.isLeftModified = false;
  }

  /**
   * Check if a 2d location (x, y) is within the bounds of this track.
   *
   * @param {number} x - X position to be tested.
   * @param {number} y - Y position to be tested.
   * @return {boolean}  If `true` location is within the track.
   */
  isWithin(x, y) {
    let xx = x;
    let yy = y;
    let left = this.position[0];
    let top = this.position[1];

    if (this.isLeftModified) {
      xx = y;
      yy = x;
      left = this.position[1];
      top = this.position[0];
    }

    return isWithin(
      xx,
      yy,
      left,
      this.dimensions[0] + left,
      top,
      this.dimensions[1] + top,
    );
  }

  /**
   * Get a property from the track.
   * @template {keyof this} T
   * @param {T} prop - The property to get.
   * @return {() => this[T]}
   */
  getProp(prop) {
    return () => this[prop];
  }

  getData() {}

  /**
   * Capture click events. x and y are relative to the track position
   * @template T
   * @param {number} x - X position of the click event.
   * @param {number} y - Y position of the click event.
   * @param {T} evt - The event.
   * @return {{ type: 'generic', event: T, payload: null }}
   */
  click(x, y, evt) {
    return {
      type: 'generic',
      event: evt,
      payload: null,
    };
  }

  /** There was a click event outside the track * */
  clickOutside() {}

  /** @returns {[number, number]} */
  getDimensions() {
    return this.dimensions;
  }

  /** @param {[number, number]} newDimensions */
  setDimensions(newDimensions) {
    this.dimensions = newDimensions;

    this._xScale.range([0, this.dimensions[0]]);
    this._yScale.range([0, this.dimensions[1]]);
  }

  /**
   * @overload
   * @return {import('./types').Scale}
   */
  /**
   * @overload
   * @param {import('./types').Scale} scale
   * @return {this}
   */
  /**
   * Either get or set the reference xScale
   *
   * @param {import('./types').Scale=} scale
   * @return {import('./types').Scale | this}
   */
  refXScale(scale) {
    if (!scale) return this._refXScale;
    this._refXScale = scale;
    return this;
  }

  /**
   * @overload
   * @return {import('./types').Scale}
   */
  /**
   * @overload
   * @param {import('./types').Scale} scale
   * @return {this}
   */
  /**
   * Either get or set the reference yScale
   *
   * @param {import('./types').Scale=} scale
   * @return {import('./types').Scale | this}
   */
  refYScale(scale) {
    if (!scale) return this._refYScale;
    this._refYScale = scale;
    return this;
  }

  /**
   * @overload
   * @return {import('./types').Scale}
   */
  /**
   * @overload
   * @param {import('./types').Scale} scale
   * @return {this}
   */
  /**
   * Either get or set the xScale
   *
   * @param {import('./types').Scale=} scale
   * @return {import('./types').Scale | this}
   */
  xScale(scale) {
    if (!scale) return this._xScale;
    this._xScale = scale;
    return this;
  }

  /**
   * @overload
   * @return {import('./types').Scale}
   */
  /**
   * @overload
   * @param {import('./types').Scale} scale
   * @return {this}
   */
  /**
   * Either get or set the yScale
   *
   * @param {import('./types').Scale=} scale
   * @return {import('./types').Scale | this}
   */
  yScale(scale) {
    if (!scale) return this._yScale;
    this._yScale = scale;
    return this;
  }

  /**
   * @param {import('./types').Scale} newXScale
   * @param {import('./types').Scale} newYScale
   * @returns {void}
   */
  zoomed(newXScale, newYScale) {
    this.xScale(newXScale);
    this.yScale(newYScale);
  }

  /**
   * @param {import('./types').Scale} refXScale
   * @param {import('./types').Scale} refYScale
   * @returns {void}
   */
  refScalesChanged(refXScale, refYScale) {
    this._refXScale = refXScale;
    this._refYScale = refYScale;
  }

  /** @returns {void} */
  draw() {}

  /** @returns {[number, number]} */
  getPosition() {
    return this.position;
  }

  /**
   * @param {[number, number]} newPosition
   * @returns {void}
   */
  setPosition(newPosition) {
    this.position = newPosition;
  }

  /**
   * A blank handler for MouseMove / Zoom events. Should be overriden
   * by individual tracks to provide
   *
   * @param {{}} evt
   * @returns {void}
   */
  defaultMouseMoveHandler(evt) {}

  /** @returns {void} */
  remove() {
    // Clear all pubSub subscriptions
    this.pubSubs.forEach((subscription) =>
      this.pubSub.unsubscribe(subscription),
    );
    this.pubSubs = [];
  }

  /**
   * @param {Options} options
   * @returns {void}
   */
  rerender(options) {}

  /**
   * This function is for seeing whether this track should respond
   * to events at this mouse position. The difference to `isWithin()` is that it
   * can be overwritten if a track is inactive for example.
   *
   * @param {number} x - X position to be tested.
   * @param {number} y - Y position to be tested.
   * @returns {boolean}
   */
  respondsToPosition(x, y) {
    return this.isWithin(x, y);
  }

  /**
   * @param {number} trackY
   * @param {number} kMultiplier
   * @returns {void}
   */
  zoomedY(trackY, kMultiplier) {}

  /**
   * @param {number} dY
   * @returns {void}
   */
  movedY(dY) {}
}

export default Track;
