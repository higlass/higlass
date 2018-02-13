import {BarTrack} from './BarTrack';
import {scaleLinear, scaleOrdinal, schemeCategory10} from 'd3-scale';
import {colorToHex} from './utils';

export class StackedBarTrack extends BarTrack {
  constructor(scene, dataConfig, handleTilesetInfoReceived, option, animate, onValueScaleChanged) {
    super(scene, dataConfig, handleTilesetInfoReceived, option, animate, onValueScaleChanged);

    this.maxAndMin = {
      max: 0,
      min: 0
    };
  }

  initTile(tile) {
    this.renderTile(tile);
  }

  updateTile(tile) {
    const visibleAndFetched = this.visibleAndFetchedTiles();

    this.maxAndMin = {
      max: 0,
      min: 0
    };

    // find total max across all tiles
    let visibleMax = 0;
    let visibleMin = 0;
    for(let i = 0; i < visibleAndFetched.length; i++) {
      const matrix = this.unFlatten(visibleAndFetched[i]);
      const tileMaxAndMin = this.findMaxAndMin(matrix);

      (tileMaxAndMin.max > visibleMax) ? visibleMax = tileMaxAndMin.max : visibleMax;
      (tileMaxAndMin.min < visibleMin) ? visibleMin = tileMaxAndMin.min : visibleMin;
    }
    this.maxAndMin.max = visibleMax;
    this.maxAndMin.min = visibleMin;

    for(let i = 0; i < visibleAndFetched.length; i++) {
      this.renderTile(visibleAndFetched[i]);
    }

  }

  /**
   * Find max and min heights for the given tile
   *
   * @param matrix 2d array of numbers representing one tile
   */
  findMaxAndMin(matrix) {
    // find max height of bars for scaling in the track
    let maxAndMin = {
      max: 0,
      min: 0
    };

    for (let i = 0; i < matrix.length; i++) {
      const temp = matrix[i];

      // find total heights of each positive column and each negative column
      // and compare to highest overall values above
      const localPositiveMax = temp.filter((a) => a >= 0).reduce((a, b) => a + b, 0);
      (localPositiveMax > maxAndMin.max) ? maxAndMin.max = localPositiveMax : maxAndMin.max;
      const localNegativeMax = Math.abs(temp.filter((a) => a < 0).reduce((a, b) => a + b, 0));
      (localNegativeMax > maxAndMin.min) ? maxAndMin.min = localNegativeMax : maxAndMin.min;
    }
    return maxAndMin;
  }

  /**
   * un-flatten data into matrix of tile.tileData.shape[0] x tile.tileData.shape[1]
   *
   * @param tile
   * @returns {Array} 2d array of numerical values for each column
   */
  unFlatten(tile) {
    const shapeX = tile.tileData.shape[0]; // number of different nucleotides in each bar
    const shapeY = tile.tileData.shape[1]; // number of bars
    let flattenedArray = tile.tileData.dense;

    // if any data is negative, switch to exponential scale //todo does this clash with call in TiledPixiTrack?
    if (flattenedArray.filter((a) => a < 0).length > 0 && this.options.valueScaling === 'linear') {
      console.warn('Negative values present in data. Defaulting to exponential scale.');
      this.options.valueScaling = 'exponential';
    }

    // matrix[0] will be [flattenedArray[0], flattenedArray[256], flattenedArray[512], etc.]
    // because of how flattenedArray comes back from the server.
    const matrix = [];
    for (let i = 0; i < shapeX; i++) {//6
      for (let j = 0; j < shapeY; j++) {//256;
        let singleBar;
        (matrix[j] === undefined) ? singleBar = [] : singleBar = matrix[j];
        singleBar.push(flattenedArray[(shapeY * i) + j]);
        matrix[j] = singleBar;
      }
    }

    return matrix;
  }

  /**
   * Draws exactly one tile.
   *
   * @param tile
   */
  renderTile(tile) {
    const graphics = tile.graphics;
    graphics.clear();
    tile.drawnAtScale = this._xScale.copy();

    // we're setting the start of the tile to the current zoom level
    const {tileX, tileWidth} = this.getTilePosAndDimensions(tile.tileData.zoomLevel,
      tile.tileData.tilePos, this.tilesetInfo.tile_size);

    const matrix = this.unFlatten(tile);

    if (this.options.scaledHeight === true) {
      this.findMaxAndMin(matrix);
      this.drawVerticalBars(graphics, matrix, tileX, tileWidth, this.maxAndMin.max, this.maxAndMin.min);
    }
    else {
      // normalize each array in matrix
      for (let i = 0; i < matrix.length; i++) {
        const temp = matrix[i];
        const barValuesSum = temp.reduce((a, b) => a + b, 0);
        matrix[i] = temp.map((a) => a / barValuesSum);
      }
      this.drawNormalizedBars(graphics, matrix, tileX, tileWidth);
    }
  }

  /**
   * Draws graph using normalized values.
   *
   * @param graphics PIXI.Graphics instance
   * @param matrix 2d array of numbers representing nucleotides
   * @param tileX starting position of tile
   * @param tileWidth pre-scaled width of tile
   * @param positiveMax the height of the tallest bar in the positive part of the graph
   * @param negativeMax the height of the tallest bar in the negative part of the graph
   */
  drawVerticalBars(graphics, matrix, tileX, tileWidth, positiveMax, negativeMax) {
    const trackHeight = this.dimensions[1];

    // get amount of trackHeight reserved for positive and for negative
    const unscaledHeight = positiveMax + negativeMax;
    const positiveTrackHeight = (positiveMax * trackHeight) / unscaledHeight;
    const negativeTrackHeight = (negativeMax * trackHeight) / unscaledHeight;

    const colorScale = this.options.colorScale || scaleOrdinal(schemeCategory10);
    const valueToPixels = scaleLinear()
      .domain([0, positiveMax])
      .range([0, trackHeight]);
    let prevStackedBarHeight = 0;

    // draws positive values
    for (let j = 0; j < matrix.length; j++) { // jth vertical bar in the graph
      const x = this._xScale(tileX + (j * tileWidth / this.tilesetInfo.tile_size));
      const width = this._xScale(tileX + (tileWidth / this.tilesetInfo.tile_size)) - this._xScale(tileX);

      // filter for positive values only
      const positiveVals  = matrix[j].filter((a) => a >= 0);

      // mapping colors to unsorted values
      const originalColors = {};
      for (let i = 0; i < positiveVals.length; i++) {
        originalColors[colorToHex(colorScale[i])] = positiveVals[i];
      }

      // sorted from smallest to largest here, but code below this makes largest bar go on top
      const positiveValsSorted = positiveVals.slice().sort((a, b) => a - b);

      for (let i = 0; i < positiveValsSorted.length; i++) {
        const height = valueToPixels(positiveValsSorted[i]);
        const y = (trackHeight - negativeTrackHeight) - (prevStackedBarHeight + height);
        for (let k = 0; k < Object.keys(originalColors).length; k++) {
          if (originalColors[Object.keys(originalColors)[k]] === positiveValsSorted[i]) {
            graphics.beginFill(Object.keys(originalColors)[k]);
          }
        }
        graphics.drawRect(x, y, width, height);
        prevStackedBarHeight = prevStackedBarHeight + height;
      }
      prevStackedBarHeight = 0;
    }

    // draws negative values
    for (let j = 0; j < matrix.length; j++) { // jth vertical bar in the graph
      const x = this._xScale(tileX + (j * tileWidth / this.tilesetInfo.tile_size));
      const width = this._xScale(tileX + (tileWidth / this.tilesetInfo.tile_size)) - this._xScale(tileX);
      const negativeValsSorted = matrix[j].filter((a) => a < 0).sort((a, b) => a - b);

      for (let i = 0; i < negativeValsSorted.length; i++) {
        const height = valueToPixels(negativeValsSorted[i]);
        const y = positiveTrackHeight - (prevStackedBarHeight + height);
        graphics.beginFill(colorToHex(colorScale[i]));
        graphics.drawRect(x, y, width, height);
        prevStackedBarHeight = prevStackedBarHeight - height;
      }
      prevStackedBarHeight = 0;
    }

  }

  /**
   * Draws graph using normalized values.
   *
   * @param graphics PIXI.Graphics instance
   * @param matrix 2d array of numbers representing nucleotides
   * @param tileX starting position of tile
   * @param tileWidth pre-scaled width of tile
   */
  drawNormalizedBars(graphics, matrix, tileX, tileWidth) {
    const trackHeight = this.dimensions[1];
    const colorScale = scaleOrdinal(schemeCategory10);
    const valueToPixels = scaleLinear()
      .domain([0, 1])
      .range([0, trackHeight]);
    let prevStackedBarHeight = 0;

    for (let j = 0; j < matrix.length; j++) { // jth vertical bar in the graph
      const x = this._xScale(tileX + (j * tileWidth / this.tilesetInfo.tile_size));
      const width = this._xScale(tileX + (tileWidth / this.tilesetInfo.tile_size)) - this._xScale(tileX);

      // mapping each value to its original color. color: value
      const rowWithOriginalIndices = {};
      for (let i = 0; i < matrix[j].length; i++) {
        rowWithOriginalIndices[colorToHex(colorScale(i))] = matrix[j][i];
      }

      const sorted = matrix[j].sort((a, b) => {
        return b - a;
      });
      for (let i = 0; i < sorted.length; i++) {
        const y = this.position[0] + (prevStackedBarHeight * trackHeight);
        const height = valueToPixels(sorted[i]);
        for (let k in rowWithOriginalIndices) {
          if (rowWithOriginalIndices[k] !== null
            && rowWithOriginalIndices[k] === sorted[i]) {
            graphics.beginFill(k, 1);
          }
        }
        graphics.drawRect(x, y, width, height);
        prevStackedBarHeight = prevStackedBarHeight + sorted[i];
      }
      prevStackedBarHeight = 0;
    }
  }

  draw() {
    super.draw();
  }
}

export default StackedBarTrack;
