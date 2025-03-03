// @ts-nocheck
import TiledPixiTrack from './TiledPixiTrack';

import { tileProxy } from './services';

import { colorToHex } from './utils';

class SquareMarkersTrack extends TiledPixiTrack {
  constructor(context, options) {
    super(context, options);

    this.drawnRects = new Set();
  }

  /*
   * The local tile identifier
   */
  tileToLocalId(tile) {
    // tile contains [zoomLevel, xPos, yPos]
    return `${tile.join('.')}`;
  }

  /**
   * The tile identifier used on the server
   */
  tileToRemoteId(tile) {
    // tile contains [zoomLevel, xPos, yPos]
    return `${tile.join('.')}`;
  }

  localToRemoteId(remoteId) {
    const idParts = remoteId.split('.');
    return idParts.slice(0, idParts.length - 1).join('.');
  }

  calculateZoomLevel() {
    const xZoomLevel = tileProxy.calculateZoomLevel(
      this._xScale,
      this.tilesetInfo.min_pos[0],
      this.tilesetInfo.max_pos[0],
    );
    const yZoomLevel = tileProxy.calculateZoomLevel(
      this._xScale,
      this.tilesetInfo.min_pos[1],
      this.tilesetInfo.max_pos[1],
    );

    let zoomLevel = Math.max(xZoomLevel, yZoomLevel);
    zoomLevel = Math.min(zoomLevel, this.maxZoom);

    return zoomLevel;
  }

  setVisibleTiles(tilePositions) {
    /**
     * Set which tiles are visible right now.
     *
     * @param tiles: A set of tiles which will be considered the currently visible
     * tile positions.
     */
    this.visibleTiles = tilePositions.map((x) => ({
      tileId: this.tileToLocalId(x),
      remoteId: this.tileToRemoteId(x),
    }));

    this.visibleTileIds = new Set(this.visibleTiles.map((x) => x.tileId));
  }

  calculateVisibleTiles(mirrorTiles = true) {
    // if we don't know anything about this dataset, no point
    // in trying to get tiles
    if (!this.tilesetInfo) {
      return;
    }

    this.zoomLevel = this.calculateZoomLevel();
    // this.zoomLevel = 0;

    this.xTiles = tileProxy.calculateTiles(
      this.zoomLevel,
      this._xScale,
      this.tilesetInfo.min_pos[0],
      this.tilesetInfo.max_pos[0],
      this.tilesetInfo.max_zoom,
      this.tilesetInfo.max_width,
    );

    this.yTiles = tileProxy.calculateTiles(
      this.zoomLevel,
      this._yScale,
      this.tilesetInfo.min_pos[1],
      this.tilesetInfo.max_pos[1],
      this.tilesetInfo.max_zoom,
      this.tilesetInfo.max_width,
    );

    const rows = this.xTiles;
    const cols = this.yTiles;
    const zoomLevel = this.zoomLevel;

    // if we're mirroring tiles, then we only need tiles along the diagonal
    const tiles = [];

    // calculate the ids of the tiles that should be visible
    for (let i = 0; i < rows.length; i++) {
      for (let j = 0; j < cols.length; j++) {
        const newTile = [zoomLevel, rows[i], cols[j]];

        tiles.push(newTile);
      }
    }

    //
    this.setVisibleTiles(tiles);
  }

  initTile(tile) {
    /**
     * Create whatever is needed to draw this tile.
     */
    // this.drawTile(tile);
  }

  destroyTile(tile, graphics) {}

  draw() {
    this.drawnRects.clear();

    super.draw();
  }

  drawTile(tile) {
    if (!tile.graphics) {
      return;
    }

    // console.log('tile:', tile);
    // console.log('Id2DTiled drawTile...');
    const graphics = tile.graphics;

    graphics.clear();

    const fill = colorToHex('green');

    graphics.lineStyle(1, 0x0000ff, 1);
    graphics.beginFill(fill, 0.8);
    graphics.alpha = 0.5;

    // line needs to be scaled down so that it doesn't become huge
    for (const td of tile.tileData) {
      const startX = this._xScale(td.xStart);
      const endX = this._xScale(td.xEnd);

      const startY = this._yScale(td.yStart);
      const endY = this._yScale(td.yEnd);

      const uid = td.uid;

      if (this.drawnRects.has(uid)) {
        continue;
      }
      // we've already drawn this rectangle in another tile

      this.drawnRects.add(uid);

      const MIN_WIDTH = 6;
      const MIN_HEIGHT = 6;

      let width = endY - startY;
      let height = endX - startX;

      // we're going to draw stuff relative to the center of this marker so
      // that if we have to draw a bigger outline
      const centerX = (startX + endX) / 2;
      const centerY = (startY + endY) / 2;

      if (width < MIN_WIDTH) {
        width = MIN_WIDTH;
      }
      if (height < MIN_HEIGHT) {
        height = MIN_HEIGHT;
      }

      graphics.drawRect(
        centerX - width / 2,
        centerY - height / 2,
        width,
        height,
      );
    }
  }

  setPosition(newPosition) {
    super.setPosition(newPosition);

    this.pMain.position.y = this.position[1];
    this.pMain.position.x = this.position[0];
  }

  zoomed(newXScale, newYScale) {
    this.xScale(newXScale);
    this.yScale(newYScale);

    this.refreshTiles();

    this.draw();
  }
}

export default SquareMarkersTrack;
