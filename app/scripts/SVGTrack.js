import {Track} from './Track.js';
import {select, selectAll} from 'd3-selection';
import {scaleLinear} from 'd3-scale';
import slugid from 'slugid';

export class SVGTrack extends Track {
    constructor(svgElement, clipped=false) {
        super();
        /**
         * Create a new SVG track. It will contain a g element
         * that maintains all of its element.
         */
        this.gMain = select(svgElement)
                       .append('g');
        this.clipUid = slugid.nice();

        this.clipRect = this.gMain.append('clipPath')
            .attr('id', 'track-bounds-' + this.clipUid)
            .append('rect')


        this.gMain.attr('clip-path', 'url(#track-bounds-' + this.clipUid + ')');
    }

    setPosition(newPosition) {
        this.position = newPosition;

        this.gMain.attr('transform', `translate(${this.position[0]},${this.position[1]})`);
    }

    setDimensions(newDimensions) {
        this.dimensions = newDimensions;

        this.clipRect.attr('width', this.dimensions[0]);
        this.clipRect.attr('height', this.dimensions[1]);
    }

    remove() {
        this.gMain.remove()
        this.gMain = null;
    }

    draw() {

        return this;
    }
}
