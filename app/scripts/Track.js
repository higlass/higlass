import { scaleLinear } from 'd3-scale';
import { fake as fakePubSub } from './hocs/with-pub-sub';

// Services
import { isWithin } from './utils';

class Track {
  constructor({ id, pubSub, getTheme }) {
    if (pubSub) {
      this.pubSub = pubSub;
    } else {
      this.pubSub = fakePubSub;
    }

    this.id = id;
    this._xScale = scaleLinear();
    this._yScale = scaleLinear();

    // reference scales used for tracks that can translate and scale
    // their graphics
    // They will draw their graphics on the reference scales and then translate
    // and pan them as needed
    this._refXScale = scaleLinear();
    this._refYScale = scaleLinear();

    this.position = [0, 0];
    this.dimensions = [1, 1];
    this.options = {};
    this.pubSubs = [];

    if (getTheme) {
      this.getTheme = getTheme;
    } else {
      this.getTheme = () => {};
    }

    this.pubSubs.push(
      this.pubSub.subscribe(
        'app.mouseMove',
        this.defaultMouseMoveHandler.bind(this),
      ),
    );
  }

  /**
   * Check if a 2d location (x, y) is within the bounds of this track.
   *
   * @param {Number}  x  X position to be tested.
   * @param {Number}  y  Y position to be tested.
   * @return {Boolean}  If `true` location is within the track.
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

  getProp(prop) {
    return () => this[prop];
  }

  getData() {}

  getDimensions() {
    return this.dimensions;
  }

  setDimensions(newDimensions) {
    this.dimensions = newDimensions;

    this._xScale.range([0, this.dimensions[0]]);
    this._yScale.range([0, this.dimensions[1]]);
  }

  /**
   * Either get or set the reference xScale
   */
  refXScale(_) {
    if (!arguments.length) return this._refXScale;

    this._refXScale = _;

    return this;
  }

  /**
   * Either get or set the reference yScale
   */
  refYScale(_) {
    if (!arguments.length) return this._refYScale;

    this._refYScale = _;

    return this;
  }

  /**
   * Either get or set the xScale
   */
  xScale(_) {
    if (!arguments.length) return this._xScale;

    this._xScale = _;

    return this;
  }

  /**
   * Either get or set the yScale
   */
  yScale(_) {
    if (!arguments.length) {
      return this._yScale;
    }

    this._yScale = _;

    return this;
  }

  zoomed(newXScale, newYScale) {
    this.xScale(newXScale);
    this.yScale(newYScale);
  }

  refScalesChanged(refXScale, refYScale) {
    this._refXScale = refXScale;
    this._refYScale = refYScale;
  }

  draw() {}

  getPosition() {
    return this.position;
  }

  setPosition(newPosition) {
    this.position = newPosition;
  }

  /*
   * A blank handler for MouseMove / Zoom events. Should be overriden
   * by individual tracks to provide
   *
   * @param {obj} evt:
   *
   * @returns nothing
   */
  defaultMouseMoveHandler(evt) {}

  remove() {
    // Clear all pubSub subscriptions
    this.pubSubs.forEach((subscription) =>
      this.pubSub.unsubscribe(subscription),
    );
    this.pubSubs = [];
  }

  rerender() {}

  /*
   * This function is for seeing whether this track should respond
   * to events at this mouse position. The difference to `isWithin()` is that it
   * can be overwritten if a track is inactive for example.
   */
  respondsToPosition(x, y) {
    return this.isWithin(x, y);
  }

  zoomedY(trackY, kMultiplier) {}

  movedY(dY) {}
}

export default Track;
