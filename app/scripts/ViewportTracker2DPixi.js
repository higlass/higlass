import slugid from 'slugid';

import PixiTrack from './PixiTrack';

export default class ViewportTracker2D extends PixiTrack {
  constructor(context, options) {
    super(context, options);
    const { registerViewportChanged, removeViewportChanged } = context;

    const uid = slugid.nice();
    this.uid = uid;

    this.removeViewportChanged = removeViewportChanged;
    this.viewportXDomain = null;
    this.viewportYDomain = null;

    registerViewportChanged(uid, this.viewportChanged.bind(this));

    // the viewport will call this.viewportChanged immediately upon
    // hearing registerViewportChanged
    // console.log('constructor...', this.uid);
  }

  viewportChanged(viewportXScale, viewportYScale) {
    // console.log('viewportChanged:');

    const viewportXDomain = viewportXScale.domain();
    const viewportYDomain = viewportYScale.domain();

    this.viewportXDomain = viewportXDomain;
    this.viewportYDomain = viewportYDomain;

    // console.log('vpc:', this.uid);
    this.draw();
  }

  draw() {
    const graphics = this.pMain;

    if (!this.viewportXDomain || !this.viewportYDomain) {
      return;
    }

    graphics.clear();
    graphics.lineStyle(1, 0x0000ff, 1);
    graphics.beginFill(0xff700b, 1);

    const x = this._xScale(this.viewportXDomain[0]);
    const y = this._yScale(this.viewportYDomain[0]);
    const width =
      this._xScale(this.viewportXDomain[1]) -
      this._xScale(this.viewportXDomain[0]);
    const height =
      this._yScale(this.viewportYDomain[1]) -
      this._yScale(this.viewportYDomain[0]);

    // console.log('drawing viewport:', x, y, width, height);

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

    // console.log('sp:', this.uid);
    this.draw();
  }
}
