import { bisectLeft } from 'd3-array';
import { color as d3Color } from 'd3-color';
import hull from 'hull.js';
import clip from 'liang-barsky';
import * as PIXI from 'pixi.js';

import { pubSub } from './services';
import { transitionGroup } from './services/transition';

import {
  addClass,
  addEventListenerOnce,
  canvasLinearGradient,
  colorToHex,
  coterminalAngleRad,
  degToRad,
  flatten,
  getAngleBetweenPoints,
  getClusterPropAcc,
  lDist,
  objToTransformStr,
  removeClass,
} from './utils';

import style from '../styles/Insets2dTrack.module.scss';

const BASE_MIN_SIZE = 12;
const BASE_MAX_SIZE = 24;
const BASE_SCALE = 4;
const BASE_SCALE_UP = 1.25;
const PILE_ORIENTATION = 'bottom';
const PREVIEW_SPACING = 1;

const getBaseRes = tilesetInfo => (
  tilesetInfo.max_width /
  (2 ** tilesetInfo.max_zoom) /
  tilesetInfo.bins_per_dimension
);

const pixiToOrigEvent = f => event => f(event.data.originalEvent);

export default class Inset {
  constructor(
    label,
    id,
    dataConfig,
    tilesetInfo,
    options,
    mouseHandler,
    dataType,
  ) {
    this.label = label;
    this.id = id;
    this.dataConfig = dataConfig;
    this.tilesetInfo = tilesetInfo;
    this.options = options;
    this.mouseHandler = mouseHandler;
    this.dataType = dataType;
    this.isRenderToCanvas = true;

    this.isMatrix = this.dataType === 'cooler';
    this.t = this.isMatrix ? -1 : 1;

    this.d = Infinity;
    this.relD = 1;

    this.fetching = -1;

    this.gMain = new PIXI.Graphics();
    this.gBorder = new PIXI.Graphics();
    this.gLeaderLine = new PIXI.Graphics();
    this.gOrigin = new PIXI.Graphics();

    this.gMain.addChild(this.gOrigin);
    this.gMain.addChild(this.gLeaderLine);
    this.gMain.addChild(this.gBorder);

    this.previewsHeight = 0;
    this.prvData = [];
    this.imgs = [];
    this.prvs = [];
    this.prvWrappers = [];
    this.imgWrappers = [];
    this.imgRatios = [];

    this.cssGrads = {};

    this.minSize = this.options.minSize || BASE_MIN_SIZE;
    this.maxSize = this.options.maxSize || BASE_MAX_SIZE;
    this.padding = this.options.padding || 0;
    this.paddingCustom = this.options.paddingCustom || {};
    this.resolution = this.options.resolution || this.maxSize;
    this.resolutionCustom = this.options.resolutionCustom || {};
    this.scaleBase = this.options.scale || BASE_SCALE;
    this.additionalZoom = this.options.additionalZoom || 0;
    this.onClickScale = this.options.onClickScale || BASE_SCALE_UP;
    this.pileOrientaton = this.options.pileOrientaton || PILE_ORIENTATION;
    this.previewSpacing = this.options.previewSpacing || PREVIEW_SPACING;

    this.scaleExtra = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.globalOffsetX = 0;
    this.globalOffsetY = 0;
    this.fetchAttempts = 0;
    this.imScale = 1;
    this.leaderLineAngle = 0;

    this.borderStyle = [1, 0x000000, 0.33];
    this.borderPadding = options.borderWidth * 2 || 4;
    this.borderFill = options.borderColor;
    this.borderFillAlpha = options.borderOpacity || 1;

    this.selectColor = options.selectColor;

    this.leaderLineStubWidthMin = (
      this.options.leaderLineStubWidthMin || this.options.leaderLineStubWidth
    );
    this.leaderLineStubWidthVariance = (
      this.options.leaderLineStubWidthMax - this.options.leaderLineStubWidthMin
    ) || 0;

    this.leaderLineStyle = [
      options.leaderLineWidth || 1,
      colorToHex(options.leaderLineColor),
      options.leaderLineOpacity || 1
    ];

    this.originStyle = [
      options.leaderLineWidth || 1,
      colorToHex(options.selectColor),
      1
    ];

    this.prevHeightPx = 0;

    if (this.options.scaleBorderBy) {
      this.borderPropAcc = getClusterPropAcc(
        this.options.scaleBorderBy
      );
    }

    this.mouseOverHandlerBound = this.mouseOverHandler.bind(this);
    this.mouseOutHandlerBound = this.mouseOutHandler.bind(this);
    this.mouseDownHandlerBound = this.mouseDownHandler.bind(this);
    this.mouseClickRightHandlerBound = this.mouseClickRightHandler.bind(this);
    this.mouseUpHandlerBound = this.mouseUpHandler.bind(this);
    this.mouseClickGlobalHandlerBound = this.mouseClickGlobalHandler.bind(this);

    this.initGraphics(options);
  }

  /* --------------------------- Getter / Setter ---------------------------- */

  /**
   * Return the main graphics of this class, which is `gMain`.
   * @return  {PIXI.Graphics}  Main graphics pbject.
   */
  get graphics() {
    return this.gMain;
  }

  /**
   * Return the number of annotations represented by the inset
   * @return  {number}  Number of annotations.
   */
  get numLabels() {
    return this.label.src.size;
  }

  /* ---------------------------- Custom Methods ---------------------------- */

  /**
   * Set the base HTML element
   * @param   {object}  baseElement  DOM element.
   */
  baseEl(baseElement) {
    this.baseElement = baseElement;
  }
  /**
   * Blur visually focused insert by changing back to the default border color.
   */
  blur(isPermanent = false) {
    this.isPermanentFocus = isPermanent ? false : this.isPermanentFocus;
    if (this.isRenderToCanvas) this.clearBorder();
    this.drawBorder();
  }

  /**
   * Draw inset border.
   *
   * @param  {Number}  x  X position of the inset to be drawn.
   * @param  {Number}  y  Y position of the inset to be drawn.
   * @param  {Number}  width  Width of the inset to be drawn.
   * @param  {Number}  height  Height of the inset to be drawn.
   */
  drawBorder(
    x = this.x,
    y = this.y,
    width = this.width,
    height = this.height,
    graphics = this.gBorder,
    radius = this.options.borderRadius,
    fill = this.borderFill,
  ) {
    const prevHeight = this.prvs.length
      ? (
        (this.previewsHeight * this.scaleBase * this.scaleExtra * this.imScale) +
        ((this.prvs.length - 1) * this.previewSpacing)
      )
      : 0;

    const [vX, vY] = this.computeBorderPosition(
      x, y, width, height, radius, fill, graphics
    );

    if (!this.border) {
      this.renderBorder(x, y, width, height, radius, fill, graphics);
    }

    let borderWidthExtra = 0;
    // Get extra border scale if `scaleBorderBy` option is set
    if (this.options.scaleBorderBy && this.borderScale) {
      borderWidthExtra = this.borderScale(this.borderPropAcc(this.label.src)) - 1;
    }

    const widthFinal = width + (2 * borderWidthExtra);
    const heightFinal = height + (2 * borderWidthExtra);

    this.positionBorder(
      vX - borderWidthExtra,
      vY - borderWidthExtra,
      widthFinal + this.borderPadding,
      heightFinal + prevHeight + this.borderPadding
    );
    this.styleBorder(fill, radius);
  }

  styleBorder(...args) {
    if (this.isRenderToCanvas) return;
    this.styleBorderHtml(...args);
  }

  /**
   * Style the HTML border
   * @param   {number}  radius  Radius of the corner in pixel.
   * @param   {D3.Color}  fill  Fill color.
   */
  styleBorderHtml(fill, radius) {
    const _fill = this.isPermanentFocus ? this.selectColor : fill;

    this.border.style.background = _fill.toString();
    this.border.style.borderRadius = `${radius}px`;

    if (this.isHovering) {
      addClass(this.border, style['inset-focus']);
    } else {
      removeClass(this.border, style['inset-focus']);
    }
  }

  /**
   * Position border. Just a helper function forwarding the call to the canvas
   *   or HTML positioner.
   */
  positionBorder(...args) {
    if (this.isRenderToCanvas) return this.positionBorderCanvas(...args);
    return this.positionBorderHtml(...args);
  }

  /**
   * Position border for drawing on canvas
   * @param  {number}  x  X position in pixel.
   * @param  {number}  y  Y position in pixel.
   * @param  {number}  width  Width of the border in pixel.
   * @param  {number}  height  Height of the border in pixel.
   */
  positionBorderCanvas(x, y, width, height) {
    this.border.x = x + this.globalOffsetX;
    this.border.y = y + this.globalOffsetY;
    this.border.width = width;
    this.border.height = height;
  }

  /**
   * Position border for drawing on HTML
   * @param  {number}  x  X position in pixel.
   * @param  {number}  y  Y position in pixel.
   * @param  {number}  width  Width of the border in pixel.
   * @param  {number}  height  Height of the border in pixel.
   */
  positionBorderHtml(x, y, width, height) {
    this.border.style.width = `${width}px`;
    this.border.style.height = `${height}px`;
    this.border.__transform__.translate = [
      { val: x, type: 'px' }, { val: y, type: 'px' }
    ];
    this.border.style.transform = objToTransformStr(this.border.__transform__);
  }

  /**
   * Render border. Just a helper function forwarding the call to the canvas
   *   or HTML positioner.
   */
  renderBorder(...args) {
    if (this.isRenderToCanvas) return this.renderBorderCanvas(...args);
    return this.renderBorderHtml(...args);
  }

  /**
   * Render border on canvas
   * @param  {number}  x  X position in pixel.
   * @param  {number}  y  Y position in pixel.
   * @param  {number}  width  Width of the border in pixel.
   * @param  {number}  height  Height of the border in pixel.
   * @param  {number}  radius  Radius of the corner in pixel.
   * @param  {D3.Color}  fill  Fill color.
   * @param  {PIXI.Graphics}  graphics  Graphics to draw on
   */
  renderBorderCanvas(x, y, width, height, radius, fill, graphics) {
    const ratio = width / height;
    const maxBorderSize = this.maxSize * this.onClickScale * this.scaleBase;
    if (this.tweenStop) this.tweenStop();
    this.border = this.createRect(
      (ratio >= 1
        ? maxBorderSize
        : maxBorderSize * ratio) + this.borderPadding,
      (ratio <= 1
        ? maxBorderSize
        : maxBorderSize / ratio) + this.borderPadding,
      radius,
      fill
    );
    graphics.addChild(this.border);
  }

  /**
   * Render border on HTML.
   */
  renderBorderHtml() {
    this.border = this.border || document.createElement('div');
    // The CSS transform rule is annoying because it combines multiple
    // properties into one definition string so when updating one of those we
    // need to make sure we don't overwrite existing properties. To make our
    // lifes easier we'll store things as an object on the DOM element and
    // convert this object into a transform definition string all the time
    // instead of setting the string directly.
    this.border.__transform__ = {};

    this.border.className = style.inset;
    this.baseElement.appendChild(this.border);
    this.addEventListeners();
  }

  addEventListeners() {
    this.border.addEventListener(
      'mouseenter', this.mouseOverHandlerBound, true
    );
    this.border.addEventListener(
      'mouseleave', this.mouseOutHandlerBound, true
    );
    this.border.addEventListener(
      'mousedown', this.mouseDownHandlerBound, true
    );
    this.border.addEventListener(
      'contextmenu', this.mouseClickRightHandlerBound, true
    );
    // Unfortunately D3's zoom behavior is too aggressive and kills all local
    // mouseup event, which is why we have to listen for a global mouse up even
    // here.
    pubSub.subscribe('mouseup', this.mouseUpHandlerBound);
    pubSub.subscribe('click', this.mouseClickGlobalHandlerBound);
  }

  removeEventListeners() {
    this.border.removeEventListener('mouseenter', this.mouseOverHandlerBound);
    this.border.removeEventListener('mouseleave', this.mouseOutHandlerBound);
    this.border.removeEventListener('mousedown', this.mouseDownHandlerBound);
    this.border.removeEventListener('contextmenu', this.mouseClickRightHandlerBound);
    pubSub.unsubscribe('mouseup', this.mouseUpHandlerBound);
    pubSub.unsubscribe('click', this.mouseClickGlobalHandlerBound);
  }

  /**
   * Clear and initialize graphics.
   *
   * @param  {Object}  options  Custom line style for the border and leader line
   */
  clear(options = this.options) {
    if (this.tweenStop) this.tweenStop(1);
    this.gOrigin.clear();
    this.gBorder.clear();
    this.gLeaderLine.clear();
    this.gMain.clear();
    this.initGraphics(options);
  }

  /**
   * Remove children and destroy border sprite.
   */
  clearBorder() {
    if (this.tweenStop) this.tweenStop(1);
    this.gBorder.removeChildren();
    this.border.destroy();
    this.border = undefined;
  }

  /**
   * Compute the x, y, width, and height of the inset in view coordinates.
   * @param   {number}  x  X position of the inset at the original position.
   * @param   {number}  y  Y position of the inset at the original position.
   * @param   {number}  width  Original width
   * @param   {number}  height  Original height
   * @param   {boolean}  isAbs  If `true` return `[xStart, yStart, xEnd, yEnd]`.
   * @return  {array}  X, Y, width, and height of the inset in view coordinates.
   */
  computeBorderPosition(
    x = this.x,
    y = this.y,
    width = this.width,
    height = this.height,
    padding = this.borderPadding,
    isAbs = false,
  ) {
    const finalX = x - (width / 2);
    const finalY = y - (height / 2);

    return [
      finalX - (padding / 2),
      finalY - (padding / 2),
      (isAbs * finalX) + (width * this.scaleExtra) + padding,
      (isAbs * finalY) + (height * this.scaleExtra) + padding,
    ];
  }

  /**
   * "Compute" the x, y, width, and height of the border of the origin. This
   *   is more of a convenience function to save code duplication
   * @return  {array}  X, y, width, and height of the original annotation.
   */
  computeBorderOriginPosition() {
    return [
      this.originX,
      this.originY,
      this.originWidthHalf * 2,
      this.originHeightHalf * 2
    ];
  }

  /**
   * Compute and cache CSS gradients
   * @param   {[type]}  color  [description]
   * @return  {[type]}  [description]
   */
  compCssGrad(color, def, id = 0) {
    const colorId = `${color.toString()}.${id}`;
    if (this.cssGrads[colorId]) return this.cssGrads[colorId];

    const _color = d3Color(color);
    const colors = [];
    Object.keys(def)
      .map(percent => +percent)
      .sort()
      .forEach((percent) => {
        _color.opacity = def[percent];
        colors.push(`${_color.toString()} ${percent * 100}%`);
      });

    this.cssGrads[colorId] = `linear-gradient(to right, ${colors.join(', ')})`;

    return this.cssGrads[colorId];
  }

  compImgScale() {
    // Scale the image down from its raw resolution to the inset's pixel size
    this.imScale = (
      Math.max(this.width, this.height) /
      this.scaleBase /
      Math.max(this.imgData.width, this.imgData.height)
    );
  }

  /**
   * Compute view position of the image given a [x,y] location and the width
   *   and height.
   * @param  {Number}  x  X position of the inset to be drawn.
   * @param  {Number}  y  Y position of the inset to be drawn.
   * @param  {Number}  width  Width of the inset to be drawn.
   * @param  {Number}  height  Height of the inset to be drawn.
   */
  computeImagePosition(
    x = this.x, y = this.y, width = this.width, height = this.height
  ) {
    return {
      x: (
        this.globalOffsetX + (this.offsetX * this.t) + x - (width / 2 * this.t)
      ),
      y: (
        this.globalOffsetY + (this.offsetY * this.t) + y - (height / 2 * this.t)
      ),
      scaleX: (
        this.t * this.scaleBase * this.scaleExtra * this.imScale
      ),
      scaleY: (
        this.t * this.scaleBase * this.scaleExtra * this.imScale
      ),
    };
  }

  /**
   * Compute the truncated endpoints of the leader line
   * @return  {array}  Tuple of the two end points in form of `[x, y]`
   */
  computerLeaderLineEndpoints() {
    const rectInset = this.computeBorderPosition(
      this.x, this.y, this.width, this.height, 0, true
    );
    const rectOrigin = this.computeBorderPosition(
      ...this.computeBorderOriginPosition(), 0, true
    );

    const pInset = [this.x, this.y];
    const pOrigin = [this.originX, this.originY];

    // Get the point on the border of the inset that intersects with the leader
    // line by clipping of the origin, i.e., the point not being within the
    // inset as illustrated:
    //  1) ___________                 2) ___________
    //     |         |     _____          |         |
    //     |         |     |   |          |         |
    //     |    i----X-----Y-o |   >>>    |    i----o
    //     |         |     |   |          |         |
    //     |         |     ¯¯¯¯¯          |         |
    //     ¯¯¯¯¯¯¯¯¯¯¯                    ¯¯¯¯¯¯¯¯¯¯¯
    // where i is the center of the inset (given) and o is the center of the
    // origin (given) and X and Y are the intersection of the leader line with
    // the insets and annotation bounding box. In order to get X we clip the
    // path between i and o such that i remains the same and o gets clipped (2).
    // Therefore the new location of i is the clipped point o!
    const pInsetNew = pOrigin.slice();
    clip(pInset.slice(), pInsetNew, rectInset);

    const pOriginNew = pInset.slice();
    clip(pOriginNew, pOrigin.slice(), rectOrigin);

    return [pInsetNew, pOriginNew];
  }

  /**
   * Compute view position of the preview's image given a [x,y] location and
   *   the width and height.
   * @param  {Number}  x  X position of the inset to be drawn.
   * @param  {Number}  y  Y position of the inset to be drawn.
   * @param  {Number}  width  Width of the inset to be drawn.
   * @param  {Number}  height  Height of the inset to be drawn.
   */
  computePreviewsPosition(
    x = this.x,
    y = this.y,
    width = this.width,
    height = this.height,
    orientation = this.pileOrientaton,
  ) {
    // Scale the image down from its raw resolution to the inset's pixel size
    this.imScale = (
      Math.max(width, height) /
      this.scaleBase /
      Math.max(this.imgData.width, this.imgData.height)
    );

    const scale = this.scaleBase * this.scaleExtra * this.imScale;
    this.prevHeightPx = (
      (this.previewsHeight * scale) +
      ((this.numLabels - 1) * this.previewSpacing)
    );
    // const yOff = orientation === 'bottom'
    //   ? (height / 2) + 4
    //   : -(height / 2) - 2;

    const yT = this.t * (1 - (2 * (orientation === 'top')));

    return {
      x: (
        this.globalOffsetX + (this.offsetX * this.t) + x - (width / 2 * this.t)
      ),
      y: (
        this.globalOffsetY + (this.offsetY * this.t) + y - (height / 2 * yT)
      ),
      scaleX: (
        this.t * scale
      ),
      scaleY: (
        this.t * scale
      ),
    };
  }

  /**
   * Compute the padded remote size of the locus defining this inset. This
   *   method basically expands the remote size by the relative padding.
   *
   * @example Assuming the remote data is given in base pairs (bp) and the
   *   longest side of the locus is 8000bp with a padding of 0.2 then the
   *   final padded remote size is `8000 + (8000 * 0.2 * 2) = 11200`.
   */
  computeRemotePaddedSize() {
    this.remotePaddedSizes = this.remoteSizes
      .map(size => size + (size * this.getPadding(size) * 2));
  }

  /**
   * Compute the remote size of the locus defining this inset and the final
   *   resolution.
   */
  computeResolution() {
    const resolutionCustomLocSorted = Object.keys(this.resolutionCustom)
      .map(x => +x)
      .sort((a, b) => a - b);

    // Assumption: all remote positions have the same length (either 4 or 6)
    const isBedpe = this.remotePos[0].length === 6;
    const xStartId = isBedpe ? 1 : 0;
    const xEndId = isBedpe ? 2 : 1;
    const yStartId = isBedpe ? 4 : 2;
    const yEndId = isBedpe ? 5 : 3;

    this.remoteSizes = this.renderedPos.map((pos) => {
      const absXLen = pos[xEndId] - pos[xStartId];
      const absYLen = pos[yEndId] - pos[yStartId];
      return Math.max(absXLen, absYLen);
    });

    this.finalRes = this.remoteSizes.map((remoteSize) => {
      const entry = resolutionCustomLocSorted[bisectLeft(
        resolutionCustomLocSorted, remoteSize
      )];

      return (entry ? this.resolutionCustom[entry] : this.resolution);
    });
  }

  /**
   * Compute the closest zoom level providing enough resolution for displaying
   * the snippet at maximum size
   *
   * @return  {Number}  Closest zoom level.
   */
  computedZoom(i = 0) {
    const finalRes = this.finalRes[i];
    const remotePos = this.remotePos[i];
    const remotePaddedSize = this.remotePaddedSizes[i];
    const isBedpe = remotePos.length === 6;
    const baseRes = isBedpe ? getBaseRes(this.tilesetInfo) : 1;

    const zoomLevel = Math.max(0, Math.min(
      this.tilesetInfo.max_zoom,
      Math.ceil(Math.log2(
        (
          finalRes * (2 ** this.tilesetInfo.max_zoom)
        ) / (remotePaddedSize / baseRes)
      ))
    ));

    const finalZoom = isBedpe
      ? this.tilesetInfo.max_zoom - zoomLevel
      : zoomLevel;

    return finalZoom;
  }

  /**
   * Create a rounded rectangular sprite.
   * @param   {number}  width  Width of the rectangle in pixel.
   * @param   {number}  height  Height of the rectangle in pixel.
   * @param   {number}  radius  Border radius in pixel.
   * @return  {object}  PIXI.Sprite of the rounded rectangular.
   */
  createRect(
    width = this.width,
    height = this.height,
    radius = 0,
    fill = this.borderFill,
  ) {
    const rect = new PIXI.Graphics()
      .beginFill(colorToHex(fill))
      .drawRoundedRect(0, 0, width, height, radius)
      .endFill()
      .generateCanvasTexture();

    return new PIXI.Sprite(rect);
  }

  setDataPos(remotePos, renderedPos, dataPos) {
    this.remotePos = remotePos;
    this.renderedPos = renderedPos || this.remotePos;
    this.dataPos = dataPos;

    // Compute final resolution of inset
    this.computeResolution();
    this.computeRemotePaddedSize();
  }

  /**
   * Destroy graphics and unset data.
   */
  destroy() {
    if (this.tweenStop) this.tweenStop();
    if (this.img) this.img.removeAllListeners();

    this.isDestroyed = true;

    this.gOrigin.destroy();
    this.gBorder.destroy();
    this.gLeaderLine.destroy();
    this.gMain.destroy();

    this.data = null;
    this.img = null;

    if (this.isRenderToCanvas) {
      this.border = null;
    } else {
      this.removeEventListeners();
      this.baseElement.removeChild(this.border);
      this.baseElement.removeChild(this.leaderLine);
      this.border = null;
      this.leaderLine = null;
      this.leaderLineStubA = null;
      this.leaderLineStubB = null;
      this.imgsRendering = null;
      this.previewsRendering = null;
      this.imgData = null;
      this.prvData = [];
      this.imgs = [];
      this.prvs = [];
      this.prvWrappers = [];
      this.imgWrappers = [];
      this.imgRatios = [];
      this.imgsWrapper = null;
      this.imgsWrapperLeft = null;
      this.imgsWrapperRight = null;
      this.prvsWrapper = null;
    }
  }

  /**
   * Set or get the distance of the inset to the mouse cursor.
   * @param   {number}  d  Eucledian distance to the mouse cursor.
   * @param   {number}  d  Relative distance to the mouse cursor.
   * @return  {array}  Eucledian and relative distance to the mouse cursor.
   */
  distance(d = this.d, relD = this.relD) {
    this.d = d;
    this.relD = relD;
    return [d, relD];
  }

  /**
   * Wrapper function for complete drawing.
   * @return  {promise}  Resolving to true once everything has been drawn.
   */
  draw() {
    this.drawLeaderLine();
    this.drawBorder();
    return this.drawImage(this.label.src.isChanged).then(() => {
      this.label.src.changed(false);
    });
  }

  /**
   * Draw leader line.
   * @param   {D3.Color}  color  Color.
   */
  drawLeaderLine(color = this.leaderLineColor) {
    let pointFrom = [this.originX, this.originY];
    let pointTo = [this.x, this.y];
    let dist = lDist(pointFrom, pointTo);

    if (
      this.options.leaderLineStubLength * 1.5 < dist ||
      this.options.leaderLineFading
    ) {
      // Calculate the truncated start and end points
      [pointFrom, pointTo] = this.computerLeaderLineEndpoints();
      dist = lDist(pointFrom, pointTo);
    }

    this.renderLeaderLine(pointFrom, pointTo, dist, color);
  }

  /**
   * Render the leader line between the inset and the origin.
   * @return  {array}  List of PIXI.Sprite objects of the leader line.
   */
  renderLeaderLine(pointFrom, pointTo, dist, color = this.options.leaderLineColor) {
    if (this.options.leaderLineStubLength) {
      return this.renderLeaderLineStubs(pointFrom, pointTo, dist, color);
    }

    if (this.options.leaderLineFading) {
      return this.renderLeaderLineGrd(pointFrom, pointTo, dist, color);
    }

    return this.renderLeaderLinePlain(pointFrom, pointTo, dist, color);
  }

  /**
   * Render plain leader line. Just a forwader to the canvas and HTML renderer.
   */
  renderLeaderLinePlain(...args) {
    if (this.isRenderToCanvas) return this.renderLeaderLinePlainCanvas(...args);
    return this.renderleaderLineHtml(...args);
  }

  /**
   * Render plain leader line on canvas.
   * @param   {array}  pointFrom  Tuple in form of `[x,y]`.
   * @param   {array}  pointTo  Tuple in form of `[x,y]`.
   */
  renderLeaderLinePlainCanvas(pointFrom, pointTo) {
    this.gLeaderLine.clear();
    this.gLeaderLine.lineStyle(
      this.leaderLineStyle[0],
      this.isHovering ? colorToHex(this.selectColor) : this.leaderLineStyle[1],
      this.leaderLineStyle[2]
    );

    // Origin
    this.gLeaderLine.moveTo(
      pointFrom[0] + this.globalOffsetX,
      pointFrom[1] + this.globalOffsetY
    );

    // Inset position
    this.gLeaderLine.lineTo(
      pointTo[0] + this.globalOffsetX,
      pointTo[1] + this.globalOffsetY
    );
  }

  /**
   * Render all types of leader lines on HTML.
   * @param   {array}  pointFrom  Tuple in form of `[x,y]`.
   * @param   {array}  pointTo  Tuple in form of `[x,y]`.
   * @param   {number}  dist  Eucledian distance between `pointFrom` and
   *   `pointTo`.
   * @param   {D3.Color}  color  Color.
   */
  renderleaderLineHtml(pointFrom, pointTo, dist, color) {
    const ll = this.leaderLine || document.createElement('div');

    ll.className = style['inset-leader-line'];
    ll.style.width = `${dist}px`;
    ll.style.height = `${this.leaderLineStyle[0]}px`;

    const _color = this.isHovering ? this.options.selectColor : color;

    if (this.options.leaderLineStubLength) {
      let stubA = this.leaderLineStubA;
      let stubB = this.leaderLineStubB;

      if (!stubA || !stubB) {
        stubA = document.createElement('div');
        stubB = document.createElement('div');

        stubA.className = style['inset-leader-line-stub-left'];
        stubB.className = style['inset-leader-line-stub-right'];
      }

      const gradientA = this.compCssGrad(_color, { 0: 1, 1: 0 }, 0);
      const gradientB = this.compCssGrad(_color, { 0: 0, 1: 1 }, 1);

      stubA.style.background = gradientA;
      stubB.style.background = gradientB;

      const width = Math.max(
        this.options.leaderLineStubLength,
        dist * (1 - this.relD)
      );
      const lineWidth = (
        this.leaderLineStubWidthMin
        + (this.leaderLineStubWidthVariance * this.relD)
      );

      stubA.style.width = `${Math.round(width)}px`;
      stubA.style.height = `${lineWidth}px`;
      stubB.style.width = `${Math.round(width)}px`;
      stubB.style.height = `${lineWidth}px`;

      if (
        this.leaderLineStubA !== stubA ||
        this.leaderLineStubB !== stubB
      ) {
        ll.appendChild(stubA);
        ll.appendChild(stubB);
        this.leaderLineStubA = stubA;
        this.leaderLineStubB = stubB;
      }
    } else if (this.options.leaderLineFading) {
      ll.style.background = this.compCssGrad(
        _color, this.options.leaderLineFading
      );
    } else {
      ll.style.background = _color.toString();
    }

    this.getClosestRadChange(pointFrom, pointTo);

    const yOff = Math.round(this.leaderLineStyle[0] / 2);

    ll.style.left = `${pointFrom[0]}px`;
    ll.style.top = `${pointFrom[1] - yOff}px`;
    ll.style.transform = `rotate(${this.leaderLineAngle}rad)`;

    if (this.leaderLine !== ll) {
      this.baseElement.appendChild(ll);
      this.leaderLine = ll;
    }
  }

  /**
   * Compute the closest angle change in radians. Compare the "normal" new
   *   angle and it's coterminal counterpart.
   * @param   {array}  pointFrom  Tuple in form of `[x,y]`.
   * @param   {array}  pointTo  Tuple in form of `[x,y]`.
   * @return  {number}  Radians of the closest angle in terms of the numerical
   *   distance between the old and new angle.
   */
  getClosestRadChange(pointFrom, pointTo) {
    const oldAngle = this.leaderLineAngle;
    const newAngle = getAngleBetweenPoints(pointFrom, pointTo);
    const ctAngle = coterminalAngleRad(newAngle, newAngle < 0);

    this.leaderLineAngle = (
      Math.abs(oldAngle - newAngle) > Math.abs(oldAngle - ctAngle)
    ) ? ctAngle : newAngle;

    return this.leaderLineAngle;
  }

  /**
   * Render gradient leader line. Just a forwader to the canvas and HTML
   *   renderer.
   */
  renderLeaderLineGrd(...args) {
    if (this.isRenderToCanvas) return this.renderLeaderLineGrdCanvas(...args);
    return this.renderleaderLineHtml(...args);
  }

  /**
   * Render fading leader line a relative multistep color gradient.
   * @param   {array}  pointFrom  Tuple of form [x,y].
   * @param   {array}  pointTo  Tuple of form [x,y].
   * @param   {object}  color  RGBA D3 color object.
   * @return  {array}  List of PIXI.Sprite objects of the leader line.
   */
  renderLeaderLineGrdCanvas(pointFrom, pointTo, color = this.options.leaderLineColor) {
    const _color = d3Color((this.isHovering
      ? this.options.selectColor
      : color
    ));

    const colorSteps = {};
    Object.keys(this.options.leaderLineFading).forEach((step) => {
      _color.opacity = this.options.leaderLineFading[step];
      colorSteps[step] = _color.toString();
    });

    const gradient = new PIXI.Sprite(
      PIXI.Texture.fromCanvas(canvasLinearGradient(
        lDist(pointFrom, pointTo),
        this.options.leaderLineWidth || 2,
        colorSteps
      ))
    );
    // Set the rotation center to [0, half height]
    gradient.pivot.set(0, this.options.leaderLineWidth / 2);

    gradient.x = pointTo[0] + this.globalOffsetX;
    gradient.y = pointTo[1] + this.globalOffsetY;
    gradient.rotation = getAngleBetweenPoints(
      [this.originX, this.originY],
      [this.x, this.y]
    );

    this.gLeaderLine.removeChildren();
    this.gLeaderLine.addChild(gradient);

    this.gLeaderLineGrd = [gradient];

    return this.gLeaderLineGrd;
  }

  /**
   * Render stub leader line. Just a forwader to the canvas and HTML renderer.
   */
  renderLeaderLineStubs(...args) {
    if (this.isRenderToCanvas) return this.renderLeaderLineStubsCanvas(...args);
    return this.renderleaderLineHtml(...args);
  }

  /**
   * Render leader line stubs consisting of two absolute-sized color gradients.
   * @param   {array}  pointFrom  Tuple of form [x,y].
   * @param   {array}  pointTo  Tuple of form [x,y].
   * @param   {object}  color  RGBA D3 color object.
   * @return  {array}  List of PIXI.Sprite objects of the leader line.
   */
  renderLeaderLineStubsCanvas(pointFrom, pointTo, color = this.options.leaderLineColor) {
    const _color = d3Color((this.isHovering
      ? this.options.selectColor
      : color
    ));

    const colorFrom = Object.assign(_color.rgb(), { opacity: 1 }).toString();
    const colorTo = Object.assign(_color.rgb(), { opacity: 0 }).toString();

    const dist = lDist(pointFrom, pointTo);
    const width = Math.max(
      this.options.leaderLineStubLength,
      dist * (1 - this.relD)
    );
    const lineWidth = (
      this.leaderLineStubWidthMin
      + (this.leaderLineStubWidthVariance * this.relD)
    );

    const gradient = PIXI.Texture.fromCanvas(canvasLinearGradient(
      width,
      lineWidth || 2,
      { 0: colorFrom, 1: colorTo }
    ));

    const angle = getAngleBetweenPoints(
      [this.originX, this.originY],
      [this.x, this.y]
    );

    const gradientFrom = new PIXI.Sprite(gradient);
    const gradientTo = new PIXI.Sprite(gradient);

    // Set the rotation center to [0, half height]
    gradientFrom.pivot.set(0, this.options.leaderLineWidth / 2);
    gradientTo.pivot.set(0, this.options.leaderLineWidth / 2);

    gradientFrom.x = pointTo[0];
    gradientFrom.y = pointTo[1];
    gradientFrom.rotation = angle;

    gradientTo.x = pointFrom[0];
    gradientTo.y = pointFrom[1];
    gradientTo.rotation = angle + degToRad(180);

    this.gLeaderLine.removeChildren();
    this.gLeaderLine.addChild(gradientFrom);
    this.gLeaderLine.addChild(gradientTo);

    this.gLeaderLineGrd = [gradientFrom, gradientTo];

    return this.gLeaderLineGrd;
  }

  /**
   * Draw the image of the inset (i.e., a matrix snippet or image snippet)
   *
   * @param  {Function}  renderer  Image renderer, i.e., function converting
   *   the data into canvas.
   * @param  {Boolean}  force  If `true` forces a rerendering of the image.
   */
  drawImage(force = false, requestId = null) {
    if (this.fetchAttempts >= 2) {
      return Promise.reject('Could not fetch the inset\'s images');
    }

    if (!this.imgData || force) {
      if (!this.inFlight || force) {
        this.imgs = [];
        this.imgsRendering = null;
        this.imgData = null;
        this.dataTypes = [];
        this.prvData = [];

        this.inFlight = this.fetchData()
          .then((data) => {
            if (
              this.isDestroyed || data.requestId !== this.fetching
            ) return Promise.resolve();

            if (
              this.numLabels === this.remotePos.length ||
              Math.min(4, this.numLabels) === Math.min(4, data.fragments.length) ||
              !force
            ) {
              // When reloading insets we might trigger several reloads before
              // the data arrived. To avoid inconsistencies only render when the
              // most recent data arrived.
              this.dataTypes = data.dataTypes;
              this.imgData = data.fragments;
              this.prvData = data.previews;
              this.inFlight = false;

              return this.drawImage(false, data.requestId);
            }

            this.inFlight = false;

            return Promise.reject(
              'Fetch data resulted in a hiccup. Image not rendered.'
            );
          });
      }
      return this.inFlight;
    }

    const imageRendered = this.renderImage(this.imgData, force, requestId)
      .then(() => {
        if (
          this.isDestroyed ||
          (requestId !== null && requestId !== this.fetching) ||
          this.imgData === null
        ) return true;

        this.compImgScale();
        this.positionImage();
        return true;
      })
      .catch((err) => {
        console.error('Image rendering and positioning failed', err);
      });

    const previewsRendered = this.renderPreviews(this.prvData, force)
      .catch((err) => {
        console.error('Preview rendering failed', err);
      });

    const allDrawn = Promise.all([imageRendered, previewsRendered]).then(() => {
      if (this.isDestroyed) return;
      this.positionPreviews();
      // We need to redraw the border because the height has changed
      this.drawBorder();
    });

    return allDrawn;
  }

  /**
   * Draw a border around the origin of the inset.
   */
  drawOriginBorder() {
    if (this.label.src.size > 1) {
      const points = [];
      const padding = 3;
      const xOff = this.globalOffsetX + this.galleryOffsetX;
      const yOff = this.globalOffsetY + this.galleryOffsetY;
      this.label.src.members.forEach((annotation) => {
        points.push(
          [annotation.minX + xOff - padding, annotation.minY + yOff - padding],
          [annotation.maxX + xOff + padding, annotation.minY + yOff - padding],
          [annotation.maxX + xOff + padding, annotation.maxY + yOff + padding],
          [annotation.minX + xOff - padding, annotation.maxY + yOff + padding],
        );
        // Draw original annotations
        this.gOrigin.drawRect(
          annotation.minX + xOff,
          annotation.minY + yOff,
          annotation.maxX - annotation.minX,
          annotation.maxY - annotation.minY,
        );
      });

      const orgLineWidth = this.gOrigin.lineWidth;
      const orgLineColor = this.gOrigin.lineColor;
      const orgLineAlpha = this.gOrigin.lineAlpha;

      // Draw convex hull
      this.gOrigin
        .lineStyle(1, orgLineColor, 0.66)
        .beginFill(colorToHex(this.selectColor), 0.2)
        .drawPolygon(flatten(hull(points, Infinity)))
        .endFill()
        .lineStyle(orgLineWidth, orgLineColor, orgLineAlpha);
    } else {
      const borderOrigin = this.computeBorderOriginPosition();

      this.gOrigin.drawRect(
        ...this.computeBorderPosition(
          borderOrigin[0] + (this.originStyle[0] / 2) + this.globalOffsetX,
          borderOrigin[1] + (this.originStyle[0] / 2) + this.globalOffsetY,
          borderOrigin[2] - this.originStyle[0],
          borderOrigin[3] - this.originStyle[0],
        )
      );
    }
  }

  /**
   * Fetch data for the image.
   *
   * @return  {Object}  Promise resolving to the JSON response
   */
  fetchData() {
    const loci = this.remotePos.map((remotePos, i) => [
      ...remotePos,
      this.dataConfig.tilesetUid,
      this.computedZoom(i),
      this.finalRes[i]
    ]);

    const padding = this.options.isAbsPadding ? this.getPadding() : 0;

    let aggregation = '1';
    let encoding = 'matrix';
    let representative = 0;
    let maxPrevs = this.options.maxPreviews;

    if (this.dataType.indexOf('image') >= 0) {
      aggregation = '';
      encoding = 'b64';
      representative = 4;
      maxPrevs = 0;
    }

    const fetchRequest = ++this.fetching;

    return fetch(
      `${this.dataConfig.server}/fragments_by_loci/?ag=${aggregation}&pd=${padding}&en=${encoding}&rp=${representative}&mp=${maxPrevs}`, {
        method: 'POST',
        headers: {
          accept: 'application/json; charset=UTF-8',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loci)
      })
      .then(response => response.json())
      .then((parsedResponse) => {
        // Add the request ID to the response in order to identify the latest
        // response value and avoid rendering and positioning hiccups.
        parsedResponse.requestId = fetchRequest;
        return parsedResponse;
      })
      .catch(() => {
        this.fetchAttempts += 1;
      });
  }

  /**
   * Visually focus the inset by changing the border color to
   *   `this.selectColor`.
   */
  focus(isPermanent = false) {
    this.isPermanentFocus = isPermanent ? true : this.isPermanentFocus;
    if (this.isRenderToCanvas) this.clearBorder();
    this.drawBorder(
      this.x,
      this.y,
      this.width,
      this.height,
      this.gBorder,
      this.options.borderRadius,
      this.selectColor,
    );
  }

  /**
   * Get location padding for loading the inset.
   * @return  {number}  Padding to be added to the location to be pulled as a
   *   snippet.
   */
  getPadding(remoteSize) {
    const paddingCustomLocSorted = Object.keys(this.paddingCustom)
      .map(x => +x)
      .sort((a, b) => a - b);

    const entry = paddingCustomLocSorted[bisectLeft(
      paddingCustomLocSorted, remoteSize
    )];

    return (entry ? this.paddingCustom[entry] : this.padding);
  }

  /**
   * Get or set global offset.
   *
   * @param  {Number}  x  Global X offset.
   * @param  {Number}  y  Global Y offset.
   * @return  {Array}   Tuple holding the global X and Y offset.
   */
  globalOffset(
    x = this.globalOffsetX,
    y = this.globalOffsetY,
    gX = this.galleryOffsetX,
    gY = this.galleryOffsetY
  ) {
    this.globalOffsetX = x;
    this.globalOffsetY = y;
    this.galleryOffsetX = gX;
    this.galleryOffsetY = gY;
    return [x, y, gX, gY];
  }

  /**
   * Get or set the size of the inset
   *
   * @param  {Number}  width  Width of the inset.
   * @param  {Number}  height  Height of the inset.
   * @return  {Array}   Tuple holding `[width, height]`.
   */
  globalSize(width = this.globalWidth, height = this.globalHeight) {
    this.globalWidth = width;
    this.globalHeight = height;
    return [width, height];
  }


  /**
   * Initialize line style of the border and leader line graphics.
   *
   * @param  {Object}  options  Line style for the border and leader line.
   */
  initGraphics() {
    // this.gBorder.lineStyle(...this.borderStyle);
    this.gLeaderLine.lineStyle(...this.leaderLineStyle);
    this.gOrigin.lineStyle(...this.originStyle);
  }

  /**
   * Mouse click handler.
   *
   * @param  {Object}  event  Event object.
   */
  mouseClickHandler(event) {
    this.mouseHandler.click(event, this);
  }

  /**
   * Global mouse click handler.
   */
  mouseClickGlobalHandler() {
    this.isPermanentFocus = false;
    this.drawBorder();
  }

  /**
   * Mouse click handler.
   *
   * @param  {Object}  event  Event object.
   */
  mouseClickRightHandler(event) {
    this.mouseHandler.clickRight(event, this);
  }

  /**
   * Mouse over handler.
   *
   * @param  {Object}  event  Event object.
   */
  mouseOverHandler(event) {
    this.isHovering = true;
    this.focus();
    this.focusOrigin();
    this.drawLeaderLine();
    this.mouseHandler.mouseOver(event, this);
  }

  /**
   * Mouse out handler.
   *
   * @param  {Object}  event  Event object.
   */
  mouseOutHandler(event) {
    this.isHovering = false;
    this.blur();
    this.originBlur();
    this.drawLeaderLine();
    this.mouseHandler.mouseOut(event, this);
  }

  /**
   * Mouse down handler.
   *
   * @param  {Object}  event  Event object.
   */
  mouseDownHandler(event) {
    if (event.button === 2) {
      // Right mouse down
      this.focus(true);
    } else {
      this.mouseDown = true;
      this.scale(this.onClickScale);
      this.mouseHandler.mouseDown(event, this);
    }
  }

  /**
   * Mouse down handler for a right click.
   *
   * @param  {Object}  event  Event object.
   */
  mouseDownRightHandler(event) {
    this.mouseDownRight = true;
    this.mouseHandler.mouseDownRight(event, this);
    this.mouseClickRightHandler(event);
    console.log(
      `Annotation: ${this.id} |`,
      `Remote pos: ${this.remotePos.join(', ')} |`,
      `Ideal zoom level for snippet: ${this.computedZoom()}`
    );
  }

  /**
   * Mouse up handler.
   *
   * @param  {Object}  event  Event object.
   */
  mouseUpHandler(event) {
    if (this.mouseDown) this.mouseClickHandler(event);
    this.scale();
    this.mouseDown = false;
    this.mouseHandler.mouseUp(event, this);
  }

  /**
   * Mouse up handler for a right click.
   *
   * @param  {Object}  event  Event object.
   */
  mouseUpRightHandler(event) {
    this.mouseDownRight = false;
    this.mouseHandler.mouseUpRight(event, this);
  }

  /**
   * Get or set the center of the origin of the inset.
   *
   * @param  {Number}  x  X origin.
   * @param  {Number}  y  Y origin.
   * @return  {Array}  Tuple holding the X,Y origin.
   */
  origin(
    x = this.originX,
    y = this.originY,
    wh = this.originWidthHalf,
    hh = this.originHeightHalf
  ) {
    this.originX = x;
    this.originY = y;
    this.originWidthHalf = wh;
    this.originHeightHalf = hh;

    return [x, y, wh, hh];
  }

  /**
   * Focus on the original locus by drawing an extra border around it and
   *   clipping of the leader line at the boundary of the original locus.
   */
  focusOrigin() {
    this.drawOriginBorder();
  }

  /**
   * Blur the original locus. This removes the highlighting border and unsets
   *   the mask.
   */
  originBlur() {
    this.gOrigin.clear();
    this.initGraphics();
  }

  /**
   * Get or set the position of the inset.
   *
   * @param  {Number}  x  X position.
   * @param  {Number}  y  Y position.
   * @return  {Array}  Tuple holding the X,Y position.
   */
  position(x = this.x, y = this.y) {
    this.x = x;
    this.y = y;
    return [x, y];
  }

  /**
   * Position the main image. Forwarder to the respective canvas and HTML
   *   functions.
   */
  positionImage(...args) {
    if (this.isRenderToCanvas) return this.positionImageCanvas(...args);
    return this.positionImageHtml(...args);
  }

  /**
   * Position the image on the canvas, i.e., apply the view [x,y] position and
   *   the final image scales.
   * @param  {Number}  x  X position of the inset to be drawn.
   * @param  {Number}  y  Y position of the inset to be drawn.
   * @param  {Number}  width  Width of the inset to be drawn.
   * @param  {Number}  height  Height of the inset to be drawn.
   */
  positionImageCanvas(
    x = this.x, y = this.y, width = this.width, height = this.height
  ) {
    const pos = this.computeImagePosition(x, y, width, height);

    this.img.x = pos.x;
    this.img.y = pos.y;
    this.img.scale.x = pos.scaleX;
    this.img.scale.y = pos.scaleY;
  }

  /**
   * Adjusts the ratio of the image
   */
  positionImageHtml() {
    if (!this.imgData.length) return;

    switch (this.imgData.length) {
      case 1:
        this.positionImageOneHtml();
        break;

      case 2:
        this.positionImageTwoHtml();
        break;

      case 3:
        this.positionImageThreeHtml();
        break;

      case 4:
        this.positionImageFourHtml();
        break;

      default:
        console.warn('Only up to 4 images are supported');
    }
  }

  positionImageOneHtml() {
    const ratio = (this.imgData[0].height / this.imgData[0].width) * 100;
    this.imgRatios[0].style.paddingTop = `${ratio}%`;
  }

  positionImageTwoHtml() {
    this.imgRatios.forEach((el) => { el.style.paddingTop = '100%'; });
    this.imgsWrapperRight.className =
      `${style['inset-images-wrapper-right']} ${style['inset-images-wrapper-right-grow']}`;
  }

  positionImageThreeHtml() {
    this.imgRatios.forEach((el) => { el.style.paddingTop = '100%'; });
    this.imgsWrapperLeft.className =
      `${style['inset-images-wrapper-left']} ${style['inset-images-wrapper-left-three']}`;
    this.imgsWrapperRight.className =
      `${style['inset-images-wrapper-right']} ${style['inset-images-wrapper-right-grow']}`;
  }

  positionImageFourHtml() {
    this.imgRatios.forEach((el) => { el.style.paddingTop = '100%'; });
    this.imgsWrapperLeft.className =
      `${style['inset-images-wrapper-left']} ${style['inset-images-wrapper-left-four']}`;
    this.imgsWrapperRight.className =
      `${style['inset-images-wrapper-right']} ${style['inset-images-wrapper-right-grow']}`;
  }

  /**
   * Position the main image. Forwarder to the respective canvas and HTML
   *   functions.
   */
  positionPreviews(...args) {
    if (this.isRenderToCanvas) return this.positionPreviewsCanvas(...args);
    return this.positionPreviewsHtml(...args);
  }

  /**
   * Position the image of the previews, i.e., apply the view [x,y] position
   *   and the final image scales.
   * @param  {Number}  x  X position of the inset to be drawn.
   * @param  {Number}  y  Y position of the inset to be drawn.
   * @param  {Number}  width  Width of the inset to be drawn.
   * @param  {Number}  height  Height of the inset to be drawn.
   */
  positionPreviewsCanvas(
    x = this.x, y = this.y, width = this.width, height = this.height
  ) {
    if (!this.prvs) return;

    const pos = this.computePreviewsPosition(x, y, width, height);

    this.prvs.forEach((preview, i) => {
      const prevHeight = Math.abs(pos.scaleY);
      const yOffset = ((prevHeight + this.previewSpacing) * (i + 1));

      preview.x = pos.x;
      preview.y = pos.y + yOffset;
      preview.scale.x = pos.scaleX;
      preview.scale.y = pos.scaleY;
    });
  }

  /**
   * Position the image of the previews, i.e., apply the view [x,y] position
   *   and the final image scales.
   * @param  {Number}  x  X position of the inset to be drawn.
   * @param  {Number}  y  Y position of the inset to be drawn.
   * @param  {Number}  width  Width of the inset to be drawn.
   * @param  {Number}  height  Height of the inset to be drawn.
   */
  positionPreviewsHtml() {
    if (!this.prvsWrapper) return;

    const height = (
      this.previewsHeight * this.scaleBase * this.scaleExtra * this.imScale
    ) + this.previewsHeight - 1;

    this.prvsWrapper.style.height = `${height}px`;
  }

  /**
   * Render the main image and assign event listeners. This is just a
   *   forwarder to the specific method for the canvas or html methods.
   */
  renderImage(...args) {
    if (this.isRenderToCanvas) return this.renderImageCanvas(...args);
    return this.renderImageHtml(...args);
  }

  /**
   * Render the main image and assign event listeners.
   *
   * @param  {Array}  data  Data to be rendered
   */
  renderImageCanvas(data, force) {
    if ((this.img && !force) || !data.length || this.isDestroyed) {
      return Promise.resolve();
    }

    if (this.imgRendering) return this.imgRendering;

    this.imgRendering = this.renderer(data[0], this.dataTypes[0])
      .then((renderedImg) => {
        if (this.isDestroyed) return;

        this.imgData = renderedImg;

        this.img = new PIXI.Sprite(
          PIXI.Texture.fromCanvas(
            renderedImg, PIXI.SCALE_MODES.NEAREST
          )
        );

        this.img.interactive = true;
        this.img
          .on('mousedown', pixiToOrigEvent(this.mouseDownHandler.bind(this)))
          .on('mouseover', pixiToOrigEvent(this.mouseOverHandler.bind(this)))
          .on('mouseout', pixiToOrigEvent(this.mouseOutHandler.bind(this)))
          .on('mouseup', pixiToOrigEvent(this.mouseUpHandler.bind(this)))
          .on('rightdown', pixiToOrigEvent(this.mouseDownRightHandler.bind(this)))
          .on('rightup', pixiToOrigEvent(this.mouseUpRightHandler.bind(this)));

        this.gMain.addChild(this.img);
      });

    return this.imgRendering;
  }

  /**
   * Render the main image and assign event listeners.
   *
   * @param  {Array}  data  Data to be rendered
   */
  renderImageHtml(data, force, requestId) {
    if (
      !data ||
      (this.imgs.length === data.length && !force) ||
      !data.length ||
      this.isDestroyed
    ) return Promise.resolve();

    if (this.imgsRendering) return this.imgsRendering;

    this.previewsHeight = 0;
    this.imgRatios = [];
    this.imgs = [];
    this.imgWrappers = [];

    if (this.imgsWrapper) this.border.removeChild(this.imgsWrapper);

    const imgsWrapper = document.createElement('div');
    imgsWrapper.className = style['inset-images-wrapper'];

    this.imgsWrapper = imgsWrapper;
    this.border.appendChild(imgsWrapper);

    const imgsWrapperLeft = document.createElement('div');
    imgsWrapperLeft.className = style['inset-images-wrapper-left'];

    this.imgsWrapperLeft = imgsWrapperLeft;
    this.imgsWrapper.appendChild(imgsWrapperLeft);

    const imgsWrapperRight = document.createElement('div');
    imgsWrapperRight.className = style['inset-images-wrapper-right'];

    this.imgsWrapperRight = imgsWrapperRight;
    this.imgsWrapper.appendChild(imgsWrapperRight);

    this.imgsRendering = Promise.all(data
      .map((imgDataRaw, i) => this.renderer(imgDataRaw, this.dataTypes[0])
        .then((renderedImg) => {
          if (this.isDestroyed || this.imgData === null) return;

          this.imgData[i] = renderedImg;

          const imgWrapper = document.createElement('div');
          imgWrapper.className = style['inset-image-wrapper'];

          let imgRatio;
          if (data.length === 1) {
            imgRatio = document.createElement('div');
            imgRatio.className = style['inset-image-ratio'];
          }

          const img = document.createElement('div');
          img.className = style['inset-image'];

          const orient = i === 0 ? 'left' : 'right';
          let intense = data.length === 2 ? 'half' : '';
          let pos = 'middle';
          if (data.length > 2) {
            intense = 'full';
            if (i === 1) pos = 'first';
            if (i === data.length - 1) pos = 'last';
          }

          addClass(img, style[`inset-image-${orient}-${intense}-${pos}`]);

          img.style.backgroundImage = `url(${renderedImg.toDataURL()})`;
          img.__transform__ = {};

          if (this.dataType === 'cooler') {
            // Enable nearest-neighbor scaling
            img.style.imageRendering = 'pixelated';
          }

          const mainWrapper = i === 0
            ? this.imgsWrapperLeft
            : this.imgsWrapperRight;

          this.imgWrappers[i] = imgWrapper;
          mainWrapper.appendChild(imgWrapper);

          if (imgRatio) {
            this.imgRatios[i] = imgRatio;
            this.imgWrappers[i].appendChild(imgRatio);
          }

          this.imgs[i] = img;
          this.imgWrappers[i].appendChild(img);
        })
      )
    );

    return this.imgsRendering;
  }

  /**
   * Render the previews and assign event listeners. This is just a
   *   forwarder to the specific method for the canvas or html methods.
   */
  renderPreviews(...args) {
    if (this.isRenderToCanvas) return this.renderPreviewsCanvas(...args);
    return this.renderPreviewsHtml(...args);
  }

  /**
   * Render the data to an image and assign event listeners.
   *
   * @param  {Array}  data  Data to be rendered
   */
  renderPreviewsCanvas(data, force) {
    if (
      !data ||
      (this.prvs.length === data.length && !force) ||
      !data.length ||
      this.isDestroyed
    ) return Promise.resolve();

    if (this.previewsRendering) return this.previewsRendering;

    this.previewsHeight = 0;

    const renderedPreviews = data
      .map((preview, i) => this.renderer(preview, this.dataTypes[0])
        .then((renderedImg) => {
          if (this.isDestroyed) return;

          this.prvData[i] = renderedImg;

          this.prvs[i] = new PIXI.Sprite(
            PIXI.Texture.fromCanvas(
              renderedImg, PIXI.SCALE_MODES.NEAREST
            )
          );

          this.prvs[i].interactive = true;
          this.prvs[i]
            .on('mousedown', pixiToOrigEvent(this.mouseDownHandler.bind(this)))
            .on('mouseover', pixiToOrigEvent(this.mouseOverHandler.bind(this)))
            .on('mouseout', pixiToOrigEvent(this.mouseOutHandler.bind(this)))
            .on('mouseup', pixiToOrigEvent(this.mouseUpHandler.bind(this)))
            .on('rightdown', pixiToOrigEvent(this.mouseDownRightHandler.bind(this)))
            .on('rightup', pixiToOrigEvent(this.mouseUpRightHandler.bind(this)));

          this.previewsHeight += this.prvs[i].height;

          this.gMain.addChild(this.prvs[i]);
        })
      );

    this.previewsRendering = Promise.all(renderedPreviews);

    return this.previewsRendering;
  }

  /**
   * Render the data to an image and assign event listeners.
   *
   * @param  {Array}  data  Data to be rendered
   */
  renderPreviewsHtml(data, force) {
    if (
      !data ||
      (this.prvs.length === data.length && !force) ||
      !data.length ||
      this.isDestroyed
    ) return Promise.resolve();

    if (this.previewsRendering) return this.previewsRendering;

    this.previewsHeight = 0;

    const prvsWrapper = this.prvsWrapper || document.createElement('div');
    prvsWrapper.className = this.pileOrientaton === 'top'
      ? style['inset-previews-wrapper-top']
      : style['inset-previews-wrapper-bottom'];

    if (prvsWrapper !== this.prvsWrapper && this.prvsWrapper) {
      this.border.removeChild(this.prvsWrapper);
    }

    this.prvsWrapper = prvsWrapper;
    this.border.appendChild(prvsWrapper);

    this.previewsRendering = Promise.all(data
      .map((preview, i) => this.renderer(preview, this.dataTypes[0])
        .then((renderedImg) => {
          if (this.isDestroyed) return;

          this.prvData[i] = renderedImg;

          this.previewsHeight += renderedImg.height;

          const prvWrapper = this.prvWrappers[i] || document.createElement('div');
          prvWrapper.className = style['inset-preview-wrapper'];

          const img = this.prvs[i] || document.createElement('img');
          img.className = style['inset-preview'];
          img.src = renderedImg.toDataURL();
          img.__transform__ = {};

          if (this.dataType === 'cooler') {
            // Enable nearest-neighbor scaling
            img.style.imageRendering = 'pixelated';
          }

          if (prvWrapper !== this.prvWrappers[i] && this.prvWrappers[i]) {
            this.prvsWrapper.removeChild(this.prvWrappers[i]);
          }

          this.prvWrappers[i] = prvWrapper;
          this.prvsWrapper.appendChild(prvWrapper);

          if (img !== this.prvs[i] && this.prvs[i]) {
            this.prvWrappers[i].removeChild(this.prvs[i]);
          }

          this.prvs[i] = img;
          this.prvWrappers[i].appendChild(img);
        })
      )
    );

    return this.previewsRendering;
  }

  renderTo(target) {
    switch (target) {
      case 'html':
        this.isRenderToCanvas = false;
        break;

      default:
        this.isRenderToCanvas = true;
        break;
    }
  }

  smoothTransitions(unset = false) {
    if (unset) removeClass(this.border, style['inset-smooth-transition']);
    else addClass(this.border, style['inset-smooth-transition']);
  }

  /**
   * Scale the inset. This is just a forwarder to the specific method for the
   *   canvas or html methods.
   */
  scale(...args) {
    if (this.isRenderToCanvas) return this.scaleCanvas(...args);
    return this.scaleHtml(...args);
  }

  /**
   * Scale the inset.
   * @param  {Number}  amount  Amount by which to scale the inset
   */
  scaleCanvas(amount = 1) {
    if (this.tweenStop) this.tweenStop();

    this.scaleExtra = amount;
    this.offsetX = this.width * (amount - 1) / -2;
    this.offsetY = this.height * (amount - 1) / -2;

    const imPos = this.computeImagePosition();

    const prevHeight = this.prvs.length
      ? (
        (this.previewsHeight * Math.abs(imPos.scaleY)) +
        ((this.prvs.length - 1) * this.previewSpacing)
      ) + 1
      : 0;

    const bWidth = (
      this.imgData.width * imPos.scaleX * this.t
    ) + this.borderPadding;
    const bHeight = (
      this.imgData.height * Math.abs(imPos.scaleY)
    ) + this.borderPadding;

    const [bX, bY] = this.computeBorderPosition(
      this.x,
      this.y,
      bWidth,
      bHeight,
      true
    );

    const previewTweenDefs = this.prvs.map((sprite, i) => ({
      obj: sprite,
      propsTo: {
        x: imPos.x,
        y: imPos.y + ((Math.abs(imPos.scaleY) + this.previewSpacing) * (i + 1)),
        scale: {
          x: imPos.scaleX,
          y: imPos.scaleY,
        }
      }
    }));

    this.tweenStop = transitionGroup(
      [
        {
          obj: this.img,
          propsTo: {
            x: imPos.x,
            y: imPos.y,
            scale: {
              x: imPos.scaleX,
              y: imPos.scaleY,
            }
          }
        },
        {
          obj: this.border,
          propsTo: {
            x: bX,
            y: bY,
            // Not sure why we need the `+1`. Maybe an interpolation problem?
            width: bWidth + 1,
            height: bHeight + prevHeight + 1,
          }
        },
        ...previewTweenDefs
      ],
      80
    );
  }

  /**
   * Check if the inset in on the border, i.e., in gallery laylout mode, and
   *   assign the approariate class for the transform origin.
   */
  checkTransformOrigin() {
    if (typeof this.label.isLeftCloser === 'undefined') return;

    const l = this.label;

    // Assign each position (top, right, bottom, left) a unique number
    // 0 == bottom, 1 == top, 2 == right, 4 == left
    const position = (
      ((l.isVerticalOnly * l.isLeftCloser << 1) + (l.isVerticalOnly * 2)) +
      (!l.isVerticalOnly * l.isTopCloser)
    );

    removeClass(this.border, style['inset-is-bottom']);
    removeClass(this.border, style['inset-is-top']);
    removeClass(this.border, style['inset-is-right']);
    removeClass(this.border, style['inset-is-left']);

    switch (position) {
      case 0:
        addClass(this.border, style['inset-is-bottom']);
        break;

      case 1:
        addClass(this.border, style['inset-is-top']);
        break;

      case 2:
        addClass(this.border, style['inset-is-right']);
        break;

      case 4:
        addClass(this.border, style['inset-is-left']);
        break;

      default:
        // Nothing
    }
  }

  /**
   * Scale the inset.
   *
   * @param  {Number}  amount  Amount by which to scale the inset
   */
  scaleHtml(amount = 1) {
    if (this.scaleExtra === amount) return;
    this.smoothTransitions();
    this.checkTransformOrigin();

    addEventListenerOnce(
      this.border, 'transitionend', () => { this.smoothTransitions(true); }
    );

    this.border.__transform__.scale = [amount, amount];
    this.border.style.transform = objToTransformStr(this.border.__transform__);
    this.scaleExtra = amount;
  }

  /**
   * Set a border scaling
   * @param   {function}  borderScale  Border scale function. Used for
   *   adjusting the border witdth.
   */
  setBorderScale(borderScale) {
    this.borderScale = borderScale;
  }

  /**
   * Set an inset renderer
   * @param   {function}  renderer  Inset renderer
   */
  setRenderer(renderer) {
    this.renderer = renderer;
  }

  /**
   * Get or set the size of the inset
   *
   * @param  {Number}  width  Width of the inset.
   * @param  {Number}  height  Height of the inset.
   * @return  {Array}   Tuple holding `[width, height]`.
   */
  size(width = this.width, height = this.height) {
    this.width = width;
    this.height = height;
    return [width, height];
  }
}
