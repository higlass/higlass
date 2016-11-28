import {axisTop} from 'd3-axis';
import {SVGTrack} from './SVGTrack.js';

export class TopAxisTrack extends SVGTrack {
    constructor(svgElement) {
        super(svgElement);

        this.axis = axisTop(this._xScale);
        this.gAxis = this.gMain.append('g')
    }

    setDimensions(newDimensions) {
        super.setDimensions(newDimensions);

        this.gAxis.attr('transform', `translate(0,${newDimensions[1]/2 + 8})`);
    }


    draw() {
        this.axis.scale(this._xScale);
        this.gAxis.call(this.axis);

        return this;
    }
}
