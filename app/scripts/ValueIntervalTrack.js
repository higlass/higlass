import { scaleLog } from 'd3-scale';

import HorizontalLine1DPixiTrack from './HorizontalLine1DPixiTrack';
import AxisPixi from './AxisPixi';

import { colorToHex } from './utils';

class ValueIntervalTrack extends HorizontalLine1DPixiTrack {
  constructor(context, options) {
    super(context, options);

    this.axis = new AxisPixi(this);
    this.pBase.addChild(this.axis.pAxis);
  }

  initTile(tile) {
    // create the tile
    // should be overwritten by child classes
    this.scale.minRawValue = this.minVisibleValueInTiles();
    this.scale.maxRawValue = this.minVisibleValueInTiles();

    this.scale.minValue = this.scale.minRawValue;
    this.scale.maxValue = this.scale.maxRawValue;

    this.drawTile(tile);
  }

  drawTile(tile) {
    if (!tile.graphics) {
      return;
    }

    const graphics = tile.graphics;
    const RECT_HEIGHT = 6;
    const MIN_RECT_WIDTH = 4;

    graphics.clear();

    this.valueScale = scaleLog()
      .domain([this.minValue() + 0.01, this.maxValue()])
      .range([this.dimensions[1] - RECT_HEIGHT / 2, RECT_HEIGHT / 2]);

    const fill = colorToHex('black');

    graphics.lineStyle(1, fill, 0.3);
    graphics.beginFill(fill, 0.3);

    this.drawAxis(this.valueScale);

    tile.tileData.forEach((td) => {
      const fields = td.fields;

      const chrOffset = +td.chrOffset;

      const genomeStart = +fields[1] + chrOffset;
      const genomeEnd = +fields[2] + chrOffset;
      const value = +fields[3];

      const startPos = this._xScale(genomeStart);
      const endPos = this._xScale(genomeEnd);

      const width = Math.max(endPos - startPos, MIN_RECT_WIDTH);
      const midY = this.valueScale(value);
      const midX = (endPos + startPos) / 2;

      graphics.drawRect(
        midX - width / 2,
        midY - RECT_HEIGHT / 2,
        width,
        RECT_HEIGHT,
      );
    });
  }

  minVisibleValueInTiles() {
    let visibleAndFetchedIds = this.visibleAndFetchedIds();

    if (visibleAndFetchedIds.length === 0) {
      visibleAndFetchedIds = Object.keys(this.fetchedTiles);
    }

    const min = Math.min.apply(
      null,
      visibleAndFetchedIds.map(
        (x) =>
          +Math.min(
            ...this.fetchedTiles[x].tileData
              .filter((y) => !Number.isNaN(y.fields[3]))
              .map((y) => +y.fields[3]),
          ),
      ),
    );

    return min;
  }

  maxVisibleValueInTiles() {
    let visibleAndFetchedIds = this.visibleAndFetchedIds();

    if (visibleAndFetchedIds.length === 0) {
      visibleAndFetchedIds = Object.keys(this.fetchedTiles);
    }

    const max = Math.max.apply(
      null,
      visibleAndFetchedIds.map(
        (x) =>
          +Math.max(
            ...this.fetchedTiles[x].tileData
              .filter((y) => !Number.isNaN(y.fields[3]))
              .map((y) => +y.fields[3]),
          ),
      ),
    );

    return max;
  }
}

export default ValueIntervalTrack;
