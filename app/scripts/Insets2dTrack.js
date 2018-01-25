import { DropShadowFilter } from 'pixi-filters';

// Components
import PixiTrack from './PixiTrack';
import Inset from './Inset';
import DataFetcher from './DataFetcher';

// Services
import { chromInfo } from './services';
import { create } from './services/pub-sub';

// Utils
import {
  absToChr, base64ToCanvas, colorToHex, flatten, tileToCanvas
} from './utils';

const BASE_MIN_RES = 12;
const BASE_MAX_RES = 24;
const BASE_SCALE = 4;

export default class Insets2dTrack extends PixiTrack {
  constructor(
    scene,
    dataConfig,
    dataType,
    chromInfoPath,
    options,
    animate,
    positioning  // Computed track position, location, and offset
  ) {
    super(scene, options);

    this.dataConfig = dataConfig;
    this.dataType = dataType;
    this.options = options;
    this.animate = animate;
    this.positioning = positioning;  // Needed for the gallery view

    this.fetchChromInfo = this.dataType === 'cooler'
      ? chromInfo.get(chromInfoPath)
      : undefined;

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

    this.insetMinRes = this.options.minRes || BASE_MIN_RES;
    this.insetMaxRes = this.options.maxRes || BASE_MAX_RES;
    this.insetScale = this.options.scale || BASE_SCALE;

    this.dataFetcher = new DataFetcher(dataConfig);
    this.dataFetcher.tilesetInfo((tilesetInfo) => {
      if (tilesetInfo.error) {
        console.error(
          'Error retrieving tileset info:', dataConfig, this.tilesetInfo.error
        );
      }
      this.tilesetInfo = tilesetInfo;
    });
  }

  clear() {
    this.pMain.clear();
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

  createFetchRenderInset(
    uid, x, y, w, h, sx, sy, dX1, dX2, dY1, dY2, remotePos
  ) {
    const inset = (
      this.insets[uid] ||
      this.initInset(
        uid,
        [dX1, dX2, dY1, dY2],
        remotePos
      )
    );

    inset.clear(this.options);
    inset.globalOffset(...this.position);
    inset.origin(sx, sy);
    inset.position(x, y);
    inset.size(w, h);
    inset.drawLeaderLine();
    inset.drawBorder();
    return inset.drawImage(this.rendererInset.bind(this));
  }

  dataToGenomePos(dX1, dX2, dY1, dY2, _chromInfo) {
    const x = absToChr(dX1, _chromInfo);
    const y = absToChr(dX2, _chromInfo);

    return [
      x[0],
      x[1],
      x[1] + dX2 - dX1,
      y[0],
      y[1],
      y[1] + dY2 - dY1,
    ];
  }

  dataToImPos(dX1, dX2, dY1, dY2) {
    return [dX1, dX2, dY1, dY2];
  }

  drawInset(inset) {
    if (this.dataType === 'cooler') {
      if (!this.fetchChromInfo) return Promise.reject('This is truly odd!');

      return this.fetchChromInfo
        .then(_chromInfo => this.createFetchRenderInset(
          ...inset,
          this.dataToGenomePos(
            inset[7], inset[8], inset[9], inset[10], _chromInfo
          )
        ));
    }

    return this.createFetchRenderInset(
      ...inset,
      this.dataToImPos(inset[7], inset[8], inset[9], inset[10])
    );
  }

  drawInsets(insets, insetIds) {
    if (!this.tilesetInfo) {
      return [Promise.reject('Tileset info not available')];
    }

    this.cleanUp(insetIds);

    return insets.map(inset => this.drawInset(inset));
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

  initInset(
    uid,
    dataPos,
    remotePos,
    dataConfig = this.dataConfig,
    tilesetInfo = this.tilesetInfo,
    options = this.options,
    mouseHandler = this.insetMouseHandler
  ) {
    this.insets[uid] = new Inset(
      uid,
      dataPos,
      remotePos,
      dataConfig,
      tilesetInfo,
      options,
      mouseHandler,
      this.dataType
    );
    this.pMain.addChild(this.insets[uid].graphics);
    return this.insets[uid];
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

  rendererInset(data, w, h) {
    return data.dataTypes[0] === 'dataUrl'
      ? this.rendererImage(data.fragments[0], w, h)
      : this.rendererHeatmap(data.fragments[0], w, h);
  }

  rendererHeatmap(data, w, h) {
    const flatImg = flatten(data);

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

    return Promise.resolve(tileToCanvas(pixData, w, h));
  }

  rendererImage(data, w, h) {
    return base64ToCanvas(data, w, h);
  }

  zoomed(newXScale, newYScale, k) {
    super.zoomed(newXScale, newYScale, k);

    this.publish('zoom', { newXScale, newYScale, k });
  }
}
