import ndarray from 'ndarray';
import { brushY } from 'd3-brush';
import { format } from 'd3-format';
import { scaleLinear } from 'd3-scale';
import { select, event } from 'd3-selection';
import slugid from 'slugid';
import {
  colorToRgba,
  absToChr,
  colorDomainToRgbaArray,
  colorToHex,
  download,
  ndarrayAssign,
  ndarrayFlatten,
  objVals,
  showMousePosition,
  valueToColor,
} from './utils';

import TiledPixiTrack, { getValueScale } from './TiledPixiTrack';
import AxisPixi from './AxisPixi';

// Services
import { tileProxy } from './services';

import { GLOBALS, HEATED_OBJECT_MAP } from './configs';

import { NUM_PRECOMP_SUBSETS_PER_2D_TTILE } from './configs/dense-data-extrema-config';

const COLORBAR_MAX_HEIGHT = 200;
const COLORBAR_WIDTH = 10;
const COLORBAR_LABELS_WIDTH = 40;
const COLORBAR_MARGIN = 10;
const BRUSH_WIDTH = COLORBAR_MARGIN;
const BRUSH_HEIGHT = 4;
const BRUSH_COLORBAR_GAP = 1;
const BRUSH_MARGIN = 4;
const SCALE_LIMIT_PRECISION = 5;
const BINS_PER_TILE = 256;
const COLORBAR_AREA_WIDTH =
  COLORBAR_WIDTH +
  COLORBAR_LABELS_WIDTH +
  COLORBAR_MARGIN +
  BRUSH_COLORBAR_GAP +
  BRUSH_WIDTH +
  BRUSH_MARGIN;

class HeatmapTiledPixiTrack extends TiledPixiTrack {
  constructor(context, options) {
    // Fritz: this smells very hacky!
    const newContext = { ...context };
    newContext.onValueScaleChanged = () => {
      context.onValueScaleChanged();
      this.drawColorbar();
    };
    super(newContext, options);
    const {
      pubSub,
      animate,
      svgElement,
      onTrackOptionsChanged,
      onMouseMoveZoom,
      isShowGlobalMousePosition,
      isValueScaleLocked,
    } = context;

    this.pubSub = pubSub;
    this.is2d = true;
    this.animate = animate;
    this.uid = slugid.nice();
    this.scaleBrush = brushY();

    this.onTrackOptionsChanged = onTrackOptionsChanged;
    this.isShowGlobalMousePosition = isShowGlobalMousePosition;

    this.isValueScaleLocked = isValueScaleLocked;

    // Graphics for drawing the colorbar
    this.pColorbarArea = new GLOBALS.PIXI.Graphics();
    this.pMasked.addChild(this.pColorbarArea);

    this.pColorbar = new GLOBALS.PIXI.Graphics();
    this.pColorbarArea.addChild(this.pColorbar);

    this.axis = new AxisPixi(this);
    this.pColorbarArea.addChild(this.axis.pAxis);

    // [[255,255,255,0], [237,218,10,4] ...
    // a 256 element array mapping the values 0-255 to rgba values
    // not a d3 color scale for speed
    this.colorScale = HEATED_OBJECT_MAP;

    if (options && options.colorRange) {
      this.colorScale = colorDomainToRgbaArray(options.colorRange);
    }

    this.gBase = select(svgElement).append('g');
    this.gMain = this.gBase.append('g');
    this.gColorscaleBrush = this.gMain.append('g');

    this.brushing = false;
    this.prevOptions = '';

    // Contains information about which part of the upper left tile is visible
    this.prevIndUpperLeftTile = '';

    /*
    chromInfoService
      .get(`${dataConfig.server}/chrom-sizes/?id=${dataConfig.tilesetUid}`)
      .then((chromInfo) => { this.chromInfo = chromInfo; });
    */

    this.onMouseMoveZoom = onMouseMoveZoom;
    this.setDataLensSize(11);
    this.dataLens = new Float32Array(this.dataLensSize ** 2);

    this.mouseMoveHandlerBound = this.mouseMoveHandler.bind(this);

    if (this.onMouseMoveZoom) {
      this.pubSubs.push(
        this.pubSub.subscribe('app.mouseMove', this.mouseMoveHandlerBound),
      );
    }

    if (
      this.options &&
      this.options.showMousePosition &&
      !this.hideMousePosition
    ) {
      this.hideMousePosition = showMousePosition(
        this,
        this.is2d,
        this.isShowGlobalMousePosition(),
      );
    }

    this.prevOptions = JSON.stringify(options);
  }

  /**
   * Mouse move handler
   *
   * @param  {Object}  e  Event object.
   */
  mouseMoveHandler(e) {
    if (!this.isWithin(e.x, e.y)) return;

    this.mouseX = e.x;
    this.mouseY = e.y;

    this.mouseMoveZoomHandler();
  }

  /**
   * Mouse move and zoom handler. Is triggered on both events.
   *
   * @param  {Number}  absX  Absolute X coordinate.
   * @param  {Number}  absY  Absolute Y coordinate
   */
  mouseMoveZoomHandler(absX = this.mouseX, absY = this.mouseY) {
    if (
      typeof absX === 'undefined' ||
      typeof absY === 'undefined' ||
      !this.areAllVisibleTilesLoaded()
    )
      return;

    if (!this.tilesetInfo) {
      return;
    }

    const relX = absX - this.position[0];
    const relY = absY - this.position[1];

    let data;
    let dataLens;
    try {
      dataLens = this.getVisibleRectangleData(
        relX - this.dataLensPadding,
        relY - this.dataLensPadding,
        this.dataLensSize,
        this.dataLensSize,
      );
      // The center value
      data = dataLens.get(this.dataLensPadding, this.dataLensPadding);
    } catch (e) {
      return;
    }

    const dim = this.dataLensSize;

    let toRgb;
    try {
      toRgb = valueToColor(
        this.limitedValueScale,
        this.colorScale,
        this.valueScale.domain()[0],
      );
    } catch (err) {
      return;
    }

    if (!toRgb) return;

    const dataX = Math.round(this._xScale.invert(relX));
    const dataY = Math.round(this._yScale.invert(relY));

    let center = [dataX, dataY];
    let xRange = [
      Math.round(this._xScale.invert(relX - this.dataLensPadding)),
      Math.round(this._xScale.invert(relX + this.dataLensPadding)),
    ];
    let yRange = [
      Math.round(this._yScale.invert(relY - this.dataLensPadding)),
      Math.round(this._yScale.invert(relY + this.dataLensPadding)),
    ];

    if (this.chromInfo) {
      center = center.map((pos) => absToChr(pos, this.chromInfo).slice(0, 2));
      xRange = xRange.map((pos) => absToChr(pos, this.chromInfo).slice(0, 2));
      yRange = yRange.map((pos) => absToChr(pos, this.chromInfo).slice(0, 2));
    }

    this.onMouseMoveZoom({
      trackId: this.id,
      data,
      absX,
      absY,
      relX,
      relY,
      dataX,
      dataY,
      orientation: '2d',
      // Specific to 2D matrices
      dataLens,
      dim,
      toRgb,
      center,
      xRange,
      yRange,
      isGenomicCoords: !!this.chromInfo,
    });
  }

  scheduleRerender() {
    this.backgroundTaskScheduler.enqueueTask(
      this.handleRerender.bind(this),
      null,
      this.uuid,
    );
  }

  handleRerender() {
    this.rerender(this.options, true);
  }

  /**
   * Get absolute (i.e., display) tile dimension and position.
   *
   * @param {Number}  zoomLevel  Current zoom level.
   * @param {Array}  tilePos  Tile position.
   * @return {Object}  Object holding the absolute x, y, width, and height.
   */
  getAbsTileDim(zoomLevel, tilePos, mirrored) {
    const {
      tileX,
      tileY,
      tileWidth,
      tileHeight,
    } = this.getTilePosAndDimensions(zoomLevel, tilePos);

    const dim = {};

    dim.width = this._refXScale(tileX + tileWidth) - this._refXScale(tileX);
    dim.height = this._refYScale(tileY + tileHeight) - this._refYScale(tileY);

    if (mirrored) {
      // this is a mirrored tile that represents the other half of a
      // triangular matrix
      dim.x = this._refXScale(tileY);
      dim.y = this._refYScale(tileX);
    } else {
      dim.x = this._refXScale(tileX);
      dim.y = this._refYScale(tileY);
    }

    return dim;
  }

  updateValueScale() {
    let minValue = this.minValue();
    let maxValue = this.maxValue();

    // There might be only one value in the visible area. We extend the
    // valuescale artificially, so that point is still displayed
    const epsilon = 1e-6;
    if (
      minValue !== undefined &&
      minValue !== null &&
      maxValue !== undefined &&
      maxValue !== null &&
      Math.abs(minValue - maxValue) < epsilon
    ) {
      // don't go to or below 0 in case there is a log scale
      const offset = 1e-3;
      minValue = Math.max(epsilon, minValue - offset);
      maxValue += offset;
    }

    const [scaleType, valueScale] = getValueScale(
      (this.options && this.options.heatmapValueScaling) || 'log',
      minValue,
      this.medianVisibleValue,
      maxValue,
      'log',
    );

    this.valueScale = valueScale;

    this.limitedValueScale = this.valueScale.copy();

    if (
      this.options &&
      typeof this.options.scaleStartPercent !== 'undefined' &&
      typeof this.options.scaleEndPercent !== 'undefined'
    ) {
      this.limitedValueScale.domain([
        this.valueScale.domain()[0] +
          (this.valueScale.domain()[1] - this.valueScale.domain()[0]) *
            this.options.scaleStartPercent,
        this.valueScale.domain()[0] +
          (this.valueScale.domain()[1] - this.valueScale.domain()[0]) *
            this.options.scaleEndPercent,
      ]);
    }

    return [scaleType, valueScale];
  }

  rerender(options, force) {
    super.rerender(options, force);

    // We need to update the value scale prior to updating the colorbar
    this.updateValueScale();

    // if force is set, then we force a rerender even if the options
    // haven't changed rerender will force a brush.move
    const strOptions = JSON.stringify(options);
    this.drawColorbar();

    if (!force && strOptions === this.prevOptions) return;

    this.prevOptions = strOptions;
    this.options = options;

    super.rerender(options, force);

    // the normalization method may have changed
    this.calculateVisibleTiles();

    if (options && options.colorRange) {
      this.colorScale = colorDomainToRgbaArray(options.colorRange);
    }

    this.visibleAndFetchedTiles().forEach((tile) => this.renderTile(tile));

    // hopefully draw isn't rerendering all the tiles
    // this.drawColorbar();

    if (this.hideMousePosition) {
      this.hideMousePosition();
      this.hideMousePosition = undefined;
    }

    if (
      this.options &&
      this.options.showMousePosition &&
      !this.hideMousePosition
    ) {
      this.hideMousePosition = showMousePosition(
        this,
        this.is2d,
        this.isShowGlobalMousePosition(),
      );
    }
  }

  drawLabel() {
    if (this.options.labelPosition === this.options.colorbarPosition) {
      this.labelXOffset = COLORBAR_AREA_WIDTH;
    } else {
      this.labelXOffset = 0;
    }

    super.drawLabel();
  }

  tileDataToCanvas(pixData) {
    const canvas = document.createElement('canvas');

    canvas.width = this.binsPerTile();
    canvas.height = this.binsPerTile();

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pix = new ImageData(pixData, canvas.width, canvas.height);

    ctx.putImageData(pix, 0, 0);

    return canvas;
  }

  exportData() {
    if (this.tilesetInfo) {
      // const currentResolution = tileProxy.calculateResolution(this.tilesetInfo,
      //  this.zoomLevel);

      // const pixelsWidth = (this._xScale.domain()[1]  - this._xScale.domain()[0])
      // / currentResolution;
      // const pixelsHeight = (this._yScale.domain()[1]  - this._yScale.domain()[0])
      // / currentResolution;

      const data = this.getVisibleRectangleData(
        0,
        0,
        this.dimensions[0],
        this.dimensions[1],
      );
      const output = {
        bounds: [this._xScale.domain(), this._yScale.domain()],
        dimensions: data.shape,
        data: ndarrayFlatten(data),
      };

      download('data.json', JSON.stringify(output));
    }
  }

  /**
   * Position sprite (the rendered tile)
   *
   * @param  {Object}  sprite  PIXI sprite object.
   * @param  {Number}  zoomLevel  Current zoom level.
   * @param  {Array}  tilePos  X,Y position of tile.
   * @param  {Boolean}  mirrored  If `true` tile is mirrored.
   */
  setSpriteProperties(sprite, zoomLevel, tilePos, mirrored) {
    const dim = this.getAbsTileDim(zoomLevel, tilePos, mirrored);

    sprite.width = dim.width;
    sprite.height = dim.height;
    sprite.x = dim.x;
    sprite.y = dim.y;

    if (mirrored && tilePos[0] !== tilePos[1]) {
      // sprite.pivot = [this._refXScale()[1] / 2, this._refYScale()[1] / 2];

      // I think PIXIv3 used a different method to set the pivot value
      // because the code above no longer works as of v4
      sprite.rotation = -Math.PI / 2;
      sprite.scale.x = Math.abs(sprite.scale.x) * -1;
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

    // this.drawColorbar();
  }

  newBrushOptions(selection) {
    const newOptions = JSON.parse(JSON.stringify(this.options));

    const axisValueScale = this.valueScale
      .copy()
      .range([this.colorbarHeight, 0]);

    const endDomain = axisValueScale.invert(selection[0]);
    const startDomain = axisValueScale.invert(selection[1]);

    // Fritz: I am disabling ESLint here twice because moving the slash onto the
    // next line breaks my editors style template somehow.
    const startPercent =
      (startDomain - axisValueScale.domain()[0]) / // eslint-disable-line operator-linebreak
      (axisValueScale.domain()[1] - axisValueScale.domain()[0]);
    const endPercent =
      (endDomain - axisValueScale.domain()[0]) / // eslint-disable-line operator-linebreak
      (axisValueScale.domain()[1] - axisValueScale.domain()[0]);

    newOptions.scaleStartPercent = startPercent.toFixed(SCALE_LIMIT_PRECISION);
    newOptions.scaleEndPercent = endPercent.toFixed(SCALE_LIMIT_PRECISION);

    return newOptions;
  }

  brushStart() {
    this.brushing = true;
  }

  brushMoved() {
    if (!event.selection) {
      return;
    }
    const newOptions = this.newBrushOptions(event.selection);

    const strOptions = JSON.stringify(newOptions);

    this.gColorscaleBrush
      .selectAll('.handle--custom')
      .attr('y', (d) =>
        d.type === 'n'
          ? event.selection[0]
          : event.selection[1] - BRUSH_HEIGHT / 2,
      );

    if (strOptions === this.prevOptions) return;

    this.prevOptions = strOptions;

    // force a rerender because we've already set prevOptions
    // to the new options
    // this is necessary for when value scales are synced between
    // tracks
    this.rerender(newOptions, true);

    this.onTrackOptionsChanged(newOptions);

    if (this.isValueScaleLocked()) {
      this.onValueScaleChanged();
    }
  }

  brushEnd() {
    // let newOptions = this.newBrushOptions(event.selection);

    // this.rerender(newOptions);
    // this.animate();
    this.brushing = false;
  }

  setPosition(newPosition) {
    super.setPosition(newPosition);

    this.drawColorbar();
  }

  setDimensions(newDimensions) {
    super.setDimensions(newDimensions);

    this.drawColorbar();
  }

  removeColorbar() {
    this.pColorbarArea.visible = false;

    if (this.scaleBrush.on('.brush')) {
      this.gColorscaleBrush.call(this.scaleBrush.move, null);
    }

    // turn off the color scale brush
    this.gColorscaleBrush.on('.brush', null);
    this.gColorscaleBrush.selectAll('rect').remove();
  }

  drawColorbar() {
    this.pColorbar.clear();
    // console.trace('draw colorbar');

    if (
      !this.options ||
      !this.options.colorbarPosition ||
      this.options.colorbarPosition === 'hidden'
    ) {
      this.removeColorbar();

      return;
    }

    this.pColorbarArea.visible = true;

    if (!this.valueScale) {
      return;
    }

    if (
      Number.isNaN(+this.valueScale.domain()[0]) ||
      Number.isNaN(+this.valueScale.domain()[1])
    ) {
      return;
    }

    const colorbarAreaHeight = Math.min(
      this.dimensions[1] / 2,
      COLORBAR_MAX_HEIGHT,
    );
    this.colorbarHeight = colorbarAreaHeight - 2 * COLORBAR_MARGIN;

    //  no point in drawing the colorbar if it's not going to be visible
    if (this.colorbarHeight < 0) {
      // turn off the color scale brush
      this.removeColorbar();
      return;
    }

    if (this.valueScale.domain()[1] === this.valueScale.domain()[0]) {
      // degenerate color bar
      this.removeColorbar();
      return;
    }

    const axisValueScale = this.valueScale
      .copy()
      .range([this.colorbarHeight, 0]);

    // this.scaleBrush = brushY();

    // this is to make the handles of the scale brush stick out away
    // from the colorbar
    if (
      this.options.colorbarPosition === 'topLeft' ||
      this.options.colorbarPosition === 'bottomLeft'
    ) {
      this.scaleBrush.extent([
        [BRUSH_MARGIN, 0],
        [BRUSH_WIDTH, this.colorbarHeight],
      ]);
    } else {
      this.scaleBrush.extent([
        [0, 0],
        [BRUSH_WIDTH - BRUSH_MARGIN, this.colorbarHeight],
      ]);
    }

    if (this.options.colorbarPosition === 'topLeft') {
      // draw the background for the colorbar
      [this.pColorbarArea.x, this.pColorbarArea.y] = this.position;

      this.pColorbar.y = COLORBAR_MARGIN;
      this.axis.pAxis.y = COLORBAR_MARGIN;

      this.axis.pAxis.x =
        BRUSH_MARGIN + BRUSH_WIDTH + BRUSH_COLORBAR_GAP + COLORBAR_WIDTH;
      this.pColorbar.x = BRUSH_MARGIN + BRUSH_WIDTH + BRUSH_COLORBAR_GAP;

      this.gColorscaleBrush.attr(
        'transform',
        `translate(${this.pColorbarArea.x + BRUSH_MARGIN},${
          this.pColorbarArea.y + this.pColorbar.y - 1
        })`,
      );
    }

    if (this.options.colorbarPosition === 'topRight') {
      // draw the background for the colorbar
      this.pColorbarArea.x =
        this.position[0] + this.dimensions[0] - COLORBAR_AREA_WIDTH;
      this.pColorbarArea.y = this.position[1];

      this.pColorbar.y = COLORBAR_MARGIN;
      this.axis.pAxis.y = COLORBAR_MARGIN;

      // default to 'inside'
      this.axis.pAxis.x = COLORBAR_LABELS_WIDTH + COLORBAR_MARGIN;

      this.pColorbar.x = COLORBAR_LABELS_WIDTH + COLORBAR_MARGIN;

      this.gColorscaleBrush.attr(
        'transform',
        `translate(${
          this.pColorbarArea.x + this.pColorbar.x + COLORBAR_WIDTH + 2
        },${this.pColorbarArea.y + this.pColorbar.y - 1})`,
      );
    }

    if (this.options.colorbarPosition === 'bottomRight') {
      this.pColorbarArea.x =
        this.position[0] + this.dimensions[0] - COLORBAR_AREA_WIDTH;
      this.pColorbarArea.y =
        this.position[1] + this.dimensions[1] - colorbarAreaHeight;

      this.pColorbar.y = COLORBAR_MARGIN;
      this.axis.pAxis.y = COLORBAR_MARGIN;

      // default to "inside"
      this.axis.pAxis.x = COLORBAR_LABELS_WIDTH + COLORBAR_MARGIN;
      this.pColorbar.x = COLORBAR_LABELS_WIDTH + COLORBAR_MARGIN;

      this.gColorscaleBrush.attr(
        'transform',
        `translate(${
          this.pColorbarArea.x +
          this.pColorbar.x +
          COLORBAR_WIDTH +
          BRUSH_COLORBAR_GAP
        },${this.pColorbarArea.y + this.pColorbar.y - 1})`,
      );
    }

    if (this.options.colorbarPosition === 'bottomLeft') {
      this.pColorbarArea.x = this.position[0];
      this.pColorbarArea.y =
        this.position[1] + this.dimensions[1] - colorbarAreaHeight;

      this.pColorbar.y = COLORBAR_MARGIN;
      this.axis.pAxis.y = COLORBAR_MARGIN;

      // default to "inside"
      this.axis.pAxis.x =
        BRUSH_MARGIN + BRUSH_WIDTH + BRUSH_COLORBAR_GAP + COLORBAR_WIDTH;
      this.pColorbar.x = BRUSH_MARGIN + BRUSH_WIDTH + BRUSH_COLORBAR_GAP;

      this.gColorscaleBrush.attr(
        'transform',
        `translate(${this.pColorbarArea.x + 2},${
          this.pColorbarArea.y + this.pColorbar.y - 1
        })`,
      );
    }

    this.pColorbarArea.clear();
    this.pColorbarArea.beginFill(
      colorToHex(this.options.colorbarBackgroundColor || 'white'),
      +this.options.colorbarBackgroundOpacity >= 0
        ? +this.options.colorbarBackgroundOpacity
        : 0.6,
    );
    this.pColorbarArea.drawRect(0, 0, COLORBAR_AREA_WIDTH, colorbarAreaHeight);

    if (!this.options) {
      this.options = { scaleStartPercent: 0, scaleEndPercent: 1 };
    } else {
      if (!this.options.scaleStartPercent) {
        this.options.scaleStartPercent = 0;
      }
      if (!this.options.scaleEndPercent) {
        this.options.scaleEndPercent = 1;
      }
    }

    const domainWidth = axisValueScale.domain()[1] - axisValueScale.domain()[0];

    const startBrush = axisValueScale(
      this.options.scaleStartPercent * domainWidth + axisValueScale.domain()[0],
    );
    const endBrush = axisValueScale(
      this.options.scaleEndPercent * domainWidth + axisValueScale.domain()[0],
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

      this.northHandle = this.gColorscaleBrush
        .selectAll('.handle--custom')
        .data([{ type: 'n' }, { type: 's' }])
        .enter()
        .append('rect')
        .classed('handle--custom', true)
        .attr('cursor', 'ns-resize')
        .attr('width', BRUSH_WIDTH)
        .attr('height', BRUSH_HEIGHT)
        .style('fill', '#666')
        .style('stroke', 'white');

      if (this.flipText) {
        this.northHandle.attr('cursor', 'ew-resize');
      }

      this.gColorscaleBrush.call(this.scaleBrush.move, [endBrush, startBrush]);
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
    gColorbarArea.setAttribute('class', 'color-bar');

    if (
      !this.options.colorbarPosition ||
      this.options.colorbarPosition === 'hidden'
    ) {
      // if there's no visible colorbar, we don't need to export anything
      return gColorbarArea;
    }

    // no value scale, no colorbar
    if (!this.valueScale) return gColorbarArea;

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
      this.dimensions[1] / 2,
      COLORBAR_MAX_HEIGHT,
    );
    this.colorbarHeight = colorbarAreaHeight - 2 * COLORBAR_MARGIN;

    rectColorbarArea.setAttribute('x', 0);
    rectColorbarArea.setAttribute('y', 0);
    rectColorbarArea.setAttribute('width', COLORBAR_AREA_WIDTH);
    rectColorbarArea.setAttribute('height', colorbarAreaHeight);
    rectColorbarArea.setAttribute(
      'style',
      'fill: white; stroke-width: 0; opacity: 0.7',
    );

    const barsToDraw = 256;
    const posScale = scaleLinear()
      .domain([0, barsToDraw - 1])
      .range([0, this.colorbarHeight]);
    const colorHeight = this.colorbarHeight / barsToDraw;

    for (let i = 0; i < barsToDraw; i++) {
      const rectColor = document.createElement('rect');
      gColorbar.appendChild(rectColor);

      rectColor.setAttribute('x', 0);
      rectColor.setAttribute('y', posScale(i));
      rectColor.setAttribute('width', COLORBAR_WIDTH);
      rectColor.setAttribute('height', colorHeight);
      rectColor.setAttribute('class', 'color-rect');

      const limitedIndex = Math.min(
        this.colorScale.length - 1,
        Math.max(
          0,
          Math.floor(this.limitedValueScale(this.valueScale.invert(i))),
        ),
      );

      const color = this.colorScale[limitedIndex];
      if (color) {
        rectColor.setAttribute(
          'style',
          `fill: rgb(${color[0]}, ${color[1]}, ${color[2]})`,
        );
      } else {
        // when no tiles are loaded, color will be undefined and we don't want to crash
        rectColor.setAttribute('style', `fill: rgb(255,255,255,0)`);
      }
    }

    const gAxisHolder = document.createElement('g');
    gColorbarArea.appendChild(gAxisHolder);
    gAxisHolder.setAttribute(
      'transform',
      `translate(${this.axis.pAxis.position.x},${this.axis.pAxis.position.y})`,
    );

    let gAxis = null;

    const axisValueScale = this.valueScale
      .copy()
      .range([this.colorbarHeight, 0]);
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
   * Set data lens size
   *
   * @param  {Integer}  newDataLensSize  New data lens size. Needs to be an odd
   *   integer.
   */
  setDataLensSize(newDataLensSize) {
    this.dataLensPadding = Math.max(0, Math.floor((newDataLensSize - 1) / 2));
    this.dataLensSize = this.dataLensPadding * 2 + 1;
  }

  binsPerTile() {
    return this.tilesetInfo.bins_per_dimension || BINS_PER_TILE;
  }

  /**
   * Get the data in the visible rectangle
   *
   * The parameter coordinates are in pixel coordinates
   *
   * @param {int} x: The upper left corner of the rectangle in pixel coordinates
   * @param {int} y: The upper left corner of the rectangle in pixel coordinates
   * @param {int} width: The width of the rectangle (pixels)
   * @param {int} height: The height of the rectangle (pixels)
   *
   * @returns {Array} A numjs array containing the data in the visible region
   *
   */
  getVisibleRectangleData(x, y, width, height) {
    let zoomLevel = this.calculateZoomLevel();
    zoomLevel = this.tilesetInfo.max_zoom
      ? Math.min(this.tilesetInfo.max_zoom, zoomLevel)
      : zoomLevel;

    const calculatedWidth = tileProxy.calculateTileWidth(
      this.tilesetInfo,
      zoomLevel,
      this.binsPerTile(),
    );

    // BP resolution of a tile's bin (i.e., numbe of base pairs per bin / pixel)
    const tileRes = calculatedWidth / this.binsPerTile();

    // the data domain of the currently visible region
    const xDomain = [this._xScale.invert(x), this._xScale.invert(x + width)];
    const yDomain = [this._yScale.invert(y), this._yScale.invert(y + height)];

    // we need to limit the domain of the requested region
    // to the bounds of the data
    const limitedXDomain = [
      Math.max(xDomain[0], this.tilesetInfo.min_pos[0]),
      Math.min(xDomain[1], this.tilesetInfo.max_pos[0]),
    ];

    const limitedYDomain = [
      Math.max(yDomain[0], this.tilesetInfo.min_pos[1]),
      Math.min(yDomain[1], this.tilesetInfo.max_pos[1]),
    ];

    // the bounds of the currently visible region in bins
    const leftXBin = Math.floor(limitedXDomain[0] / tileRes);
    const leftYBin = Math.floor(limitedYDomain[0] / tileRes);
    const binWidth = Math.max(
      0,
      Math.ceil((limitedXDomain[1] - limitedXDomain[0]) / tileRes),
    );
    const binHeight = Math.max(
      0,
      Math.ceil((limitedYDomain[1] - limitedYDomain[0]) / tileRes),
    );

    const out = ndarray(new Array(binHeight * binWidth).fill(NaN), [
      binHeight,
      binWidth,
    ]);

    // iterate through all the visible tiles
    this.visibleAndFetchedTiles().forEach((tile) => {
      const tilePos = tile.mirrored
        ? [tile.tileData.tilePos[1], tile.tileData.tilePos[0]]
        : tile.tileData.tilePos;

      // get the tile's position and width (in data coordinates)
      // if it's mirrored then we have to switch the position indeces
      const {
        tileX,
        tileY,
        tileWidth,
        tileHeight,
      } = this.getTilePosAndDimensions(
        tile.tileData.zoomLevel,
        tilePos,
        this.binsPerTile(),
      );

      // calculate the tile's position in bins
      const tileXStartBin = Math.floor(tileX / tileRes);
      const tileXEndBin = Math.floor((tileX + tileWidth) / tileRes);
      const tileYStartBin = Math.floor(tileY / tileRes);
      const tileYEndBin = Math.floor((tileY + tileHeight) / tileRes);

      // calculate which part of this tile is present in the current window
      let tileSliceXStart = Math.max(leftXBin, tileXStartBin) - tileXStartBin;
      let tileSliceYStart = Math.max(leftYBin, tileYStartBin) - tileYStartBin;
      const tileSliceXEnd =
        Math.min(leftXBin + binWidth, tileXEndBin) - tileXStartBin;
      const tileSliceYEnd =
        Math.min(leftYBin + binHeight, tileYEndBin) - tileYStartBin;

      // where in the output array will the portion of this tile which is in the
      // visible window be placed?
      const tileXOffset = Math.max(tileXStartBin - leftXBin, 0);
      const tileYOffset = Math.max(tileYStartBin - leftYBin, 0);
      const tileSliceWidth = tileSliceXEnd - tileSliceXStart;
      const tileSliceHeight = tileSliceYEnd - tileSliceYStart;

      // the region is outside of this tile
      if (tileSliceWidth < 0 || tileSliceHeight < 0) return;

      if (tile.mirrored && tileSliceXStart > tileSliceYStart) {
        const tmp = tileSliceXStart;
        tileSliceXStart = tileSliceYStart;
        tileSliceYStart = tmp;
      }

      ndarrayAssign(
        out
          .hi(tileYOffset + tileSliceHeight, tileXOffset + tileSliceWidth)
          .lo(tileYOffset, tileXOffset),
        tile.dataArray
          .hi(
            tileSliceYStart + tileSliceHeight,
            tileSliceXStart + tileSliceWidth,
          )
          .lo(tileSliceYStart, tileSliceXStart),
      );
    });

    return out;
  }

  /**
   * Convert the raw tile data to a rendered array of values which can be represented as a sprite.
   *
   * @param tile: The data structure containing all the tile information. Relevant to
   *              this function are tile.tileData = \{'dense': [...], ...\}
   *              and tile.graphics
   */
  initTile(tile) {
    super.initTile(tile);

    // prepare the data for fast retrieval in getVisibleRectangleData
    if (tile.tileData.dense.length === this.binsPerTile() ** 2) {
      tile.dataArray = ndarray(Array.from(tile.tileData.dense), [
        this.binsPerTile(),
        this.binsPerTile(),
      ]);

      // Recompute DenseDataExtrema for diagonal tiles which have been mirrored
      if (
        this.continuousScaling &&
        tile.tileData.tilePos[0] === tile.tileData.tilePos[1] &&
        tile.mirrored
      ) {
        tile.tileData.denseDataExtrema.mirrorPrecomputedExtrema();
        super.initTile(tile);
      }
    }

    // no data present
    if (this.scale.minValue === null || this.scale.maxValue === null) {
      return;
    }

    this.renderTile(tile);
  }

  // /**
  //  * Draw a border around tiles
  //  *
  //  * @param  {Array}  pixData  Pixel data to be adjusted
  //  */
  // addBorder(pixData) {
  //   for (let i = 0; i < 256; i++) {
  //     if (i === 0) {
  //       const prefix = i * 256 * 4;
  //       for (let j = 0; j < 255; j++) {
  //         pixData[prefix + (j * 4)] = 0;
  //         pixData[prefix + (j * 4) + 1] = 0;
  //         pixData[prefix + (j * 4) + 2] = 255;
  //         pixData[prefix + (j * 4) + 3] = 255;
  //       }
  //     }
  //     pixData[(i * 256 * 4)] = 0;
  //     pixData[(i * 256 * 4) + 1] = 0;
  //     pixData[(i * 256 * 4) + 2] = 255;
  //     pixData[(i * 256 * 4) + 3] = 255;
  //   }
  // }
  //
  updateTile(tile) {
    if (
      tile.scale &&
      this.scale &&
      this.scale.minValue === tile.scale.minValue &&
      this.scale.maxValue === tile.scale.maxValue
    ) {
      // already rendered properly, no need to rerender
    } else {
      // not rendered using the current scale, so we need to rerender
      this.renderTile(tile);
      this.drawColorbar();
    }
  }

  destroyTile(tile) {
    // sprite have to be explicitly destroyed in order to
    // free the texture cache
    tile.sprite.destroy(true);

    tile.canvas = null;
    tile.sprite = null;
    tile.texture = null;

    // this is a handy method for checking what's in the texture
    // cache
    // console.log('destroy', PIXI.utils.BaseTextureCache);
  }

  pixDataFunction(tile, pixData) {
    // the tileData has been converted to pixData by the worker script and
    // needs to be loaded as a sprite
    if (pixData) {
      const { graphics } = tile;
      const canvas = this.tileDataToCanvas(pixData.pixData);

      if (tile.sprite) {
        // if this tile has already been rendered with a sprite, we
        // have to destroy it before creating a new one
        tile.sprite.destroy(true);
      }

      const texture =
        GLOBALS.PIXI.VERSION[0] === '4'
          ? GLOBALS.PIXI.Texture.fromCanvas(
              canvas,
              GLOBALS.PIXI.SCALE_MODES.NEAREST,
            )
          : GLOBALS.PIXI.Texture.from(canvas, {
              scaleMode: GLOBALS.PIXI.SCALE_MODES.NEAREST,
            });

      const sprite = new GLOBALS.PIXI.Sprite(texture);

      tile.sprite = sprite;
      tile.texture = texture;
      // store the pixData so that we can export it
      tile.canvas = canvas;
      this.setSpriteProperties(
        tile.sprite,
        tile.tileData.zoomLevel,
        tile.tileData.tilePos,
        tile.mirrored,
      );

      graphics.removeChildren();
      graphics.addChild(tile.sprite);
    }
    this.renderingTiles.delete(tile.tileId);
  }

  /**
   * Render / draw a tile.
   *
   * @param {Object}  tile  Tile data to be rendered.
   */
  renderTile(tile) {
    const [scaleType] = this.updateValueScale();
    const pseudocount = 0;

    this.renderingTiles.add(tile.tileId);

    if (this.tilesetInfo.tile_size) {
      if (tile.tileData.dense.length < this.tilesetInfo.tile_size) {
        // we haven't gotten a full tile from the server so we want to pad
        // it with nan values
        const newArray = new Float32Array(this.tilesetInfo.tile_size);

        newArray.fill(NaN);
        newArray.set(tile.tileData.dense);

        tile.tileData.dense = newArray;
      }
    }

    tileProxy.tileDataToPixData(
      tile,
      scaleType,
      this.limitedValueScale.domain(),
      pseudocount, // used as a pseudocount to prevent taking the log of 0
      this.colorScale,
      (pixData) => this.pixDataFunction(tile, pixData),
      this.mirrorTiles() &&
        !tile.mirrored &&
        tile.tileData.tilePos[0] === tile.tileData.tilePos[1],
      this.options.extent === 'upper-right' &&
        tile.tileData.tilePos[0] === tile.tileData.tilePos[1],
      this.options.zeroValueColor
        ? colorToRgba(this.options.zeroValueColor)
        : undefined,
      {
        selectedRows: this.options.selectRows,
        selectedRowsAggregationMode: this.options.selectRowsAggregationMode,
        selectedRowsAggregationWithRelativeHeight: this.options
          .selectRowsAggregationWithRelativeHeight,
        selectedRowsAggregationMethod: this.options.selectRowsAggregationMethod,
      },
    );
  }

  /**
   * Remove this track from the view
   */
  remove() {
    this.gMain.remove();
    this.gMain = null;

    super.remove();
  }

  refScalesChanged(refXScale, refYScale) {
    super.refScalesChanged(refXScale, refYScale);

    objVals(this.fetchedTiles)
      .filter((tile) => tile.sprite)
      .forEach((tile) =>
        this.setSpriteProperties(
          tile.sprite,
          tile.tileData.zoomLevel,
          tile.tileData.tilePos,
          tile.mirrored,
        ),
      );
  }

  /**
   * Bypass this track's exportSVG function
   */
  superSVG() {
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
      const rotation = (tile.sprite.rotation * 180) / Math.PI;
      const g = document.createElement('g');
      g.setAttribute(
        'transform',
        `translate(${tile.sprite.x},${tile.sprite.y}) rotate(${rotation}) scale(${tile.sprite.scale.x},${tile.sprite.scale.y})`,
      );

      const image = document.createElement('image');
      image.setAttributeNS(
        'http://www.w3.org/1999/xlink',
        'xlink:href',
        tile.canvas.toDataURL(),
      );
      image.setAttribute('width', tile.canvas.width);
      image.setAttribute('height', tile.canvas.height);
      image.setAttribute('style', 'image-rendering: pixelated');

      g.appendChild(image);
      output.appendChild(g);
    }

    const gColorbar = this.exportColorBarSVG();
    track.appendChild(gColorbar);

    return [base, base];
  }

  // This function gets the indices of the visible part of the upper left tile.
  // The indices are 'rounded' to the grid used by the DenseDataExrema module.
  // It is used to determine if we should check for a new value scale in
  // the case of continuous scaling
  getVisiblePartOfUppLeftTile() {
    const tilePositions = this.visibleAndFetchedTiles().map((tile) => {
      const tilePos = tile.mirrored
        ? [tile.tileData.tilePos[1], tile.tileData.tilePos[0]]
        : tile.tileData.tilePos;
      return [tilePos[0], tilePos[1], tile.tileId];
    });

    if (tilePositions.length === 0) return null;

    let minTilePosition = tilePositions[0];

    for (let i = 0; i < tilePositions.length; i++) {
      const curPos = tilePositions[i];
      if (curPos[0] < minTilePosition[0] || curPos[1] < minTilePosition[1]) {
        minTilePosition = curPos;
      }
    }

    const numSubsets = Math.min(
      NUM_PRECOMP_SUBSETS_PER_2D_TTILE,
      this.binsPerTile(),
    );
    const subsetSize = this.binsPerTile() / numSubsets;

    const upperLeftTile = this.visibleAndFetchedTiles().filter(
      (tile) => tile.tileId === minTilePosition[2],
    )[0];

    const upperLeftTileInd = this.getIndicesOfVisibleDataInTile(upperLeftTile);

    const startX = upperLeftTileInd[0];
    const startY = upperLeftTileInd[1];
    // round to nearest grid point as used in the DenseDataExtrema Module
    const startXadjusted = startX - (startX % subsetSize);
    const startYadjusted = startY - (startY % subsetSize);

    return [upperLeftTile.tileId, startXadjusted, startYadjusted];
  }

  getIndicesOfVisibleDataInTile(tile) {
    const visibleX = this._xScale.range();
    const visibleY = this._yScale.range();

    const tilePos = tile.mirrored
      ? [tile.tileData.tilePos[1], tile.tileData.tilePos[0]]
      : tile.tileData.tilePos;

    const {
      tileX,
      tileY,
      tileWidth,
      tileHeight,
    } = this.getTilePosAndDimensions(
      tile.tileData.zoomLevel,
      tilePos,
      this.binsPerTile(),
    );

    const tileXScale = scaleLinear()
      .domain([0, this.binsPerTile()])
      .range([tileX, tileX + tileWidth]);

    const startX = Math.max(
      0,
      Math.round(tileXScale.invert(this._xScale.invert(visibleX[0]))) - 1,
    );

    const endX = Math.min(
      this.binsPerTile(),
      Math.round(tileXScale.invert(this._xScale.invert(visibleX[1]))),
    );

    const tileYScale = scaleLinear()
      .domain([0, this.binsPerTile()])
      .range([tileY, tileY + tileHeight]);

    const startY = Math.max(
      0,
      Math.round(tileYScale.invert(this._yScale.invert(visibleY[0]))) - 1,
    );

    const endY = Math.min(
      this.binsPerTile(),
      Math.round(tileYScale.invert(this._yScale.invert(visibleY[1]))),
    );

    const result =
      tile.mirrored && tilePos[0] !== tilePos[1]
        ? [startY, startX, endY, endX]
        : [startX, startY, endX, endY];

    return result;
  }

  minVisibleValue(ignoreFixedScale = false) {
    const minimumsPerTile = this.visibleAndFetchedTiles().map((tile) => {
      if (tile.tileData.denseDataExtrema === undefined) {
        return null;
      }
      const ind = this.getIndicesOfVisibleDataInTile(tile);
      return tile.tileData.denseDataExtrema.getMinNonZeroInSubset(ind);
    });

    if (minimumsPerTile.length === 0 && this.valueScaleMax === null) {
      return null;
    }

    const min = Math.min.apply(null, minimumsPerTile);

    // If there is no data or no denseDataExtrema, go to parent method
    if (min === Number.MAX_SAFE_INTEGER) {
      return super.minVisibleValue(ignoreFixedScale);
    }

    if (ignoreFixedScale) return min;

    return this.valueScaleMin !== null ? this.valueScaleMin : min;
  }

  maxVisibleValue(ignoreFixedScale = false) {
    const maximumsPerTile = this.visibleAndFetchedTiles().map((tile) => {
      if (tile.tileData.denseDataExtrema === undefined) {
        return null;
      }

      const ind = this.getIndicesOfVisibleDataInTile(tile);

      return tile.tileData.denseDataExtrema.getMaxNonZeroInSubset(ind);
    });

    if (maximumsPerTile.length === 0 && this.valueScaleMax === null) {
      return null;
    }

    const max = Math.max.apply(null, maximumsPerTile);

    // If there is no data  or no deseDataExtrema, go to parent method
    if (max === Number.MIN_SAFE_INTEGER) {
      return super.maxVisibleValue(ignoreFixedScale);
    }

    if (ignoreFixedScale) return max;

    return this.valueScaleMax !== null ? this.valueScaleMax : max;
  }

  zoomed(newXScale, newYScale, k, tx, ty) {
    if (this.brushing) {
      return;
    }

    super.zoomed(newXScale, newYScale);

    this.pMain.position.x = tx; // translateX;
    this.pMain.position.y = ty; // translateY;

    this.pMain.scale.x = k; // scaleX;
    this.pMain.scale.y = k; // scaleY;

    const isValueScaleLocked = this.isValueScaleLocked();

    if (
      this.continuousScaling &&
      this.minValue() !== undefined &&
      this.maxValue() !== undefined
    ) {
      // Get the indices of the visible part of the upper left tile.
      // Helps to determine if we zoomed far enough to justify a min/max computation
      const indUpperLeftTile = JSON.stringify(
        this.getVisiblePartOfUppLeftTile(),
      );

      if (
        this.valueScaleMin === null &&
        this.valueScaleMax === null &&
        !isValueScaleLocked &&
        // syncs the recomputation with the grid used in the DenseDataExtrema module
        indUpperLeftTile !== this.prevIndUpperLeftTile
      ) {
        const newMin = this.minVisibleValue();
        const newMax = this.maxVisibleValue();

        const epsilon = 1e-6;

        if (
          newMin !== null && // can happen if tiles haven't loaded
          newMax !== null &&
          (Math.abs(this.minValue() - newMin) > epsilon ||
            Math.abs(this.maxValue() - newMax) > epsilon)
        ) {
          this.minValue(newMin);
          this.maxValue(newMax);

          this.scheduleRerender();
        }
        this.prevIndUpperLeftTile = indUpperLeftTile;
      }

      if (isValueScaleLocked) {
        this.onValueScaleChanged();
      }
    }

    this.mouseMoveZoomHandler();
  }

  /**
   * Helper method for adding a tile ID in place. Used by `tilesToId()`.
   *
   * @param  {Array}  tiles  Array tile ID should be added to.
   * @param  {Integer}  zoomLevel  Zoom level.
   * @param  {Integer}  row  Column ID, i.e., y.
   * @param  {Integer}  column  Column ID, i.e., x.
   * @param  {Objwect}  dataTransform  ??
   * @param  {Boolean}  mirrored  If `true` tile is mirrored.
   */
  addTileId(tiles, zoomLevel, row, column, dataTransform, mirrored = false) {
    const newTile = [zoomLevel, row, column];
    newTile.mirrored = mirrored;
    newTile.dataTransform = dataTransform;
    tiles.push(newTile);
  }

  /**
   * Convert tile positions to tile IDs
   *
   * @param  {Array}  xTiles  X positions of tiles
   * @param  {Array}  yTiles  Y positions of tiles
   * @param  {Array}  zoomLevel  Current zoom level
   * @return  {Array}  List of tile IDs
   */
  tilesToId(xTiles, yTiles, zoomLevel) {
    const rows = xTiles;
    const cols = yTiles;
    const dataTransform =
      (this.options && this.options.dataTransform) || 'default';

    // if we're mirroring tiles, then we only need tiles along the diagonal
    const tiles = [];

    // calculate the ids of the tiles that should be visible
    for (let i = 0; i < rows.length; i++) {
      for (let j = 0; j < cols.length; j++) {
        if (this.mirrorTiles()) {
          if (rows[i] >= cols[j]) {
            if (this.options.extent !== 'lower-left') {
              // if we're in the upper triangular part of the matrix, then we need
              // to load a mirrored tile
              this.addTileId(
                tiles,
                zoomLevel,
                cols[j],
                rows[i],
                dataTransform,
                true,
              );
            }
          } else if (this.options.extent !== 'upper-right') {
            // otherwise, load an original tile
            this.addTileId(tiles, zoomLevel, rows[i], cols[j], dataTransform);
          }

          if (rows[i] === cols[j] && this.options.extent === 'lower-left') {
            // on the diagonal, load original tiles
            this.addTileId(tiles, zoomLevel, rows[i], cols[j], dataTransform);
          }
        } else {
          this.addTileId(tiles, zoomLevel, rows[i], cols[j], dataTransform);
        }
      }
    }

    return tiles;
  }

  calculateVisibleTiles() {
    // if we don't know anything about this dataset, no point
    // in trying to get tiles
    if (!this.tilesetInfo) {
      return;
    }

    this.zoomLevel = this.calculateZoomLevel();

    // this.zoomLevel = 0;
    if (this.tilesetInfo.resolutions) {
      const sortedResolutions = this.tilesetInfo.resolutions
        .map((x) => +x)
        .sort((a, b) => b - a);

      this.xTiles = tileProxy.calculateTilesFromResolution(
        sortedResolutions[this.zoomLevel],
        this._xScale,
        this.tilesetInfo.min_pos[0],
        this.tilesetInfo.max_pos[0],
      );
      this.yTiles = tileProxy.calculateTilesFromResolution(
        sortedResolutions[this.zoomLevel],
        this._yScale,
        this.tilesetInfo.min_pos[0],
        this.tilesetInfo.max_pos[0],
      );
    } else {
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
        this.options.reverseYAxis
          ? -this.tilesetInfo.max_pos[1]
          : this.tilesetInfo.min_pos[1],
        this.options.reverseYAxis
          ? -this.tilesetInfo.min_pos[1]
          : this.tilesetInfo.max_pos[1],
        this.tilesetInfo.max_zoom,
        this.tilesetInfo.max_width1 || this.tilesetInfo.max_width,
      );
    }

    this.setVisibleTiles(
      this.tilesToId(this.xTiles, this.yTiles, this.zoomLevel),
    );
  }

  mirrorTiles() {
    return !(
      this.tilesetInfo.mirror_tiles &&
      (this.tilesetInfo.mirror_tiles === false ||
        this.tilesetInfo.mirror_tiles === 'false')
    );
  }

  getMouseOverHtml(trackX, trackY) {
    if (!this.options || !this.options.showTooltip) {
      return '';
    }

    if (!this.tilesetInfo) {
      return '';
    }

    const currentResolution = tileProxy.calculateResolution(
      this.tilesetInfo,
      this.zoomLevel,
    );

    const maxWidth = Math.max(
      this.tilesetInfo.max_pos[1] - this.tilesetInfo.min_pos[1],
      this.tilesetInfo.max_pos[0] - this.tilesetInfo.min_pos[0],
    );

    const formatResolution = Math.ceil(
      Math.log(maxWidth / currentResolution) / Math.log(10),
    );

    this.setDataLensSize(1);

    const dataX = this._xScale.invert(trackX);
    const dataY = this._yScale.invert(trackY);

    let positionText = '<b>Position:</b> ';

    if (this.chromInfo) {
      const atcX = absToChr(dataX, this.chromInfo);
      const atcY = absToChr(dataY, this.chromInfo);

      const f = (n) => format(`.${formatResolution}s`)(n);

      positionText += `${atcX[0]}:${f(atcX[1])} & ${atcY[0]}:${f(atcY[1])}`;
      positionText += '<br/>';
    }

    let data = null;
    try {
      data = this.getVisibleRectangleData(trackX, trackY, 1, 1).get(0, 0);
    } catch (err) {
      return '';
    }

    if (this.options && this.options.heatmapValueScaling === 'log') {
      if (data > 0) {
        return `${positionText}<b>Value:</b> 1e${format('.3f')(
          Math.log(data) / Math.log(10),
        )}`;
      }

      if (data === 0) {
        return `${positionText}<b>Value:</b> 0`;
      }

      return `${positionText}<b>Value:</b> N/A`;
    }
    return `${positionText}<b>Value:</b> ${format('.3f')(data)}`;
  }

  /**
   * Get the tile's position in its coordinate system.
   *
   * @description
   * Normally the absolute coordinate system are the genome basepair positions
   */
  getTilePosAndDimensions(zoomLevel, tilePos, binsPerTileIn) {
    /**
     * Get the tile's position in its coordinate system.
     */
    const binsPerTile = binsPerTileIn || this.binsPerTile();

    if (this.tilesetInfo.resolutions) {
      const sortedResolutions = this.tilesetInfo.resolutions
        .map((x) => +x)
        .sort((a, b) => b - a);

      const chosenResolution = sortedResolutions[zoomLevel];

      const tileWidth = chosenResolution * binsPerTile;
      const tileHeight = tileWidth;

      const tileX = chosenResolution * binsPerTile * tilePos[0];
      const tileY = chosenResolution * binsPerTile * tilePos[1];

      return {
        tileX,
        tileY,
        tileWidth,
        tileHeight,
      };
    }

    const xTilePos = tilePos[0];
    const yTilePos = tilePos[1];

    const minX = this.tilesetInfo.min_pos[0];

    const minY = this.options.reverseYAxis
      ? -this.tilesetInfo.max_pos[1]
      : this.tilesetInfo.min_pos[1];

    const tileWidth = this.tilesetInfo.max_width / 2 ** zoomLevel;
    const tileHeight = this.tilesetInfo.max_width / 2 ** zoomLevel;

    const tileX = minX + xTilePos * tileWidth;
    const tileY = minY + yTilePos * tileHeight;

    return {
      tileX,
      tileY,
      tileWidth,
      tileHeight,
    };
  }

  calculateZoomLevel() {
    const minX = this.tilesetInfo.min_pos[0];
    const maxX = this.tilesetInfo.max_pos[0];

    const minY = this.tilesetInfo.min_pos[1];
    const maxY = this.tilesetInfo.max_pos[1];

    let zoomLevel = null;

    if (this.tilesetInfo.resolutions) {
      const zoomIndexX = tileProxy.calculateZoomLevelFromResolutions(
        this.tilesetInfo.resolutions,
        this._xScale,
        minX,
        maxX,
      );
      const zoomIndexY = tileProxy.calculateZoomLevelFromResolutions(
        this.tilesetInfo.resolutions,
        this._yScale,
        minY,
        maxY,
      );

      zoomLevel = Math.min(zoomIndexX, zoomIndexY);
    } else {
      const xZoomLevel = tileProxy.calculateZoomLevel(
        this._xScale,
        this.tilesetInfo.min_pos[0],
        this.tilesetInfo.max_pos[0],
        this.binsPerTile(),
      );

      const yZoomLevel = tileProxy.calculateZoomLevel(
        this._xScale,
        this.tilesetInfo.min_pos[1],
        this.tilesetInfo.max_pos[1],
        this.binsPerTile(),
      );

      zoomLevel = Math.max(xZoomLevel, yZoomLevel);
      zoomLevel = Math.min(zoomLevel, this.maxZoom);
    }

    if (this.options && this.options.maxZoom) {
      if (this.options.maxZoom >= 0) {
        zoomLevel = Math.min(this.options.maxZoom, zoomLevel);
      } else {
        console.error('Invalid maxZoom on track:', this);
      }
    }

    return zoomLevel;
  }

  /**
   * The local tile identifier
   *
   * @param {array}  tile  Tile definition array to be converted to id. Tile
   *   array must contain `[zoomLevel, xPos, yPos]` and two props `mirrored` and
   *   `dataTransform`.
   */
  tileToLocalId(tile) {
    // tile
    if (tile.dataTransform && tile.dataTransform !== 'default') {
      return `${tile.join('.')}.${tile.mirrored}.${tile.dataTransform}`;
    }
    return `${tile.join('.')}.${tile.mirrored}`;
  }

  /**
   * The tile identifier used on the server
   */
  tileToRemoteId(tile) {
    // tile contains [zoomLevel, xPos, yPos]
    if (tile.dataTransform && tile.dataTransform !== 'default') {
      return `${tile.join('.')}.${tile.dataTransform}`;
    }
    return `${tile.join('.')}`;
  }

  localToRemoteId(remoteId) {
    const idParts = remoteId.split('.');
    return idParts.slice(0, idParts.length - 1).join('.');
  }
}

export default HeatmapTiledPixiTrack;
