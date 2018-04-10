import {mix} from 'mixwith';
import {BarTrack} from './BarTrack';
import {OneDimensionalMixin} from './OneDimensionalMixin';
import {scaleLinear, scaleOrdinal, schemeCategory10} from 'd3-scale';
import {tileProxy} from './services';

export class StackedBarTrack extends mix(BarTrack).with(OneDimensionalMixin) {
  constructor(scene, dataConfig, handleTilesetInfoReceived, option, animate, onValueScaleChanged) {
    super(scene, dataConfig, handleTilesetInfoReceived, option, animate, onValueScaleChanged);

    this.maxAndMin = {
      max: null,
      min: null
    };

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
      this.drawVerticalBars(graphics, this.mapOriginalColors(matrix),
        tileX, tileWidth, this.maxAndMin.max, this.maxAndMin.min, tile);
    }
    else {
      // normalize each array in matrix
      for (let i = 0; i < matrix.length; i++) {
        const temp = matrix[i];
        const barValuesSum = temp.reduce((a, b) => a + b, 0);
        matrix[i] = temp.map((a) => a / barValuesSum);
      }
      this.drawNormalizedBars(graphics, this.scaleMatrix(this.mapOriginalColors(matrix)), tileX, tileWidth, tile);
    }
    this.makeMouseOverData(tile);
  }

  /**
   * Scales positive and negative values in the given matrix so that they each sum to 1.
   *
   * @param matrix call mapOriginalColors on this matrix before calling this function on it.
   */
  scaleMatrix(matrix) {
    for (let i = 0; i < matrix.length; i++) {
      let positives = matrix[i][0];
      let negatives = matrix[i][1];

      const positiveArray = positives.map((a) => {
        return a.value;
      });
      const negativeArray = negatives.map((a) => {
        return a.value;
      });

      let positiveSum = (positiveArray.length > 0) ? positiveArray.reduce((sum, a) => sum + a) : 0;
      let negativeSum = (negativeArray.length > 0) ? negativeArray.reduce((sum, a) => sum + a) : 0;

      positives.map((a) => a.value = a.value / positiveSum);
      negatives.map((a) => a.value = a.value / negativeSum); // these will be positive numbers
    }
    return matrix;
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
          color: colorScale[i]
        }
      }

      // separate positive and negative array values
      const positive = [];
      const negative = [];
      for (let i = 0; i < columnColors.length; i++) {
        if (columnColors[i].value >= 0) {
          positive.push(columnColors[i]);
        }
        else if (columnColors[i].value < 0) {
          negative.push(columnColors[i]);
        }
      }

      if (this.options.sortLargestOnTop) {
        positive.sort((a, b) => a.value - b.value);
        negative.sort((a, b) => b.value - a.value);
      }
      else {
        positive.sort((a, b) => b.value - a.value);
        negative.sort((a, b) => a.value - b.value);
      }

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
   * @param tile
   */
  drawVerticalBars(graphics, matrix, tileX, tileWidth, positiveMax, negativeMax, tile) {
    const trackHeight = this.dimensions[1];

    // get amount of trackHeight reserved for positive and for negative
    const unscaledHeight = positiveMax + negativeMax;
    const positiveTrackHeight = (positiveMax * trackHeight) / unscaledHeight;
    const negativeTrackHeight = (negativeMax * trackHeight) / unscaledHeight;

    if (this.options.barBorder) {
      graphics.lineStyle(0.1, 'black', 1);
      tile.barBorders = true;
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
        this.addSVGInfo(tile, x, y, width, height, positive[i].color);
        graphics.beginFill(this.colorHexMap[positive[i].color]);

        graphics.drawRect(x, y, width, height);
        positiveStackedHeight = positiveStackedHeight + height;
      }

      // draw negative values
      const negative = matrix[j][1];
      const valueToPixelsNegative = scaleLinear()
        .domain([-Math.abs(negativeMax), 0])
        .range([negativeTrackHeight, 0]);
      //this.valuesToPixelsNegative = valueToPixelsNegative;
      let negativeStackedHeight = 0;
      for (let i = 0; i < negative.length; i++) {
        const height = valueToPixelsNegative(negative[i].value);
        const y = positiveTrackHeight + negativeStackedHeight;
        this.addSVGInfo(tile, x, y, width, height, negative[i].color);
        graphics.beginFill(this.colorHexMap[negative[i].color]);

        graphics.drawRect(x, y, width, height);
        negativeStackedHeight = negativeStackedHeight + height;

      }

      // sets background to black if black option enabled
      const backgroundColor = this.options.backgroundColor;
      if (backgroundColor === 'black') {
        this.options.labelColor = 'white';
        graphics.beginFill(backgroundColor);
        graphics.drawRect(x, 0, width, trackHeight - positiveStackedHeight); // positive background
        graphics.drawRect(x, negativeStackedHeight + positiveTrackHeight,    // negative background
          width, negativeTrackHeight - negativeStackedHeight);

        this.addSVGInfo(tile, x, 0, width, trackHeight - positiveStackedHeight, 'black'); // positive
        this.addSVGInfo(tile, x, negativeStackedHeight + positiveTrackHeight, width,
          negativeTrackHeight - negativeStackedHeight, 'black'); // negative

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
   * @param tile
   */
  drawNormalizedBars(graphics, matrix, tileX, tileWidth, tile) {
    const trackHeight = this.dimensions[1];

    if (this.options.barBorder) {
      graphics.lineStyle(0.2, 'black', 1);
      tile.barBorders = true;
    }

    for (let j = 0; j < matrix.length; j++) { // jth vertical bar in the graph
      const x = this._xScale(tileX + (j * tileWidth / this.tilesetInfo.tile_size));
      const width = this._xScale(tileX + (tileWidth / this.tilesetInfo.tile_size)) - this._xScale(tileX);
      // positives
      const valueToPixelsPositive = scaleLinear()
        .domain([0, 1])
        .range([0, trackHeight / 2]);
      let positiveStackedHeight = 0;
      for (let i = 0; i < matrix[j][0].length; i++) {
        const height = valueToPixelsPositive(matrix[j][0][i].value);
        const y = trackHeight / 2 - (positiveStackedHeight + height);
        const color = matrix[j][0][i].color;
        this.addSVGInfo(tile, x, y, width, height, color);
        graphics.beginFill(this.colorHexMap[color], 1);
        graphics.drawRect(x, y, width, height);
        positiveStackedHeight = positiveStackedHeight + height;
      }
      positiveStackedHeight = 0;

      // negatives
      const valueToPixelsNegative = scaleLinear()
        .domain([0, 1])
        .range([0, (trackHeight / 2)]);
      let negativeStackedHeight = 0;
      for (let i = 0; i < matrix[j][1].length; i++) {
        const height = valueToPixelsNegative(matrix[j][1][i].value);
        const y = (trackHeight / 2) + negativeStackedHeight;
        const color = matrix[j][1][i].color;
        this.addSVGInfo(tile, x, y, width, height, color);
        graphics.beginFill(this.colorHexMap[color], 1);
        graphics.drawRect(x, y, width, height);
        negativeStackedHeight = negativeStackedHeight + height;
      }
      negativeStackedHeight = 0;
    }
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
    if (tile.hasOwnProperty('svgData') && tile.svgData !== null) {
      tile.svgData.barXValues.push(x);
      tile.svgData.barYValues.push(y);
      tile.svgData.barWidths.push(width);
      tile.svgData.barHeights.push(height);
      tile.svgData.barColors.push(color);
    }
    else {
      tile.svgData = {
        barXValues: [x],
        barYValues: [y],
        barWidths: [width],
        barHeights: [height],
        barColors: [color]
      };
    }
  }

  draw() {
    super.draw();
  }


  makeMouseOverData(tile) {
    if (!tile.hasOwnProperty('mouseOverData')) {
      const shapeX = tile.tileData.shape[0]; // 15 number of different nucleotides in each bar
      const shapeY = tile.tileData.shape[1]; // 3840 number of bars
      let mouseOverData = [];

      if (this.options.scaledHeight === true) {
        const barYValues = tile.svgData.barYValues;
        const barColors = tile.svgData.barColors;
        const barHeights = tile.svgData.barHeights;

        // make 2d array. run through flat list and the first 256 elements go into the first index in each array, etc.
        // this reverse engineers the order the values are stored in render method.
        for (let i = 0; i < shapeX; i++) {
          for (let j = 0; j < shapeY; j++) {
            const index = (j * shapeX) + i;
            if (mouseOverData[j] === undefined) {
              mouseOverData[j] = [{
                y: barYValues[index],
                color: barColors[index],
                height: barHeights[index]
              }];
            }
            else {
              mouseOverData[j].push({
                y: barYValues[index],
                color: barColors[index],
                height: barHeights[index]
              });
            }
          }
        }
        for (let i = 0; i < mouseOverData.length; i++) {
          mouseOverData[i] = mouseOverData[i].sort((a, b) => {
            return a.y - b.y
          });
        }
        tile.mouseOverData = mouseOverData;
      }
      else {

      }
    }
  }

  getMouseOverHtml(trackX, trackY) {

    if (!this.tilesetInfo)
      return '';

    const colorScale = this.options.colorScale || scaleOrdinal(schemeCategory10);

    const zoomLevel = this.calculateZoomLevel();
    const tileWidth = tileProxy.calculateTileWidth(this.tilesetInfo, zoomLevel, this.tilesetInfo.tile_size);

    // the position of the tile containing the query position
    const tilePos = this._xScale.invert(trackX) / tileWidth;

    const posInTileX = Math.floor(this.tilesetInfo.tile_size * (tilePos - Math.floor(tilePos)));

    const tileId = this.tileToLocalId([zoomLevel, Math.floor(tilePos)]);
    const fetchedTile = this.fetchedTiles[tileId];
    const matrixRow = fetchedTile.matrix[posInTileX];
    const row = fetchedTile.mouseOverData[posInTileX];

    // use color to map back to the array index for correct data
    const colorScaleMap = {};
    for (let i = 0; i < colorScale.length; i++) {
      colorScaleMap[colorScale[i]] = i;
    }

    /**
     * extra problem: zooming/stretching messes up data
     */

    if (trackY < row[0].y || trackY >= (row[row.length - 1].y + row[row.length - 1].height)) {
      return '';
    }
    else {
      for (let i = 0; i < row.length; i++) {
        if (trackY > row[i].y && trackY <= (row[i].y + row[i].height)) {
          const color = row[i].color;
          const value = Number.parseFloat(matrixRow[colorScaleMap[color]]).toPrecision(4).toString();
          const type = this.tilesetInfo.row_infos[colorScaleMap[color]];

          return `<svg width="10" height="10"><rect width="10" height="10" rx="2" ry="2" 
            style="fill:${color};stroke:black;stroke-width:2;"></svg>`
            + ` ${type}` + `<br>` + `${value}`;

        }
      }
    }

  }
}

export default StackedBarTrack;
