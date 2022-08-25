import { brushX } from 'd3-brush';
import slugid from 'slugid';

import SVGTrack from './SVGTrack';

class ViewportTrackerHorizontal extends SVGTrack {
  constructor(context, options) {
    // create a clipped SVG Path
    super(context, options);
    const {
      registerViewportChanged,
      removeViewportChanged,
      setDomainsCallback,
    } = context;

    const uid = slugid.nice();
    this.uid = uid;
    this.options = options;

    // Is there actually a linked _from_ view? Or is this projection "independent"?
    this.hasFromView = !context.projectionXDomain;

    this.removeViewportChanged = removeViewportChanged;
    this.setDomainsCallback = setDomainsCallback;

    this.viewportXDomain = this.hasFromView ? null : context.projectionXDomain;
    this.viewportYDomain = this.hasFromView ? null : [0, 0];

    this.brush = brushX().on('brush', this.brushed.bind(this));

    this.gBrush = this.gMain
      .append('g')
      .attr('id', `brush-${this.uid}`)
      .call(this.brush);

    // turn off the ability to select new regions for this brush
    this.gBrush.selectAll('.overlay').style('pointer-events', 'none');

    // turn off the ability to modify the aspect ratio of the brush
    this.gBrush.selectAll('.handle--ne').style('pointer-events', 'none');

    this.gBrush.selectAll('.handle--nw').style('pointer-events', 'none');

    this.gBrush.selectAll('.handle--sw').style('pointer-events', 'none');

    this.gBrush.selectAll('.handle--se').style('pointer-events', 'none');

    this.gBrush.selectAll('.handle--n').style('pointer-events', 'none');

    this.gBrush.selectAll('.handle--s').style('pointer-events', 'none');

    // the viewport will call this.viewportChanged immediately upon
    // hearing registerViewportChanged
    registerViewportChanged(uid, this.viewportChanged.bind(this));

    this.rerender();
    this.draw();
  }

  brushed(event) {
    /**
     * Should only be called  on active brushing, not in response to the
     * draw event
     */
    const s = event.selection;

    if (!this._xScale || !this._yScale) {
      return;
    }

    const xDomain = [this._xScale.invert(s[0]), this._xScale.invert(s[1])];

    const yDomain = this.viewportYDomain;

    if (!this.hasFromView) {
      this.viewportXDomain = xDomain;
    }

    // console.log('xDomain:', xDomain);
    // console.log('yDomain:', yDomain);

    this.setDomainsCallback(xDomain, yDomain);
  }

  viewportChanged(viewportXScale, viewportYScale, update = true) {
    // console.log('viewport changed:', viewportXScale.domain());
    const viewportXDomain = viewportXScale.domain();
    const viewportYDomain = viewportYScale.domain();

    this.viewportXDomain = viewportXDomain;
    this.viewportYDomain = viewportYDomain;

    this.draw();
  }

  remove() {
    // remove the event handler that updates this viewport tracker
    this.removeViewportChanged(this.uid);

    super.remove();
  }

  rerender() {
    // set the fill and stroke colors
    this.gBrush
      .selectAll('.selection')
      .attr('fill', this.options.projectionFillColor)
      .attr('stroke', this.options.projectionStrokeColor)
      .attr('fill-opacity', this.options.projectionFillOpacity)
      .attr('stroke-opacity', this.options.projectionStrokeOpacity)
      .attr('stroke-width', this.options.strokeWidth);
  }

  draw() {
    if (!this._xScale || !this.yScale) {
      return;
    }

    if (!this.viewportXDomain || !this.viewportYDomain) {
      return;
    }

    const x0 = this._xScale(this.viewportXDomain[0]);
    const x1 = this._xScale(this.viewportXDomain[1]);

    const dest = [x0, x1];

    // console.log('dest:', dest[0], dest[1]);

    // user hasn't actively brushed so we don't want to emit a
    // 'brushed' event
    this.brush.on('brush', null);
    this.gBrush.call(this.brush.move, dest);
    this.brush.on('brush', this.brushed.bind(this));
  }

  zoomed(newXScale, newYScale) {
    this.xScale(newXScale);
    this.yScale(newYScale);

    this.draw();
  }

  setPosition(newPosition) {
    super.setPosition(newPosition);

    this.draw();
  }

  setDimensions(newDimensions) {
    super.setDimensions(newDimensions);

    const xRange = this._xScale.range();
    const yRange = this._yScale.range();
    const xDiff = xRange[1] - xRange[0];

    this.brush.extent([
      [xRange[0] - xDiff, yRange[0]],
      [xRange[1] + xDiff, yRange[1]],
    ]);
    this.gBrush.call(this.brush);

    this.draw();
  }
}

export default ViewportTrackerHorizontal;
