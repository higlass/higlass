import { mix } from 'mixwith';
import { BarTrack } from './BarTrack';
import { OneDimensionalMixin } from './OneDimensionalMixin';
import {scaleLinear, scaleOrdinal, schemeCategory10} from 'd3-scale';

export class BasicMultipleLineChart extends mix(BarTrack).with(OneDimensionalMixin) {
  constructor(scene, dataConfig, handleTilesetInfoReceived, options, animate, onValueScaleChanged) {
    super(scene, dataConfig, handleTilesetInfoReceived, options, animate, onValueScaleChanged);

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

    const matrix = tile.matrix;
    const trackHeight = this.dimensions[1];
    const matrixDimensions = tile.tileData.shape;
    const colorScale = this.options.colorScale || scaleOrdinal(schemeCategory10);
    const valueToPixels = scaleLinear()
      .domain([0, this.maxAndMin.max])
      .range([0, trackHeight / matrixDimensions[0]]);

    for (let i = 0; i < matrix[0].length; i++) {
      const intervals = trackHeight / matrixDimensions[0];
      // calculates placement for a line in each interval; we subtract 1 so we can see the last line clearly
      const linePlacement = (i === matrix[0].length - 1) ?
        (intervals * i) + ((intervals * (i + 1) - (intervals * i))) - 1 :
        (intervals * i) + ((intervals * (i + 1) - (intervals * i)));
      graphics.lineStyle(1, this.colorHexMap[colorScale[i]], 1);

      for (let j = 0; j < matrix.length; j++) { // 3070 or something
        const x = this._xScale(tileX + (j * tileWidth / this.tilesetInfo.tile_size));
        const y = linePlacement - valueToPixels(matrix[j][i]);
        this.addSVGInfo(tile, x, y, colorScale[i]);
        // move draw position back to the start at beginning of each line
        (j === 0) ? graphics.moveTo(x, y) : graphics.lineTo(x, y);
      }
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

  getMouseOverHtml(trackX, trackY) {
    //console.log(this.tilesetInfo, trackX, trackY);
    return '';
  }

}

export default BasicMultipleLineChart;


