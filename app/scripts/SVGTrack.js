import {Track} from './Track.js';
import {select, selectAll} from 'd3-select';
import {scaleLinear} from 'd3-scale';

export class SVGTrack extends Track {
    constructor(svgElement) {
        /**
         * Create a new SVG track. It will contain a g element
         * that maintains all of its element.
         */
        this.gMain = d3.select(svgElement)
                       .append('g');

        this.xScale = scaleLinear();
        this.yScale = scaleLinear();
    }

    xScale(_) {
        /**
         * Either get or set the xScale
         */
        if (!arguments.length) 
            return this.xScale;

        return this;
    }

    yScale(_) {
        /**
         * Either get or set the yScale
         */
        if (!arguments.length)
            return this.yScale;

        this.yScale = _;

        return this;
    }

    remove() {
        this.gMain.remove()
        this.gMain = null;
    }

    draw() {

        return this;
    }
}
