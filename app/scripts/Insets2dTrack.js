import { color as d3Color } from 'd3-color';
import { scaleLinear } from 'd3-scale';
import React from 'react';
import { DropShadowFilter } from 'pixi-filters';

// Components
import ContextMenuItem from './ContextMenuItem';
import DataFetcher from './DataFetcher';
import Inset from './Inset';
import PixiTrack from './PixiTrack';

// Services
import { chromInfo } from './services';
import pubSub, { create } from './services/pub-sub';

// Factories
import { KeySet } from './factories';

// Utils
import {
  absToChr,
  base64ToCanvas,
  lDist,
  flatten,
  isTrackOrChildTrack,
  latToY,
  lngToX,
  objVals,
  tileToCanvas
} from './utils';

const BASE_MIN_SIZE = 12;
const BASE_MAX_SIZE = 24;
const BASE_SCALE = 4;
const ZOOM_TO_ANNO = 1600;

export default class Insets2dTrack extends PixiTrack {
  constructor(
    scene,
    dataConfig,
    dataType,
    chromInfoPath,
    options,
    animate,
    zoomToDataPos,
    positioning  // Computed track position, location, and offset
  ) {
    super(scene, options);

    this.isAugmentationTrack = true;

    this.dataConfig = dataConfig;
    this.dataType = dataType;
    this.options = options;
    this.animate = animate;
    this.zoomToDataPos = zoomToDataPos;
    this.positioning = positioning;  // Needed for the gallery view

    this.positioning.offsetX = this.positioning.offsetX || 0;
    this.positioning.offsetY = this.positioning.offsetY || 0;

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

    this.insets = new KeySet();
    this.insetsInPreparation = new KeySet();

    this.insetMouseHandler = {
      click: this.clickHandler.bind(this),
      clickRight: this.clickRightHandler.bind(this),
      mouseOver: this.mouseOverHandler.bind(this),
      mouseOut: this.mouseOutHandler.bind(this),
      mouseDown: this.mouseDownHandler.bind(this),
      mouseDownRight: this.mouseDownHandler.bind(this),
      mouseUp: this.mouseUpHandler.bind(this),
      mouseUpRight: this.mouseUpHandler.bind(this),
    };

    this.pubSubs.push(
      pubSub.subscribe('app.mouseMove', this.mouseMoveHandler.bind(this)),
    );

    // Create a custom pubSub interface
    const { publish, subscribe, unsubscribe } = create({});
    this.publish = publish;
    this.subscribe = subscribe;
    this.unsubscribe = unsubscribe;

    this.options.fill = d3Color(this.options.fill);
    this.options.borderColor = d3Color(this.options.borderColor);
    this.options.leaderLineColor = d3Color(this.options.leaderLineColor);
    this.options.selectColor = d3Color(this.options.selectColor);

    this.insetMinSize = this.options.minSize || BASE_MIN_SIZE;
    this.insetMaxSize = this.options.maxSize || BASE_MAX_SIZE;
    this.insetScale = this.options.scale || BASE_SCALE;

    this.dataFetcher = new DataFetcher(dataConfig);
    this.dataFetcher.tilesetInfo((tilesetInfo) => {
      if (tilesetInfo.error) {
        console.error(
          'Error retrieving tileset info:', dataConfig, tilesetInfo.error
        );
      }
      this.tilesetInfo = tilesetInfo;
    });

    this.contextMenuGoto = (
      <ContextMenuItem
        onClick={() => this.props.onAddTrack({
          type: 'horizontal-rule',
          y: this.props.coords[1],
          position: 'whole',
        })}
        onMouseEnter={e => this.handleOtherMouseEnter(e)}
      >
        {'Zoom to annotation'}
      </ContextMenuItem>
    );

    this.relCursorDist = scaleLinear()
      .domain([
        this.options.leaderLineDynamicMinDist || 0,
        this.options.leaderLineDynamicMaxDist || Math.max(...this.dimensions)
      ])
      .clamp(true);
  }

  getContextMenuGoto(inset) {
    return (
      <ContextMenuItem
        onClick={() => { this.goTo(inset); }}
      >
        {'Zoom to annotation'}
      </ContextMenuItem>
    );
  }

  goTo(inset) {
    // Add some padding for context
    const dataPos = [...inset.dataPos];
    const width = dataPos[1] - dataPos[0];
    const height = dataPos[3] - dataPos[2];
    dataPos[0] -= width * 0.2;
    dataPos[1] += width * 0.2;
    dataPos[2] -= height * 0.2;
    dataPos[3] += height * 0.2;

    this.zoomToDataPos(...dataPos, true, ZOOM_TO_ANNO);
  }

  clear() {
    this.pMain.clear();
  }

  /**
   * Clean up rendered inset and insets which are in preparation
   *
   * @param  {Set}  insetIds  Set of inset IDs to keep
   */
  cleanUp(insetIds) {
    this.insetsInPreparation.forEach((inset) => {
      if (!insetIds.has(inset.id)) {
        this.insetsInPreparation.delete(inset);
      }
    });

    this.insets.forEach((inset) => {
      if (!insetIds.has(inset.id)) {
        this.insets.delete(inset);
      }
    });
  }

  createFetchRenderInset(label, remotePos, renderedPos) {
    const inset = (
      this.insets.get(label.id) ||
      this.initInset(
        label.id,
        remotePos,
        renderedPos,
        label.dataPos
      )
    );
    this.insetsInPreparation.delete(label);

    inset.clear(this.options);
    inset.globalOffset(...this.position);
    inset.globalSize(...this.dimensions);
    inset.origin(label.oX, label.oY, label.oWH, label.oHH);
    inset.position(label.x, label.y);
    inset.size(label.width, label.height);
    inset.drawLeaderLine();
    inset.drawBorder();

    return inset.drawImage(this.rendererInset.bind(this));
  }

  dataToGenomePos(dataPos, _chromInfo) {
    return dataPos.map(([dX1, dX2, dY1, dY2]) => {
      const x = absToChr(dX1, _chromInfo);
      const y = absToChr(dY1, _chromInfo);

      return [
        x[0],
        x[1],
        x[1] + dX2 - dX1,
        y[0],
        y[1],
        y[1] + dY2 - dY1,
      ];
    });
  }

  /**
   * Draw an inset.
   * @description This is the entry point for creating an inset including to
   *   download the snippet or aggregate it represents.
   * @param   {Label}  label  Label to be drawn as an inset.
   * @return  {Promise}  Promise resolving once the inset has been drawn.
   */
  drawInset(label) {
    this.insetsInPreparation.add(label);

    if (this.dataType === 'cooler') {
      if (!this.fetchChromInfo) return Promise.reject('This is truly odd!');

      return this.fetchChromInfo
        .then((_chromInfo) => {
          if (!this.insetsInPreparation.has(label)) {
            // Label must have been deleted in the meantime
            return Promise.resolve('Inset has been deleted prior to rendering');
          }

          return this.createFetchRenderInset(
            label,
            this.dataToGenomePos(label.dataPos, _chromInfo)
          );
        });
    }

    if (this.dataType === 'osm-image') {
      return this.createFetchRenderInset(
        label,
        [...label.dataPos],
        this.lngLatToProjPos(label.dataPos)
      );
    }

    return this.createFetchRenderInset(
      label,
      label.dataPos,
      label.dataPos
    );
  }

  /**
   * Draw insets
   * @param   {KeySet}  insets  Insets to be drawn
   * @return  {Array}  List of promises that resolve one the inset is fully
   *   drawn.
   */
  drawInsets(insets) {
    if (!this.tilesetInfo) {
      return [Promise.reject('Tileset info not available')];
    }

    this.cleanUp(new Set(insets.keys));

    return insets.translate(inset => this.drawInset(inset));
  }

  /**
   * Destroy an inset, i.e., call the inset's destroy method and remove it from
   * the cache.
   *
   * @param  {String}  id  ID of the inset to be destroyed.
   */
  destroyInset(id) {
    this.insets.get(id).destroy();
    this.insets.delete(id);
  }

  initInset(
    id,
    remotePos,
    renderedPos,
    dataPos,
    dataConfig = this.dataConfig,
    tilesetInfo = this.tilesetInfo,
    options = this.options,
    mouseHandler = this.insetMouseHandler
  ) {
    const newInset = new Inset(
      id,
      remotePos,
      renderedPos,
      dataPos,
      dataConfig,
      tilesetInfo,
      options,
      mouseHandler,
      this.dataType
    );
    this.insets.add(newInset);
    this.pMain.addChild(newInset.graphics);
    return newInset;
  }

  /**
   * Project longitude and latitude to projected Mercator position
   * @param   {array}  dataPos  List of quadruples in form of `[xFrom, xTo,
   *   yFrom, yTo]` with the X coordinates being in logitude and Y being in
   *   latitude.
   * @return  {array}  Projected position in form of `[xFrom, xTo, yFrom,
   *   yTo]` where X and Y correspond to absolute pixel positions at the
   *   highest zoom level.
   */
  lngLatToProjPos(dataPos) {
    return dataPos.map(([dX1, dX2, dY1, dY2]) => [
      lngToX(dX1, 19) * this.tilesetInfo.tile_size,
      lngToX(dX2, 19) * this.tilesetInfo.tile_size,
      latToY(dY1, 19) * this.tilesetInfo.tile_size,
      latToY(dY2, 19) * this.tilesetInfo.tile_size,
    ]);
  }

  clickHandler(/* event, inset */) {}

  clickRightHandler(event, inset) {
    console.log('PIXI CONTEXT MENU', event.type, inset);

    event.data.originalEvent.hgCustomItems = [
      this.getContextMenuGoto(inset)
    ];

    pubSub.publish('contextmenu', event.data.originalEvent);
  }

  mouseOverHandler(/* event, inset */) {
    this.animate();
  }

  mouseOutHandler(/* event, inset */) {
    this.animate();
  }

  mouseDownHandler(event, inset) {
    this.hoveringInsetIdx = this.pMain.getChildIndex(inset.gMain);
    this.pMain.setChildIndex(inset.gMain, this.pMain.children.length - 1);
    this.animate();
  }

  mouseDownRightHandler(/* event, inset */) {
  }

  mouseUpHandler(event, inset) {
    this.pMain.setChildIndex(inset.gMain, this.hoveringInsetIdx);
    this.animate();
  }

  mouseUpRightHandler(/* event, inset */) {}

  mouseMoveHandler(event) {
    if (event.hoveredTracks.some(track => isTrackOrChildTrack(this, track))) {
      let x = event.relTrackX;
      let y = event.relTrackY;
      if (this.positioning.location === 'gallery') {
        x = event.x - this.position[0];
        y = event.y - this.position[0];
      }
      this.updateDistances(x, y);
    }
  }

  updateDistances(x, y) {
    const closest = { d: Infinity, inset: null };
    this.insets.forEach((inset) => {
      const d = this.computeDistance(x, y, inset);

      inset.distance(d, this.relCursorDist(d));

      if (closest.d > d) {
        closest.d = d;
        closest.inset = inset;
      }

      if (this.options.leaderLineDynamic) inset.drawLeaderLine();
    });
    // this.updateClosestInset(closest.inset);
    this.animate();
  }

  updateClosestInset(inset) {
    if (!inset || (this.closestInset && this.closestInset === inset)) return;

    if (this.closestInset) this.closestInset.blur();

    this.closestInset = inset;
    this.closestInset.focus();
    this.animate();
  }

  computeDistance(x, y, inset) {
    const distToOrigin = lDist(
      [inset.originX, inset.originY],
      [x, y]
    );
    const distToInset = lDist(
      [inset.x, inset.y],
      [x, y]
    );
    return Math.min(distToOrigin, distToInset);
  }

  rendererInset(data, w, h) {
    return data.dataTypes[0] === 'dataUrl'
      ? this.rendererImage(data.fragments[0])
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

  rendererImage(data) {
    return base64ToCanvas(data);
  }

  setDimensions(newDimensions) {
    super.setDimensions(newDimensions);

    this.publish('dimensions', newDimensions);
  }

  setPosition(newPosition) {
    super.setPosition(newPosition);

    this.publish('position', newPosition);
  }

  zoomed(newXScale, newYScale, k) {
    super.zoomed(newXScale, newYScale, k);

    this.publish('zoom', { newXScale, newYScale, k });
  }
}
