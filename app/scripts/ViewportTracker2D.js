import {SVGTrack} from './SVGTrack.js';
import slugid from 'slugid';
import {brush} from 'd3-brush';

export class ViewportTracker2D extends SVGTrack {
    constructor(svgElement, registerViewportChanged, removeViewportChanged) {
        super(svgElement);

        let uid = slugid.nice()
        this.uid = uid;

        this.removeViewportChanged = removeViewportChanged;
        this.viewportXDomain = null;
        this.viewportYDomain = null;

        this.brush = brush();
        this.gMain.call(this.brush);

        registerViewportChanged(uid, this.viewportChanged.bind(this));

        // the viewport will call this.viewportChanged immediately upon
        // hearing registerViewportChanged
        console.log('constructor...', this.uid);
    }

    viewportChanged(viewportXScale, viewportYScale) {
        console.log('viewportChanged:');

        let viewportXDomain = viewportXScale.domain();
        let viewportYDomain = viewportYScale.domain();

        this.viewportXDomain = viewportXDomain;
        this.viewportYDomain = viewportYDomain;

        console.log('vpc:', this.uid);
        this.draw();
    }

    remove() {
        // remove the event handler that updates this viewport tracker
        this.removeViewportChanged(uid); 

        super.remove();
    }

    draw() {
        if (!this.viewportXDomain || !this.viewportYDomain)
            return;

        let x0 = this._xScale(this.viewportXDomain[0]);
        let y0 = this._yScale(this.viewportYDomain[0]);

        let x1 = this._xScale(this.viewportXDomain[1]);
        let y1 = this._yScale(this.viewportYDomain[1]);
         
        let dest = [[x0,y0],[x1,y1]];
        console.log('moving:', dest);

        this.gMain.call(this.brush.move, dest)
    }

    zoomed(newXScale, newYScale) {
        this.xScale(newXScale);
        this.yScale(newYScale);

        this.draw();

    }

    setPosition(newPosition) {
        super.setPosition(newPosition);

        /*
        this.pMain.position.y = this.position[1];
        this.pMain.position.x = this.position[0];

        console.log('sp:', this.uid);
        */
        this.draw();
    }
}
