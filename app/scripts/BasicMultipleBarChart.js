import {BarTrack} from './BarTrack';
import {scaleLinear, scaleOrdinal, schemeCategory10} from 'd3-scale';
import {colorToHex} from './utils';
import {range} from 'd3-array';

class BasicMultipleBarChart extends BarTrack {
  constructor(scene, dataConfig, handleTilesetInfoReceived, option, animate, onValueScaleChanged) {
    super(scene, dataConfig, handleTilesetInfoReceived, option, animate, onValueScaleChanged);

    this.maxAndMin = {
      max: null,
      min: null
    };

  }

  initTile(tile) {
    this.localColorToHexScale();
    this.unFlatten(tile);
    this.maxAndMin.max = tile.maxValue;
    this.maxAndMin.min = tile.minValue;
    this.renderTile(tile);
  }

  updateTile(tile) {
    const visibleAndFetched = this.visibleAndFetchedTiles();

    // reset max and min to null so previous maxes and mins don't carry over
    this.maxAndMin = {
      max: null,
      min: null
    };

    for (let i = 0; i < visibleAndFetched.length; i++) {
      const tile = visibleAndFetched[i];
      tile.svgData = null;
      this.unFlatten(tile);
      if (tile.matrix) {
        // update global max and min if necessary
        (this.maxAndMin.max === null || tile.maxValue > this.maxAndMin.max) ?
          this.maxAndMin.max = tile.maxValue : this.maxAndMin.max;
        (this.maxAndMin.min === null || tile.minValue < this.maxAndMin.min) ?
          this.maxAndMin.min = tile.minValue : this.maxAndMin.min;
      }
    }

    for (let i = 0; i < visibleAndFetched.length; i++) {
      this.renderTile(visibleAndFetched[i]);
    }

  }

  renderTile(tile) {
    const graphics = tile.graphics;
    graphics.clear();
    tile.drawnAtScale = this._xScale.copy();

    // we're setting the start of the tile to the current zoom level
    const {tileX, tileWidth} = this.getTilePosAndDimensions(tile.tileData.zoomLevel,
      tile.tileData.tilePos, this.tilesetInfo.tile_size);

    if (this.options.barBorder) {
      graphics.lineStyle(0.1, 'black', 1);
      tile.barBorders = true;
    }

    const matrix = this.unFlatten(tile);
    const trackHeight = this.dimensions[1];
    const matrixDimensions = tile.tileData.shape;
    const colorScale = this.options.colorScale || scaleOrdinal(schemeCategory10);
    const width = this._xScale(tileX + (tileWidth / this.tilesetInfo.tile_size)) - this._xScale(tileX);
    const valueToPixels = scaleLinear()
      .domain([0, this.maxAndMin.max])
      .range([0, trackHeight / matrixDimensions[0]]);

    for (let i = 0; i < matrix[0].length; i++) { // 15
      graphics.beginFill(this.colorHexMap[colorScale[i]]);

      for (let j = 0; j < matrix.length; j++) { // 3000
        const x = this._xScale(tileX + (j * tileWidth / this.tilesetInfo.tile_size));
        const height = valueToPixels(matrix[j][i]);
        const y = ((trackHeight / matrixDimensions[0]) * (i + 1) - height);
        this.addSVGInfo(tile, x, y, width, height, colorScale[i]);
        graphics.drawRect(x, y, width, height);
      }

    }

  }

  /**
   * Stores x and y coordinates in 2d arrays in each tile to indicate new lines and line color.
   *
   * @param tile
   * @param x
   * @param y
   * @param width
   * @param height
   * @param color
   */
  addSVGInfo(tile, x, y, width, height, color) {
    if (tile.svgData
      && tile.svgData.hasOwnProperty('barXValues')
      && tile.svgData.hasOwnProperty('barYValues')
      && tile.svgData.hasOwnProperty('barColors')) {
      tile.svgData.barXValues.push(x);
      tile.svgData.barYValues.push(y);
      tile.svgData.barWidths.push(width);
      tile.svgData.barHeights.push(height);
      tile.svgData.barColors.push(color);
    }
    else {
      // create entirely new 2d arrays for x y coordinates
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
   * Converts all colors in a colorScale to Hex colors.
   */
  localColorToHexScale() {
    const colorScale = this.options.colorScale || scaleOrdinal(schemeCategory10);
    let colorHexMap = {};
    for (let i = 0; i < colorScale.length; i++) {
      colorHexMap[colorScale[i]] = colorToHex(colorScale[i]);
    }
    this.colorHexMap = colorHexMap;
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

    return maxAndMin;

  }

  /**
   * un-flatten data into matrix of tile.tileData.shape[0] x tile.tileData.shape[1]
   *
   * @param tile
   * @returns {Array} 2d array of numerical values for each column
   */
  unFlatten(tile) {
    if (tile.matrix) {
      return tile.matrix;
    }
    else {
      const shapeX = tile.tileData.shape[0]; // number of different nucleotides in each bar
      const shapeY = tile.tileData.shape[1]; // number of bars
      let flattenedArray = tile.tileData.dense;

      // if any data is negative, switch to exponential scale
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

      const maxAndMin = this.findMaxAndMin(matrix);

      tile.matrix = matrix;
      tile.maxValue = maxAndMin.max;
      tile.minValue = maxAndMin.min;

      return matrix;
    }
  }

  getMouseOverHtml(trackX, trackY) {
    //console.log(this.tilesetInfo);
    return '';
  }

}

export default BasicMultipleBarChart;

