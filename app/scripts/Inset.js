import { bisectLeft } from 'd3-array';
import { color } from 'd3-color';
import clip from 'liang-barsky';
import * as PIXI from 'pixi.js';

import { canvasLinearGradient, getAngleBetweenPoints } from './utils';

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
    dataConfig,
    tilesetInfo,
    options,
    mouseHandler,
    dataType,
  ) {
    this.uid = uid;
    this.remotePos = remotePos;
    this.renderedPos = renderedPos || this.remotePos;
    this.dataConfig = dataConfig;
    this.tilesetInfo = tilesetInfo;
    this.options = options;
    this.mouseHandler = mouseHandler;
    this.dataType = dataType;

    this.isMatrix = this.dataType === 'cooler';
    this.t = this.isMatrix ? -1 : 1;

    this.gMain = new PIXI.Graphics();
    this.gBorder = new PIXI.Graphics();
    this.gLeaderLine = new PIXI.Graphics();
    this.gOriginMask = new PIXI.Graphics();

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
   * Clear and initialize graphics.
   *
   * @param  {Object}  options  Custom line style for the border and leader line
   */
  clear(options = this.options) {
    this.gOriginMask.clear();
    this.gBorder.clear();
    this.gLeaderLine.clear();
    this.gMain.clear();
    this.initGraphics(options);
  }

  /**
   * Compute the x, y, width, and height of the inset in view coordinates.
   * @param   {number}  x  X position of the inset at the original position.
   * @param   {number}  y  Y position of the inset at the original position.
   * @param   {number}  width  Original width
   * @param   {number}  height  Original height
   * @param   {boolean}  isAbs  If `true` return `[xStart, yStart, xEnd, yEnd]`.
   * @return  {array}  X, y, width, and height of the inset in view coordinates.
   */
  computeBorder(
    x = this.x,
    y = this.y,
    width = this.width,
    height = this.height,
    isAbs = false,
  ) {
    const finalX = this.globalOffsetX + this.offsetX + x - (width / 2);
    const finalY = this.globalOffsetY + this.offsetY + y - (height / 2);
    return [
      finalX,
      finalY,
      (isAbs * finalX) + (width * this.scaleExtra),
      (isAbs * finalY) + (height * this.scaleExtra),
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
      this.originHeightHalf * 2,
    ];
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
   * Destroy graphics and unset data.
   */
  destroy() {
    if (this.sprite) this.sprite.removeAllListeners();

    this.gOriginMask.destroy();
    this.gBorder.destroy();
    this.gLeaderLine.destroy();
    this.gMain.destroy();

    this.data = undefined;
    this.sprite = undefined;
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
  ) {
    graphics.drawRect(...this.computeBorder(x, y, width, height));
  }

  /**
   * Draw leader line.
   */
  drawLeaderLine() {
    if (this.options.leaderLineFading) {
      this.renderLeaderLine();
    } else {
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

  renderLeaderLine() {
    const rectInset = this.computeBorder(
      this.x, this.y, this.width, this.height, true
    );
    const rectOrigin = this.computeBorder(...this.computeBorderOrigin(), true);

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

    const xLen = pOriginNew[0] - pInsetNew[0];
    const yLen = pOriginNew[1] - pInsetNew[1];
    const hex = `#${this.options.leaderLineColor.toString(16)}`;
    const c = color(hex);
    const cf = color(hex);
    cf.opacity = 0.33;

    this.gLeaderLineGrd = new PIXI.Sprite(
      PIXI.Texture.fromCanvas(canvasLinearGradient(
        Math.sqrt((xLen ** 2) + (yLen ** 2)),
        this.options.leaderLineWidth || 2,
        {
          0: c,
          0.3: cf,
          0.7: cf,
          1: c,
        }
      ))
    );

    this.gLeaderLineGrd.x = pOriginNew[0];
    this.gLeaderLineGrd.y = pOriginNew[1];
    this.gLeaderLineGrd.rotation = getAngleBetweenPoints(
      [this.originX, this.originY],
      [this.x, this.y]
    );

    this.gLeaderLine.removeChildren();
    this.gLeaderLine.addChild(this.gLeaderLineGrd);

    return this.imageRendering;
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
    this.drawBorder(
      ...this.computeBorderOrigin(),
      this.gLeaderLine
    );
  }

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
  initGraphics(options = this.options) {
    this.gBorder.lineStyle(
      options.borderWidth || 1,
      options.borderColor || 0x000000,
      options.borderOpacity || 1
    );
    this.gLeaderLine.lineStyle(
      options.leaderLineWidth || 1,
      options.leaderLineColor || 0x000000,
      options.leaderLineOpacity || 1
    );
    this.gOriginMask.lineStyle(0);
  }

  /**
   * Mouse click handler.
   *
   * @param  {Object}  event  Event object.
   */
  mouseClickHandler(event) {
    this.mouseHandler.click(event, this.gMain);
  }

  /**
   * Mouse click handler.
   *
   * @param  {Object}  event  Event object.
   */
  mouseClickRightHandler(event) {
    this.mouseHandler.clickRight(event, this.gMain);
  }

  /**
   * Mouse over handler.
   *
   * @param  {Object}  event  Event object.
   */
  mouseOverHandler(event) {
    this.originFocus();
    this.mouseHandler.mouseOver(event, this.gMain);
  }

  /**
   * Mouse out handler.
   *
   * @param  {Object}  event  Event object.
   */
  mouseOutHandler(event) {
    this.originBlur();
    this.mouseHandler.mouseOut(event, this.gMain);
  }

  /**
   * Mouse down handler.
   *
   * @param  {Object}  event  Event object.
   */
  mouseDownHandler(event) {
    this.mouseDown = true;
    this.scale(this.onClickScale);
    this.mouseHandler.mouseDown(event, this.gMain);
  }

  /**
   * Mouse down handler for a right click.
   *
   * @param  {Object}  event  Event object.
   */
  mouseDownRightHandler(event) {
    this.mouseDownRight = true;
    this.mouseHandler.mouseDownRight(event, this.gMain);
    this.mouseClickRightHandler(event)
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
    this.mouseHandler.mouseUp(event, this.gMain);
  }

  /**
   * Mouse up handler for a right click.
   *
   * @param  {Object}  event  Event object.
   */
  mouseUpRightHandler(event) {
    this.mouseDownRight = false;
    this.mouseHandler.mouseUpRight(event, this.gMain);
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
    // this.drawOriginMask();
    this.drawOriginBorder();
  }

  /**
   * Blur the original locus. This removes the highlighting border and unsets
   *   the mask.
   */
  originBlur() {
    this.gLeaderLine.mask = null;
    this.gLeaderLine.clear();
    this.initGraphics();
    this.drawLeaderLine();
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
   * Position the image.
   *
   * @param  {Number}  x  X position of the inset to be drawn.
   * @param  {Number}  y  Y position of the inset to be drawn.
   * @param  {Number}  width  Width of the inset to be drawn.
   * @param  {Number}  height  Height of the inset to be drawn.
   */
  positionImage(
    x = this.x, y = this.y, width = this.width, height = this.height
  ) {
    // Scale the image down from its raw resolution to the inset's pixel size
    this.imScale = (
      Math.max(width, height) /
      this.scaleBase /
      Math.max(this.data.width, this.data.height)
    );

    this.sprite.x = (
      this.globalOffsetX + (this.offsetX * this.t) + x - (width / 2 * this.t)
    );
    this.sprite.y = (
      this.globalOffsetY + (this.offsetY * this.t) + y - (height / 2 * this.t)
    );
    this.sprite.scale.x = (
      this.t * this.scaleBase * this.scaleExtra * this.imScale
    );
    this.sprite.scale.y = (
      this.t * this.scaleBase * this.scaleExtra * this.imScale
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
   * Scale the inset.
   *
   * @param  {Number}  amount  Amount by which to scale the inset
   */
  scale(amount = 1) {
    this.scaleExtra = amount;
    this.offsetX = this.width * (amount - 1) / -2;
    this.offsetY = this.height * (amount - 1) / -2;

    this.positionImage();
    this.gBorder.clear();
    this.initGraphics();
    this.drawBorder();
  }
}
