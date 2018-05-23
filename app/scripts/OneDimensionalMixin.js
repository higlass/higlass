import {Mixin} from 'mixwith';
import {scaleLinear, scaleOrdinal, schemeCategory10} from 'd3-scale';
import {colorToHex} from './utils';

export const OneDimensionalMixin = Mixin(superclass => class extends superclass {

  initTile(tile) {
    this.localColorToHexScale();

    this.unFlatten(tile);
    this.maxAndMin.max = tile.maxValue;
    this.maxAndMin.min = tile.minValue;

    if (tile.matrix) {
      // update global max and min if necessary
      (this.maxAndMin.max === null || tile.maxValue > this.maxAndMin.max) ?
        this.maxAndMin.max = tile.maxValue : this.maxAndMin.max;
      (this.maxAndMin.min === null || tile.minValue < this.maxAndMin.min) ?
        this.maxAndMin.min = tile.minValue : this.maxAndMin.min;
    }


    //this.rescaleTile(tile);

    const visibleAndFetched = this.visibleAndFetchedTiles();
    visibleAndFetched.map(a => {
      this.rescaleTile(a);
    });
    this.renderTile(tile);
  }

  rerender(newOptions) {
    this.options = newOptions;
    const visibleAndFetched = this.visibleAndFetchedTiles();

    for (let i = 0; i < visibleAndFetched.length; i++) {
      this.updateTile(visibleAndFetched[i]);
    }
  }

  // todo it is not rerender's fault update happens so many times

  updateTile(tile) {
    const visibleAndFetched = this.visibleAndFetchedTiles();
    // reset max and min to null so previous maxes and mins don't carry over
    this.maxAndMin = {
      max: null,
      min: null
    };


    for (let i = 0; i < visibleAndFetched.length; i++) {
      const tile = visibleAndFetched[i];
      this.unFlatten(tile);
      tile.svgData = null;
      tile.mouseOverData = null;
      if (tile.matrix) {
        // update global max and min if necessary
        (this.maxAndMin.max === null || tile.maxValue > this.maxAndMin.max) ?
          this.maxAndMin.max = tile.maxValue : this.maxAndMin.max;
        (this.maxAndMin.min === null || tile.minValue < this.maxAndMin.min) ?
          this.maxAndMin.min = tile.minValue : this.maxAndMin.min;
        //this.rescaleTile(visibleAndFetched[i]);
      }
    }
    //const visibleAndFetched = this.visibleAndFetchedTiles();
    visibleAndFetched.map(a => {
      this.rescaleTile(a);
    });

  }

  rescaleTile(tile) {
    const visibleAndFetched = this.visibleAndFetchedTiles();
    //console.log('# of tiles', visibleAndFetched.length);
    const tileMax = tile.minValue + tile.maxValue;
    const globalMax = this.maxAndMin.max + this.maxAndMin.min;

    const valueToPixels = scaleLinear()
      .domain([0, globalMax])
      .range([0, this.dimensions[1]]);
    // const yValToPixels = scaleLinear()
    //   .domain([0, ])
    (tile.tileData.sprite !== undefined) ?
      tile.tileData.sprite.height = valueToPixels(tileMax) :
      tile.tileData.spriteHeight = valueToPixels(tileMax);

    visibleAndFetched.map(a => {
      const tileMaxPixels = valueToPixels(a.minValue + a.maxValue);
      //console.log(tile.tileId, 'pixels', tileMaxPixels);
      const height = this.dimensions[1] - tileMaxPixels;//valueToPixels(tileMax);
      // console.log(tile.tileId, height);
      // if (a.tileData.sprite === undefined) {
      //   a.tileData.spriteY = this.dimensions[1] - 180;
      //   //console.log(a.tileData.spriteY);
      // }
      // else {
      //   a.tileData.sprite.y = this.dimensions[1] - 180;
      //   console.log(a.tileData.sprite.y);
      // }
      if (a.tileData.sprite) {
        //console.log(tile.tileId, a.tileData.sprite.y);
        a.tileData.sprite.y = height;
        //console.log(a.tileData.sprite);
      }
      else {
        a.tileData.spriteY = height;
      }
      // if (a.tileData.sprite === undefined) {
      //   if (Math.trunc(tileMax) === Math.trunc(globalMax)) {
      //     console.log(tile.tileId, 'max!');
      //     a.tileData.spriteY = height;
      //   }
      //   else {
      //     console.log(tile.tileId, 'not max', this.dimensions[1] - valueToPixels(tileMax));
      //     a.tileData.spriteY = height;//this.dimensions[1] - valueToPixels(tileMax);
      //   }
      // }
      // else {
      //   if (Math.trunc(tileMax) === Math.trunc(globalMax)) {
      //     console.log(tile.tileId, 'max!');
      //     a.tileData.sprite.y = height;
      //   }
      //   else {
      //     console.log(tile.tileId, 'not max', this.dimensions[1] - valueToPixels(tileMax));
      //     a.tileData.sprite.y = height;// this.dimensions[1] - valueToPixels(tileMax);
      //   }
      // }
    });
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
      let flattenedArray = tile.tileData.dense;

      // if any data is negative, switch to exponential scale
      if (flattenedArray.filter((a) => a < 0).length > 0 && this.options.valueScaling === 'linear') {
        console.warn('Negative values present in data. Defaulting to exponential scale.');
        this.options.valueScaling = 'exponential';
      }

      const matrix = this.simpleUnFlatten(tile, flattenedArray);

      const maxAndMin = this.findMaxAndMin(matrix);

      tile.matrix = matrix;
      tile.maxValue = maxAndMin.max;
      tile.minValue = maxAndMin.min;

      return matrix;
    }
  }

  /**
   *
   * @param tile
   * @param data array of values to reshape
   * @returns {Array} 2D array representation of data
   */
  simpleUnFlatten(tile, data) {
    const shapeX = tile.tileData.shape[0]; // number of different nucleotides in each bar
    const shapeY = tile.tileData.shape[1]; // number of bars

    // matrix[0] will be [flattenedArray[0], flattenedArray[256], flattenedArray[512], etc.]
    // because of how flattenedArray comes back from the server.
    const matrix = [];
    for (let i = 0; i < shapeX; i++) {//6
      for (let j = 0; j < shapeY; j++) {//256;
        let singleBar;
        (matrix[j] === undefined) ? singleBar = [] : singleBar = matrix[j];
        singleBar.push(data[(shapeY * i) + j]);
        matrix[j] = singleBar;
      }
    }

    return matrix;
  }


});

export default OneDimensionalMixin;
