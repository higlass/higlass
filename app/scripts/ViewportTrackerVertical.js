// @ts-nocheck
import { brushY } from 'd3-brush';
import slugid from 'slugid';

import SVGTrack from './SVGTrack';

class ViewportTrackerVertical extends SVGTrack {
  constructor(context, options) {
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
    this.hasFromView = !context.projectionYDomain;

    this.removeViewportChanged = removeViewportChanged;
    this.setDomainsCallback = setDomainsCallback;

    this.viewportXDomain = this.hasFromView ? null : [0, 0];
    this.viewportYDomain = this.hasFromView ? null : context.projectionYDomain;

    this.brush = brushY().on('brush', this.brushed.bind(this));

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

    this.gBrush.selectAll('.handle--e').style('pointer-events', 'none');

    this.gBrush.selectAll('.handle--w').style('pointer-events', 'none');

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

    const xDomain = this.viewportXDomain;

    const yDomain = [this._yScale.invert(s[0]), this._yScale.invert(s[1])];

    if (!this.hasFromView) {
      this.viewportYDomain = yDomain;
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

    const y0 = this._yScale(this.viewportYDomain[0]);
    const y1 = this._yScale(this.viewportYDomain[1]);

    const dest = [y0, y1];

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
    const yDiff = yRange[1] - yRange[0];
    this.brush.extent([
      [xRange[0], yRange[0] - yDiff],
      [xRange[1], yRange[1] + yDiff],
    ]);
    this.gBrush.call(this.brush);

    this.draw();
  }
}

export default ViewportTrackerVertical;
