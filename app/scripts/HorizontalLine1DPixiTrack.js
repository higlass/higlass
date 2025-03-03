// @ts-nocheck
import { format } from 'd3-format';
import { scaleLinear } from 'd3-scale';

import HorizontalTiled1DPixiTrack from './HorizontalTiled1DPixiTrack';

import { colorToHex } from './utils';

class HorizontalLine1DPixiTrack extends HorizontalTiled1DPixiTrack {
  stopHover() {
    this.pMouseOver.clear();
    this.animate();
  }

  getMouseOverHtml(trackX) {
    // if we're not supposed to show the tooltip, don't show it
    // we return here so that the mark isn't drawn in the code
    // below
    if (!this.tilesetInfo || !this.options.showTooltip || !this.valueScale)
      return '';

    const value = this.getDataAtPos(trackX);
    let textValue = '';

    if (value) textValue = format('.3f')(value);

    const graphics = this.pMouseOver;
    const colorHex = 0;
    const yPos = this.valueScale(value);

    graphics.clear();
    graphics.beginFill(colorHex, 0.5);
    graphics.lineStyle(1, colorHex, 1);
    const markerWidth = 4;

    graphics.drawRect(
      trackX - markerWidth / 2,
      yPos - markerWidth / 2,
      markerWidth,
      markerWidth,
    );

    this.animate();

    return `${textValue}`;
  }

  /**
   * Create whatever is needed to draw this tile.
   */
  initTile(tile) {
    super.initTile(tile);

    if (!tile.tileData || !tile.tileData.dense) {
      console.warn('emptyTile:', tile);
      return;
    }

    tile.xValues = new Array(tile.tileData.dense.length);
    tile.yValues = new Array(tile.tileData.dense.length);

    if (this.isValueScaleLocked()) {
      // If valueScales are locked get min and max values of the locked group
      // for initialization. This prevents a flickering that is caused by
      // rendering the track multiple times with possibly different valueScales
      const glge = this.getLockGroupExtrema();
      if (glge !== null) {
        this.minValue(glge[0]);
        this.maxValue(glge[1]);
      }
    }

    this.drawTile(tile);
  }

  rerender(options, force) {
    super.rerender(options, force);

    this.options = options;

    super.draw();

    this.visibleAndFetchedTiles().forEach((tile) => {
      this.renderTile(tile);
    });
  }

  renderTile(tile) {
    // this function is just so that we follow the same pattern as
    // HeatmapTiledPixiTrack.js
    this.drawTile(tile);
    this.drawAxis(this.valueScale);
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

    const strokeWidth = this.options.lineStrokeWidth
      ? this.options.lineStrokeWidth
      : 1;
    graphics.lineStyle(strokeWidth, stroke, 1);

    tile.segments = [];
    let currentSegment = [];

    for (let i = 0; i < tileValues.length; i++) {
      const xPos = this._xScale(tileXScale(i));
      const yPos = this.valueScale(tileValues[i] + offsetValue);

      if (
        (this.options.valueScaling === 'log' && tileValues[i] === 0) ||
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

    for (const segment of tile.segments) {
      const first = segment[0];
      const rest = segment.slice(1);
      graphics.moveTo(first[0], first[1]);
      for (const point of rest) {
        graphics.lineTo(point[0], point[1]);
      }
    }
  }

  setPosition(newPosition) {
    super.setPosition(newPosition);

    this.pMain.position.y = this.position[1];
    this.pMain.position.x = this.position[0];

    this.pMouseOver.position.y = this.position[1];
    this.pMouseOver.position.x = this.position[0];
  }

  zoomed(newXScale, newYScale) {
    this.xScale(newXScale);
    this.yScale(newYScale);

    this.refreshTiles();

    this.draw();

    const isValueScaleLocked = this.isValueScaleLocked();

    if (
      this.continuousScaling &&
      this.minValue() !== undefined &&
      this.maxValue() !== undefined
    ) {
      if (
        this.valueScaleMin === null &&
        this.valueScaleMax === null &&
        !isValueScaleLocked
      ) {
        const newMin = this.minVisibleValue();
        const newMax = this.maxVisibleValue();

        const epsilon = 1e-6;

        if (
          newMin !== null &&
          newMax !== null &&
          (Math.abs(this.minValue() - newMin) > epsilon ||
            Math.abs(this.maxValue() - newMax) > epsilon)
        ) {
          this.minValue(newMin);
          this.maxValue(newMax);

          this.scheduleRerender();
        }
      }

      if (isValueScaleLocked) {
        this.onValueScaleChanged();
      }
    }
  }

  superSVG() {
    /*
     * Bypass this track's exportSVG and call its parent's directly.
     */
    return super.exportSVG();
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

    this.visibleAndFetchedTiles().forEach((tile) => {
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

  tileToLocalId(tile) {
    if (
      this.options.aggregationMode &&
      this.options.aggregationMode !== 'mean'
    ) {
      return `${tile.join('.')}.${this.options.aggregationMode}`;
    }
    return `${tile.join('.')}`;
  }

  tileToRemoteId(tile) {
    return this.tileToLocalId(tile);
  }
}

export default HorizontalLine1DPixiTrack;
