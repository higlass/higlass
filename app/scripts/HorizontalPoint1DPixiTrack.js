import { scaleLinear, scaleLog } from 'd3-scale';
import HorizontalLine1DPixiTrack from './HorizontalLine1DPixiTrack';
import { colorToHex, dictValues } from './utils';

class HorizontalPoint1DPixiTrack extends HorizontalLine1DPixiTrack {
  /**
   * Create whatever is needed to draw this tile.
   */
  initTile(tile) {
    tile.barXValues = new Array(tile.tileData.dense.length);
    tile.barYValues = new Array(tile.tileData.dense.length);
    tile.barWidths = new Array(tile.tileData.dense.length);
    tile.barHeights = new Array(tile.tileData.dense.length);

    super.initTile(tile);
  }

  drawTile(tile) {
    if (!tile.graphics) {
      return;
    }

    if (!tile.tileData || !tile.tileData.dense) {
      return;
    }

    const graphics = tile.graphics;

    const { tileX, tileWidth } = this.getTilePosAndDimensions(
      tile.tileData.zoomLevel,
      tile.tileData.tilePos,
    );
    const tileValues = tile.tileData.dense;

    if (tileValues.length === 0) {
      return;
    }

    let pseudocount = 0; // if we use a log scale, then we'll set a pseudocount
    // equal to the smallest non-zero value
    this.valueScale = null;

    if (this.options.valueScaling === 'log') {
      let offsetValue = this.medianVisibleValue;

      if (!this.medianVisibleValue) {
        offsetValue = this.minValue();
      }

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

    if (
      this.options.valueScaling === 'log' &&
      this.valueScale.domain()[1] < 0
    ) {
      console.warn(
        'Negative values present when using a log scale',
        this.valueScale.domain(),
      );
      return;
    }

    const stroke = colorToHex(
      this.options.lineStrokeColor ? this.options.lineStrokeColor : 'blue',
    );
    // this scale should go from an index in the data array to
    // a position in the genome coordinates
    const tileXScale = scaleLinear()
      .domain([0, this.tilesetInfo.tile_size])
      .range([tileX, tileX + tileWidth]);

    // let strokeWidth = this.options.lineStrokeWidth ? this.options.lineStrokeWidth : 1;

    const strokeWidth = 0;
    graphics.lineStyle(strokeWidth, stroke, 1);

    const squareSide = this.options.pointSize ? this.options.pointSize : 3;
    const pointColor = colorToHex(
      this.options.pointColor ? this.options.pointColor : 'red',
    );

    graphics.beginFill(pointColor, 1);

    tile.drawnAtScale = this._xScale.copy();

    for (let i = 0; i < tileValues.length; i++) {
      const xPos = this._xScale(tileXScale(i));
      const yPos = this.valueScale(tileValues[i] + pseudocount);

      tile.barXValues[i] = xPos - squareSide / 2 / this.pMain.scale.x;
      tile.barYValues[i] = yPos - squareSide / 2 / this.pMain.scale.y;
      tile.barWidths[i] = squareSide / this.pMain.scale.x;
      tile.barHeights[i] = squareSide / this.pMain.scale.y;

      if (tileXScale(i) > this.tilesetInfo.max_pos[0]) {
        break;
      }
      // this data is in the last tile and extends beyond the length
      // of the coordinate system

      // console.log('drawRect');
      // console.log('xPos:', xPos)

      graphics.drawRect(
        xPos - squareSide / 2 / this.pMain.scale.x,
        yPos - squareSide / 2 / this.pMain.scale.y,
        squareSide / this.pMain.scale.x,
        squareSide / this.pMain.scale.y,
      );
    }
  }

  draw() {
    super.draw();

    for (const tile of dictValues(this.fetchedTiles)) {
      // scaling between tiles
      const tileK =
        (tile.drawnAtScale.domain()[1] - tile.drawnAtScale.domain()[0]) /
        (this._xScale.domain()[1] - this._xScale.domain()[0]);

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
   * @returns {Array} The two returned DOM nodes are both SVG
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
    output.setAttribute(
      'transform',
      `translate(${this.position[0]},${this.position[1]})`,
    );

    for (const tile of this.visibleAndFetchedTiles()) {
      for (let i = 0; i < tile.barXValues.length; i++) {
        const rect = document.createElement('rect');

        const strokeColor = this.options.lineStrokeColor || 'blue';
        const pointColor = this.options.pointColor || 'red';

        rect.setAttribute('fill', pointColor);
        rect.setAttribute('stroke', strokeColor);
        rect.setAttribute('stroke-width', 0);

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
    gAxis.setAttribute(
      'transform',
      `translate(${this.axis.pAxis.position.x}, ${this.axis.pAxis.position.y})`,
    );

    // add the axis to the export
    if (
      this.options.axisPositionHorizontal === 'left' ||
      this.options.axisPositionVertical === 'top'
    ) {
      // left axis are shown at the beginning of the plot
      const gDrawnAxis = this.axis.exportAxisLeftSVG(
        this.valueScale,
        this.dimensions[1],
      );
      gAxis.appendChild(gDrawnAxis);
    } else if (
      this.options.axisPositionHorizontal === 'right' ||
      this.options.axisPositionVertical === 'bottom'
    ) {
      const gDrawnAxis = this.axis.exportAxisRightSVG(
        this.valueScale,
        this.dimensions[1],
      );
      gAxis.appendChild(gDrawnAxis);
    }

    return [base, track];
  }
}

export default HorizontalPoint1DPixiTrack;
