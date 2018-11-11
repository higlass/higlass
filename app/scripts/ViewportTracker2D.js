import slugid from 'slugid';
import { brush } from 'd3-brush';
import { event } from 'd3-selection';

import SVGTrack from './SVGTrack';

class ViewportTracker2D extends SVGTrack {
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

    this.removeViewportChanged = removeViewportChanged;
    this.setDomainsCallback = setDomainsCallback;

    this.viewportXDomain = null;
    this.viewportYDomain = null;

    const maxHalf = Number.MAX_VALUE / 2;

    this.brush = brush(true)
      .extent([[-maxHalf, -maxHalf], [maxHalf, maxHalf]])
      .on('brush', this.brushed.bind(this));

    this.gBrush = this.gMain
      .append('g')
      .attr('id', `brush-${this.uid}`)
      .call(this.brush);

    /*
    // This is used to draw a border that is completely outside of the
    // drawn rectangle
    this.gBorder = this.gMain
      .append('path')
      .style('pointer-events', 'none');
    */

    // turn off the ability to select new regions for this brush
    this.gBrush.selectAll('.overlay')
      .style('pointer-events', 'none');

    // turn off the ability to modify the aspect ratio of the brush
    this.gBrush.selectAll('.handle--n')
      .style('pointer-events', 'none');

    this.gBrush.selectAll('.handle--s')
      .style('pointer-events', 'none');

    this.gBrush.selectAll('.handle--w')
      .style('pointer-events', 'none');

    this.gBrush.selectAll('.handle--e')
      .style('pointer-events', 'none');

    registerViewportChanged(uid, this.viewportChanged.bind(this));

    // the viewport will call this.viewportChanged immediately upon
    // hearing registerViewportChanged
    this.rerender();
    this.draw();
  }

  brushed() {
    /**
     * Should only be called  on active brushing, not in response to the
     * draw event
     */
    const s = event.selection;

    if (!this._xScale || !this._yScale) { return; }

    const xDomain = [this._xScale.invert(s[0][0]),
      this._xScale.invert(s[1][0])];

    const yDomain = [this._yScale.invert(s[0][1]),
      this._yScale.invert(s[1][1])];

    this.setDomainsCallback(xDomain, yDomain);
  }

  viewportChanged(viewportXScale, viewportYScale) {
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
    // console.log('rerender');
    this.gBrush.selectAll('.selection')
      .attr('fill', this.options.projectionFillColor)
      .attr('stroke', this.options.projectionStrokeColor)
      .attr('fill-opacity', this.options.projectionFillOpacity)
      .attr('stroke-opacity', this.options.projectionStrokeOpacity)
      .attr('stroke-width', this.options.strokeWidth);

    /*
    this.gBorder
      .style('fill', this.options.projectionStrokeColor)
      .style('opacity', this.options.projectionStrokeOpacity)
    */
  }

  draw() {
    if (!this._xScale || !this.yScale) { return; }

    if (!this.viewportXDomain || !this.viewportYDomain) { return; }

    const x0 = this._xScale(this.viewportXDomain[0]);
    const y0 = this._yScale(this.viewportYDomain[0]);

    const x1 = this._xScale(this.viewportXDomain[1]);
    const y1 = this._yScale(this.viewportYDomain[1]);

    const dest = [[x0, y0], [x1, y1]];

    // user hasn't actively brushed so we don't want to emit a
    // 'brushed' event
    this.brush.on('brush', null);
    this.gBrush.call(this.brush.move, dest);
    this.brush.on('brush', this.brushed.bind(this));

    /*
    const sW = this.options.strokeWidth;

    this.gBorder
    .attr('d', `M${x0} ${y0} H ${x1} V ${y1} H ${x0} V ${y0 - sW} H ${x0 - sW} V ${y1 + sW} H ${x1 + sW} V ${y0 - sW} H ${x0 - sW} V ${y0}`);

  */
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
}

export default ViewportTracker2D;
