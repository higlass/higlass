import { brush } from 'd3-brush';
import { event } from 'd3-selection';
import slugid from 'slugid';

import SVGTrack from './SVGTrack';

class SelectionTrackHorizontal extends SVGTrack {
  constructor(context, options) {
    // create a clipped SVG Path
    super(context, options);
    const {
      registerSelectionChanged,
      removeSelectionChanged,
      setDomainsCallback,
    } = context;

    const uid = slugid.nice();
    this.uid = uid;
    this.context = context;
    this.options = options;
    this.newSelection = false;

    this.context.pubSub.subscribe(
      'app.mouseClick', () => {
        console.log('mouseClick');
        this.disableBrush();
      }
    );

    this.context.pubSub.subscribe(
      'app.selectionStarted', () => {
        this.disableBrush();
        this.newSelection = true;
        this.enableBrush();
      }
    );

    this.context.pubSub.subscribe(
      'app.selectionEnded', () => {
        this.newSelection = false;
        this.disableBrush();
      }
    );

    this.removeSelectionChanged = removeSelectionChanged;
    this.setDomainsCallback = setDomainsCallback;

    this.selectionXDomain = null;
    this.selectionYDomain = null;

    if (context.xDomain) {
      // track has an x-domain set
      this.selectionXDomain = context.xDomain;
    }

    this.brush = brush(true)
      .on('brush', this.brushed.bind(this))
      .on('end', this.brushEnded.bind(this));

    this.gBrush = null;
    this.selected = null;

    // the selection will call this.selectionChanged immediately upon
    // hearing registerSelectionChanged
    this.draw();

    registerSelectionChanged(uid, this.selectionChanged.bind(this));
  }

  /**
   * Enable the brush. If a parameter is passed, create
   * the brush on top of that rectangle.
   *
   * @param  {int} onRect The index of the rectangle on which to
   *                      center the brush.
   * @return {null}       Nothing.
   */
  enableBrush(onRect) {
    this.gBrush = this.gMain
      .append('g')
      .attr('id', `brush-${this.uid}`);

    this.gBrush.call(this.brush);

    // turn off the ability to select new regions for this brush
    this.gBrush.selectAll('.overlay')
      .style('pointer-events', 'all');

    // turn off the ability to modify the aspect ratio of the brush
    this.gBrush.selectAll('.handle--ne')
      .style('pointer-events', 'none');

    this.gBrush.selectAll('.handle--nw')
      .style('pointer-events', 'none');

    this.gBrush.selectAll('.handle--sw')
      .style('pointer-events', 'none');

    this.gBrush.selectAll('.handle--se')
      .style('pointer-events', 'none');

    this.gBrush.selectAll('.handle--n')
      .style('pointer-events', 'none');

    this.gBrush.selectAll('.handle--s')
      .style('pointer-events', 'none');

    if (onRect !== null && onRect !== undefined) {
      console.log('enabling', onRect);
      // we've clicked on an existing selection so don't
      // allow selecting regions outside of it
      this.gBrush.selectAll('.overlay')
        .style('pointer-events', 'none');

      this.selectionXDomain = this.options.savedRegions[onRect][0];
      this.draw();
    }
  }

  disableBrush() {
    if (this.gBrush) {
      this.selected = null;
      this.selectionXDomain = null;
      this.gBrush.remove();
      this.draw();
    }
  }

  brushEnded() {
    if (event.selection === null) {
      this.setDomainsCallback(null, this.selectionYDomain);

      this.gBrush.selectAll('.overlay')
        .attr('cursor', 'move');
    }
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

    const yDomain = this.selectionYDomain;

    this.selectionXDomain = xDomain;
    this.selectionYDomain = xDomain;
    // console.log('xDomain:', xDomain);
    // console.log('yDomain:', yDomain);
    if (this.selected !== null
      && this.selected !== undefined) {
      this.options.savedRegions[this.selected][0] = this.selectionXDomain;
    } else if (this.newSelection) {
      // Nothing is selected, so we've just started brushing
      // a new selection. Create a new section
      console.log('adding:', this.selectionXDomain);
      this.selected = this.options.savedRegions.length;
      this.options.savedRegions.push([
        this.selectionXDomain,
        null
      ]);
    }

    this.setDomainsCallback(xDomain, yDomain);
    this.draw();
  }

  selectionChanged(selectionXDomain, selectionYDomain) {
    this.selectionXDomain = selectionXDomain;
    this.selectionYDomain = selectionYDomain;

    this.draw();
  }

  remove() {
    // remove the event handler that updates this selection tracker
    this.removeSelectionChanged(this.uid);

    super.remove();
  }

  rerender() {
    // set the fill and stroke colors
    if (this.gBrush) {
      this.gBrush.selectAll('.selection')
        .attr('fill', this.options.projectionFillColor)
        .attr('stroke', this.options.projectionStrokeColor)
        .attr('fill-opacity', this.options.projectionFillOpacity)
        .attr('stroke-opacity', this.options.projectionStrokeOpacity)
        .attr('stroke-width', this.options.strokeWidth);
    }
  }

  draw() {
    if (!this._xScale || !this.yScale) {
      return;
    }

    let dest = null;

    if (this.selectionXDomain) {
      const x0 = this._xScale(this.selectionXDomain[0]);
      const y0 = 0;

      const x1 = this._xScale(this.selectionXDomain[1]);
      const y1 = this.dimensions[1];

      dest = [[x0, y0], [x1, y1]];
    }

    let rectSelection = this.gMain.selectAll('.region')
      .data(
        this.options.savedRegions
          .map((r, i) => [r, i]) // keep track of the index of each
        // rectangle so that we can use it to alter the selection later
          .filter(r => r[1] !== this.selected)
      );

    // previously drawn selections can be interacted with
    // necessary for enabling the click event below
    rectSelection
      .enter()
      .append('rect')
      .classed('region', true)
      .attr('fill', this.options.projectionFillColor)
      .attr('stroke', 'yellow')
      .attr('fill-opacity', this.options.projectionFillOpacity)
      .attr('stroke-opacity', this.options.projectionStrokeOpacity)
      .attr('stroke-width', this.options.strokeWidth)
      .style('pointer-events', 'all');

    rectSelection.exit()
      .remove();

    rectSelection = this.gMain.selectAll('.region')
      .attr('x', d => this._xScale(d[0][0][0]))
      .attr('y', 0)
      .attr('width', d => this._xScale(d[0][0][1]) - this._xScale(d[0][0][0]))
      .attr('height', this.dimensions[1])
      .on('click', (d) => {
        this.disableBrush();
        this.selected = d[1];
        this.enableBrush(d[1]);

        event.preventDefault();
        event.stopPropagation();
      });


    if (this.gBrush) {
      // user hasn't actively brushed so we don't want to emit a
      // 'brushed' event
      this.brush.on('brush', null);
      this.brush.on('end', null);
      // console.log('moving brush:', this.options.savedRegions);
      this.gBrush.call(this.brush.move, dest);
      this.brush.on('brush', this.brushed.bind(this));
      this.brush.on('end', this.brushEnded.bind(this));
    }
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

export default SelectionTrackHorizontal;
