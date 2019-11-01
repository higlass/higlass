import { axisLeft } from 'd3-axis';

import SVGTrack from './SVGTrack';

class LeftAxisTrack extends SVGTrack {
  constructor(context, options) {
    super(context, options);

    this.axis = axisLeft(this._yScale);
    this.gAxis = this.gMain.append('g');

    // to make sure that the isWaitingOnTiles functions
    // return immediately
    this.tilesetInfo = true;
  }

  setDimensions(newDimensions) {
    super.setDimensions(newDimensions);

    // match the spacing of the TopAxisTrack ticks
    this.axis.ticks(Math.ceil(this.dimensions[1] / 150));
    this.gAxis.attr('transform', `translate(${newDimensions[0]},0)`);
  }

  draw() {
    this.axis.scale(this._yScale);
    this.gAxis.call(this.axis);

    return this;
  }

  zoomed(newXScale, newYScale) {
    super.zoomed(newXScale, newYScale);

    this.draw();
  }
}

export default LeftAxisTrack;
