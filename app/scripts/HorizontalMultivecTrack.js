import { brushY } from 'd3-brush';
import { scaleLinear, scaleLog } from 'd3-scale';
import { format } from 'd3-format';
import { select, selectAll, clientPoint } from 'd3-selection';
import * as PIXI from 'pixi.js';

import { TiledPixiTrack } from './TiledPixiTrack';
import { HeatmapTiledPixiTrack } from './HeatmapTiledPixiTrack.js';
import { AxisPixi } from './AxisPixi';

import { tileProxy } from './services';

import { colorDomainToRgbaArray, colorToHex } from './utils';

import { heatedObjectMap } from './configs';

const COLORBAR_MAX_HEIGHT = 200;
const COLORBAR_WIDTH = 10;
const COLORBAR_LABELS_WIDTH = 40;
const COLORBAR_MARGIN = 10;
const BRUSH_WIDTH = COLORBAR_MARGIN;
const BRUSH_HEIGHT = 4;
const BRUSH_COLORBAR_GAP = 1;
const BRUSH_MARGIN = 4;
const SCALE_LIMIT_PRECISION = 5;
const BINS_PER_TILE=256;


export default class HorizontalMultivecTrack extends HeatmapTiledPixiTrack {
  constructor(
    scene,
    dataConfig,
    handleTilesetInfoReceived,
    options,
    animate,
    svgElement,
    onValueScaleChanged,
    onTrackOptionsChanged,
  ) {
    /**
     * @param scene: A PIXI.js scene to draw everything to.
     * @param server: The server to pull tiles from.
     * @param uid: The data set to get the tiles from the server
     */
    super(
      scene,
      dataConfig,
      handleTilesetInfoReceived,
      options,
      animate,
      svgElement,
      onValueScaleChanged,
      onTrackOptionsChanged,
    );
  }

  tileDataToCanvas(pixData) {
    const canvas = document.createElement('canvas');

    canvas.width = this.tilesetInfo.shape[0];
    canvas.height = this.tilesetInfo.shape[1];

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    console.log('pixData:', pixData);
    console.log('canvas.width:', canvas.width, 'canvas.height', canvas.height);

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

    console.log('sprite.x:', sprite.x);
    /*
    console.log('sprite.y:', sprite.y);
    console.log('sprite.height:', sprite.height);
    */
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

  /**
   * Create the local tile identifier, which be used with the
   * tile stores in TiledPixiTrack
   *
   * @param {array} tile: [zoomLevel, xPos]
   */
  tileToLocalId(tile) {
    return `${tile.join('.')}`;
  }

  /** 
   * Create the remote tile identifier, which will be used to identify the
   * tile on the server
   *
   * @param {array} tile: [zoomLevel, xPos]
   */
  tileToRemoteId(tile) {
    return `${tile.join('.')}`;
  }

  /**
   * Calculate the tile position at the given track position
   * 
   * @param {Number} trackX: The track's X position
   * @param {Number} trackY: The track's Y position
   *
   * @return {array} [zoomLevel, tilePos]
   */
  getTilePosAtPosition(trackX, trackY) {
    const zoomLevel = this.calculateZoomLevel();

    // the width of the tile in base pairs
    const tileWidth = tileProxy.calculateTileWidth(this.tilesetInfo, zoomLevel, BINS_PER_TILE);

    // the position of the tile containing the query position
    const tilePos = this._xScale.invert(trackX) / tileWidth;

    return [zoomLevel, Math.floor(tilePos)];
  }

  /**
   * Return the data currently visible at position X and Y
   *
   * @param {Number} trackX: The x position relative to the track's start and end
   * @param {Number} trakcY: The y position relative to the track's start and end
   */
  getVisibleData(trackX, trackY) {
    const zoomLevel = this.calculateZoomLevel();

    // the width of the tile in base pairs
    const tileWidth = tileProxy.calculateTileWidth(this.tilesetInfo, zoomLevel, BINS_PER_TILE);

    // the position of the tile containing the query position
    const tilePos = this._xScale.invert(trackX) / tileWidth;

    // the position of query within the tile
    const posInTileX = BINS_PER_TILE * (tilePos - Math.floor(tilePos));
    const posInTileY = (trackY / this.dimensions[1])  * this.tilesetInfo.shape[1];

    const tileId = this.tileToLocalId([zoomLevel, Math.floor(tilePos)])
    const fetchedTile = this.fetchedTiles[tileId];

    // console.log('tileId:', tileId);
    // console.log('vaft:', this.visibleAndFetchedTiles());

    let value = '';

    if (fetchedTile) {
      /*
      const a = rangeQuery2d(fetchedTile.tileData.dense,
        this.tilesetInfo.shape[0],
        this.tilesetInfo.shape[1],
        [Math.floor(posInTileX), Math.floor(posInTileX)],
        [posInTileY, posInTileY],
      */
      console.log('fetchedTile', fetchedTile);
      const index = this.tilesetInfo.shape[1] * Math.floor(posInTileY) + Math.floor(posInTileX);
      value = format(".3f")(fetchedTile.tileData.dense[index]);
    }

    console.log('trackX:', trackX, 'tileWidth:', tileWidth, 'tilePos: ', tilePos, posInTileX);
    return `${value}`;
  }

    /**
     * Get some information to display when the mouse is over this
     * track
     *
     * @param {Number} trackX: the x position of the mouse over the track
     * @param {Number} trackY: the y position of the mouse over the track
     *
     * @return {string}: A HTML string containing the information to display
     *
     */
  getMouseOverHtml(trackX, trackY) {
    const tilePos = this.getTilePosAtPosition(trackX, trackY);

    let output = "Data value: " + this.getVisibleData(trackX, trackY) + "</br>";
    output += `Zoom level: ${tilePos[0]} tile position: ${tilePos[1]}`;

    return output;
  }
}
