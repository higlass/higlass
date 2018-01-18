import * as PIXI from 'pixi.js';
import HeatmapTiledPixiTrack from './HeatmapTiledPixiTrack';

class Id2DTiledPixiTrack extends HeatmapTiledPixiTrack {
  constructor(scene, dataConfig, handleTilesetInfoReceived, options, animate) {
    super(scene, dataConfig, handleTilesetInfoReceived, options, animate);

  }

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

    const graphics = tile.graphics;
    tile.textGraphics = new PIXI.Graphics();
    // tile.text = new PIXI.Text(tile.tileData.zoomLevel + "/" + tile.tileData.tilePos.join('/') + '/' + tile.mirrored,

    if (tile.mirrored) {
      // mirrored tiles have their x and y coordinates reversed
      tile.text = new PIXI.Text(`${tile.tileData.zoomLevel}/${[tile.tileData.tilePos[1], tile.tileData.tilePos[0]].join('/')}`,
        { fontFamily: 'Arial', fontSize: 48, fill: 0xff1010, align: 'center' });
    } else {
      tile.text = new PIXI.Text(`${tile.tileData.zoomLevel}/${tile.tileData.tilePos.join('/')}`,
        { fontFamily: 'Arial', fontSize: 48, fill: 0xff1010, align: 'center' });
    }

    // tile.text.y = 100;
    tile.textGraphics.addChild(tile.text);

    tile.text.anchor.x = 0.5;
    tile.text.anchor.y = 0.5;


    graphics.addChild(tile.textGraphics);

    this.drawTile(tile, graphics);
  }

  destroyTile(tile, graphics) {

  }

  drawTile(tile) {
    if (!tile.graphics) { return; }

    // console.log('Id2DTiled drawTile...', tile);
    const graphics = tile.graphics;
    const { tileX, tileY, tileWidth, tileHeight } = this.getTilePosAndDimensions(tile.tileData.zoomLevel,
      tile.tileData.tilePos);

    // console.log('tileX:', tileX, 'tileY:', tileY, 'tileWidth:', tileWidth, 'tileHeight:', tileHeight);

    // the text needs to be scaled down so that it doesn't become huge
    // when we zoom in
    const tSX = 1 / ((this._xScale(1) - this._xScale(0)) / (this._refXScale(1) - this._refXScale(0)));
    const tSY = 1 / ((this._yScale(1) - this._yScale(0)) / (this._refYScale(1) - this._refYScale(0)));

    tile.text.scale.x = tSX;
    tile.text.scale.y = tSY;

    // console.log('tSX:', tSX, 'tSY:',tSY);

    graphics.clear();

    graphics.lineStyle(4 * tSX, 0x0000FF, 1);
    graphics.beginFill(0xFF700B, 0.4);
    graphics.alpha = 0.5;

    // line needs to be scaled down so that it doesn't become huge


    // fun tile positioning when it's mirrored, except this is just a rectangle
    // that doesn't need to be rotated so it's easy
    if (tile.mirrored) {
      const tileScaledWidth = this._refXScale(tileY + tileWidth) - this._refXScale(tileY);
      const tileScaledHeight = this._refYScale(tileX + tileWidth) - this._refYScale(tileX);

      // add tileScaledHeight / 2 and tileScaledWidth / 2 to center the text on the tile
      tile.textGraphics.position.x = this._refXScale(tileY) + tileScaledWidth / 2;
      tile.textGraphics.position.y = this._refYScale(tileX) + tileScaledHeight / 2;

      graphics.drawRect(this._refXScale(tileY), this._refYScale(tileX), tileScaledWidth, tileScaledHeight);
    } else {
      const tileScaledWidth = this._refXScale(tileX + tileWidth) - this._refXScale(tileX);
      const tileScaledHeight = this._refYScale(tileY + tileWidth) - this._refYScale(tileY);

      // add tileScaledHeight / 2 and tileScaledWidth / 2 to center the text on the tile
      tile.textGraphics.position.x = this._refXScale(tileX) + tileScaledWidth / 2;
      tile.textGraphics.position.y = this._refYScale(tileY) + tileScaledHeight / 2;

      const x = this._refXScale(tileX);
      const y = this._refYScale(tileY);

      graphics.drawRect(this._refXScale(tileX), this._refYScale(tileY), tileScaledWidth, tileScaledHeight);
    }
  }

  fetchNewTiles(toFetch) {
    // no real fetching involved... we just need to display the data
    toFetch.map((x) => {
      const key = x.remoteId;
      const keyParts = key.split('.');

      const data = {
        zoomLevel: keyParts[0],
        tilePos: keyParts.slice(1, keyParts.length).map(x => +x),
      };

      this.fetchedTiles[x.tileId] = x;
      this.fetchedTiles[x.tileId].tileData = data;

      // since we're not actually fetching remote data, we can easily
      // remove these tiles from the fetching list
      if (this.fetching.has(x.remoteId)) { this.fetching.delete(x.remoteId); }
    });

    this.synchronizeTilesAndGraphics();
  }
}

export default Id2DTiledPixiTrack;
