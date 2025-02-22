import { scaleLinear } from 'd3-scale';
import HorizontalLine1DPixiTrack from './HorizontalLine1DPixiTrack';
import { colorToHex } from './utils';

class FilledLine extends HorizontalLine1DPixiTrack {
  drawRange(tile, row, tileXScale, offsetValue) {
    const tileValues = tile.tileData.dense;
    // draw a single row from this matrix
    let currentSegment = [];
    let mv = 0;

    for (let i = 0; i < tile.tileData.shape[1]; i++) {
      const rowStart = row * tile.tileData.shape[1];
      const pos = rowStart + i;

      if (tileValues[pos] > mv) {
        mv = tileValues[pos];
      }
      const xPos = this._xScale(tileXScale(i));
      const yPos = this.valueScale(tileValues[pos] + offsetValue);

      if (
        (this.options.valueScaling === 'log' && tileValues[pos] === 0) ||
        Number.isNaN(yPos)
      ) {
        if (currentSegment.length > 1) {
          tile.segments.push(currentSegment);
        }
        // Just ignore 1-element segments.
        currentSegment = [];
        continue;
      }

      if (tileXScale(i) > this.tilesetInfo.max_pos[0]) {
        // Data is in the last tile and extends beyond the coordinate system.
        break;
      }

      currentSegment.push([xPos, yPos]);
    }
    if (currentSegment.length > 1) {
      tile.segments.push(currentSegment);
    }
  }

  drawTile(tile) {
    super.drawTile(tile);

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
      tile.tileData.shape[1],
    );

    const tileValues = tile.tileData.dense;

    if (tileValues.length === 0) {
      return;
    }

    const [vs, offsetValue] = this.makeValueScale(
      this.minValue(),
      this.medianVisibleValue,
      this.maxValue(),
    );

    this.valueScale = vs;

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
    if (!this.tilesetInfo.tile_size && !this.tilesetInfo.bins_per_dimension) {
      console.warn(
        'No tileset_info.tile_size or tileset_info.bins_per_dimension',
        this.tilesetInfo,
      );
    }

    const tileSize =
      this.tilesetInfo.tile_size || this.tilesetInfo.bins_per_dimension;

    const tileXScale = scaleLinear()
      .domain([0, tileSize])
      .range([tileX, tileX + tileWidth]);

    const strokeWidth =
      this.options.lineStrokeWidth !== undefined
        ? this.options.lineStrokeWidth
        : 1;

    tile.segments = [];

    tile.minYs = [];
    tile.maxYs = [];
    tile.xs = [];

    for (let i = 0; i < tile.tileData.shape[0]; i++) {
      // for (let i = 0; i < 1; i++) {
      this.drawRange(tile, i, tileXScale, offsetValue);
    }

    for (let j = 0; j < tile.tileData.shape[1]; j++) {
      tile.minYs.push(Number.MAX_SAFE_INTEGER);
      tile.maxYs.push(-Number.MAX_SAFE_INTEGER);
      tile.xs.push(this._xScale(tileXScale(j)));
    }

    // find minimum and maximum values
    for (const segment of tile.segments) {
      let counter = 0;

      const first = segment[0];

      if (first[1] < tile.minYs[counter]) tile.minYs[counter] = first[1];
      if (first[1] > tile.maxYs[counter]) tile.maxYs[counter] = first[1];

      const rest = segment.slice(1);
      for (const point of rest) {
        counter += 1;

        if (point[1] < tile.minYs[counter]) tile.minYs[counter] = point[1];
        if (point[1] > tile.maxYs[counter]) tile.maxYs[counter] = point[1];
      }
    }

    // we have to do something funky here to make sure that
    // discontinuous sections are rendered as such
    let startI = 0;

    const color = this.options.fillColor || 'grey';
    const colorHex = colorToHex(color);

    const opacity =
      'fillOpacity' in this.options ? this.options.fillOpacity : 0.5;

    while (startI < tile.xs.length) {
      graphics.beginFill(colorHex, opacity);
      graphics.moveTo(tile.xs[startI], tile.minYs[startI]);
      // draw a filled area around the whole region
      let i = startI + 1;

      for (; i < tile.xs.length; i++) {
        if (tile.minYs[i] < Number.MAX_SAFE_INTEGER)
          graphics.lineTo(tile.xs[i], tile.minYs[i]);
        else break;
      }

      for (let j = i; j >= startI; j--) {
        if (tile.maxYs[j] > -Number.MAX_SAFE_INTEGER) {
          // console.log('to', xs[i], maxYs[i]);
          graphics.lineTo(tile.xs[j], tile.maxYs[j]);
        }
      }

      graphics.endFill();

      while (tile.minYs[i] === Number.MAX_SAFE_INTEGER && i < tile.xs.length)
        i++;
      startI = i;
    }

    if (
      this.options.strokeSingleSeries &&
      this.options.strokeSingleSeries !== 'all'
    ) {
      graphics.lineStyle(strokeWidth, stroke, 0);
    } else {
      graphics.lineStyle(strokeWidth, stroke, 1);
    }
    // draw the boundary values
    for (let i = 0; i < tile.segments.length; i++) {
      if (
        this.options.strokeSingleSeries &&
        this.options.strokeSingleSeries !== 'all'
      ) {
        // we're only going to be drawing one of these series
        if (this.options.strokeSingleSeries === i + 1) {
          graphics.lineStyle(strokeWidth, stroke, 1);
        } else {
          graphics.lineStyle(0, stroke, 0);
        }
      }

      const segment = tile.segments[i];
      const first = segment[0];
      const rest = segment.slice(1);
      graphics.moveTo(first[0], first[1]);
      for (const point of rest) {
        graphics.lineTo(point[0], point[1]);
      }
    }
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

    if (super.exportSVG) {
      [base, track] = super.exportSVG();
    } else {
      base = document.createElement('g');
      track = base;
    }

    base.setAttribute('class', 'exported-line-track');
    const output = document.createElement('g');

    track.appendChild(output);
    output.setAttribute(
      'transform',
      `translate(${this.position[0]},${this.position[1]})`,
    );

    const stroke = this.options.lineStrokeColor
      ? this.options.lineStrokeColor
      : 'blue';

    this.visibleAndFetchedTiles().forEach(tile => {
      // draw the filled area
      const color = this.options.fillColor || 'grey';

      const opacity =
        'fillOpacity' in this.options ? this.options.fillOpacity : 0.5;

      let startI = 0;

      while (startI < tile.xs.length) {
        const g1 = document.createElement('path');
        g1.setAttribute('opacity', opacity);
        g1.setAttribute('fill', color);
        g1.setAttribute('stroke', 'transparent');

        let d = `M${tile.xs[startI]},${tile.minYs[startI]}`;
        // draw a filled area around the whole region
        let i = startI + 1;

        for (; i < tile.xs.length; i++) {
          if (tile.minYs[i] < Number.MAX_SAFE_INTEGER)
            d += `L${tile.xs[i]},${tile.minYs[i]}`;
          else break;
        }

        for (let j = i; j >= startI; j--) {
          if (tile.maxYs[j] > -Number.MAX_SAFE_INTEGER) {
            // console.log('to', xs[i], maxYs[i]);
            d += `L${tile.xs[j]},${tile.maxYs[j]}`;
          }
        }

        g1.setAttribute('d', d);
        output.appendChild(g1);

        while (tile.minYs[i] === Number.MAX_SAFE_INTEGER && i < tile.xs.length)
          i++;
        startI = i;
      }

      // draw the lines
      const g = document.createElement('path');
      g.setAttribute('fill', 'transparent');
      g.setAttribute('stroke', stroke);
      let d = '';

      for (const segment of tile.segments) {
        const first = segment[0];
        const rest = segment.slice(1);
        d += `M${first[0]} ${first[1]}`;
        for (const point of rest) {
          d += `L${point[0]} ${point[1]}`;
        }
      }

      g.setAttribute('d', d);
      output.appendChild(g);
    });

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

export default FilledLine;
