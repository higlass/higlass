import { scaleLinear } from 'd3-scale';

// Services
import { pubSub } from './services';

export class Track {
  constructor() {
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
  }

  /**
   * Check if a 2d location (x, y) is within the bounds of this track.
   *
   * @param {Number}  x  X position to be tested.
   * @param {Number}  y  Y position to be tested.
   * @return {Boolean}  If `true` location is within the track.
   */
  isWithin(x, y) {
    const withinX = x >= this.position[0] && x <= this.dimensions[0] + this.position[0];
    const withinY = y >= this.position[1] && y <= this.dimensions[1] + this.position[1];
    return withinX && withinY;
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
    if (!arguments.length) { return this._yScale; }

    this._yScale = _;

    return this;
  }

  isPointInsideTrack(x,y) {
    if (x > this.position[0] && x < this.dimensions[0] &&
        y > this.position[1] && y < this.dimensions[1]) {
      return true;
    }
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

  remove() {
    // Clear all pubSub subscriptions
    this.pubSubs.forEach(subscription => pubSub.unsubscribe(subscription));
    this.pubSubs = [];
  }

  rerender() {}

  respondsToPosition(x,y) {
    return this.isWithin(x,y);
  }
}

export default Track;
