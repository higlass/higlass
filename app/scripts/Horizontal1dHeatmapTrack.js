// @ts-nocheck
import { scaleLinear } from 'd3-scale';
import HorizontalLine1DPixiTrack from './HorizontalLine1DPixiTrack';

import { colorDomainToRgbaArray } from './utils';

import { GLOBALS, HEATED_OBJECT_MAP } from './configs';

class Horizontal1dHeatmapTrack extends HorizontalLine1DPixiTrack {
  constructor(context, options) {
    super(context, options);

    this.setColorScale(options.colorRange);

    this.opacity = options.opacity || 1;
  }

  setColorScale(colorRange) {
    this.colorScale = colorRange
      ? colorDomainToRgbaArray(colorRange)
      : HEATED_OBJECT_MAP;

    // Normalize colormap upfront to save 3 divisions per data point during the
    // rendering.
    this.colorScale = this.colorScale.map((rgb) =>
      rgb.map((channel) => channel / 255.0),
    );
  }

  rerender(options) {
    if (options && options.colorRange) {
      this.setColorScale(options.colorRange);
    }

    this.opacity = options.opacity || 1;

    super.rerender(options);
  }

  drawAxis() {
    // Disable axis for now.
  }

  drawTile(tile) {
    if (!tile.graphics || !tile.tileData || !tile.tileData.dense) return;

    const graphics = tile.graphics;

    const { tileX, tileWidth } = this.getTilePosAndDimensions(
      tile.tileData.zoomLevel,
      tile.tileData.tilePos,
    );

    const tileValues = tile.tileData.dense;

    if (tileValues.length === 0) return;

    const [valueScale, pseudocount] = this.makeValueScale(
      this.minValue(),
      this.medianVisibleValue,
      this.maxValue(),
    );
    valueScale.range([254, 0]).clamp(true);
    this.valueScale = valueScale;

    graphics.clear();

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

    // this scale should go from an index in the data array to
    // a position in the genome coordinates
    const tileXScale = scaleLinear()
      .domain([0, this.tilesetInfo.tile_size])
      .range([tileX, tileX + tileWidth]);

    graphics.lineStyle(0, 0, 0);

    // const logScaling = this.options.valueScaling === 'log';

    for (let i = 0; i < tileValues.length; i++) {
      if (Number.isNaN(tileValues[i])) continue;

      const rgbIdx = Math.round(this.valueScale(tileValues[i] + pseudocount));

      if (Number.isNaN(+rgbIdx)) continue;

      const xPos = this._xScale(tileXScale(i));
      const width = this._xScale(tileXScale(i + 1)) - xPos;
      const height = this.dimensions[1];

      tile.xValues[i] = xPos;
      tile.yValues[i] = rgbIdx;

      const rgb = this.colorScale[rgbIdx];
      const hex = GLOBALS.PIXI.utils.rgb2hex(rgb);

      graphics.beginFill(hex, this.opacity);

      if (i === 0) continue;

      if (tileXScale(i) > this.tilesetInfo.max_pos[0]) {
        // this data is in the last tile and extends beyond the length
        // of the coordinate system
        break;
      }

      if (tileValues[i] !== 0) {
        graphics.drawRect(xPos, 0, width, height);
      }
    }
  }
}

export default Horizontal1dHeatmapTrack;
