import { scaleLinear } from 'd3-scale';
import HorizontalLine1DPixiTrack from './HorizontalLine1DPixiTrack';
import { colorToHex } from './utils';

/** @typedef {import('./TiledPixiTrack').Tile} Tile */
/** @typedef {import('./TiledPixiTrack').TileData} TileData */

/**
 * @typedef {Tile & {
 *   segments?: Array<Array<number[]>>
 * }} FilledLineTile
 */

class FilledLine extends HorizontalLine1DPixiTrack {
  /**
   * @param {FilledLineTile} tile - The tile to draw
   * @param {number} row - The row index
   * @param {function} tileXScale - Scale function to convert tile coordinates to screen coordinates
   * @param {number} offsetValue - Value offset for scaling
   */
  drawRange(tile, row, tileXScale, offsetValue) {
    if (!this.tilesetInfo) return;
    if (!this.valueScale) return;
    if (!tile.tileData.shape) return;
    if (!tile.segments) tile.segments = [];

    const tileValues = tile.tileData.dense;
    // draw a single row from this matrix
    let currentSegment = [];
    let mv = 0;

    for (let i = 0; i < tile.tileData.shape[1]; i++) {
      /** @type {number} */
      const rowStart = row * tile.tileData.shape[1];
      const pos = rowStart + i;

      if (tileValues[pos] > mv) {
        mv = tileValues[pos];
      }
      // console.log('i:', i, tileValues[i]);
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

  /**
   * @param {FilledLineTile} tile - The tile to draw
   */
  drawTile(tile) {
    super.drawTile(tile);

    if (!this.tilesetInfo) return;

    if (!tile.graphics) {
      return;
    }

    if (!tile.tileData || !tile.tileData.dense) {
      return;
    }

    if (!tile.tileData.shape) {
      console.error(
        'Tiles in FilledLine track should have the .shape property',
      );
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

    const minValue = this.minValue();
    const maxValue = this.maxValue();

    if (
      minValue == null ||
      minValue === undefined ||
      typeof minValue !== 'number'
    ) {
      console.warn("minValue is null or undefined. Can't create valueScale");
      return;
    }

    if (
      maxValue == null ||
      maxValue === undefined ||
      typeof maxValue !== 'number'
    ) {
      console.warn("maxValue is null or undefined. Can't create valueScale");
      return;
    }

    if (
      this.medianVisibleValue == null ||
      this.medianVisibleValue === undefined
    ) {
      console.warn('medianVisibleValue is null or undefined.');
      return;
    }

    // @ts-ignore
    const [vs, offsetValue] = this.makeValueScale(
      minValue,
      this.medianVisibleValue,
      maxValue,
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
    const tileSize =
      this.tilesetInfo.tile_size ||
      ('bins_per_dimension' in this.tilesetInfo
        ? this.tilesetInfo.bins_per_dimension
        : undefined);

    if (tileSize == null || tileSize === undefined) {
      console.warn(
        'No tileset_info.tile_size or tileset_info.bins_per_dimension',
        this.tilesetInfo,
      );
      return;
    }

    const tileXScale = scaleLinear()
      .domain([0, tileSize])
      .range([tileX, tileX + tileWidth]);

    const strokeWidth = this.options.lineStrokeWidth
      ? this.options.lineStrokeWidth
      : 1;
    graphics.lineStyle(strokeWidth, stroke, 1);

    tile.segments = [];

    for (let i = 0; i < tile.tileData.shape[0]; i++) {
      // for (let i = 0; i < 1; i++) {
      this.drawRange(tile, i, tileXScale, offsetValue);
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
}

export default FilledLine;
