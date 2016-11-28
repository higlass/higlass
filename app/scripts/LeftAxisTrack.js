import {axisLeft} from 'd3-axis';
import {SVGTrack} from './SVGTrack.js';

export class LeftAxisTrack extends SVGTrack {
    constructor(svgElement) {
        super(svgElement);

        this.axis = axisLeft(this._yScale);
        this.gAxis = this.gMain.append('g')
    }

    setDimensions(newDimensions) {
        super.setDimensions(newDimensions);

        this.gAxis.attr('transform', `translate(${newDimensions[0]/2 + 8},0)`);
    }


    draw() {
        this.axis.scale(this._yScale);
        this.gAxis.call(this.axis);

        return this;
    }
}
