import {Track} from './Track.js';
import {select, selectAll} from 'd3-selection';
import {scaleLinear} from 'd3-scale';

export class SVGTrack extends Track {
    constructor(svgElement) {
        super();
        /**
         * Create a new SVG track. It will contain a g element
         * that maintains all of its element.
         */
        this.gMain = select(svgElement)
                       .append('g');

    }

    setPosition(newPosition) {
        this.position = newPosition;

        this.gMain.attr('transform', `translate(${this.position[0]},${this.position[1]})`);
    }

    setDimensions(newDimensions) {
        this.dimensions = newDimensions;

        console.log('set dimensions:', newDimensions);

        this._xScale.range([0, this.dimensions[0]]);
        this._yScale.range([0, this.dimensions[1]]);

    }

    remove() {
        this.gMain.remove()
        this.gMain = null;
    }

    draw() {

        return this;
    }
}
