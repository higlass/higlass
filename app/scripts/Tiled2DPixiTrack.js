import TiledPixiTrack from './TiledPixiTrack';

import { tileProxy } from './services';
import indexOfMax from './utils/index-of-max.js'

export class Tiled2DPixiTrack extends TiledPixiTrack {
  tileToLocalId(tile) {
    /*
     * The local tile identifier
     */

    // tile contains [zoomLevel, xPos, yPos]
    if (tile.dataTransform && tile.dataTransform != 'default') { return `${this.tilesetUid}.${tile.join('.')}.${tile.mirrored}.${tile.dataTransform}`; }
    return `${this.tilesetUid}.${tile.join('.')}.${tile.mirrored}`;
  }

  tileToRemoteId(tile) {
    /**
     * The tile identifier used on the server
     */

    // tile contains [zoomLevel, xPos, yPos]
    if (tile.dataTransform && tile.dataTransform != 'default') { return `${this.tilesetUid}.${tile.join('.')}.${tile.dataTransform}`; }
    return `${this.tilesetUid}.${tile.join('.')}`;
  }

  localToRemoteId(remoteId) {
    const idParts = remoteId.split('.');
    return idParts.slice(0, idParts.length - 1).join('.');
  }

  calculateZoomLevel() {
    let minX = this.tilesetInfo.min_pos[0];
    let maxX = this.tilesetInfo.max_pos[0];

    if (this.tilesetInfo.resolutions) {
      const sortedResolutions = this.tilesetInfo.resolutions.map(x => +x).sort((a,b) => b-a)

      const trackWidth = this._xScale.range()[1] - this._xScale.range()[0];
      console.log('trackWidth:', trackWidth, 'scale:', this._xScale.domain()[1] - this._xScale.domain()[0]);

      let binsDisplayed = sortedResolutions.map(r => (this._xScale.domain()[1] - this._xScale.domain()[0]) / r)
      let binsPerPixel = binsDisplayed.map(b => b / trackWidth);

      console.log('trackWidth:', trackWidth);
      console.log('resolutions:', sortedResolutions);
      console.log('binsDisplayed:', binsDisplayed);
      console.log('binsPerPixel:', binsPerPixel);

      // we're going to show the highest resolution that requires more than one pixel per bin
      let displayableBinsPerPixel = binsPerPixel.filter(b => b < 1);

      if (displayableBinsPerPixel.length == 0)
        return 0;

      let zoomIndex = binsPerPixel.indexOf(displayableBinsPerPixel[displayableBinsPerPixel.length-1]);
      console.log('displayableBinsPerPixel', displayableBinsPerPixel);
      console.log('zoomIndex:', zoomIndex);

      return zoomIndex;
    }

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

  calculateVisibleTiles(mirrorTiles = true) {
    // if we don't know anything about this dataset, no point
    // in trying to get tiles
    if (!this.tilesetInfo) { return; }

    this.zoomLevel = this.calculateZoomLevel();

    // this.zoomLevel = 0;
    if (this.tilesetInfo.resolutions) {
      const sortedResolutions = this.tilesetInfo.resolutions.map(x => +x).sort((a,b) => b-a)
      this.xTiles = tileProxy.calculateTilesFromResolution(
        sortedResolutions[this.zoomLevel], 
        this._xScale,
        this.tilesetInfo.min_pos[0], this.tilesetInfo.max_pos[0]);
      console.log('this.xTiles:', this.xTiles);
    } else {
      this.xTiles = tileProxy.calculateTiles(this.zoomLevel, this._xScale,
        this.tilesetInfo.min_pos[0],
        this.tilesetInfo.max_pos[0],
        this.tilesetInfo.max_zoom,
        this.tilesetInfo.max_width);

      this.yTiles = tileProxy.calculateTiles(this.zoomLevel, this._yScale,
        this.tilesetInfo.min_pos[1],
        this.tilesetInfo.max_pos[1],
        this.tilesetInfo.max_zoom,
        this.tilesetInfo.max_width);
    }

    console.log('this.xTiles', this.xTiles);

    const rows = this.xTiles;
    const cols = this.yTiles;
    const zoomLevel = this.zoomLevel;

    // if we're mirroring tiles, then we only need tiles along the diagonal
    const tiles = [];
    // console.log('this.options:', this.options);

    // calculate the ids of the tiles that should be visible
    for (let i = 0; i < rows.length; i++) {
      for (let j = 0; j < cols.length; j++) {
        if (mirrorTiles) {
          if (rows[i] >= cols[j]) {
            // if we're in the upper triangular part of the matrix, then we need to load
            // a mirrored tile
            const newTile = [zoomLevel, cols[j], rows[i]];
            newTile.mirrored = true;
            newTile.dataTransform = this.options.dataTransform ?
              this.options.dataTransform : 'default';
            tiles.push(newTile);
          } else {
            // otherwise, load an original tile
            const newTile = [zoomLevel, rows[i], cols[j]];
            newTile.mirrored = false;
            newTile.dataTransform = this.options.dataTransform ?
              this.options.dataTransform : 'default';
            tiles.push(newTile);
          }

          if (rows[i] == cols[j]) {
            // on the diagonal, load original tiles
            const newTile = [zoomLevel, rows[i], cols[j]];
            newTile.mirrored = false;
            newTile.dataTransform = this.options.dataTransform ?
              this.options.dataTransform : 'default';
            tiles.push(newTile);
          }
        } else {
          const newTile = [zoomLevel, rows[i], cols[j]];
          newTile.mirrored = false;
          newTile.dataTransform = this.options.dataTransform ?
            this.options.dataTransform : 'default';

          tiles.push(newTile);
        }
      }
    }

    this.setVisibleTiles(tiles);
  }


  getTilePosAndDimensions(zoomLevel, tilePos) {
    /**
         * Get the tile's position in its coordinate system.
         */
    let xTilePos = tilePos[0],
      yTilePos = tilePos[1];

    const totalWidth = this.tilesetInfo.max_width;
    const totalHeight = this.tilesetInfo.max_width;

    const minX = 0;
    const minY = 0;

    const tileWidth = totalWidth / Math.pow(2, zoomLevel);
    const tileHeight = totalHeight / Math.pow(2, zoomLevel);

    const tileX = minX + xTilePos * tileWidth;
    const tileY = minY + yTilePos * tileHeight;

    return { tileX,
      tileY,
      tileWidth,
      tileHeight };
  }


  zoomed(newXScale, newYScale, k, tx, ty) {
    super.zoomed(newXScale, newYScale);

    this.pMain.position.x = tx; // translateX;
    this.pMain.position.y = ty; // translateY;

    this.pMain.scale.x = k; // scaleX;
    this.pMain.scale.y = k; // scaleY;
  }

  updateTile(tile) {
    // no need to redraw this tile, usually


  }
}

export default Tiled2DPixiTrack;
