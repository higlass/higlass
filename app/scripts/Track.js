import {scaleLinear} from 'd3-scale';

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

    this.position = [0,0];
    this.dimensions = [1,1];
    this.options = {};
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
    if (!arguments.length)
      return this._yScale;

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

  setPosition(newPosition) {
    this.position = newPosition;
  }

  remove() {}

  rerender() {}
}
