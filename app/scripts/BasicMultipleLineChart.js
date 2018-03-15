import {HorizontalLine1DPixiTrack} from './HorizontalLine1DPixiTrack';
import {scaleLinear, scaleOrdinal, schemeCategory10} from 'd3-scale';
import {colorToHex} from './utils';

export class BasicMultipleLineChart extends HorizontalLine1DPixiTrack {
  constructor(scene,
              dataConfig,
              handleTilesetInfoReceived,
              options,
              animate,
              onValueScaleChanged,) {
    super(
      scene,
      dataConfig,
      handleTilesetInfoReceived,
      options,
      animate,
      onValueScaleChanged
    );

    this.maxAndMin = {
      max: null,
      min: null
    };

  }

  initTile(tile) {
    //super.initTile(tile);
    this.localColorToHexScale();
    this.unFlatten(tile);
    this.maxAndMin.max = tile.tileData.maxValue;
    this.maxAndMin.min = tile.tileData.minValue;
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
      if (tile.tileData.matrix) {
        // update global max and min if necessary
        (this.maxAndMin.max === null || tile.tileData.maxValue > this.maxAndMin.max) ?
          this.maxAndMin.max = tile.tileData.maxValue : this.maxAndMin.max;
        (this.maxAndMin.min === null || tile.tileData.minValue < this.maxAndMin.min) ?
          this.maxAndMin.min = tile.tileData.minValue : this.maxAndMin.min;
      }
    }

    for (let i = 0; i < visibleAndFetched.length; i++) {
      this.renderTile(visibleAndFetched[i]);
    }

  }

  /**
   * Draws exactly one tile.
   * @param tile
   */
  renderTile(tile) {
    const graphics = tile.graphics;
    graphics.clear();
    tile.drawnAtScale = this._xScale.copy();

    // we're setting the start of the tile to the current zoom level
    const {tileX, tileWidth} = this.getTilePosAndDimensions(tile.tileData.zoomLevel,
      tile.tileData.tilePos, this.tilesetInfo.tile_size);

    this.unFlatten(tile);

    // this function is just so that we follow the same pattern as
    // HeatmapTiledPixiTrack.js
    this.drawTile(tile, graphics, tileX, tileWidth);
  }

  /**
   * Draws tile as separated line graphs
   *
   * @param tile
   * @param graphics PIXI.Graphics instance
   * @param tileX starting position of tile
   * @param tileWidth pre-scaled width of tile
   */
  drawTile(tile, graphics, tileX, tileWidth) {
    const trackHeight = this.dimensions[1];
    const matrix = tile.tileData.matrix;
    const matrixDimensions = tile.tileData.shape;
    const colorScale = this.options.colorScale || scaleOrdinal(schemeCategory10);
    const valueToPixels = scaleLinear()
      .domain([0, this.maxAndMin.max])
      .range([0, trackHeight / matrixDimensions[0]]);

    for (let i = 0; i < matrixDimensions[0]; i++) {
      // divides track into horizontal intervals for each line and calculates placement for a line in each interval
      const lineInterval = (trackHeight / matrixDimensions[0]) * i + (((trackHeight / matrixDimensions[0]) * (i + 1)
        - ((trackHeight / matrixDimensions[0]) * i)) / 2);
      graphics.lineStyle(1, this.colorHexMap[colorScale[i]], 1);

      for (let j = 0; j < matrix.length; j++) { // 3070 or something
        const x = this._xScale(tileX + (j * tileWidth / this.tilesetInfo.tile_size));
        const y = lineInterval + valueToPixels(matrix[j][i]);
        this.addSVGInfo(tile, x, y, colorScale[i]);
        // move draw position back to the start at beginning of each line
        (j == 0) ? graphics.moveTo(x, y) : graphics.lineTo(x, y);
      }
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

      tile.tileData.matrix = matrix;
      tile.tileData.maxValue = maxAndMin.max;
      tile.tileData.minValue = maxAndMin.min;

      return matrix;
    }
  }

  /**
   * Stores x and y coordinates in 2d arrays in each tile to indicate new lines and line color.
   *
   * @param tile
   * @param x
   * @param y
   * @param color
   */
  addSVGInfo(tile, x, y, color) {
    if (tile.svgData
      && tile.svgData.hasOwnProperty('lineXValues')
      && tile.svgData.hasOwnProperty('lineYValues')
      && tile.svgData.hasOwnProperty('lineColor')) {
      // if a new color appears, create a separate array to indicate new line
      if (tile.svgData.lineColor[tile.svgData.lineColor.length - 1] !== color) {
        tile.svgData.lineXValues.push([x]);
        tile.svgData.lineYValues.push([y]);
        tile.svgData.lineColor.push(color);
      }
      // else add x y coordinates onto the last array in the list
      else {
        tile.svgData.lineXValues[tile.svgData.lineXValues.length - 1].push(x);
        tile.svgData.lineYValues[tile.svgData.lineYValues.length - 1].push(y);
      }
    }
    else {
      // create entirely new 2d arrays for x y coordinates
      tile.svgData  = {
        lineXValues: [[x]],
        lineYValues: [[y]],
        lineColor: [color]
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
    let base = document.createElement('g');
    let track = base;

    base.setAttribute('class', 'exported-line-track');
    const output = document.createElement('g');

    track.appendChild(output);
    output.setAttribute('transform',
      `translate(${this.position[0]},${this.position[1]})`);

    const tiles = this.visibleAndFetchedTiles();
    for (let i = 0; i < tiles.length; i++) { // unique tiles
      for (let j = 0; j < tiles[i].svgData.lineXValues.length; j++) { // unique lines
        const g = document.createElement('path');
        g.setAttribute('fill', 'transparent');
        g.setAttribute('stroke', tiles[i].svgData.lineColor[j]);
        let d = `M${tiles[i].svgData.lineXValues[j][0]} ${tiles[i].svgData.lineYValues[j][0]}`;
        for (let k = 0; k < tiles[i].svgData.lineXValues[j].length; k++) { // data points on each line
          d += `L${tiles[i].svgData.lineXValues[j][k]} ${tiles[i].svgData.lineYValues[j][k]}`;
        }
        g.setAttribute('d', d);
        output.appendChild(g);
      }
    }

    const gAxis = document.createElement('g');
    gAxis.setAttribute('id', 'axis');

    // append the axis to base so that it's not clipped
    base.appendChild(gAxis);
    gAxis.setAttribute('transform',
      `translate(${this.axis.pAxis.position.x}, ${this.axis.pAxis.position.y})`);

    // add the axis to the export
    if (
      this.options.axisPositionHorizontal === 'left' ||
      this.options.axisPositionVertical === 'top'
    ) {
      // left axis are shown at the beginning of the plot
      const gDrawnAxis = this.axis.exportAxisLeftSVG(this.valueScale, this.dimensions[1]);
      gAxis.appendChild(gDrawnAxis);
    } else if (
      this.options.axisPositionHorizontal === 'right' ||
      this.options.axisPositionVertical === 'bottom'
    ) {
      const gDrawnAxis = this.axis.exportAxisRightSVG(this.valueScale, this.dimensions[1]);
      gAxis.appendChild(gDrawnAxis);
    }

    return [base, track];
  }

  // prevent TiledPixiTrack from drawing
  draw(tile) {
    this.updateTile(tile);
  }

}

export default BasicMultipleLineChart;


