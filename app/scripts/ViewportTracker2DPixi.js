import {PixiTrack} from './PixiTrack.js';
import slugid from 'slugid';

export class ViewportTracker2D extends PixiTrack {
    constructor(scene, registerViewportChanged, removeViewportChanged) {
        super(scene);

        let uid = slugid.nice()
        this.uid = uid;

        this.removeViewportChanged = removeViewportChanged;
        this.viewportXDomain = null;
        this.viewportYDomain = null;

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

    close() {
        // remove the event handler that updates this viewport tracker
        this.removeViewportChanged(uid); 
    }

    draw() {
        let graphics = this.pMain;

        if (!this.viewportXDomain || !this.viewportYDomain)
            return;


        graphics.clear();
        graphics.lineStyle(1, 0x0000FF, 1);
        graphics.beginFill(0xFF700B, 1);

        let x = this._xScale(this.viewportXDomain[0]);
        let y = this._yScale(this.viewportYDomain[0]);
        let width = this._xScale(this.viewportXDomain[1]) - this._xScale(this.viewportXDomain[0]);
        let height = this._yScale(this.viewportYDomain[1]) - this._yScale(this.viewportYDomain[0]);

        //console.log('drawing viewport:', x, y, width, height);

        this.pMain.drawRect(x, y, width, height);
    }

    zoomed(newXScale, newYScale) {
        this.xScale(newXScale);
        this.yScale(newYScale);

        this.draw();

    }

    setPosition(newPosition) {
        super.setPosition(newPosition);

        this.pMain.position.y = this.position[1];
        this.pMain.position.x = this.position[0];

        console.log('sp:', this.uid);
        this.draw();
    }
}
