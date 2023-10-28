// @ts-nocheck
import { select } from 'd3-selection';
import slugid from 'slugid';

import Track from './Track';

class SVGTrack extends Track {
  constructor(context, options) {
    super(context, options);
    const { svgElement } = context;
    /**
     * Create a new SVG track. It will contain a g element
     * that maintains all of its element.
     */
    this.gMain = select(svgElement).append('g');
    this.clipUid = slugid.nice();

    this.clipRect = this.gMain
      .append('clipPath')
      .attr('id', `track-bounds-${this.clipUid}`)
      .append('rect');

    this.gMain.attr('clip-path', `url(#track-bounds-${this.clipUid})`);
  }

  setPosition(newPosition) {
    this.position = newPosition;

    this.gMain.attr(
      'transform',
      `translate(${this.position[0]},${this.position[1]})`,
    );
    this.draw();
  }

  setDimensions(newDimensions) {
    this.dimensions = newDimensions;

    this._xScale.range([0, this.dimensions[0]]);
    this._yScale.range([0, this.dimensions[1]]);

    if (newDimensions[0] >= 0 && newDimensions[1] >= 0) {
      this.clipRect.attr('width', newDimensions[0]);
      this.clipRect.attr('height', newDimensions[1]);
    } else {
      this.clipRect.attr('width', 0);
      this.clipRect.attr('height', 0);
    }

    this.draw();
  }

  remove() {
    this.gMain.remove();
    this.gMain = null;
  }

  draw() {
    return this;
  }
}

export default SVGTrack;
