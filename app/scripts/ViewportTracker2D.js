import {PixiTrack} from './PixiTrack.js';

export class ViewportTracker2D extends PixiTrack {
    constructor(scene, server, uid, registerViewportChanged, removeViewportChanged) {
        super(scene, server, uid);

        this.removeViewportChanged = removeViewportChanged;
        registerViewportChanged(uid, this.viewportChanged);

        // the viewport will call this.viewportChanged immediately upon
        // hearing registerViewportChanged
        this.viewportXDomain = null;
        this.viewportYDomain = null;
    }

    viewportChanged(viewportXDomain, viewportYDomain) {
        this.viewportXDomain = viewportXDomain;
        this.viewportYDomain = viewportYDomain;

        this.draw();
    }

    close() {
        // remove the event handler that updates this viewport tracker
        this.removeViewportChanged(uid); 
    }

    draw() {
        let graphics = this.pMain;

        graphics.clear();
        graphics.lineStyle(0, 0x0000FF, 1);
        graphics.beginFill(0xFF700B, 1);

        let x = this.xScale(this.viewportXDomain[0]);
        let y = this.yScale(this.viewportYDomain[0]);
        let width = this.xScale(this.viewportXDomain[1]) - this.xScale(this.viewportXDomain[0]);
        let height = this.yScale(this.viewportYDomain[1]) - this.yScale(this.viewportYDomain[0]);

        console.log('drawing viewport:', x, y, width, height);

        this.pMain.drawRect(x, y, width, height);
    }
}
