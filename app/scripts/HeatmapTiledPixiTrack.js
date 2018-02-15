import { brushY } from 'd3-brush';
import { scaleLinear, scaleLog } from 'd3-scale';
import { select, event } from 'd3-selection';
import * as PIXI from 'pixi.js';

import { TiledPixiTrack, getValueScale } from './TiledPixiTrack';
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


export class HeatmapTiledPixiTrack extends TiledPixiTrack {
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
      () => {
        console.log('valueScale changed');
        this.drawColorbar();
        onValueScaleChanged();
      },
    );

    this.onTrackOptionsChanged = onTrackOptionsChanged;

    // Graphics for drawing the colorbar
    this.pColorbarArea = new PIXI.Graphics();
    this.pMasked.addChild(this.pColorbarArea);

    this.pColorbar = new PIXI.Graphics();
    this.pColorbarArea.addChild(this.pColorbar);

    this.axis = new AxisPixi(this);
    this.pColorbarArea.addChild(this.axis.pAxis);

    // [[255,255,255,0], [237,218,10,4] ...
    // a 256 element array mapping the values 0-255 to rgba values
    // not a d3 color scale for speed
    // this.colorScale = heatedObjectMap;
    this.colorScale = heatedObjectMap;

    if (options && options.colorRange) {
      this.colorScale = colorDomainToRgbaArray(options.colorRange);
    }

    this.gBase = select(svgElement).append('g');
    this.gMain = this.gBase.append('g');
    this.gColorscaleBrush = this.gMain.append('g');

    this.brushing = false;
    this.prevOptions = '';
  }

  /**
   * Set the position of this track. Normally this is handled by its ancestors,
   * but because we're also drawing on the SVG track, we need the function to
   * adjust the location of this.gSVG
   *
   * Arguments
   * ---------
   *      newPosition: [x,y]
   *          The new position of this track
   */
  setPosition(newPosition) {
    super.setPosition(newPosition);
  }

  rerender(options, force) {
    // if force is set, then we force a rerender even if the options
    // haven't changed rerender will force a brush.move

    const strOptions = JSON.stringify(options);

    if (!force && strOptions === this.prevOptions) { return; }

    this.prevOptions = strOptions;

    super.rerender(options, force);

    // the normalization method may have changed
    this.calculateVisibleTiles();

    if (options && options.colorRange) {
      this.colorScale = colorDomainToRgbaArray(options.colorRange);
    }

    for (const tile of this.visibleAndFetchedTiles()) {
      this.renderTile(tile);
    }

    // hopefully draw isn't rerendering all the tiles
    // this.drawColorbar();
  }

  tileDataToCanvas(pixData) {
    const canvas = document.createElement('canvas');

    canvas.width = 256;
    canvas.height = 256;

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pix = new ImageData(pixData, canvas.width, canvas.height);

    ctx.putImageData(pix, 0, 0);

    return canvas;
  }

  exportData() {}

  setSpriteProperties(sprite, zoomLevel, tilePos, mirrored) {
    const { tileX, tileY, tileWidth, tileHeight } = this.getTilePosAndDimensions(zoomLevel, tilePos);

    const tileEndX = tileX + tileWidth;
    const tileEndY = tileY + tileHeight;

    const spriteWidth = this._refXScale(tileEndX) - this._refXScale(tileX);
    const spriteHeight = this._refYScale(tileEndY) - this._refYScale(tileY);

    sprite.width = this._refXScale(tileEndX) - this._refXScale(tileX);
    sprite.height = this._refYScale(tileEndY) - this._refYScale(tileY);

    if (mirrored) {
      // this is a mirrored tile that represents the other half of a
      // triangular matrix
      sprite.x = this._refXScale(tileY);
      sprite.y = this._refYScale(tileX);

      // sprite.pivot = [this._refXScale()[1] / 2, this._refYScale()[1] / 2];

      // I think PIXIv3 used a different method to set the pivot value
      // because the code above no longer works as of v4
      sprite.rotation = -Math.PI / 2;
      sprite.scale.x = Math.abs(sprite.scale.x) * -1;

      sprite.width = spriteHeight;
      sprite.height = spriteWidth;
    } else {
      sprite.x = this._refXScale(tileX);
      sprite.y = this._refYScale(tileY);
    }
  }


  refXScale(_) {
    super.refXScale(_);

    this.draw();
  }

  refYScale(_) {
    super.refYScale(_);

    this.draw();
  }

  draw() {
    super.draw();

    //this.drawColorbar();
  }

  newBrushOptions(selection) {
    const newOptions = JSON.parse(JSON.stringify(this.options));

    const axisValueScale = this.valueScale.copy().range([this.colorbarHeight, 0]);

    const endDomain = axisValueScale.invert(selection[0]);
    const startDomain = axisValueScale.invert(selection[1]);

    const startPercent = (startDomain - axisValueScale.domain()[0])
            / (axisValueScale.domain()[1] - axisValueScale.domain()[0]);
    const endPercent = (endDomain - axisValueScale.domain()[0])
            / (axisValueScale.domain()[1] - axisValueScale.domain()[0]);

    newOptions.scaleStartPercent = startPercent.toFixed(SCALE_LIMIT_PRECISION);
    newOptions.scaleEndPercent = endPercent.toFixed(SCALE_LIMIT_PRECISION);

    return newOptions;
  }

  brushStart() {
    this.brushing = true;
  }

  brushMoved() {
    if (!event.selection) { return; }

    const newOptions = this.newBrushOptions(event.selection);

    const strOptions = JSON.stringify(newOptions);

    this.gColorscaleBrush.selectAll('.handle--custom').attr(
      'y',
      d => (
        d.type === 'n' ?
          event.selection[0] :
          event.selection[1] - (BRUSH_HEIGHT / 2)
      ));

    if (strOptions === this.prevOptions) return;


    this.prevOptions = strOptions;

    // force a rerender because we've already set prevOptions
    // to the new options
    // this is necessary for when value scales are synced between
    // tracks
    this.rerender(newOptions, true);

    this.onTrackOptionsChanged(newOptions);
    this.onValueScaleChanged();
  }

  brushEnd() {
    // let newOptions = this.newBrushOptions(event.selection);

    // this.rerender(newOptions);
    // this.animate();
    this.brushing = false;
  }

  drawColorbar() {
    this.pColorbar.clear();

    if (!this.options.colorbarPosition || this.options.colorbarPosition === 'hidden') {
      this.pColorbarArea.visible = false;

      if (this.scaleBrush) {
        this.gColorscaleBrush.call(this.scaleBrush.move, null);
      }

      // turn off the color scale brush
      this.gColorscaleBrush.on('.brush', null);
      this.gColorscaleBrush.selectAll('rect').remove();

      return;
    }

    this.pColorbarArea.visible = true;

    if (!this.valueScale) { return; }
    if (isNaN(this.valueScale.domain()[0]) ||
        isNaN(this.valueScale.domain()[1])) { return; }


    const colorbarAreaHeight = Math.min(this.dimensions[1] / 2, COLORBAR_MAX_HEIGHT);
    this.colorbarHeight = colorbarAreaHeight - (2 * COLORBAR_MARGIN);

    if (this.colorbarHeight < 0)
      //  no point in drawing the colorbar if it's not going to be visible
      return;

    const colorbarAreaWidth = (
      COLORBAR_WIDTH +
      COLORBAR_LABELS_WIDTH +
      COLORBAR_MARGIN +
      BRUSH_COLORBAR_GAP +
      BRUSH_WIDTH +
      BRUSH_MARGIN
    );

    const axisValueScale = this.valueScale.copy().range([this.colorbarHeight, 0]);

    this.scaleBrush = brushY();

    // this is to make the handles of the scale brush stick out away
    // from the colorbar
    if (
      this.options.colorbarPosition === 'topLeft' ||
      this.options.colorbarPosition === 'bottomLeft'
    ) {
      this.scaleBrush.extent(
        [
          [BRUSH_MARGIN, 0],
          [BRUSH_WIDTH, this.colorbarHeight],
        ],
      );
    } else {
      this.scaleBrush.extent(
        [
          [0, 0],
          [BRUSH_WIDTH - BRUSH_MARGIN, this.colorbarHeight],
        ],
      );
    }

    if (this.options.colorbarPosition === 'topLeft') {
      // draw the background for the colorbar
      this.pColorbarArea.x = this.position[0];
      this.pColorbarArea.y = this.position[1];

      this.pColorbar.y = COLORBAR_MARGIN;
      this.axis.pAxis.y = COLORBAR_MARGIN;

      this.axis.pAxis.x = BRUSH_MARGIN + BRUSH_WIDTH + BRUSH_COLORBAR_GAP + COLORBAR_WIDTH;
      this.pColorbar.x = BRUSH_MARGIN + BRUSH_WIDTH + BRUSH_COLORBAR_GAP;

      this.gColorscaleBrush.attr(
        'transform',
        `translate(${this.pColorbarArea.x + BRUSH_MARGIN},${this.pColorbarArea.y + this.pColorbar.y - 1})`,
      );
    }

    if (this.options.colorbarPosition === 'topRight') {
      // draw the background for the colorbar
      this.pColorbarArea.x = this.position[0] + this.dimensions[0] - colorbarAreaWidth;
      this.pColorbarArea.y = this.position[1];

      this.pColorbar.y = COLORBAR_MARGIN;
      this.axis.pAxis.y = COLORBAR_MARGIN;

      // default to 'inside'
      this.axis.pAxis.x = COLORBAR_LABELS_WIDTH + COLORBAR_MARGIN;

      this.pColorbar.x = COLORBAR_LABELS_WIDTH + COLORBAR_MARGIN;

      this.gColorscaleBrush.attr(
        'transform',
        `translate(${this.pColorbarArea.x + this.pColorbar.x + COLORBAR_WIDTH + 2},${this.pColorbarArea.y + this.pColorbar.y - 1})`,
      );
    }

    if (this.options.colorbarPosition === 'bottomRight') {
      this.pColorbarArea.x = this.position[0] + this.dimensions[0] - colorbarAreaWidth;
      this.pColorbarArea.y = this.position[1] + this.dimensions[1] - colorbarAreaHeight;

      this.pColorbar.y = COLORBAR_MARGIN;
      this.axis.pAxis.y = COLORBAR_MARGIN;

      // default to "inside"
      this.axis.pAxis.x = COLORBAR_LABELS_WIDTH + COLORBAR_MARGIN;
      this.pColorbar.x = COLORBAR_LABELS_WIDTH + COLORBAR_MARGIN;

      this.gColorscaleBrush.attr(
        'transform',
        `translate(${this.pColorbarArea.x + this.pColorbar.x + COLORBAR_WIDTH + BRUSH_COLORBAR_GAP},${this.pColorbarArea.y + this.pColorbar.y - 1})`,
      );
    }

    if (this.options.colorbarPosition === 'bottomLeft') {
      this.pColorbarArea.x = this.position[0];
      this.pColorbarArea.y = this.position[1] + this.dimensions[1] - colorbarAreaHeight;

      this.pColorbar.y = COLORBAR_MARGIN;
      this.axis.pAxis.y = COLORBAR_MARGIN;

      // default to "inside"
      this.axis.pAxis.x = BRUSH_MARGIN + BRUSH_WIDTH + BRUSH_COLORBAR_GAP + COLORBAR_WIDTH;
      this.pColorbar.x = BRUSH_MARGIN + BRUSH_WIDTH + BRUSH_COLORBAR_GAP;

      this.gColorscaleBrush.attr(
        'transform',
        `translate(${this.pColorbarArea.x + 2},${this.pColorbarArea.y + this.pColorbar.y - 1})`,
      );
    }

    this.pColorbarArea.clear();
    this.pColorbarArea.beginFill(colorToHex('white'), 0.6);
    this.pColorbarArea.drawRect(0, 0, colorbarAreaWidth, colorbarAreaHeight);

    if (!this.options) { this.options = {}; }
    if (!this.options.scaleStartPercent) { this.options.scaleStartPercent = 0; }
    if (!this.options.scaleEndPercent) { this.options.scaleEndPercent = 1; }

    const domainWidth = axisValueScale.domain()[1] - axisValueScale.domain()[0];

    const startBrush = axisValueScale(
      (this.options.scaleStartPercent * domainWidth) + axisValueScale.domain()[0],
    );
    const endBrush = axisValueScale(
      (this.options.scaleEndPercent * domainWidth) + axisValueScale.domain()[0],
    );

    // endBrush and startBrush are reversed because lower values come first
    // only set if the user isn't brushing at the moment
    if (!this.brushing) {
      this.scaleBrush
        .on('start', this.brushStart.bind(this))
        .on('brush', this.brushMoved.bind(this))
        .on('end', this.brushEnd.bind(this))
        .handleSize(0);

      this.gColorscaleBrush.on('.brush', null);
      this.gColorscaleBrush.call(this.scaleBrush);

      this.northHandle = this.gColorscaleBrush.selectAll('.handle--custom')
        .data([{ type: 'n' }, { type: 's' }])
        .enter()
        .append('rect')
        .classed('handle--custom', true)
        .attr('cursor', 'ns-resize')
        .attr('width', BRUSH_WIDTH)
        .attr('height', BRUSH_HEIGHT)
        .style('fill', '#666')
        .style('stroke', 'white');

      if (this.flipText) { this.northHandle.attr('cursor', 'ew-resize'); }

      this.gColorscaleBrush.call(
        this.scaleBrush.move,
        [endBrush, startBrush],
      );
    }

    const posScale = scaleLinear()
      .domain([0, 255])
      .range([0, this.colorbarHeight]);

    // draw a small rectangle for each color of the colorbar
    for (let i = 0; i < this.colorbarHeight; i++) {
      const value = this.limitedValueScale(axisValueScale.invert(i));

      const rgbIdx = Math.max(0, Math.min(254, Math.floor(value)));
      this.pColorbar.beginFill(
        colorToHex(
          `rgb(${this.colorScale[rgbIdx][0]},${this.colorScale[rgbIdx][1]},${this.colorScale[rgbIdx][2]})`,
        ),
      );

      // each rectangle in the colorbar will be one pixel high
      this.pColorbar.drawRect(0, i, COLORBAR_WIDTH, 1);
    }

    // draw an axis on the right side of the colorbar
    this.pAxis.position.x = COLORBAR_WIDTH;
    this.pAxis.position.y = posScale(0);

    if (
      this.options.colorbarPosition === 'topLeft' ||
      this.options.colorbarPosition === 'bottomLeft'
    ) {
      this.axis.drawAxisRight(axisValueScale, this.colorbarHeight);
    } else if (
      this.options.colorbarPosition === 'topRight' ||
      this.options.colorbarPosition === 'bottomRight'
    ) {
      this.axis.drawAxisLeft(axisValueScale, this.colorbarHeight);
    }
  }

  exportColorBarSVG() {
    const gColorbarArea = document.createElement('g');

    if (!this.options.colorbarPosition || this.options.colorbarPosition === 'hidden') {
      // if there's no visible colorbar, we don't need to export anything
      return gColorbarArea;
    }

    // no value scale, no colorbar
    if (!this.valueScale) return gColorbarArea;

    gColorbarArea.setAttribute(
      'transform',
      `translate(${this.pColorbarArea.x}, ${this.pColorbarArea.y})`,
    );

    gColorbarArea.setAttribute(
      'transform',
      `translate(${this.pColorbarArea.x}, ${this.pColorbarArea.y})`,
    );

    const rectColorbarArea = document.createElement('rect');
    gColorbarArea.appendChild(rectColorbarArea);

    const gColorbar = document.createElement('g');
    gColorbarArea.appendChild(gColorbar);

    gColorbar.setAttribute(
      'transform',
      `translate(${this.pColorbar.x}, ${this.pColorbar.y})`,
    );

    const colorbarAreaHeight = Math.min(
      this.dimensions[1], COLORBAR_MAX_HEIGHT,
    );
    this.colorbarHeight = colorbarAreaHeight - (2 * COLORBAR_MARGIN);
    const colorbarAreaWidth = COLORBAR_WIDTH + COLORBAR_LABELS_WIDTH + (2 * COLORBAR_MARGIN);

    rectColorbarArea.setAttribute('x', 0);
    rectColorbarArea.setAttribute('y', 0);
    rectColorbarArea.setAttribute('width', colorbarAreaWidth);
    rectColorbarArea.setAttribute('height', colorbarAreaHeight);
    rectColorbarArea.setAttribute('style', 'fill: white; stroke-width: 0; opacity: 0.7');

    const posScale = scaleLinear()
      .domain([0, 255])
      .range([0, this.colorbarHeight]);
    const colorHeight = (this.colorbarHeight) / 256.0;

    for (let i = 0; i < 256; i++) {
      const rectColor = document.createElement('rect');
      gColorbar.appendChild(rectColor);

      rectColor.setAttribute('x', 0);
      rectColor.setAttribute('y', posScale(i));
      rectColor.setAttribute('width', COLORBAR_WIDTH);
      rectColor.setAttribute('height', colorHeight);
      rectColor.setAttribute('class', 'color-rect');

      rectColor.setAttribute('style', `fill: rgb(${this.colorScale[i][0]}, ${this.colorScale[i][1]}, ${this.colorScale[i][2]})`);
    }

    const gAxisHolder = document.createElement('g');
    gColorbarArea.appendChild(gAxisHolder);
    gAxisHolder.setAttribute('transform',
      `translate(${this.axis.pAxis.position.x},${this.axis.pAxis.position.y})`);

    let gAxis = null;
    const axisValueScale = this.valueScale.copy().range([this.colorbarHeight, 0]);

    if (
      this.options.colorbarPosition === 'topLeft' ||
      this.options.colorbarPosition === 'bottomLeft'
    ) {
      gAxis = this.axis.exportAxisRightSVG(axisValueScale, this.colorbarHeight);
    } else if (
      this.options.colorbarPosition === 'topRight' ||
      this.options.colorbarPosition === 'bottomRight'
    ) {
      gAxis = this.axis.exportAxisLeftSVG(axisValueScale, this.colorbarHeight);
    }

    gAxisHolder.appendChild(gAxis);

    return gColorbarArea;
  }

  /**
   * Convert the raw tile data to a rendered array of values which can be represented as a sprite.
   *
   * @param tile: The data structure containing all the tile information. Relevant to
   *              this function are tile.tileData = {'dense': [...], ...}
   *              and tile.graphics
   */
  initTile(tile) {
    super.initTile(tile);

    if (this.scale.minValue == null || this.scale.maxValue == null)
      // no data present
      return;

    this.renderTile(tile);
  }

  renderTile(tile) {
    const [scaleType, valueScale] = getValueScale(this.options.heatmapValueScaling,
            this.scale.minValue, this.medianVisibleValue, this.scale.maxValue, 'log');

    this.valueScale = valueScale;
    let pseudocount = 0;

    if (scaleType == 'log')
        pseudocount = this.valueScale.domain()[0];

    this.limitedValueScale = this.valueScale.copy();

    if (this.options
            && typeof (this.options.scaleStartPercent) !== 'undefined'
            && typeof (this.options.scaleEndPercent) !== 'undefined') {
      this.limitedValueScale.domain(
        [this.valueScale.domain()[0] + (this.valueScale.domain()[1] - this.valueScale.domain()[0]) * (this.options.scaleStartPercent),
          this.valueScale.domain()[0] + (this.valueScale.domain()[1] - this.valueScale.domain()[0]) * (this.options.scaleEndPercent)]);
    }

    tileProxy.tileDataToPixData(tile,
      this.limitedValueScale,
      pseudocount, // used as a pseudocount to prevent taking the log of 0
      this.colorScale,
      (pixData) => {
        // the tileData has been converted to pixData by the worker script and needs to be loaded
        // as a sprite
        const graphics = tile.graphics;
        const canvas = this.tileDataToCanvas(pixData);

        let sprite = null;

        sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(canvas, PIXI.SCALE_MODES.NEAREST));

        tile.sprite = sprite;

        // store the pixData so that we can export it
        tile.canvas = canvas;
        this.setSpriteProperties(tile.sprite, tile.tileData.zoomLevel, tile.tileData.tilePos, tile.mirrored);

        graphics.removeChildren();
        graphics.addChild(tile.sprite);
      });
  }

  remove() {
    /**
     * Remove this track from the view
     */
    this.gMain.remove();
    this.gMain = null;

    super.remove();
  }

  refScalesChanged(refXScale, refYScale) {
    super.refScalesChanged(refXScale, refYScale);

    for (const uid in this.fetchedTiles) {
      const tile = this.fetchedTiles[uid];

      if (tile.sprite) {
        this.setSpriteProperties(tile.sprite, tile.tileData.zoomLevel, tile.tileData.tilePos, tile.mirrored);
      }
    }
  }

  superSVG() {
    /**
     * Bypass this track's exportSVG function
     */
    return super.exportSVG();
  }

  exportSVG() {
    let track = null;
    let base = null;

    if (super.exportSVG) {
      [base, track] = super.exportSVG();
    } else {
      base = document.createElement('g');
      track = base;
    }

    const output = document.createElement('g');
    track.appendChild(output);

    output.setAttribute(
      'transform',
      `translate(${this.pMain.position.x},${this.pMain.position.y}) scale(${this.pMain.scale.x},${this.pMain.scale.y})`,
    );

    for (const tile of this.visibleAndFetchedTiles()) {
      const rotation = tile.sprite.rotation * 180 / Math.PI;
      const g = document.createElement('g');
      g.setAttribute(
        'transform',
        `translate(${tile.sprite.x},${tile.sprite.y}) rotate(${rotation}) scale(${tile.sprite.scale.x},${tile.sprite.scale.y})`,
      );

      const image = document.createElement('image');
      image.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', tile.canvas.toDataURL());
      image.setAttribute('width', 256);
      image.setAttribute('height', 256);

      g.appendChild(image);
      output.appendChild(g);
    }

    const gColorbar = this.exportColorBarSVG();
    track.appendChild(gColorbar);

    return [base, base];
  }

  zoomed(newXScale, newYScale, k, tx, ty) {
    super.zoomed(newXScale, newYScale);

    this.pMain.position.x = tx; // translateX;
    this.pMain.position.y = ty; // translateY;

    this.pMain.scale.x = k; // scaleX;
    this.pMain.scale.y = k; // scaleY;

    // this.drawColorbar();
  }

  calculateVisibleTiles(mirrorTiles = true) {
    // if we don't know anything about this dataset, no point
    // in trying to get tiles
    if (!this.tilesetInfo) { return; }

    this.zoomLevel = this.calculateZoomLevel();

    // this.zoomLevel = 0;
    if (this.tilesetInfo.resolutions) {
      let sortedResolutions = this.tilesetInfo.resolutions.map(x => +x).sort((a,b) => b-a)

      this.xTiles = tileProxy.calculateTilesFromResolution(
        sortedResolutions[this.zoomLevel],
        this._xScale,
        this.tilesetInfo.min_pos[0], this.tilesetInfo.max_pos[0]);
      this.yTiles = tileProxy.calculateTilesFromResolution(
        sortedResolutions[this.zoomLevel],
        this._yScale,
        this.tilesetInfo.min_pos[0], this.tilesetInfo.max_pos[0]);

      //console.log('res', sortedResolutions[this.zoomLevel]);
      //console.log('this.xTiles:', this.xTiles);
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

    if (this.tilesetInfo.resolutions) {
      let sortedResolutions = this.tilesetInfo.resolutions.map(x => +x).sort((a,b) => b-a)

      let chosenResolution = sortedResolutions[zoomLevel];

      let tileWidth =  chosenResolution * BINS_PER_TILE;
      let tileHeight = tileWidth;

      let tileX = chosenResolution * BINS_PER_TILE * tilePos[0];
      let tileY = chosenResolution * BINS_PER_TILE * tilePos[1];

      return { tileX,
        tileY,
        tileWidth,
        tileHeight };
    }

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

  calculateZoomLevel() {
    let minX = this.tilesetInfo.min_pos[0];
    let maxX = this.tilesetInfo.max_pos[0];

    let minY = this.tilesetInfo.min_pos[1];
    let maxY = this.tilesetInfo.max_pos[1];

    if (this.tilesetInfo.resolutions) {
      let zoomIndexX = tileProxy.calculateZoomLevelFromResolutions(this.tilesetInfo.resolutions, this._xScale, minX, maxX);
      let zoomIndexY = tileProxy.calculateZoomLevelFromResolutions(this.tilesetInfo.resolutions, this._yScale, minY, maxY);

      return Math.min(zoomIndexX, zoomIndexY);
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

  tileToLocalId(tile) {
    /*
     * The local tile identifier
     */

    // tile contains [zoomLevel, xPos, yPos]
    if (tile.dataTransform && tile.dataTransform != 'default') { return `${tile.join('.')}.${tile.mirrored}.${tile.dataTransform}`; }
    return `${tile.join('.')}.${tile.mirrored}`;
  }

  tileToRemoteId(tile) {
    /**
     * The tile identifier used on the server
     */

    // tile contains [zoomLevel, xPos, yPos]
    if (tile.dataTransform && tile.dataTransform != 'default') { return `${tile.join('.')}.${tile.dataTransform}`; }
    return `${tile.join('.')}`;
  }

  localToRemoteId(remoteId) {
    const idParts = remoteId.split('.');
    return idParts.slice(0, idParts.length - 1).join('.');
  }
}

export default HeatmapTiledPixiTrack;
