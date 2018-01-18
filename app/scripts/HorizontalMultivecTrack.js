import HeatmapTiledPixiTrack from './HeatmapTiledPixiTrack';

import { tileProxy } from './services';


export default class HorizontalMultivecTrack extends HeatmapTiledPixiTrack {
  tileDataToCanvas(pixData) {
    const canvas = document.createElement('canvas');

    canvas.width = this.tilesetInfo.shape[0];
    canvas.height = this.tilesetInfo.shape[1];

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pix = new ImageData(pixData, canvas.width, canvas.height);

    ctx.putImageData(pix, 0, 0);

    return canvas;
  }

  setSpriteProperties(sprite, zoomLevel, tilePos, mirrored) {
    const { tileX, tileY, tileWidth, tileHeight } = this.getTilePosAndDimensions(zoomLevel,
      tilePos,
      this.tilesetInfo.tile_size);

    const tileEndX = tileX + tileWidth;
    const tileEndY = tileY + tileHeight;

    sprite.width = this._refXScale(tileEndX) - this._refXScale(tileX);
    //sprite.height = this.tilesetInfo.shape[1]; //this._refYScale(tileEndY) - this._refYScale(tileY);
    sprite.height = this.dimensions[1];

    sprite.x = this._refXScale(tileX);
    sprite.y = 0;
  }

  zoomed(newXScale, newYScale, k, tx, ty) {
    super.zoomed(newXScale, newYScale);

    this.pMain.position.x = tx; // translateX;
    this.pMain.position.y = this.position[1]; // translateY;

    this.pMain.scale.x = k; // scaleX;
    this.pMain.scale.y = 1; // scaleY;

    this.drawColorbar();
  }

  calculateVisibleTiles(mirrorTiles = true) {
    // if we don't know anything about this dataset, no point
    // in trying to get tiles
    if (!this.tilesetInfo) { return; }

    this.zoomLevel = this.calculateZoomLevel();
    console.log('zoomLevel:', this.zoomLevel);

    let sortedResolutions = this.tilesetInfo.resolutions.map(x => +x).sort((a,b) => b-a)

    this.xTiles = tileProxy.calculateTilesFromResolution(
      sortedResolutions[this.zoomLevel],
      this._xScale,
      this.tilesetInfo.min_pos[0],
      null,
      this.tilesetInfo.tile_size);
    //console.log('res', sortedResolutions[this.zoomLevel]);
    //console.log('this.xTiles:', this.xTiles);

    const tiles = this.xTiles.map(x => [this.zoomLevel, x]);
    console.log('tiles:', tiles);

    this.setVisibleTiles(tiles);
  }

  calculateZoomLevel() {
    console.log('tilesetInfo:', this.tilesetInfo);

    let minX = this.tilesetInfo.min_pos[0];

    let zoomIndexX = tileProxy.calculateZoomLevelFromResolutions(this.tilesetInfo.resolutions, this._xScale, minX);

    return zoomIndexX;
  }

  tileToLocalId(tile) {
    /*
     * The local tile identifier
     */

    // tile contains [zoomLevel, xPos, yPos]
    if (tile.dataTransform && tile.dataTransform != 'default') { return `${tile.join('.')}.${tile.mirrored}.${tile.dataTransform}`; }
    return `${tile.join('.')}.${tile.mirrored}`;
  }

  tileToLocalId(tile) {
    /*
         * The local tile identifier
         */

    // tile contains [zoomLevel, xPos]
    return `${tile.join('.')}`;
  }

  tileToRemoteId(tile) {
    /**
         * The tile identifier used on the server
         */

    // tile contains [zoomLevel, xPos]
    return `${tile.join('.')}`;
  }
}
