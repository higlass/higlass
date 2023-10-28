// @ts-nocheck
import { scaleLinear } from 'd3-scale';
import { zoomIdentity } from 'd3-zoom';

import HorizontalLine1DPixiTrack from './HorizontalLine1DPixiTrack';

// Configs
import { GLOBALS } from './configs';

// Utils
import { colorDomainToRgbaArray, colorToHex, gradient } from './utils';

const HEX_WHITE = colorToHex('#FFFFFF');

class BarTrack extends HorizontalLine1DPixiTrack {
  constructor(...args) {
    super(...args);

    this.zeroLine = new GLOBALS.PIXI.Graphics();
    this.pMain.addChild(this.zeroLine);
    this.valueScaleTransform = zoomIdentity;

    if (this.options && this.options.colorRange) {
      if (this.options.colorRangeGradient) {
        this.setColorGradient(this.options.colorRange);
      } else {
        this.setColorScale(this.options.colorRange);
      }
    }

    this.initialized = true;
  }

  setColorScale(colorRange) {
    if (!colorRange) return;

    this.colorScale = colorDomainToRgbaArray(colorRange);

    // Normalize colormap upfront to save 3 divisions per data point during the
    // rendering.
    this.colorScale = this.colorScale.map((rgb) =>
      rgb.map((channel) => channel / 255.0),
    );
  }

  setColorGradient(colorGradient) {
    if (!colorGradient) return;

    const N = colorGradient.length - 1;

    this.colorGradientColors =
      this.options.align === 'bottom'
        ? colorGradient
            .slice()
            .reverse()
            .map((color, i) => ({ from: i / N, color }))
        : colorGradient.map((color, i) => ({ from: i / N, color }));
  }

  /**
   * Create whatever is needed to draw this tile.
   */
  initTile(tile) {
    if (!this.initialized) return;
    super.initTile(tile);
  }

  updateTile(tile) {
    if (
      !tile.valueScale ||
      !this.scale ||
      this.scale.minValue !== tile.scale.minValue ||
      this.scale.maxValue !== tile.scale.maxValue
    ) {
      // not rendered using the current scale, so we need to rerender
      this.renderTile(tile);
    }
  }

  renderTile(tile) {
    if (!this.initialized) return;
    super.renderTile(tile);
  }

  drawTile(tile) {
    if (!tile.graphics) return;

    if (!tile.tileData || !tile.tileData.dense) {
      return;
    }

    const { graphics } = tile;

    // Reset svg data to avoid overplotting
    tile.svgData = undefined;

    const { tileX, tileWidth } = this.getTilePosAndDimensions(
      tile.tileData.zoomLevel,
      tile.tileData.tilePos,
      this.tilesetInfo.bins_per_dimension || this.tilesetInfo.tile_size,
    );
    const tileValues = tile.tileData.dense;

    if (tileValues.length === 0) return;

    const [valueScale, pseudocount] = this.makeValueScale(
      this.minValue(),
      this.medianVisibleValue,
      this.maxValue(),
      0,
    );

    // Important when when using `options.valueScaleMin` or
    // `options.valueScaleMax` such that the y position later on doesn't become
    // negative
    valueScale.clamp(true);

    this.valueScale = valueScale;

    const colorScale = valueScale.copy();
    colorScale.range([254, 0]).clamp(true);

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

    const stroke = colorToHex(this.options.lineStrokeColor || 'blue');

    // this scale should go from an index in the data array to
    // a position in the genome coordinates
    const tileXScale = scaleLinear()
      .domain([
        0,
        this.tilesetInfo.tile_size || this.tilesetInfo.bins_per_dimension,
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
      barMask = new GLOBALS.PIXI.Graphics();
      barMask.beginFill(HEX_WHITE, 1);

      const canvas = gradient(
        this.colorGradientColors,
        1,
        this.dimensions[1], // width, height
        0,
        0,
        0,
        this.dimensions[1], // fromX, fromY, toX, toY
      );

      barSprite = new GLOBALS.PIXI.Sprite(
        GLOBALS.PIXI.Texture.fromCanvas(
          canvas,
          GLOBALS.PIXI.SCALE_MODES.NEAREST,
        ),
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

      if (Number.isNaN(height) || height < 0 || yPos < 0) continue;
      this.addSVGInfo(tile, xPos, yPos, width, height, color);

      // this data is in the last tile and extends beyond the length
      // of the coordinate system
      if (tileXScale(i) > this.tilesetInfo.max_pos[0]) break;

      if (this.colorScale && !this.options.colorRangeGradient) {
        const rgbIdx = Math.round(colorScale(tileValues[i] + pseudocount));
        const rgb = this.colorScale[rgbIdx];
        const hex = GLOBALS.PIXI.utils.rgb2hex(rgb);
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

  rerender(options, force) {
    if (options && options.colorRange) {
      if (options.colorRangeGradient) {
        this.setColorGradient(options.colorRange);
      } else {
        this.setColorScale(options.colorRange);
      }
    }

    super.rerender(options, force);
  }

  drawZeroLine() {
    this.zeroLine.clear();

    const color = colorToHex(this.options.barFillColor || 'grey');
    const opacity = +this.options.barOpacity || 1;

    const demarcationColor = this.options.zeroLineColor
      ? colorToHex(this.options.zeroLineColor)
      : color;

    const demarcationOpacity = Number.isNaN(+this.options.zeroLineOpacity)
      ? opacity
      : +this.options.zeroLineOpacity;

    this.zeroLine.beginFill(demarcationColor, demarcationOpacity);

    this.zeroLine.drawRect(0, this.dimensions[1] - 1, this.dimensions[0], 1);
  }

  drawZeroLineSvg(output) {
    const zeroLine = document.createElement('rect');
    zeroLine.setAttribute('id', 'zero-line');

    zeroLine.setAttribute('x', 0);
    zeroLine.setAttribute('y', this.dimensions[1] - 1);
    zeroLine.setAttribute('height', 1);
    zeroLine.setAttribute('width', this.dimensions[0]);

    zeroLine.setAttribute(
      'fill',
      this.options.zeroLineColor || this.options.barFillColor,
    );
    zeroLine.setAttribute(
      'fill-opacity',
      this.options.zeroLineOpacity || this.options.barOpacity,
    );

    output.appendChild(zeroLine);
  }

  getXScaleAndOffset(drawnAtScale) {
    const dA = drawnAtScale.domain();
    const dB = this._xScale.domain();

    // scaling between tiles
    const tileK = (dA[1] - dA[0]) / (dB[1] - dB[0]);

    const newRange = this._xScale.domain().map(drawnAtScale);

    const posOffset = newRange[0];

    return [tileK, -posOffset * tileK];
  }

  draw() {
    if (!this.initialized) return;

    // we don't want to call HorizontalLine1DPixiTrack's draw function
    // but rather its parent's
    super.draw();

    if (this.options.zeroLineVisible) this.drawZeroLine();
    else this.zeroLine.clear();

    Object.values(this.fetchedTiles).forEach((tile) => {
      const [graphicsXScale, graphicsXPos] = this.getXScaleAndOffset(
        tile.drawnAtScale,
      );

      tile.graphics.scale.x = graphicsXScale;
      tile.graphics.position.x = graphicsXPos;
    });
  }

  zoomed(newXScale, newYScale) {
    super.zoomed(newXScale, newYScale);
  }

  movedY(dY) {
    // // see the reasoning behind why the code in
    // // zoomedY is commented out.
    // Object.values(this.fetchedTiles).forEach((tile) => {
    //   const vst = this.valueScaleTransform;
    //   const { y, k } = vst;
    //   const height = this.dimensions[1];
    //   // clamp at the bottom and top
    //   if (
    //     y + dY / k > -(k - 1) * height
    //     && y + dY / k < 0
    //   ) {
    //     this.valueScaleTransform = vst.translate(
    //       0, dY / k
    //     );
    //   }
    //   tile.graphics.position.y = this.valueScaleTransform.y;
    // });
    // this.animate();
  }

  zoomedY(yPos, kMultiplier) {
    // // this is commented out to serve as an example
    // // of how valueScale zooming works
    // // dont' want to support it just yet though
    // const k0 = this.valueScaleTransform.k;
    // const t0 = this.valueScaleTransform.y;
    // const dp = (yPos - t0) / k0;
    // const k1 = Math.max(k0 / kMultiplier, 1.0);
    // let t1 = k0 * dp + t0 - k1 * dp;
    // const height = this.dimensions[1];
    // // clamp at the bottom
    // t1 = Math.max(t1, -(k1 - 1) * height);
    // // clamp at the top
    // t1 = Math.min(t1, 0);
    // // right now, the point at position 162 is at position 0
    // // 0 = 1 * 162 - 162
    // //
    // // we want that when k = 2, that point is still at position
    // // 0 = 2 * 162 - t1
    // //  ypos = k0 * dp + t0
    // //  dp = (ypos - t0) / k0
    // //  nypos = k1 * dp + t1
    // //  k1 * dp + t1 = k0 * dp + t0
    // //  t1 = k0 * dp +t0 - k1 * dp
    // // we're only interested in scaling along one axis so we
    // // leave the translation of the other axis blank
    // this.valueScaleTransform = zoomIdentity.translate(0, t1).scale(k1);
    // this.zoomedValueScale = this.valueScaleTransform.rescaleY(
    //   this.valueScale.clamp(false)
    // );
    // // this.pMain.scale.y = k1;
    // // this.pMain.position.y = t1;
    // Object.values(this.fetchedTiles).forEach((tile) => {
    //   tile.graphics.scale.y = k1;
    //   tile.graphics.position.y = t1;
    //   this.drawAxis(this.zoomedValueScale);
    // });
    // this.animate();
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
        barColors: [color],
      };
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

    [base, track] = super.superSVG();

    base.setAttribute('class', 'exported-line-track');
    const output = document.createElement('g');

    track.appendChild(output);
    output.setAttribute(
      'transform',
      `translate(${this.position[0]},${this.position[1]})`,
    );

    if (this.options.zeroLine) this.drawZeroLineSvg(output);

    this.visibleAndFetchedTiles()
      .filter((tile) => tile.svgData && tile.svgData.barXValues)
      .forEach((tile) => {
        // const [xScale, xPos] = this.getXScaleAndOffset(tile.drawnAtScale);
        const data = tile.svgData;

        for (let i = 0; i < data.barXValues.length; i++) {
          const rect = document.createElement('rect');
          rect.setAttribute('fill', data.barColors[i]);
          rect.setAttribute('stroke', data.barColors[i]);

          // rect.setAttribute('x', (data.barXValues[i] + xPos) * xScale);
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

export default BarTrack;
