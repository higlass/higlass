import { scaleLinear, scaleLog } from 'd3-scale';

import { HorizontalLine1DPixiTrack } from './HorizontalLine1DPixiTrack';

// Utils
import { colorToHex, dictValues } from './utils';

export class BarTrack extends HorizontalLine1DPixiTrack {
  constructor( scene, server, uid, handleTilesetInfoReceived, option,
    animate,
    onValueScaleChanged,
  ) {
    super( scene, server, uid, handleTilesetInfoReceived, option, animate,
      onValueScaleChanged,
    );
  }

  initTile(tile) {
    /**
         * Create whatever is needed to draw this tile.
         */
    super.initTile(tile);

    // console.log('initializing tile');
    tile.barXValues = new Array(tile.tileData.dense.length);
    tile.barYValues = new Array(tile.tileData.dense.length);
    tile.barWidths = new Array(tile.tileData.dense.length);
    tile.barHeights = new Array(tile.tileData.dense.length);

    // this.drawTile(tile);
    this.renderTile(tile);
  }

  drawTile(tile) {
    // empty function so that the superclass's drawTile
    // doesn't do anything
  }

  renderTile(tile) {
    //super.drawTile(tile);

    if (!tile.graphics) { return; }

    const graphics = tile.graphics;

    const { tileX, tileWidth } = this.getTilePosAndDimensions(tile.tileData.zoomLevel, tile.tileData.tilePos);
    const tileValues = tile.tileData.dense;

    if (tileValues.length == 0) { return; }

    let pseudocount = 0; // if we use a log scale, then we'll set a pseudocount
    // equal to the smallest non-zero value
    this.valueScale = null;

    // console.log('valueScaling:', this.options.valueScaling);
    if (this.options.valueScaling == 'log') {
      let offsetValue = this.medianVisibleValue;

      if (!this.medianVisibleValue) { offsetValue = this.minVisibleValue(); }

      this.valueScale = scaleLog()
        // .base(Math.E)
        .domain([offsetValue, this.maxValue() + offsetValue])
        .range([this.dimensions[1], 0]);
      pseudocount = offsetValue;
    } else {
      // linear scale
      this.valueScale = scaleLinear()
        .domain([this.minValue(), this.maxValue()])
        .range([this.dimensions[1], 0]);
    }

    graphics.clear();

    this.drawAxis(this.valueScale);

    if (this.options.valueScaling == 'log' && this.valueScale.domain()[1] < 0) {
      console.warn('Negative values present when using a log scale', this.valueScale.domain());
      return;
    }

    const stroke = colorToHex(this.options.lineStrokeColor ? this.options.lineStrokeColor : 'blue');
    // this scale should go from an index in the data array to
    // a position in the genome coordinates
    const tileXScale = scaleLinear().domain([0, this.tilesetInfo.tile_size])
      .range([tileX, tileX + tileWidth]);

    // let strokeWidth = this.options.lineStrokeWidth ? this.options.lineStrokeWidth : 1;

    const strokeWidth = 0;
    graphics.lineStyle(strokeWidth, stroke, 1);

    const color = colorToHex(this.options.barFillColor ? this.options.barFillColor : 'grey');
    const opacity = 'barOpacity' in this.options ? this.options.barOpacity : 1;

    graphics.beginFill(color, opacity);

    const j = 0;
    tile.drawnAtScale = this._xScale.copy();

    for (let i = 0; i < tileValues.length; i++) {
      const xPos = this._xScale(tileXScale(i));
      const yPos = this.valueScale(tileValues[i] + pseudocount);

      const width = this._xScale(tileXScale(i + 1)) - xPos;
      const height = this.dimensions[1] - yPos;

      tile.barXValues[i] = xPos;
      tile.barYValues[i] = yPos;
      tile.barWidths[i] = width;
      tile.barHeights[i] = height;

      if (tileXScale(i) > this.tilesetInfo.max_pos[0])
      // this data is in the last tile and extends beyond the length
      // of the coordinate system
      { break; }

      graphics.drawRect(xPos,
        yPos,
        width,
        height);
    }
  }

  draw() {
    // we don't want to call HorizontalLine1DPixiTrack's draw function
    // but rather its parent's
    super.draw();

    for (const tile of dictValues(this.fetchedTiles)) {
      // scaling between tiles
      const tileK = (tile.drawnAtScale.domain()[1] - tile.drawnAtScale.domain()[0]) / (this._xScale.domain()[1] - this._xScale.domain()[0]);

      // let posOffset = newRange[0];

      const newRange = this._xScale.domain().map(tile.drawnAtScale);

      const posOffset = newRange[0];
      tile.graphics.scale.x = tileK;
      tile.graphics.position.x = -posOffset * tileK;
    }
  }

  zoomed(newXScale, newYScale, k, tx, ty) {
    super.zoomed(newXScale, newYScale);
  }

  /**
   * Export an SVG representation of this track
   *
   * @returns {[DOMNode,DOMNode]} The two returned DOM nodes are both SVG
   * elements [base,track]. Base is a parent which contains track as a
   * child. Track is clipped with a clipping rectangle contained in base.
   *
   */
  exportSVG() {
    let track = null;
    let base = null;

    [base, track] = super.superSVG();

    base.setAttribute('class', 'exported-line-track');
    const output = document.createElement('g');

    track.appendChild(output);
    output.setAttribute('transform',
      `translate(${this.position[0]},${this.position[1]})`);

    const stroke = this.options.lineStrokeColor ? this.options.lineStrokeColor : 'blue';

    for (const tile of this.visibleAndFetchedTiles()) {
      for (let i = 0; i < tile.barXValues.length; i++) {
        const rect = document.createElement('rect');
        const color = this.options.barFillColor ? this.options.barFillColor : 'grey';
        rect.setAttribute('fill', color);
        rect.setAttribute('stroke', color);

        rect.setAttribute('x', tile.barXValues[i]);
        rect.setAttribute('y', tile.barYValues[i]);
        rect.setAttribute('height', tile.barHeights[i]);
        rect.setAttribute('width', tile.barWidths[i]);

        output.appendChild(rect);
      }
    }

    const gAxis = document.createElement('g');
    gAxis.setAttribute('id', 'axis');

    // append the axis to base so that it's not clipped
    base.appendChild(gAxis);
    gAxis.setAttribute('transform',
      `translate(${this.axis.pAxis.position.x}, ${this.axis.pAxis.position.y})`);

    // add the axis to the export
    if (
      this.options.axisPositionHorizontal === 'left' ||
      this.options.axisPositionVertical === 'top'
    ) {
      // left axis are shown at the beginning of the plot
      const gDrawnAxis = this.axis.exportAxisLeftSVG(this.valueScale, this.dimensions[1]);
      gAxis.appendChild(gDrawnAxis);
    } else if (
      this.options.axisPositionHorizontal === 'right' ||
      this.options.axisPositionVertical === 'bottom'
    ) {
      const gDrawnAxis = this.axis.exportAxisRightSVG(this.valueScale, this.dimensions[1]);
      gAxis.appendChild(gDrawnAxis);
    }

    return [base, track];
  }
}

export default BarTrack;
