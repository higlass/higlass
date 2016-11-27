import {SVGTrack} from './SVGTrack.js';

export class HorizontalAxisTrack extends SVGTrack {
    constructor(svgElement) {
        super(svgElement);

    }

    xScale(_) {
        /**
         * Either get or set the xScale
         */
        if (!arguments.length) 
            return this.xScale;

        // a new scale usually means a new output, so we need to redraw the scene
        this.draw();

        return this;
    }

    yScale(_) {
        if (!arguments.length)
            return this.yScale;

        this.draw()

        return this;
    }

    draw() {

    }
}
