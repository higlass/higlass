import * as PIXI from 'pixi.js';

import { HeatmapTiledPixiTrack } from './HeatmapTiledPixiTrack';

// Services
import { tileProxy } from './services';

// Utils
import { colorDomainToRgbaArray } from './utils';

// Configs
import { HEATED_OBJECT_MAP } from './configs';

export class HorizontalHeatmapTrack extends HeatmapTiledPixiTrack {
  /**
   * @param scene: A PIXI.js scene to draw everything to.
   * @param server: The server to pull tiles from.
   * @param uid: The data set to get the tiles from the server
   */
  constructor(scene, server, uid, handleTilesetInfoReceived, options, animate) {
    super(scene, server, uid, handleTilesetInfoReceived, options, animate);

    this.pMain = this.pMobile;

    // [[255,255,255,0], [237,218,10,4] ...
    // a 256 element array mapping the values 0-255 to rgba values
    // not a d3 color scale for speed
    // this.colorScale = HEATED_OBJECT_MAP;
    this.colorScale = HEATED_OBJECT_MAP;

    if (options && options.colorRange) {
      this.colorScale = colorDomainToRgbaArray(options.colorRange);
    }
  }

  calculateZoomLevel() {
    const xZoomLevel = tileProxy.calculateZoomLevel(this._xScale,
      this.tilesetInfo.min_pos[0],
      this.tilesetInfo.max_pos[0]);
    const yZoomLevel = tileProxy.calculateZoomLevel(this._xScale,
      this.tilesetInfo.min_pos[1],
      this.tilesetInfo.max_pos[1]);

    let zoomLevel = Math.max(xZoomLevel, yZoomLevel);
    zoomLevel = Math.min(zoomLevel, this.maxZoom);

    if (this.options && this.options.maxZoom) {
      if (this.options.maxZoom >= 0) { zoomLevel = Math.min(this.options.maxZoom, zoomLevel); } else { console.error('Invalid maxZoom on track:', this); }
    }

    return zoomLevel;
  }

  calculateVisibleTiles() {
    // if we don't know anything about this dataset, no point
    // in trying to get tiles
    if (!this.tilesetInfo) { return; }

    this.zoomLevel = this.calculateZoomLevel();


    // this.zoomLevel = 0;
    const expandedXScale = this._xScale.copy();

    const xDomainWidth = this._xScale.domain()[1] - this._xScale.domain()[0];
    const xRangeWidth = this._xScale.range()[1] - this._xScale.range()[0];

    // we need to expand the domain of the X-scale because we are showing diagonal tiles.
    // to make sure the view is covered up the entire height, we need to expand by viewHeight * sqrt(2)
    // on each side
    expandedXScale.domain([this._xScale.invert(this._xScale.range()[0] - this.dimensions[1] * Math.sqrt(2)),
      this._xScale.invert(this._xScale.range()[1] + this.dimensions[1] * Math.sqrt(2))]);

    this.xTiles = tileProxy.calculateTiles(this.zoomLevel, expandedXScale,
      this.tilesetInfo.min_pos[0],
      this.tilesetInfo.max_pos[0],
      this.tilesetInfo.max_zoom,
      this.tilesetInfo.max_width);

    this.yTiles = tileProxy.calculateTiles(this.zoomLevel, expandedXScale,
      this.tilesetInfo.min_pos[0],
      this.tilesetInfo.max_pos[0],
      this.tilesetInfo.max_zoom,
      this.tilesetInfo.max_width);

    const rows = this.xTiles;
    const cols = this.yTiles;
    const zoomLevel = this.zoomLevel;

    const maxWidth = this.tilesetInfo.max_width;
    const tileWidth = maxWidth / Math.pow(2, zoomLevel);

    // if we're mirroring tiles, then we only need tiles along the diagonal
    const tiles = [];

    // calculate the ids of the tiles that should be visible
    for (let i = 0; i < rows.length; i++) {
      for (let j = i; j < cols.length; j++) {
        // the length between the bottom of the track and the bottom corner of the tile
        // draw it out to understand better!
        const tileBottomPosition = ((j - i) - 2) * (this._xScale(tileWidth) - this._xScale(0)) * Math.sqrt(2) / 2;

        if (tileBottomPosition > this.dimensions[1]) {
          // this tile won't be visible so we don't need to fetch it
          continue;
        }

        const newTile = [zoomLevel, rows[i], cols[j]];
        newTile.mirrored = false;
        newTile.dataTransform = this.options.dataTransform ?
          this.options.dataTransform : 'default';

        tiles.push(newTile);
      }
    }

    this.setVisibleTiles(tiles);
  }

  tileDataToCanvas(pixData) {
    const canvas = document.createElement('canvas');

    canvas.width = 256;
    canvas.height = 256;
    //

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pix = new ImageData(pixData, canvas.width, canvas.height);

    ctx.putImageData(pix, 0, 0);

    return canvas;
  }

  setSpriteProperties(sprite, zoomLevel, tilePos, mirrored) {
    const { tileX, tileY, tileWidth, tileHeight } = this.getTilePosAndDimensions(zoomLevel, tilePos);

    const tileEndX = tileX + tileWidth;
    const tileEndY = tileY + tileHeight;

    const spriteWidth = this._refXScale(tileEndX) - this._refXScale(tileX);
    const spriteHeight = this._refYScale(tileEndY) - this._refYScale(tileY);

    sprite.width = this._refXScale(tileEndX) - this._refXScale(tileX);
    sprite.height = this._refYScale(tileEndY) - this._refYScale(tileY);

    sprite.x = this._refXScale(tileX);
    sprite.y = this._refYScale(tileY);
  }

  renderTile(tile) {
    /**
         * Convert the raw tile data to a rendered array of values which can be represented as a sprite.
         *
         * @param tile: The data structure containing all the tile information. Relevant to
         *              this function are tile.tileData = {'dense': [...], ...}
         *              and tile.graphics
         */
    tileProxy.tileDataToPixData(tile,
      this.valueScale,
      this.valueScale.domain()[0], // used as a pseudocount to prevent taking the log of 0
      this.colorScale,
      (pixData) => {
        // the tileData has been converted to pixData by the worker script and needs to be loaded
        // as a sprite
        const graphics = tile.graphics;

        const canvas = this.tileDataToCanvas(pixData);

        let sprite = null;

        if (tile.tileData.zoomLevel == this.maxZoom) { sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(canvas, PIXI.SCALE_MODES.NEAREST)); } else { sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(canvas)); }

        tile.sprite = sprite;
        tile.canvas = canvas;

        this.setSpriteProperties(tile.sprite, tile.tileData.zoomLevel, tile.tileData.tilePos, tile.mirrored);

        graphics.pivot.x = this._refXScale(0);
        graphics.pivot.y = this._refYScale(0);
        graphics.scale.x = -1 / Math.sqrt(2);
        graphics.rotation = -3 * Math.PI / 4;
        graphics.scale.y = 1 / Math.sqrt(2);

        graphics.position.x = this._refXScale(0);
        graphics.position.y = 0;

        graphics.removeChildren();
        graphics.addChild(tile.sprite);
      });
  }

  refScalesChanged(refXScale, refYScale) {
    super.refScalesChanged(refXScale, refYScale);

    for (const uid in this.fetchedTiles) {
      const tile = this.fetchedTiles[uid];

      if (tile.sprite) {
        this.setSpriteProperties(tile.sprite, tile.tileData.zoomLevel, tile.tileData.tilePos, tile.mirrored);

        const graphics = tile.graphics;

        graphics.pivot.x = this._refXScale(0);
        graphics.pivot.y = this._refYScale(0);
        graphics.scale.x = -1 / Math.sqrt(2);
        graphics.rotation = -3 * Math.PI / 4;
        graphics.scale.y = 1 / Math.sqrt(2);

        graphics.position.x = this._refXScale(0);
        graphics.position.y = 0;
      } else {
        // console.log('skipping...', tile.tileId);
      }
    }
  }

  zoomed(newXScale, newYScale, k, tx, ty) {
    super.zoomed(newXScale, newYScale, k, tx, ty);
    super.draw();
    // console.log('zoomed this.pMain.position:', this.pMain.position.x, this.pMain.position.y, this.pMain.scale.x, this.pMain.scale.y);

    this.pMain.position.x = tx;
    this.pMain.position.y = this.position[1] + this.dimensions[1]; // translateY;

    this.pMain.scale.x = k; // scaleX;
    this.pMain.scale.y = k; // scaleY;

    if (this.options.oneDHeatmapFlipped) {
      this.pMain.scale.y = -k;
      this.pMain.position.y = this.position[1];
    }
  }
}

export default HorizontalHeatmapTrack;
