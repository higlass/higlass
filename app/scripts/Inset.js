import * as PIXI from 'pixi.js';

const BASE_RES = 16;
const BASE_SCALE = 4;
const BASE_SCALE_UP = 1.25;

class Inset {
  constructor(uid, dataPos, options, mouseHandler) {
    this.uid = uid;
    this.dataX1 = dataPos[0];
    this.dataX2 = dataPos[1];
    this.dataY1 = dataPos[2];
    this.dataY2 = dataPos[3];
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

  clear(options) {
    this.gBorder.clear();
    this.gLeaderLine.clear();
    this.initGraphics(options);
  }

  destroy() {
    if (this.sprite) this.sprite.removeAllListeners();

    this.gBorder.destroy();
    this.gLeaderLine.destroy();
    this.gMain.destroy();

    this.data = undefined;
    this.sprite = undefined;
  }

  graphics() {
    return this.gMain;
  }

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

  globalOffset(x = this.globalOffsetX, y = this.globalOffsetY) {
    this.globalOffsetX = x;
    this.globalOffsetY = y;
    return [x, y];
  }

  origin(x = this.originX, y = this.originY) {
    this.originX = x;
    this.originY = y;
    return [x, y];
  }

  position(x = this.x, y = this.y) {
    this.x = x;
    this.y = y;
    return [x, y];
  }

  size(width = this.width, height = this.height) {
    this.width = width;
    this.height = height;
    return [width, height];
  }

  drawBorder(
    x = this.x, y = this.y, width = this.width, height = this.height
  ) {
    this.gBorder.drawRect(
      this.globalOffsetX + this.offset + x - width,
      this.globalOffsetY + this.offset + y,
      width * this.scaleExtra,
      height * this.scaleExtra
    );
  }

  drawLeaderLine() {
    // Origin
    this.gLeaderLine.moveTo(
      this.globalOffsetX + this.originX,
      this.globalOffsetY + this.originY
    );

    // Inset position
    this.gLeaderLine.lineTo(
      this.globalOffsetX + this.x - (this.width / 2),
      this.globalOffsetY + this.y + (this.height / 2)
    );
  }

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

  positionImage() {
    this.sprite.x = this.globalOffsetX - this.offset + this.x;
    this.sprite.y = this.globalOffsetY - this.offset + this.y + this.height;

    this.sprite.scale.x = -1 * BASE_SCALE * this.scaleExtra;
    this.sprite.scale.y = -1 * BASE_SCALE * this.scaleExtra;
  }

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
      this.options.heatmapUuid,
      2  // Zoom level
    ];

    return fetch(
      `${this.options.server || ''}/fragments_by_loci/?precision=2&dims=${BASE_RES}`, {
        method: 'POST',
        headers: {
          accept: 'application/json; charset=UTF-8',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([bedpe])
      })
      .then(response => response.json());
  }

  clickHandler(event) {
    this.mouseHandler.click(event, this.gMain);
  }

  mouseOverHandler(event) {
    this.mouseHandler.mouseOver(event, this.gMain);
  }

  mouseOutHandler(event) {
    this.mouseHandler.mouseOut(event, this.gMain);
  }

  mouseDownHandler(event) {
    this.mouseDown = true;
    this.scale(BASE_SCALE_UP);
    this.mouseHandler.mouseDown(event, this.gMain);
  }

  mouseUpHandler(event) {
    if (this.mouseDown) this.clickHandler(event);
    this.scale();
    this.mouseDown = false;
    this.mouseHandler.mouseUp(event, this.gMain);
  }

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

export default Inset;
