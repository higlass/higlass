import HeatmapTiledPixiTrack from './HeatmapTiledPixiTrack';

// Configs
import { GLOBALS } from './configs';

export function drawTile(tile) {
  if (!tile.graphics) {
    return;
  }

  // console.log('Id2DTiled drawTile...', tile);
  const graphics = tile.graphics;
  const { tileX, tileY, tileWidth } = this.getTilePosAndDimensions(
    tile.tileData.zoomLevel,
    tile.tileData.tilePos,
  );

  // console.log('tileX:', tileX, 'tileY:', tileY, 'tileWidth:', tileWidth);

  // the text needs to be scaled down so that it doesn't become huge
  // when we zoom in
  tile.drawnAtScale = this._xScale.copy();

  const tSX =
    1 /
    ((this._xScale(1) - this._xScale(0)) /
      (this._refXScale(1) - this._refXScale(0)));
  const tSY =
    1 /
    ((this._yScale(1) - this._yScale(0)) /
      (this._refYScale(1) - this._refYScale(0)));

  tile.text.scale.x = tSX;
  tile.text.scale.y = tSY;

  const tilePixelWidth = this._xScale(tileWidth) - this._xScale(0);

  // make sure the text's size is always drawn at the same size
  tile.textGraphics.scale.x = tilePixelWidth / 256;
  tile.textGraphics.scale.y = tilePixelWidth / 256;

  graphics.clear();

  graphics.lineStyle(4 * tSX, 0x0000ff, 1);
  graphics.beginFill(0xff700b, 0.4);
  graphics.alpha = 0.5;

  // line needs to be scaled down so that it doesn't become huge

  // fun tile positioning when it's mirrored, except this is just a rectangle
  // that doesn't need to be rotated so it's easy
  if (tile.mirrored) {
    const tileScaledWidth =
      this._refXScale(tileY + tileWidth) - this._refXScale(tileY);
    const tileScaledHeight =
      this._refYScale(tileX + tileWidth) - this._refYScale(tileX);

    // add tileScaledHeight / 2 and tileScaledWidth / 2 to center the text on the tile
    tile.textGraphics.position.x = this._refXScale(tileY) + tileScaledWidth / 2;
    tile.textGraphics.position.y =
      this._refYScale(tileX) + tileScaledHeight / 2;

    graphics.drawRect(
      this._refXScale(tileY),
      this._refYScale(tileX),
      tileScaledWidth,
      tileScaledHeight,
    );
  } else {
    const tileScaledWidth =
      this._refXScale(tileX + tileWidth) - this._refXScale(tileX);
    const tileScaledHeight =
      this._refYScale(tileY + tileWidth) - this._refYScale(tileY);

    // add tileScaledHeight / 2 and tileScaledWidth / 2 to center the text on the tile
    tile.textGraphics.position.x = this._refXScale(tileX) + tileScaledWidth / 2;
    tile.textGraphics.position.y =
      this._refYScale(tileY) + tileScaledHeight / 2;

    graphics.drawRect(
      this._refXScale(tileX),
      this._refYScale(tileY),
      tileScaledWidth,
      tileScaledHeight,
    );
  }
}

export function initTile(tile) {
  const graphics = tile.graphics;
  tile.textGraphics = new GLOBALS.PIXI.Graphics();

  if (tile.mirrored) {
    // mirrored tiles have their x and y coordinates reversed
    tile.text = new GLOBALS.PIXI.Text(
      `${tile.tileData.zoomLevel}/${[
        tile.tileData.tilePos[1],
        tile.tileData.tilePos[0],
      ].join('/')}`,
      {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xff1010,
        align: 'center',
      },
    );
  } else {
    tile.text = new GLOBALS.PIXI.Text(
      `${tile.tileData.zoomLevel}/${tile.tileData.tilePos.join('/')}`,
      {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xff1010,
        align: 'center',
      },
    );
  }

  // tile.text.y = 100;
  tile.textGraphics.addChild(tile.text);

  tile.text.anchor.x = 0.5;
  tile.text.anchor.y = 0.5;

  graphics.addChild(tile.textGraphics);
}

class Id2DTiledPixiTrack extends HeatmapTiledPixiTrack {
  areAllVisibleTilesLoaded() {
    // we don't need to wait for any tiles to load before
    // drawing
    //
    return true;
  }

  initTile(tile) {
    /**
     * Create whatever is needed to draw this tile.
     */

    initTile.bind(this)(tile);
    this.drawTile(tile);
  }

  destroyTile(tile, graphics) {}

  drawTile(tile) {
    drawTile.bind(this)(tile);
  }

  fetchNewTiles(toFetch) {
    // no real fetching involved... we just need to display the data
    toFetch.forEach((x) => {
      const key = x.remoteId;
      const keyParts = key.split('.');

      const data = {
        zoomLevel: keyParts[0],
        tilePos: keyParts.slice(1, keyParts.length).map((keyPart) => +keyPart),
      };

      this.fetchedTiles[x.tileId] = x;
      this.fetchedTiles[x.tileId].tileData = data;

      // since we're not actually fetching remote data, we can easily
      // remove these tiles from the fetching list
      if (this.fetching.has(x.remoteId)) {
        this.fetching.delete(x.remoteId);
      }
    });

    this.synchronizeTilesAndGraphics();
  }
}

export default Id2DTiledPixiTrack;
