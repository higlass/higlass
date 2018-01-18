import * as PIXI from 'pixi.js';

const BASE_RES = 16;
const BASE_SCALE = 4;
const BASE_SCALE_UP = 1.25;

export default class Inset {
  constructor(uid, dataPos, dataConfig, options, mouseHandler) {
    this.uid = uid;
    this.dataX1 = dataPos[0];
    this.dataX2 = dataPos[1];
    this.dataY1 = dataPos[2];
    this.dataY2 = dataPos[3];
    this.dataConfig = dataConfig;
    this.options = options;
    this.mouseHandler = mouseHandler;

    this.gMain = new PIXI.Graphics();
    this.gBorder = new PIXI.Graphics();
    this.gLeaderLine = new PIXI.Graphics();

    this.gMain.addChild(this.gLeaderLine);
    this.gMain.addChild(this.gBorder);

    this.scaleExtra = 1;
    this.offset = 0;
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
  clear(options) {
    this.gBorder.clear();
    this.gLeaderLine.clear();
    this.gMain.clear();
    this.initGraphics(options);
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
      this.globalOffsetX + this.offset + x - (width / 2),
      this.globalOffsetY + this.offset + y - (height / 2),
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
   * @param  {Function}  translator  Translates data into final coordinates for
   *   querying for the inset image.
   * @param  {Boolean}  force  If `true` forces a rerendering of the image.
   */
  drawImage(imgRenderer, translator, force = false) {
    if (!this.data) {
      if (!this.inFlight) {
        this.inFlight = this.fetchData(translator)
          .then((data) => {
            this.data = data;
            this.inFlight = false;
            return this.drawImage(imgRenderer, translator, force);
          })
          .catch((err) => {
            console.error('Could not load inset', err);
          });
      }
      return this.inFlight;
    }

    if (!this.sprite || force) this.renderImage(this.data, imgRenderer);

    this.positionImage();

    return Promise.resolve(true);
  }

  /**
   * Fetch data for the image.
   *
   * @param  {Function}  translator  [description]
   * @return  {Object}  Promise resolving to the JSON response
   */
  fetchData(translator) {
    const x = translator(this.dataX1);
    const y = translator(this.dataY1);

    const bedpe = [
      x[0],
      x[1],
      x[1] + this.dataX2 - this.dataX1,
      y[0],
      y[1],
      y[1] + this.dataY2 - this.dataY1,
      this.dataConfig.tilesetUid,
      2  // Zoom level
    ];

    return fetch(
      `${this.dataConfig.server || ''}/fragments_by_loci/?precision=2&dims=${BASE_RES}`, {
        method: 'POST',
        headers: {
          accept: 'application/json; charset=UTF-8',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([bedpe])
      })
      .then(response => response.json())
      .catch((error) => {
        console.warn(
          `Could not fetch snippet data for [${bedpe.join(',')}]`, error
        );
      });
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
    this.sprite.x = this.globalOffsetX - this.offset + x + (width / 2);
    this.sprite.y = this.globalOffsetY - this.offset + y + (height / 2);

    this.sprite.scale.x = -1 * BASE_SCALE * this.scaleExtra;
    this.sprite.scale.y = -1 * BASE_SCALE * this.scaleExtra;
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
  renderImage(data, imgRenderer) {
    this.data = imgRenderer(data, BASE_RES, BASE_RES);

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
  }

  /**
   * Scale the inset.
   *
   * @param  {Number}  amount  Amount by which to scale the inset
   */
  scale(amount = 1) {
    this.scaleExtra = amount;
    this.offset = BASE_RES * BASE_SCALE * (amount - 1) / -2;

    this.positionImage();
    this.gBorder.clear();
    this.initGraphics();
    this.drawBorder();
  }
}
