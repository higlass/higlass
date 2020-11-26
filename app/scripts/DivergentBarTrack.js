import { scaleLinear, scaleLog } from 'd3-scale';

import BarTrack from './BarTrack';

// Utils
import { colorToHex } from './utils';

class DivergentBarTrack extends BarTrack {
  drawTile(tile) {
    this.renderTile(tile);
  }

  renderTile(tile) {
    // super.drawTile(tile);
    if (!tile.graphics) {
      return;
    }

    const graphics = tile.graphics;

    const { tileX, tileWidth } = this.getTilePosAndDimensions(
      tile.tileData.zoomLevel,
      tile.tileData.tilePos,
      this.tilesetInfo.tile_size || this.tilesetInfo.bins_per_dimension,
    );
    const tileValues = tile.tileData.dense;

    if (tileValues.length === 0) {
      return;
    }

    let pseudocount = 0; // if we use a log scale, then we'll set a pseudocount
    // equal to the smallest non-zero value
    this.valueScale = null;

    // console.log('valueScaling:', this.options.valueScaling);
    if (this.options.valueScaling === 'log') {
      let offsetValue = this.medianVisibleValue;

      if (!this.medianVisibleValue) {
        offsetValue = this.minValue();
      }

      this.valueScale = scaleLog()
        // .base(Math.E)
        .domain([offsetValue, this.maxValue() + offsetValue])
        .range([this.dimensions[1], 0]);
      pseudocount = offsetValue;
    } else {
      // linear scale
      this.valueScale = scaleLinear()
        .domain([this.minValue(), this.maxValue()])
        .range([this.dimensions[1], 0]);
    }

    /*
    tile.scale = {
      minValue: this.valueScale.domain()[0],
      maxValue: this.valueScale.domain()[1]
    };
    */

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
    const tileXScale = scaleLinear()
      .domain([0, this.tilesetInfo.tile_size])
      .range([tileX, tileX + tileWidth]);

    // let strokeWidth = this.options.lineStrokeWidth ? this.options.lineStrokeWidth : 1;

    const strokeWidth = 0;
    graphics.lineStyle(strokeWidth, stroke, 1);

    const topColor = this.options.barFillColorTop
      ? this.options.barFillColorTop
      : 'green';
    const bottomColor = this.options.barFillColorBottom
      ? this.options.barFillColorBottom
      : 'red';

    // PIXI wants hex colors whereas d3 wants regular colors
    const topColorHex = colorToHex(topColor);
    const bottomColorHex = colorToHex(bottomColor);

    const opacity = 'barOpacity' in this.options ? this.options.barOpacity : 1;

    tile.drawnAtScale = this._xScale.copy();

    // the line at which the values will diverge
    let baseline = 0;
    if (this.options.valueScaling === 'log') {
      baseline = this.valueScale(1);
    } else {
      baseline = this.valueScale(0);
    }

    delete tile.svgData;

    for (let i = 0; i < tileValues.length; i++) {
      const xPos = this._xScale(tileXScale(i));
      const yPos = this.valueScale(tileValues[i] + pseudocount);

      const width = this._xScale(tileXScale(i + 1)) - xPos;
      // const height = this.dimensions[1] - yPos;

      if (yPos > baseline) {
        graphics.beginFill(bottomColorHex, opacity);
        this.addSVGInfo(
          tile,
          xPos,
          baseline,
          width,
          yPos - baseline,
          bottomColor,
        );
      } else {
        graphics.beginFill(topColorHex, opacity);
        this.addSVGInfo(tile, xPos, yPos, width, baseline - yPos, topColor);
      }

      if (tileXScale(i) > this.tilesetInfo.max_pos[0]) {
        break;
      }
      // this data is in the last tile and extends beyond the length
      // of the coordinate system

      graphics.drawRect(
        xPos,
        tile.svgData.barYValues[i],
        width,
        tile.svgData.barHeights[i],
      );
    }
  }
}

export default DivergentBarTrack;
