import { mix } from 'mixwith';
import { BarTrack } from './BarTrack';
import { OneDimensionalMixin } from './OneDimensionalMixin';
import {scaleLinear, scaleOrdinal, schemeCategory10} from 'd3-scale';

class BasicMultipleBarChart extends mix(BarTrack).with(OneDimensionalMixin) {
  constructor(scene, dataConfig, handleTilesetInfoReceived, option, animate, onValueScaleChanged) {
    super(scene, dataConfig, handleTilesetInfoReceived, option, animate, onValueScaleChanged);

    this.maxAndMin = {
      max: null,
      min: null
    };

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

    if (this.options.barBorder) {
      graphics.lineStyle(0.1, 'black', 1);
      tile.barBorders = true;
    }

    const matrix = tile.matrix;
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
    if (tile.hasOwnProperty('svgData') && tile.svgData !== null) {
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

  getMouseOverHtml(trackX, trackY) {
    //console.log(this.tilesetInfo);
    return '';
  }

}

export default BasicMultipleBarChart;

