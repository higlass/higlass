import { bisectLeft } from 'd3-array';
import * as PIXI from 'pixi.js';

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
    dataPos,
    remotePos,
    dataConfig,
    tilesetInfo,
    options,
    mouseHandler,
    dataType
  ) {
    this.uid = uid;
    this.dataX1 = dataPos[0];
    this.dataX2 = dataPos[1];
    this.dataY1 = dataPos[2];
    this.dataY2 = dataPos[3];
    this.remotePos = remotePos;
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
    const absXLen = this.remotePos[xEndId] - this.remotePos[xStartId];
    const absYLen = this.remotePos[yEndId] - this.remotePos[yStartId];
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
    graphics.drawRect(
      this.globalOffsetX + this.offsetX + x - (width / 2),
      this.globalOffsetY + this.offsetY + y - (height / 2),
      width * this.scaleExtra,
      height * this.scaleExtra
    );
  }

  /**
   * Draw leader line.
   */
  drawLeaderLine() {
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
      this.originX,
      this.originY,
      (this.originWidthHalf + 1) * 2,
      (this.originHeightHalf + 1) * 2,
      this.gLeaderLine
    );
  }

  /**
   * Draw inverse border. This is useful for creating inverted masks, which is
   *   otherwise not possible with canvas.
   * @param   {number}  x  Central x coordinate of the rectangle around which
   *   the border should be drawn.
   * @param   {number}  y  Central y coordinate of the rectangle around which
   *   the border should be drawn.
   * @param   {number}  wh  Half width of the rectangle around which the
   *   border should be drawn.
   * @param   {number}  hh  Half height of the rectangle around which the
   *   border should be drawn.
   * @param   {object}  graphics  PIXI graphics on which should be drawn.
   */
  drawBorderInverse(
    x = this.x,
    y = this.y,
    wh = this.width / 2,
    hh = this.height / 2,
    graphics = this.gBorder,
  ) {
    graphics.beginFill();
    graphics.moveTo(this.globalOffsetX, this.globalOffsetY);
    graphics.lineTo(
      this.globalOffsetX + x - wh,
      this.globalOffsetY
    );
    graphics.lineTo(
      this.globalOffsetX + x - wh,
      this.globalOffsetY + y + hh
    );
    graphics.lineTo(
      this.globalOffsetX + x + wh,
      this.globalOffsetY + y + hh
    );
    graphics.lineTo(
      this.globalOffsetX + x + wh,
      this.globalOffsetY + y - hh
    );
    graphics.lineTo(
      this.globalOffsetX + x - wh,
      this.globalOffsetY + y - hh
    );
    graphics.lineTo(
      this.globalOffsetX + x - wh,
      this.globalOffsetY
    );
    graphics.lineTo(this.globalOffsetX + this.globalWidth, this.globalOffsetY);
    graphics.lineTo(this.globalOffsetX + this.globalWidth, this.globalOffsetY + this.globalHeight);
    graphics.lineTo(this.globalOffsetX, this.globalOffsetY + this.globalHeight);
    graphics.lineTo(this.globalOffsetX, this.globalOffsetY);
    graphics.endFill();
  }

  /**
   * Draw mask around the origin. This can be used to cut of leader lines
   *   pointing to the origin at the boundaries of the original locus.
   */
  drawOriginMask() {
    this.drawBorderInverse(
      this.originX,
      this.originY,
      this.originWidthHalf,
      this.originHeightHalf,
      this.gOriginMask
    );
    this.gLeaderLine.mask = this.gOriginMask;
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
    const paddingCustomLocSorted = Object.keys(this.paddingCustom)
      .map(x => +x)
      .sort((a, b) => a - b);

    const entry = paddingCustomLocSorted[bisectLeft(
      paddingCustomLocSorted, this.remoteSize
    )];

    const padding = entry ? this.paddingCustom[entry] : this.padding;

    this.remotePaddedSize = this.remoteSize + (this.remoteSize * padding * 2);
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

    return fetch(
      `${this.dataConfig.server}/fragments_by_loci/?precision=2&dims=${this.finalRes}`, {
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
  mouseclickHandler(event) {
    this.mouseHandler.click(event, this.gMain);
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
    if (this.mouseDown) this.mouseclickHandler(event);
    this.scale();
    this.mouseDown = false;
    this.mouseHandler.mouseUp(event, this.gMain);
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
    this.drawOriginMask();
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
      Math.max(this.width, this.height) /
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
          .on('mouseup', this.mouseUpHandler.bind(this));

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
