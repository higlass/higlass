// @ts-nocheck
import { scaleBand } from 'd3-scale';
import { range } from 'd3-array';
import { segmentsToRows } from './utils';

import HorizontalTiled1DPixiTrack from './HorizontalTiled1DPixiTrack';

class CNVIntervalTrack extends HorizontalTiled1DPixiTrack {
  constructor(context, options) {
    super(context, options);

    this.seen = new Set();
    this.pMain = this.pMobile;

    this.rows = [];
  }

  uid(item) {
    return item[item.length - 2];
  }

  segmentOverlap(segment1, segment2) {}

  drawAll(allTileData) {
    this.pMain.clear();
    const seen = new Set();

    const segments = allTileData
      .map((x) => {
        if (seen.has(this.uid(x))) {
          return null;
        }
        seen.add(this.uid(x));
        // console.log('length:', +x[2] - +x[1], 'id', tile.tileId)
        return {
          from: +x[1],
          to: +x[2],
          type: x[4],
          uid: this.uid(x),
        };
      })
      .filter((x) => x); // filter out null values

    const rows = segmentsToRows(segments);
    this.rows = rows;

    this.draw();
  }

  draw() {
    const rows = this.rows;

    if (!rows) {
      return;
    }

    const valueScale = scaleBand()
      .range([0, this.dimensions[1]])
      .padding(0.1)
      .domain(range(0, this.maxRows())); // draw one away from the center
    // .domain(range(0, 10));  // draw one away from the center

    const graphics = this.pMain;

    graphics.clear();

    graphics.lineStyle(1, 0x0000ff, 0);
    graphics.beginFill(0xff700b, 0.8);

    for (let i = 0; i < rows.length; i++) {
      for (let j = 0; j < rows[i].length; j++) {
        const interval = rows[i][j];

        const x1 = this._refXScale(interval.from);
        const x2 = this._refXScale(interval.to);

        const y1 = valueScale(i);
        const y2 = y1 + valueScale.bandwidth();

        const width = x2 - x1;
        const height = y2 - y1;

        graphics.drawRect(x1, y1, width, height);
      }
    }
  }

  allTilesLoaded() {
    const visibleAndFetchedIds = this.visibleAndFetchedIds();

    const tileDatas = visibleAndFetchedIds.map(
      (x) => this.fetchedTiles[x].tileData.discrete,
    );
    const allTileData = [].concat(...tileDatas);

    this.drawAll(allTileData);
  }

  initTile(tile) {}

  maxRows() {
    return this.rows.length;
  }

  updateTile(tile) {
    // this.redraw(tile);
  }

  destroyTile(tile) {
    tile.tileData.discrete.forEach((x) => {
      const uid = x[x.length - 2];

      if (this.seen.has(uid)) {
        this.seen.delete(uid);
      }
    });
  }

  drawTile(tile) {}
}

export default CNVIntervalTrack;
