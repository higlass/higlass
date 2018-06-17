import { axisTop } from 'd3-axis';

import SVGTrack from './SVGTrack';

class TopAxisTrack extends SVGTrack {
  constructor(svgElement) {
    super(svgElement);

    this.axis = axisTop(this._xScale);
    this.gAxis = this.gMain.append('g');

    this.options = options;

    // to make sure that the isWaitingOnTiles functions
    // return immediately
    this.tilesetInfo = true;
  }

  setDimensions(newDimensions) {
    super.setDimensions(newDimensions);

    // we generally want to be able display ticks for values in the billions
    // which means that we need extra spacing in our ticks
    this.axis.ticks(Math.ceil(this.dimensions[0] / 150));

    this.gAxis.attr('transform', `translate(0,${newDimensions[1]})`);
  }


  draw() {
    const xDomain = this._xScale.domain();
    const newScale = this._xScale.copy()

    if (this.options && this.options.start && this.options.scale) {
      newScale.domain([+this.options.start + this.options.scale * xDomain[0],
      +this.options.start + this.options.scale * xDomain[1]]);
    }

    this.axis.scale(newScale);
    this.gAxis.call(this.axis);

    return this;
  }

  zoomed(newXScale, newYScale) {
    super.zoomed(newXScale, newYScale);

    this.draw();
  }
}

export default TopAxisTrack;
