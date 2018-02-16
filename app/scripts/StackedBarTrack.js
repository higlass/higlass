import {BarTrack} from './BarTrack';
import {scaleLinear, scaleOrdinal, schemeCategory10} from 'd3-scale';
import {colorToHex} from './utils';

export class StackedBarTrack extends BarTrack {
  constructor(scene, dataConfig, handleTilesetInfoReceived, option, animate, onValueScaleChanged) {
    super(scene, dataConfig, handleTilesetInfoReceived, option, animate, onValueScaleChanged);

    this.maxAndMin = {
      max: null,
      min: null
    };
  }

  initTile(tile) {
    this.renderTile(tile);
  }

  updateTile(tile) {
    const visibleAndFetched = this.visibleAndFetchedTiles();

    // reset max and min to null so previous maxes and mins don't carry over //todo save previously calculated maxAndMins
    this.maxAndMin = {
      max: null,
      min: null
    };

    for (let i = 0; i < visibleAndFetched.length; i++) {
      const matrix = this.unFlatten(visibleAndFetched[i]);
      this.findMaxAndMin(matrix);
    }

    for (let i = 0; i < visibleAndFetched.length; i++) {
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
      max: null,
      min: null
    };

    for (let i = 0; i < matrix.length; i++) {
      const temp = matrix[i];

      // find total heights of each positive column and each negative column
      // and compare to highest value so far for the tile
      const localPositiveMax = temp.filter((a) => a >= 0).reduce((a, b) => a + b, 0);
      (localPositiveMax > maxAndMin.max) ? maxAndMin.max = localPositiveMax : maxAndMin.max;

      let negativeValues = temp.filter((a) => a < 0);
      if (negativeValues.length > 0) {
        negativeValues = negativeValues.map((a) => Math.abs(a));
        const localNegativeMax = negativeValues.reduce((a, b) => a + b, 0); // check
        (maxAndMin.min === null || localNegativeMax > maxAndMin.min) ?
          maxAndMin.min = localNegativeMax : maxAndMin.min;
      }
    }

    // update global max and min if necessary
    (this.maxAndMin.max === null || maxAndMin.max > this.maxAndMin.max) ?
      this.maxAndMin.max = maxAndMin.max : this.maxAndMin.max;
    (this.maxAndMin.min === null || maxAndMin.min < this.maxAndMin.min) ?
      this.maxAndMin.min = maxAndMin.min : this.maxAndMin.min;
  }

  /**
   * un-flatten data into matrix of tile.tileData.shape[0] x tile.tileData.shape[1]
   *
   *
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

    let matrix = this.unFlatten(tile);

    if (this.options.scaledHeight === true) {
      this.drawVerticalBars(graphics, this.mapOriginalColors(matrix),
        tileX, tileWidth, this.maxAndMin.max, this.maxAndMin.min);
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
   * Map each value in every array in the matrix to a color depending on position in the array
   * Divides each array into positive and negative sections and sorts them
   *
   * @param matrix 2d array of numbers representing nucleotides
   * @return
   */
  mapOriginalColors(matrix) {
    const colorScale = this.options.colorScale || scaleOrdinal(schemeCategory10);

    // mapping colors to unsorted values
    const matrixWithColors = [];
    for (let j = 0; j < matrix.length; j++) {
      const columnColors = [];
      for (let i = 0; i < matrix[j].length; i++) {
        columnColors[i] = {
          value: matrix[j][i],
          color: colorToHex(colorScale[i])
        }
      }

      // separate positive and negative array values
      const positive = [];
      const negative = [];
      for (let i = 0; i < columnColors.length; i++) {
        // todo here we discard zeros because I don't think we need them anymore. should we be doing that?
        if (columnColors[i].value > 0) {
          positive.push(columnColors[i]);
        }
        else if (columnColors[i].value < 0) {
          negative.push(columnColors[i]);
        }
      }
      positive.sort((a, b) => a.value - b.value);
      negative.sort((a, b) => b.value - a.value);

      matrixWithColors.push([positive, negative]);
    }
    return matrixWithColors;
  }

  /**
   * Draws graph without normalizing values.
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

    if(this.options.barBorder) {
      graphics.lineStyle(0.1, 'black', 1);
    }

    for (let j = 0; j < matrix.length; j++) { // jth vertical bar in the graph
      const x = this._xScale(tileX + (j * tileWidth / this.tilesetInfo.tile_size));
      const width = this._xScale(tileX + (tileWidth / this.tilesetInfo.tile_size)) - this._xScale(tileX);

      // draw positive values
      const positive = matrix[j][0];
      const valueToPixelsPositive = scaleLinear()
        .domain([0, positiveMax])
        .range([0, positiveTrackHeight]);
      let positiveStackedHeight = 0;
      for (let i = 0; i < positive.length; i++) {
        const height = valueToPixelsPositive(positive[i].value);
        const y = positiveTrackHeight - (positiveStackedHeight + height);
        graphics.beginFill(positive[i].color);
        graphics.drawRect(x, y, width, height);
        positiveStackedHeight = positiveStackedHeight + height;
      }

      // draw negative values
      const negative = matrix[j][1];
      const valueToPixelsNegative = scaleLinear()
        .domain([-Math.abs(negativeMax), 0])
        .range([negativeTrackHeight, 0]);
      let negativeStackedHeight = 0;
      for (let i = 0; i < negative.length; i++) {
        const height = valueToPixelsNegative(negative[i].value);
        const y = positiveTrackHeight + negativeStackedHeight;
        graphics.beginFill(negative[i].color);
        graphics.drawRect(x, y, width, height);
        negativeStackedHeight = negativeStackedHeight + height;
      }

      // sets background to black if black option enabled
      const backgroundColor = this.options.backgroundColor;
      if (backgroundColor === 'black') {
        graphics.beginFill(backgroundColor);
        graphics.drawRect(x, 0, width, trackHeight - positiveStackedHeight); // positive background
        graphics.drawRect(x, negativeStackedHeight + positiveTrackHeight,    // negative background
          width, negativeTrackHeight - negativeStackedHeight);
        positiveStackedHeight = 0;
        negativeStackedHeight = 0;

      }

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
