import { DropShadowFilter } from 'pixi-filters';

// Components
import PixiTrack from './PixiTrack';
import Inset from './Inset';

// Services
import { chromInfo } from './services';
import { create } from './services/pub-sub';

// Utils
import { absToChr, colorToHex, flatten, tileToCanvas } from './utils';
// import { workerSetPix } from './worker';

const BASE_RES = 16;
const BASE_SCALE = 4;

export default class Insets2dTrack extends PixiTrack {
  constructor(
    scene,
    dataConfig,
    chromInfoPath,
    options,
    animate,
  ) {
    super(scene, options);

    this.dataConfig = dataConfig;
    this.options = options;
    this.animate = animate;

    this.fetchChromInfo = chromInfo.get(chromInfoPath);

    this.dropShadow = new DropShadowFilter(
      90,
      this.options.dropDistance,
      this.options.dropBlur,
      0x000000,
      this.options.dropOpacity,
    );

    this.pBase.alpha = this.options.opacity;
    this.pMain.filters = [this.dropShadow];

    this.insets = {};

    this.insetMouseHandler = {
      click: this.clickHandler.bind(this),
      mouseOver: this.mouseOverHandler.bind(this),
      mouseOut: this.mouseOutHandler.bind(this),
      mouseDown: this.mouseDownHandler.bind(this),
      mouseUp: this.mouseUpHandler.bind(this)
    };

    // Create a custom pubSub interface
    const { publish, subscribe, unsubscribe } = create({});
    this.publish = publish;
    this.subscribe = subscribe;
    this.unsubscribe = unsubscribe;

    this.options.fill = colorToHex(this.options.fill);
    this.options.borderColor = colorToHex(this.options.borderColor);
    this.options.leaderLineColor = colorToHex(this.options.leaderLineColor);

    this.insetRes = this.options.resX || BASE_RES;
    this.insetScale = this.options.scale || BASE_SCALE;
  }

  clear() {
    this.pMain.clear();
  }

  initInset(
    uid,
    dataPos,
    dataConfig = this.dataConfig,
    options = this.options,
    mouseHandler = this.insetMouseHandler
  ) {
    this.insets[uid] = new Inset(uid, dataPos, dataConfig, options, mouseHandler);
    this.pMain.addChild(this.insets[uid].graphics);
    return this.insets[uid];
  }

  drawInset(uid, x, y, w, h, sx, sy, dX1, dX2, dY1, dY2) {
    return this.fetchChromInfo.then((_chromInfo) => {
      const inset = (
        this.insets[uid] ||
        this.initInset(
          uid,
          [dX1, dX2, dY1, dY2]
        )
      );

      inset.clear(this.options);
      inset.globalOffset(...this.position);
      inset.origin(sx, sy);
      inset.position(x, y);
      inset.size(w, h);
      inset.drawLeaderLine();
      inset.drawBorder();
      return inset.drawImage(
        this.renderImage, locus => absToChr(locus, _chromInfo)
      );
    });
  }

  drawInsets(insets, insetIds) {
    this.cleanUp(insetIds);

    return insets.map(inset => this.drawInset(...inset));
  }

  /**
   * Clean up inset instances
   *
   * @param  {Set}  insetIds  Set of inset IDs to keep
   */
  cleanUp(insetIds) {
    Object.keys(this.insets)
      .filter(id => !insetIds.has(id))
      .forEach(this.destroyInset.bind(this));
  }

  /**
   * Destroy an inset, i.e., call the inset's destroy method and remove it from
   * the cache.
   *
   * @param  {String}  uid  UID of the inset to be destroyed.
   */
  destroyInset(uid) {
    this.insets[uid].destroy();
    this.insets[uid] = undefined;
    delete this.insets[uid];
  }

  clickHandler(event, inset) {
    // console.log('PIXI CLICK', event.type, inset);
  }

  mouseOverHandler(event, inset) {
    // console.log('PIXI MOUSE OVER', event.type, inset);
    this.animate();
  }

  mouseOutHandler(event, inset) {
    // console.log('PIXI MOUSE OUT', event.type, inset);
    this.animate();
  }

  mouseDownHandler(event, inset) {
    this.hoveringInsetIdx = this.pMain.getChildIndex(inset);
    this.pMain.setChildIndex(inset, this.pMain.children.length - 1);
    this.animate();
  }

  mouseUpHandler(event, inset) {
    this.pMain.setChildIndex(inset, this.hoveringInsetIdx);
    this.animate();
  }

  renderImage(data, w, h) {
    const flatImg = flatten(data.fragments[0]);

    const n = flatImg.length;

    const pixData = new Uint8ClampedArray(n * 4);

    for (let i = 0; i < n; i++) {
      const j = i * 4;
      const val = 255 - (flatImg[i] * 255);
      pixData[j] = val;
      pixData[j + 1] = val;
      pixData[j + 2] = val;
      pixData[j + 3] = 255;
    }

    return tileToCanvas(pixData, w, h);
  }

  zoomed(newXScale, newYScale, k) {
    super.zoomed(newXScale, newYScale, k);

    this.publish('zoom', { newXScale, newYScale, k });
  }
}
