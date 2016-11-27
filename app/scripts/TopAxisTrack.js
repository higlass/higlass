import {axisTop} from 'd3-axis';
import {SVGTrack} from './SVGTrack.js';

export class HorizontalAxisTrack extends SVGTrack {
    constructor(svgElement) {
        super(svgElement);

        this.axis = axisTop();
    }


    draw() {
        this.gMain.call(this.axis);

        return this;
    }
}
