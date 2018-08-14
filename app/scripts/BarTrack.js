import { scaleLinear } from 'd3-scale';
import * as PIXI from 'pixi.js';

import HorizontalLine1DPixiTrack from './HorizontalLine1DPixiTrack';

// Utils
import { colorDomainToRgbaArray, colorToHex, gradient } from './utils';

const HEX_WHITE = colorToHex('#FFFFFF');


class BarTrack extends HorizontalLine1DPixiTrack {
  constructor(...args) {
    super(...args);

    if (this.options && this.options.colorRange) {
      if (this.options.colorRangeGradient) {
        this.setColorGradient(this.options.colorRange);
      } else {
        this.setColorScale(this.options.colorRange);
      }
    }
  }

  setColorScale(colorRange) {
    if (!colorRange) return;

    this.colorScale = colorDomainToRgbaArray(colorRange);

    // Normalize colormap upfront to save 3 divisions per data point during the
    // rendering.
    this.colorScale = this.colorScale
      .map(rgb => rgb.map(channel => channel / 255.0));
  }

  setColorGradient(colorGradient) {
    if (!colorGradient) return;

    const N = colorGradient.length - 1;

    this.colorGradientColors = this.options.align === 'bottom'
      ? colorGradient.slice().reverse().map((color, i) => ({ from: i / N, color }))
      : colorGradient.map((color, i) => ({ from: i / N, color }));
  }

  /**
   * Create whatever is needed to draw this tile.
   */
  initTile(tile) {
    super.initTile(tile);
    this.renderTile(tile);
  }

  drawTile() {
    // empty function so that the superclass's drawTile
    // doesn't do anything
  }

  updateTile(tile) {
    if (
      !tile.valueScale
      || !this.scale
      || this.scale.minValue !== tile.scale.minValue
      || this.scale.maxValue !== tile.scale.maxValue
    ) {
      // not rendered using the current scale, so we need to rerender
      this.renderTile(tile);
    }
  }

  renderTile(tile) {
    if (!tile.graphics) return;

    const graphics = tile.graphics;

    const { tileX, tileWidth } = this.getTilePosAndDimensions(
      tile.tileData.zoomLevel,
      tile.tileData.tilePos,
      this.tilesetInfo.bins_per_dimension || this.tilesetInfo.tile_size
    );
    const tileValues = tile.tileData.dense;

    if (tileValues.length === 0) return;

    // equal to the smallest non-zero value
    const [valueScale, pseudocount] = this.makeValueScale(
      this.minVisibleValue(),
      this.medianVisibleValue,
      this.maxValue(),
      0
    );

    this.valueScale = valueScale;

    const colorScale = valueScale.copy();
    colorScale.range([254, 0]).clamp(true);

    graphics.clear();

    this.drawAxis(this.valueScale);

    if (
      this.options.valueScaling === 'log'
      && this.valueScale.domain()[1] < 0
    ) {
      console.warn(
        'Negative values present when using a log scale',
        this.valueScale.domain()
      );
      return;
    }

    const stroke = colorToHex(this.options.lineStrokeColor || 'blue');

    // this scale should go from an index in the data array to
    // a position in the genome coordinates
    const tileXScale = scaleLinear()
      .domain([
        0, this.tilesetInfo.tile_size || this.tilesetInfo.bins_per_dimension
      ])
      .range([tileX, tileX + tileWidth]);

    const strokeWidth = 0;
    graphics.lineStyle(strokeWidth, stroke, 1);

    const color = this.options.barFillColor || 'grey';
    const colorHex = colorToHex(color);

    const opacity = 'barOpacity' in this.options ? this.options.barOpacity : 1;

    graphics.beginFill(colorHex, opacity);

    tile.drawnAtScale = this._xScale.copy();

    const isTopAligned = this.options.align === 'top';

    let xPos;
    let width;
    let yPos;
    let height;

    let barMask;
    let barSprite;
    if (this.colorGradientColors) {
      barMask = new PIXI.Graphics();
      barMask.beginFill(HEX_WHITE, 1);

      const canvas = gradient(
        this.colorGradientColors,
        1, this.dimensions[1],  // width, height
        0, 0, 0, this.dimensions[1]  // fromX, fromY, toX, toY
      );

      barSprite = new PIXI.Sprite(
        PIXI.Texture.fromCanvas(canvas, PIXI.SCALE_MODES.NEAREST)
      );

      barSprite.x = this._xScale(tileX);
      barSprite.width = this._xScale(tileX + tileWidth) - barSprite.x;
    }

    for (let i = 0; i < tileValues.length; i++) {
      xPos = this._xScale(tileXScale(i));
      yPos = this.valueScale(tileValues[i] + pseudocount);
      width = this._xScale(tileXScale(i + 1)) - xPos;
      height = this.dimensions[1] - yPos;

      if (isTopAligned) yPos = 0;

      this.addSVGInfo(tile, xPos, yPos, width, height, color);

      // this data is in the last tile and extends beyond the length
      // of the coordinate system
      if (tileXScale(i) > this.tilesetInfo.max_pos[0]) break;

      if (this.colorScale && !this.options.colorRangeGradient) {
        const rgbIdx = Math.round(colorScale(tileValues[i] + pseudocount));
        const rgb = this.colorScale[rgbIdx];
        const hex = PIXI.utils.rgb2hex(rgb);
        graphics.beginFill(hex, opacity);
      }

      (barMask || graphics).drawRect(xPos, yPos, width, height);
    }

    if (this.colorGradientColors) {
      barSprite.mask = barMask;

      graphics.removeChildren();
      graphics.addChild(barSprite, barMask);
    }
  }

  rerender(options) {
    if (options && options.colorRange) {
      if (options.colorRangeGradient) {
        this.setColorGradient(options.colorRange);
      } else {
        this.setColorScale(options.colorRange);
      }
    }

    super.rerender(options);
  }

  draw() {
    // we don't want to call HorizontalLine1DPixiTrack's draw function
    // but rather its parent's
    super.draw();

    Object.values(this.fetchedTiles).forEach((tile) => {
      // scaling between tiles
      const tileK = (
        (tile.drawnAtScale.domain()[1] - tile.drawnAtScale.domain()[0]) /
        (this._xScale.domain()[1] - this._xScale.domain()[0])
      );

      const newRange = this._xScale.domain().map(tile.drawnAtScale);

      const posOffset = newRange[0];
      tile.graphics.scale.x = tileK;
      tile.graphics.position.x = -posOffset * tileK;
    });
  }

  zoomed(newXScale, newYScale) {
    super.zoomed(newXScale, newYScale);
  }

  /**
   * Adds information to recreate the track in SVG to the tile
   *
   * @param tile
   * @param x x value of bar
   * @param y y value of bar
   * @param width width of bar
   * @param height height of bar
   * @param color color of bar (not converted to hex)
   */
  addSVGInfo(tile, x, y, width, height, color) {
    if (tile.svgData) {
      tile.svgData.barXValues.push(x);
      tile.svgData.barYValues.push(y);
      tile.svgData.barWidths.push(width);
      tile.svgData.barHeights.push(height);
      tile.svgData.barColors.push(color);
    } else {
      tile.svgData = {
        barXValues: [x],
        barYValues: [y],
        barWidths: [width],
        barHeights: [height],
        barColors: [color]
      };
    }
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

    this.visibleAndFetchedTiles()
      .filter(tile => tile.svgData && tile.svgData.barXValues)
      .forEach((tile) => {
        const data = tile.svgData;

        for (let i = 0; i < data.barXValues.length; i++) {
          const rect = document.createElement('rect');
          rect.setAttribute('fill', data.barColors[i]);
          rect.setAttribute('stroke', data.barColors[i]);

          rect.setAttribute('x', data.barXValues[i]);
          rect.setAttribute('y', data.barYValues[i]);
          rect.setAttribute('height', data.barHeights[i]);
          rect.setAttribute('width', data.barWidths[i]);
          if (tile.barBorders) {
            rect.setAttribute('stroke-width', '0.1');
            rect.setAttribute('stroke', 'black');
          }

          output.appendChild(rect);
        }
      });

    const gAxis = document.createElement('g');
    gAxis.setAttribute('id', 'axis');

    // append the axis to base so that it's not clipped
    base.appendChild(gAxis);
    gAxis.setAttribute(
      'transform',
      `translate(${this.axis.pAxis.position.x}, ${this.axis.pAxis.position.y})`
    );

    // add the axis to the export
    if (
      this.options.axisPositionHorizontal === 'left' ||
      this.options.axisPositionVertical === 'top'
    ) {
      // left axis are shown at the beginning of the plot
      const gDrawnAxis = this.axis.exportAxisLeftSVG(
        this.valueScale, this.dimensions[1]
      );
      gAxis.appendChild(gDrawnAxis);
    } else if (
      this.options.axisPositionHorizontal === 'right' ||
      this.options.axisPositionVertical === 'bottom'
    ) {
      const gDrawnAxis = this.axis.exportAxisRightSVG(
        this.valueScale, this.dimensions[1]
      );
      gAxis.appendChild(gDrawnAxis);
    }

    return [base, track];
  }
}

export default BarTrack;
