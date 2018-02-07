import { bisectLeft } from 'd3-array';
import { color as d3Color } from 'd3-color';
import clip from 'liang-barsky';
import * as PIXI from 'pixi.js';

import { transitionGroup } from './services/transition';

import {
  canvasLinearGradient,
  colorToHex,
  degToRad,
  getAngleBetweenPoints,
  lDist
} from './utils';

const BASE_MIN_SIZE = 12;
const BASE_MAX_SIZE = 24;
const BASE_SCALE = 4;
const BASE_SCALE_UP = 1.25;

const getBaseRes = tilesetInfo => (
  tilesetInfo.max_width /
  (2 ** tilesetInfo.max_zoom) /
  tilesetInfo.bins_per_dimension
);

export default class Inset {
  constructor(
    uid,
    remotePos,
    renderedPos,
    dataPos,
    dataConfig,
    tilesetInfo,
    options,
    mouseHandler,
    dataType,
  ) {
    this.uid = uid;
    this.remotePos = remotePos;
    this.renderedPos = renderedPos || this.remotePos;
    this.dataPos = dataPos;
    this.dataConfig = dataConfig;
    this.tilesetInfo = tilesetInfo;
    this.options = options;
    this.mouseHandler = mouseHandler;
    this.dataType = dataType;

    this.isMatrix = this.dataType === 'cooler';
    this.t = this.isMatrix ? -1 : 1;

    this.d = Infinity;
    this.relD = 1;

    this.gMain = new PIXI.Graphics();
    this.gBorder = new PIXI.Graphics();
    this.gLeaderLine = new PIXI.Graphics();
    this.gOrigin = new PIXI.Graphics();

    this.gMain.addChild(this.gOrigin);
    this.gMain.addChild(this.gLeaderLine);
    this.gMain.addChild(this.gBorder);

    this.minSize = this.options.minSize || BASE_MIN_SIZE;
    this.maxSize = this.options.maxSize || BASE_MAX_SIZE;
    this.padding = this.options.padding || 0;
    this.paddingCustom = this.options.paddingCustom || {};
    this.resolution = this.options.resolution || this.maxSize;
    this.resolutionCustom = this.options.resolutionCustom || {};
    this.scaleBase = this.options.scale || BASE_SCALE;
    this.additionalZoom = this.options.additionalZoom || 0;
    this.onClickScale = this.options.onClickScale || BASE_SCALE_UP;

    this.scaleExtra = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.globalOffsetX = 0;
    this.globalOffsetY = 0;

    // Compute final resolution of inset
    this.computeResolution();
    this.computeRemotePaddedSize();

    this.borderStyle = [1, 0x000000, 0.33];
    this.borderPadding = options.borderWidth * 2 || 4;
    this.borderFill = colorToHex(options.borderColor) || 0xffffff;
    this.borderFillAlpha = options.borderOpacity || 1;

    this.selectColor = colorToHex(options.selectColor) || 0xff0000;

    this.leaderLineStubWidthMin = (
      this.options.leaderLineStubWidthMin || this.options.leaderLineStubWidth
    );
    this.leaderLineStubWidthVariance = (
      this.options.leaderLineStubWidthMax - this.options.leaderLineStubWidthMin
    ) || 0;

    this.leaderLineStyle = [
      options.leaderLineWidth || 1,
      colorToHex(options.leaderLineColor) || 0x000000,
      options.leaderLineOpacity || 1
    ];

    this.originStyle = [
      options.leaderLineWidth || 1,
      colorToHex(options.selectColor) || 0x000000,
      1
    ];

    this.initGraphics(options);
  }

  /* --------------------------- Getter / Setter ---------------------------- */

  /**
   * Return the main graphics of this class, which is `gMain`.
   */
  get graphics() {
    return this.gMain;
  }

  /* ---------------------------- Custom Methods ---------------------------- */

  /**
   * Blur visually focused insert by changing back to the default border color.
   */
  blur() {
    this.clearBorder();
    this.drawBorder();
  }

  /**
   * Clear and initialize graphics.
   *
   * @param  {Object}  options  Custom line style for the border and leader line
   */
  clear(options = this.options) {
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
  computeBorder(
    x = this.x,
    y = this.y,
    width = this.width,
    height = this.height,
    padding = this.borderPadding,
    isAbs = false,
  ) {
    const finalX = this.globalOffsetX + this.offsetX + x - (width / 2);
    const finalY = this.globalOffsetY + this.offsetY + y - (height / 2);

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
  computeBorderOrigin() {
    return [
      this.originX,
      this.originY,
      this.originWidthHalf * 2,
      this.originHeightHalf * 2
    ];
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
    // Scale the image down from its raw resolution to the inset's pixel size
    this.imScale = (
      Math.max(width, height) /
      this.scaleBase /
      Math.max(this.data.width, this.data.height)
    );

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
   * Compute the padded remote size of the locus defining this inset. This
   *   method basically expands the remote size by the relative padding.
   *
   * @example Assuming the remote data is given in base pairs (bp) and the
   *   longest side of the locus is 8000bp with a padding of 0.2 then the
   *   final padded remote size is `8000 + (8000 * 0.2 * 2) = 11200`.
   */
  computeRemotePaddedSize() {
    this.remotePaddedSize = this.remoteSize + (
      this.remoteSize * this.getPadding() * 2
    );
  }

  /**
   * Compute the remote size of the locus defining this inset and the final
   *   resolution.
   */
  computeResolution() {
    const resolutionCustomLocSorted = Object.keys(this.resolutionCustom)
      .map(x => +x)
      .sort((a, b) => a - b);

    const isBedpe = this.remotePos.length === 6;
    const xStartId = isBedpe ? 1 : 0;
    const xEndId = isBedpe ? 2 : 1;
    const yStartId = isBedpe ? 4 : 2;
    const yEndId = isBedpe ? 5 : 3;
    const absXLen = this.renderedPos[xEndId] - this.renderedPos[xStartId];
    const absYLen = this.renderedPos[yEndId] - this.renderedPos[yStartId];
    this.remoteSize = Math.max(absXLen, absYLen);

    const entry = resolutionCustomLocSorted[bisectLeft(
      resolutionCustomLocSorted, this.remoteSize
    )];

    this.finalRes = entry ? this.resolutionCustom[entry] : this.resolution;
  }

  /**
   * Compute the closest zoom level providing enough resolution for displaying
   * the snippet at maximum size
   *
   * @return  {Number}  Closest zoom level.
   */
  computedZoom() {
    const isBedpe = this.remotePos.length === 6;

    const baseRes = isBedpe ? getBaseRes(this.tilesetInfo) : 1;

    const zoomLevel = Math.max(0, Math.min(
      this.tilesetInfo.max_zoom,
      Math.ceil(Math.log2(
        (
          this.finalRes * (2 ** this.tilesetInfo.max_zoom)
        ) / (this.remotePaddedSize / baseRes)
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
      .lineStyle(...this.borderStyle)
      .beginFill(fill)
      .drawRoundedRect(0, 0, width, height, radius)
      .endFill()
      .generateCanvasTexture();

    return new PIXI.Sprite(rect);
  }

  /**
   * Destroy graphics and unset data.
   */
  destroy() {
    if (this.sprite) this.sprite.removeAllListeners();

    this.gOrigin.destroy();
    this.gBorder.destroy();
    this.gLeaderLine.destroy();
    this.gMain.destroy();

    this.data = undefined;
    this.sprite = undefined;
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
    const [vX, vY] = this.computeBorder(x, y, width, height);

    if (!this.border) {
      const ratio = width / height;
      const maxBorderSize = this.maxSize * this.onClickScale;
      this.border = this.createRect(
        (ratio >= 1 ? maxBorderSize : maxBorderSize * ratio) + this.borderPadding,
        (ratio <= 1 ? maxBorderSize : maxBorderSize / ratio) + this.borderPadding,
        radius,
        fill
      );
      graphics.addChild(this.border);
    }

    this.border.x = vX;
    this.border.y = vY;
    this.border.width = this.width + this.borderPadding;
    this.border.height = this.height + this.borderPadding;
  }

  /**
   * Draw leader line.
   */
  drawLeaderLine(color = this.leaderLineColor) {
    const dist = lDist(
      [this.originX, this.originY],
      [this.x, this.y],
    );

    if (
      this.options.leaderLineStubLength * 1.5 < dist ||
      this.options.leaderLineFading
    ) {
      this.renderLeaderLine(color);
    } else {
      this.gLeaderLine.clear();
      this.gLeaderLine.lineStyle(
        this.leaderLineStyle[0],
        this.isHovering ? this.selectColor : this.leaderLineStyle[1],
        this.leaderLineStyle[2]
      );

      // Origin
      this.gLeaderLine.moveTo(
        this.globalOffsetX + this.originX,
        this.globalOffsetY + this.originY
      );

      // Inset position
      this.gLeaderLine.lineTo(
        this.globalOffsetX + this.x,
        this.globalOffsetY + this.y
      );
    }
  }

  /**
   * Draw the image of the inset (i.e., a matrix snippet or image snippet)
   *
   * @param  {Function}  imgRenderer  Image renderer, i.e., function converting
   *   the data into canvas.
   * @param  {Boolean}  force  If `true` forces a rerendering of the image.
   */
  drawImage(imgRenderer, force = false) {
    if (!this.data) {
      if (!this.inFlight) {
        this.inFlight = this.fetchData()
          .then((data) => {
            this.data = data;
            this.inFlight = false;
            return this.drawImage(imgRenderer, force);
          })
          .catch((err) => {
            console.error(
              `Could not fetch the inset's image at [${this.remotePos.join(',')}]`,
              err
            );
          });
      }
      return this.inFlight;
    }

    return this.renderImage(this.data, imgRenderer, force)
      .then(() => {
        this.positionImage();
        return true;
      })
      .catch(err => console.error(err));
  }

  /**
   * Draw a border around the origin of the inset.
   */
  drawOriginBorder() {
    const borderOrigin = this.computeBorderOrigin();

    this.gOrigin.drawRect(
      ...this.computeBorder(
        borderOrigin[0] + (this.originStyle[0] / 2),
        borderOrigin[1] + (this.originStyle[0] / 2),
        borderOrigin[2] - this.originStyle[0],
        borderOrigin[3] - this.originStyle[0],
      )
    );
  }

  /**
   * Fetch data for the image.
   *
   * @return  {Object}  Promise resolving to the JSON response
   */
  fetchData() {
    this.computedZoom();
    const loci = [
      [
        ...this.remotePos,
        this.dataConfig.tilesetUid,
        this.computedZoom()
      ]
    ];

    const padding = this.options.isAbsPadding ? this.getPadding() : 0;

    return fetch(
      `${this.dataConfig.server}/fragments_by_loci/?precision=2&dims=${this.finalRes}&padding=${padding}`, {
        method: 'POST',
        headers: {
          accept: 'application/json; charset=UTF-8',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loci)
      })
      .then(response => response.json());
  }

  /**
   * Visually focus the inset by changing the border color to
   *   `this.selectColor`.
   */
  focus() {
    this.clearBorder();
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
  getPadding() {
    const paddingCustomLocSorted = Object.keys(this.paddingCustom)
      .map(x => +x)
      .sort((a, b) => a - b);

    const entry = paddingCustomLocSorted[bisectLeft(
      paddingCustomLocSorted, this.remoteSize
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
  globalOffset(x = this.globalOffsetX, y = this.globalOffsetY) {
    this.globalOffsetX = x;
    this.globalOffsetY = y;
    return [x, y];
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
    this.gBorder.lineStyle(...this.borderStyle);
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
    this.originFocus();
    this.drawLeaderLine(this.options.selectColor);
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
    this.mouseDown = true;
    this.scale(this.onClickScale);
    this.mouseHandler.mouseDown(event, this);
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
      `Annotation: ${this.uid} |`,
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
  originFocus() {
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
   * Position the image, i.e., apply the view [x,y] position and the final
   *   image scales.
   * @param  {Number}  x  X position of the inset to be drawn.
   * @param  {Number}  y  Y position of the inset to be drawn.
   * @param  {Number}  width  Width of the inset to be drawn.
   * @param  {Number}  height  Height of the inset to be drawn.
   */
  positionImage(
    x = this.x, y = this.y, width = this.width, height = this.height
  ) {
    const pos = this.computeImagePosition(x, y, width, height);

    this.sprite.x = pos.x;
    this.sprite.y = pos.y;
    this.sprite.scale.x = pos.scaleX;
    this.sprite.scale.y = pos.scaleY;
  }

  /**
   * Render the data to an image and assign event listeners.
   *
   * @param  {Array}  data  Data to be rendered
   * @param  {Function}  imgRenderer  Image renderer converting the data into
   *   canvas.
   */
  renderImage(data, imgRenderer, force) {
    if (this.sprite && !force) return Promise.resolve();

    if (this.imageRendering) return this.imageRendering;

    this.imageRendering = imgRenderer(data, this.finalRes, this.finalRes)
      .then((renderedData) => {
        this.data = renderedData;

        this.sprite = new PIXI.Sprite(
          PIXI.Texture.fromCanvas(
            this.data, PIXI.SCALE_MODES.NEAREST
          )
        );

        this.sprite.interactive = true;
        this.sprite
          .on('mousedown', this.mouseDownHandler.bind(this))
          .on('mouseover', this.mouseOverHandler.bind(this))
          .on('mouseout', this.mouseOutHandler.bind(this))
          .on('mouseup', this.mouseUpHandler.bind(this))
          .on('rightdown', this.mouseDownRightHandler.bind(this))
          .on('rightup', this.mouseUpRightHandler.bind(this));

        this.gMain.addChild(this.sprite);
      });

    return this.imageRendering;
  }

  /**
   * Render the leader line between the inset and the origin.
   * @return  {array}  List of PIXI.Sprite objects of the leader line.
   */
  renderLeaderLine(color = this.options.leaderLineColor) {
    const rectInset = this.computeBorder(
      this.x, this.y, this.width, this.height, 0, true
    );
    const rectOrigin = this.computeBorder(
      ...this.computeBorderOrigin(), 0, true
    );

    const pInset = [
      this.globalOffsetX + this.x,
      this.globalOffsetY + this.y
    ];
    const pOrigin = [
      this.globalOffsetX + this.originX,
      this.globalOffsetY + this.originY
    ];

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

    if (this.options.leaderLineStubLength) {
      return this.renderLeaderLineStubs(pInsetNew, pOriginNew, color);
    }

    return this.renderLeaderLineGrd(pInsetNew, pOriginNew, color);
  }

  /**
   * Render fading leader line a relative multistep color gradient.
   * @param   {array}  pointFrom  Tuple of form [x,y].
   * @param   {array}  pointTo  Tuple of form [x,y].
   * @param   {object}  color  RGBA D3 color object.
   * @return  {array}  List of PIXI.Sprite objects of the leader line.
   */
  renderLeaderLineGrd(pointFrom, pointTo, color = this.options.leaderLineColor) {
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

    gradient.x = pointTo[0];
    gradient.y = pointTo[1];
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
   * Render leader line stubs consisting of two absolute-sized color gradients.
   * @param   {array}  pointFrom  Tuple of form [x,y].
   * @param   {array}  pointTo  Tuple of form [x,y].
   * @param   {object}  color  RGBA D3 color object.
   * @return  {array}  List of PIXI.Sprite objects of the leader line.
   */
  renderLeaderLineStubs(pointFrom, pointTo, color = this.options.leaderLineColor) {
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

    // Set the coration center to [0, half height]
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
   * Scale the inset.
   *
   * @param  {Number}  amount  Amount by which to scale the inset
   */
  scale(amount = 1) {
    if (this.tweenStop) this.tweenStop();

    this.scaleExtra = amount;
    this.offsetX = this.width * (amount - 1) / -2;
    this.offsetY = this.height * (amount - 1) / -2;

    const imPos = this.computeImagePosition();

    const [bX, bY] = this.computeBorder(
      this.x,
      this.y,
      this.width,
      this.height,
    );

    this.tweenStop = transitionGroup(
      [
        {
          obj: this.sprite,
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
            width: (this.data.width * imPos.scaleX) + this.borderPadding,
            height: (this.data.height * imPos.scaleY) + this.borderPadding,
          }
        }
      ],
      80
    );
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
