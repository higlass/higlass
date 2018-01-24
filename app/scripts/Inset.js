import * as PIXI from 'pixi.js';

const BASE_MIN_RES = 12;
const BASE_MAX_RES = 24;
const BASE_SCALE = 4;
const BASE_SCALE_UP = 1.25;

export default class Inset {
  constructor(
    uid,
    dataPos,
    remotePos,
    dataConfig,
    tilesetInfo,
    options,
    mouseHandler,
    isTransposed
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
    this.t = isTransposed ? -1 : 1;

    this.gMain = new PIXI.Graphics();
    this.gBorder = new PIXI.Graphics();
    this.gLeaderLine = new PIXI.Graphics();

    this.gMain.addChild(this.gLeaderLine);
    this.gMain.addChild(this.gBorder);

    this.minRes = this.options.minRes || BASE_MIN_RES;
    this.maxRes = this.options.maxRes || BASE_MAX_RES;
    this.scaleBase = this.options.scale || BASE_SCALE;
    this.scaleExtra = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.globalOffsetX = 0;
    this.globalOffsetY = 0;

    this.initGraphics(options);
  }

  /* --------------------------- Getter / Setter ---------------------------- */

  /**
   * Get main graphics.
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
    this.gBorder.clear();
    this.gLeaderLine.clear();
    this.gMain.clear();
    this.initGraphics(options);
    this.imageRendering
  }

  /**
   * Destroy graphics and unset data.
   */
  destroy() {
    if (this.sprite) this.sprite.removeAllListeners();

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
    x = this.x, y = this.y, width = this.width, height = this.height
  ) {
    this.gBorder.drawRect(
      this.globalOffsetX + (-this.offsetX * this.t) + x - (width / 2 * this.t),
      this.globalOffsetY + (-this.offsetY * this.t) + y - (height / 2 * this.t),
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
   * Compute the closest zoom level providing enough resolution for displaying
   * the snippet.
   *
   * @return  {Number}  Closest zoom level.
   */
  computedZoom() {
    const absXLen = this.remotePos[1] - this.remotePos[0];
    const absYLen = this.remotePos[3] - this.remotePos[2];
    return Math.ceil(
      Math.log2((this.maxRes * (2 ** this.tilesetInfo.max_zoom)) / Math.max(absXLen, absYLen))
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

    return fetch(
      `${this.dataConfig.server}/fragments_by_loci/?precision=2&dims=${this.minRes}`, {
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
    this.mouseHandler.mouseOver(event, this.gMain);
  }

  /**
   * Mouse out handler.
   *
   * @param  {Object}  event  Event object.
   */
  mouseOutHandler(event) {
    this.mouseHandler.mouseOut(event, this.gMain);
  }

  /**
   * Mouse down handler.
   *
   * @param  {Object}  event  Event object.
   */
  mouseDownHandler(event) {
    this.mouseDown = true;
    this.scale(BASE_SCALE_UP);
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
   * Get or set origin of the inset.
   *
   * @param  {Number}  x  X origin.
   * @param  {Number}  y  Y origin.
   * @return  {Array}   Tuple holding the X,Y origin.
   */
  origin(x = this.originX, y = this.originY) {
    this.originX = x;
    this.originY = y;
    return [x, y];
  }

  /**
   * Get or set the position of the inset.
   *
   * @param  {Number}  x  X position.
   * @param  {Number}  y  Y position.
   * @return  {Array}   Tuple holding the X,Y position.
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
    this.sprite.x = this.globalOffsetX - this.offsetX + x + (width / -2 * this.t);
    this.sprite.y = this.globalOffsetY - this.offsetY + y + (height / -2 * this.t);

    this.sprite.scale.x = this.t * this.scaleBase * this.scaleExtra;
    this.sprite.scale.y = this.t * this.scaleBase * this.scaleExtra;
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

    this.imageRendering = imgRenderer(data, this.width, this.height)
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
    this.offsetX = this.width * this.scaleBase * (amount - 1) / 2 * this.t;
    this.offsetY = this.height * this.scaleBase * (amount - 1) / 2 * this.t;

    this.positionImage();
    this.gBorder.clear();
    this.initGraphics();
    this.drawBorder();
  }
}
