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

  setSpriteProperties(sprite, zoomLevel, tilePos) {
    const { tileX, tileWidth } = this.getTilePosAndDimensions(zoomLevel,
      tilePos,
      this.tilesetInfo.tile_size);

    const tileEndX = tileX + tileWidth;

    sprite.width = this._refXScale(tileEndX) - this._refXScale(tileX);
    sprite.height = this.dimensions[1];

    sprite.x = this._refXScale(tileX);
    sprite.y = 0;
  }

  zoomed(newXScale, newYScale, k, tx) {
    super.zoomed(newXScale, newYScale);

    this.pMain.position.x = tx; // translateX;
    this.pMain.position.y = this.position[1]; // translateY;

    this.pMain.scale.x = k; // scaleX;
    this.pMain.scale.y = 1; // scaleY;

    this.drawColorbar();
  }

  calculateVisibleTiles() {
    // if we don't know anything about this dataset, no point
    // in trying to get tiles
    if (!this.tilesetInfo) { return; }

    this.zoomLevel = this.calculateZoomLevel();

    const sortedResolutions = this.tilesetInfo.resolutions
      .map(x => +x).sort((a, b) => b - a);

    this.xTiles = tileProxy.calculateTilesFromResolution(
      sortedResolutions[this.zoomLevel],
      this._xScale,
      this.tilesetInfo.min_pos[0],
      null,
      this.tilesetInfo.tile_size);

    const tiles = this.xTiles.map(x => [this.zoomLevel, x]);

    this.setVisibleTiles(tiles);
  }

  calculateZoomLevel() {
    return tileProxy.calculateZoomLevelFromResolutions(
      this.tilesetInfo.resolutions, this._xScale, this.tilesetInfo.min_pos[0]
    );
  }

  /*
   * The local tile identifier.
   *
   * tile contains [zoomLevel, xPos, yPos]
   */
  tileToLocalId(tile) {
    if (tile.dataTransform && tile.dataTransform !== 'default') {
      return `${tile.join('.')}.${tile.mirrored}.${tile.dataTransform}`;
    }

    return `${tile.join('.')}.${tile.mirrored}`;
  }

  tileToRemoteId(tile) {
    /**
         * The tile identifier used on the server
         */

    // tile contains [zoomLevel, xPos]
    return `${tile.join('.')}`;
  }
}
