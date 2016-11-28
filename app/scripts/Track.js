import {scaleLinear} from 'd3-scale';

export class Track {
    constructor() {
        this._xScale = scaleLinear();
        this._yScale = scaleLinear();

        this.position = [0,0];
        this.dimensions = [1,1];
    }

    setDimensions(newDimensions) {
        this.dimensions = newDimensions;

        this._xScale.range([0, this.dimensions[0]]);
        this._yScale.range([0, this.dimensions[1]]);
    }

    xScale(_) {
        /**
         * Either get or set the xScale
         */
        if (!arguments.length) 
            return this._xScale;

        this._xScale = _;

        return this;
    }

    yScale(_) {
        /**
         * Either get or set the yScale
         */
        if (!arguments.length)
            return this._yScale;

        this._yScale = _;

        return this;
    }
}
