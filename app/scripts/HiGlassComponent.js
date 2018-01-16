import React from 'react';
import PropTypes from 'prop-types';
import { select, clientPoint } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { json, request } from 'd3-request';
import slugid from 'slugid';
import ReactDOM from 'react-dom';
import ReactGridLayout from 'react-grid-layout';
import { ResizeSensor, ElementQueries } from 'css-element-queries';
import * as PIXI from 'pixi.js';
import vkbeautify from 'vkbeautify';
import parse from 'url-parse';

import { TiledPlot } from './TiledPlot';
import GenomePositionSearchBox from './GenomePositionSearchBox';
import { ExportLinkModal } from './ExportLinkModal';
import { createSymbolIcon } from './symbol';
import { all as icons } from './icons';
import ViewHeader from './ViewHeader';
import { ChromosomeInfo } from './ChromosomeInfo';
import api, { destroy as apiDestroy, publish as apiPublish } from './api';

// Services
import { chromInfo, domEvent, pubSub } from './services';

// Utils
import {
  debounce,
  dictFromTuples,
  dictItems,
  dictKeys,
  dictValues,
  download,
  getTrackByUid,
  getTrackPositionByUid,
  // loadChromInfos,
  objVals,
  positionedTracksToAllTracks,
  scalesCenterAndK,
  scalesToGenomeLoci,
} from './utils';

// Configs
import {
  DEFAULT_SERVER,
  MOUSE_TOOL_MOVE,
  MOUSE_TOOL_SELECT,
  LOCATION_LISTENER_PREFIX,
  LONG_DRAG_TIMEOUT,
  SHORT_DRAG_TIMEOUT,
  TRACKS_INFO,
  TRACKS_INFO_BY_TYPE,
} from './configs';

// Styles
import styles from '../styles/HiGlass.module.scss'; // eslint-disable-line no-unused-vars
import stylesMTHeader from '../styles/ViewHeader.module.scss'; // eslint-disable-line no-unused-vars

import stylesGlobal from '../styles/HiGlass.scss'; // eslint-disable-line no-unused-vars

const NUM_GRID_COLUMNS = 12;
const DEFAULT_NEW_VIEW_HEIGHT = 12;
const VIEW_HEADER_HEIGHT = 20;

class HiGlassComponent extends React.Component {
  constructor(props) {
    super(props);

    this.minHorizontalHeight = 20;
    this.minVerticalWidth = 20;
    this.resizeSensor = null;

    this.uid = slugid.nice();
    this.rowHeight = 40;
    this.tiledPlots = {};
    this.genomePositionSearchBoxes = {};

    // keep track of the xScales of each Track Renderer
    this.xScales = {};
    this.yScales = {};
    this.topDiv = null;

    // a reference of view / track combinations
    // to be used with combined to viewAndTrackUid
    this.viewTrackUidsToCombinedUid = {};
    this.combinedUidToViewTrack = {};

    // event listeners for when the scales of a view change
    // bypasses the React event framework because this needs
    // to be fast
    // indexed by view uid and then listener uid
    this.scalesChangedListeners = {};
    this.draggingChangedListeners = {};
    this.valueScalesChangedListeners = {};

    // locks that keep the location and zoom synchronized
    // between views
    this.zoomLocks = {};
    this.locationLocks = {};

    // locks that keep the value scales synchronized between
    // *tracks* (which can be in different views)
    this.valueScaleLocks = {};

    this.setCenters = {};

    this.plusImg = {};
    this.configImg = {};

    this.horizontalMargin = 5;
    this.verticalMargin = 5;

    this.genomePositionSearchBox = null;
    this.viewHeaders = {};

    this.boundRefreshView = (() => { this.refreshView(LONG_DRAG_TIMEOUT); });

    this.unsetOnLocationChange = [];

    let viewConfig = {};
    let views = {};
    if (typeof this.props.viewConfig === 'string') {
      // Load external viewConfig
      json(this.props.viewConfig, (error, viewConfig) => {
        this.setState({
          viewConfig,
          views: this.processViewConfig(
            JSON.parse(JSON.stringify(viewConfig))
          )
        });
        this.unsetOnLocationChange.forEach(({ viewId, callback, callbackId }) => {
          this.onLocationChange(viewId, callback, callbackId);
        });
      });
    } else {
      viewConfig = this.props.viewConfig;
      views = this.processViewConfig(
        JSON.parse(JSON.stringify(viewConfig))
      );
    }

    this.pixiStage = new PIXI.Container();
    this.pixiStage.interactive = true;
    this.element = null;

    let mouseTool = MOUSE_TOOL_MOVE;

    if (this.props.options) {
      switch (this.props.options.mouseTool) {
        case MOUSE_TOOL_SELECT:
          mouseTool = MOUSE_TOOL_SELECT;
          break;
      }
    }

    this.mounted = false;
    this.state = {
      bounded: this.props.options ? this.props.options.bounded : false,
      currentBreakpoint: 'lg',
      width: 0,
      height: 0,
      rowHeight: 30,
      svgElement: null,
      canvasElement: null,
      views,
      viewConfig,
      addTrackPositionMenuPosition: null,

      // chooseViewHandler: uid2 => this.handleZoomYanked(views[0].uid, uid2),
      // chooseViewHandler: uid2 => this.handleZoomLockChosen(views[0].uid, uid2),
      // chooseViewHandler: uid2 => this.handleCenterSynced(views[0].uid, uid2),
      // chooseTrackHandler: (viewUid, trackUid) => this.handleViewportProjected(views[0].uid, viewUid, trackUid),
      mouseOverOverlayUid: null,
      exportLinkModalOpen: false,
      exportLinkLocation: null,
      mouseTool,
    };

    dictValues(views).map(view => this.adjustLayoutToTrackSizes(view));

    // monitor whether this element is attached to the DOM so that
    // we can determine whether to add the resizesensor
    this.attachedToDOM = false;

    // Set up API
    this.api = api(this);

    this.rangeSelectionListener = [];
    this.viewChangeListener = [];

    this.triggerViewChangeDb = debounce(
      this.triggerViewChange.bind(this), 250,
    );

    this.pubSubs = [];
    this.rangeSelection = [null, null];
  }

  componentWillMount() {
    domEvent.register('keydown', document);
    domEvent.register('keyup', document);
    domEvent.register('scroll', document);
    domEvent.register('resize', window);
    domEvent.register('orientationchange', window);

    this.pubSubs = [];
    this.pubSubs.push(
      pubSub.subscribe('keydown', this.keyDownHandler.bind(this)),
    );
    this.pubSubs.push(
      pubSub.subscribe('keyup', this.keyUpHandler.bind(this)),
    );
    this.pubSubs.push(
      pubSub.subscribe('resize', this.resizeHandler.bind(this)),
    );
    this.pubSubs.push(
      pubSub.subscribe('orientationchange', this.resizeHandler.bind(this)),
    );
    this.pubSubs.push(
      pubSub.subscribe('app.animateOnMouseMove', this.animateOnMouseMoveHandler.bind(this)),
    );

    if (this.props.getApi) {
      this.props.getApi(this.api);
    }
  }

  waitForDOMAttachment(callback) {
    if (!this.mounted) return;

    const thisElement = ReactDOM.findDOMNode(this);

    if (document.body.contains(thisElement)) {
      callback();
    } else {
      requestAnimationFrame(() => this.waitForDOMAttachment(callback));
    }
  }

  componentDidMount() {
    // the addEventListener is necessary because TrackRenderer determines where to paint
    // all the elements based on their bounding boxes. If the window isn't
    // in focus, everything is drawn at the top and overlaps. When it gains
    // focus we need to redraw everything in its proper place
    this.mounted = true;
    this.element = ReactDOM.findDOMNode(this);
    window.addEventListener('focus', this.boundRefreshView);

    dictValues(this.state.views).forEach((v) => {
      if (!v.layout) {
        v.layout = this.generateViewLayout(v);
      } else {
        v.layout.i = v.uid;
      }
    });

    this.pixiRenderer = PIXI.autoDetectRenderer(this.state.width,
      this.state.height, {
        view: this.canvasElement,
        antialias: true,
        transparent: true,
        resolution: 2,
        autoResize: true,
        preserveDrawingBuffer: true,
      });

    // PIXI.RESOLUTION=2;
    this.fitPixiToParentContainer();

    // keep track of the width and height of this element, because it
    // needs to be reflected in the size of our drawing surface
    this.setState({
      svgElement: this.svgElement,
      canvasElement: this.canvasElement,
    });

    this.waitForDOMAttachment(() => {
      ElementQueries.listen();
      this.resizeSensor = new ResizeSensor(
        this.element.parentNode, this.updateAfterResize.bind(this),
      );

      // this.forceUpdate();
      this.updateAfterResize();
    });

    this.handleDragStart();
    this.handleDragStop();

    this.animate();
    // this.handleExportViewsAsLink();

    const baseSvg = select(this.element).append('svg').style('display', 'none');

    // Add SVG Icons
    icons.forEach(
      icon => createSymbolIcon(baseSvg, icon.id, icon.paths, icon.viewBox),
    );

    //loadChromInfos(this.state.views);
  }

  componentWillReceiveProps(newProps) {
    const viewsByUid = this.processViewConfig(newProps.viewConfig);

    this.setState({
      views: viewsByUid,
    });
  }

  componentWillUpdate(nextProps, nextState) {
    // let width = this.element.clientWidth;
    // let height = this.element.clientHeight;

    /*
    this.pixiRenderer.resize(width, height);
    this.pixiRenderer.view.style.width = width + 'px';
    this.pixiRenderer.view.style.height = height + 'px';
    */

    this.pixiRenderer.render(this.pixiStage);

    /*
    if (this.state.views !== nextState.views) {
      loadChromInfos(nextState.views);
    }
    */
  }

  componentDidUpdate() {
    this.animate();

    this.triggerViewChangeDb();
  }

  componentWillUnmount() {
    // Destroy PIXI renderer, stages, and assets
    this.mounted = false;
    this.pixiStage.destroy(false);
    this.pixiStage = null;
    this.pixiRenderer.destroy(true);
    this.pixiRenderer = null;

    window.removeEventListener('focus', this.boundRefreshView);

    // if this element was never attached to the DOM
    // then the resize sensor will never have been initiated
    if (this.resizeSensor) this.resizeSensor.detach();

    domEvent.unregister('keydown', document);
    domEvent.unregister('keyup', document);
    domEvent.unregister('scroll', document);

    this.pubSubs.forEach(subscription => pubSub.unsubscribe(subscription));
    this.pubSubs = [];
    apiDestroy();
  }

  /* ---------------------------- Custom Methods ---------------------------- */

  animateOnMouseMoveHandler(active) {
    if (active && !this.animateOnMouseMove) {
      this.pubSubs.push(
        pubSub.subscribe('app.mouseMove', this.animate.bind(this)),
      );
    }
    this.animateOnMouseMove = active;
  }

  fitPixiToParentContainer() {
    if (!this.element.parentNode) {
      console.warn('No parentNode:', this.element);
      return;
    }

    const width = this.element.parentNode.clientWidth;
    const height = this.element.parentNode.clientHeight;

    this.pixiRenderer.resize(width, height);

    this.pixiRenderer.view.style.width = `${width}px`;
    this.pixiRenderer.view.style.height = `${height}px`;

    this.pixiRenderer.render(this.pixiStage);
  }

  addDefaultOptions(track) {
    if (!TRACKS_INFO_BY_TYPE.hasOwnProperty(track.type)) {
      console.warn('Track type not found:', track.type, ' (check app/scripts/config/ for a list of defined track types)');
      return;
    }

    const trackOptions = track.options ? track.options : {};

    if (TRACKS_INFO_BY_TYPE[track.type].defaultOptions) {
      if (!track.options) { track.options = JSON.parse(JSON.stringify(TRACKS_INFO_BY_TYPE[track.type].defaultOptions)); } else {
        for (const optionName in TRACKS_INFO_BY_TYPE[track.type].defaultOptions) {
          track.options[optionName] = track.options[optionName] ?
            track.options[optionName] : JSON.parse(JSON.stringify(TRACKS_INFO_BY_TYPE[track.type].defaultOptions[optionName]));
        }
      }
    } else { track.options = trackOptions; }
  }

  keyDownHandler(event) {
    if (this.props.options.rangeSelectionOnAlt && event.key === 'Alt') {
      this.setState({
        mouseTool: MOUSE_TOOL_SELECT,
      });
    }
  }

  keyUpHandler(event) {
    if (this.props.options.rangeSelectionOnAlt && event.key === 'Alt') {
      this.setState({
        mouseTool: MOUSE_TOOL_MOVE,
      });
    }
  }

  animate() {
    requestAnimationFrame(() => {
      if (!this.pixiRenderer)
        // component was probably unmounted
        return;

      this.pixiRenderer.render(this.pixiStage);
    });
  }

  measureSize() {
    const heightOffset = 0;
    const height = this.element.clientHeight - heightOffset;
    const width = this.element.clientWidth;

    if (width > 0 && height > 0) {
      this.setState({
        sizeMeasured: true,
        width,
        height,
      });
    }
  }

  updateAfterResize() {
    this.measureSize();
    this.updateRowHeight();
    this.fitPixiToParentContainer();
    this.refreshView(LONG_DRAG_TIMEOUT);
  }

  onBreakpointChange(breakpoint) {
    this.setState({
      currentBreakpoint: breakpoint,
    });
  }

  handleOverlayMouseEnter(uid) {
    this.setState({
      mouseOverOverlayUid: uid,
    });
  }

  handleOverlayMouseLeave(uid) {
    this.setState({
      mouseOverOverlayUid: null,
    });
  }

  handleLockLocation(uid) {
    /**
       * We want to lock the zoom of this view to the zoom of another view.
       *
       * First we pick which other view we want to lock to.
       *
       * The we calculate the current zoom offset and center offset. The differences
       * between the center of the two views will always remain the same, as will the
       * different between the zoom levels.
       */
    // create a view chooser and remove the config view menu
    this.setState({
      chooseViewHandler: uid2 => this.handleLocationLockChosen(uid, uid2),
      mouseOverOverlayUid: uid,
    });
  }

  updateLockedValueScales(viewUid, trackUid) {
    const lockGroup = this.valueScaleLocks[this.combineViewAndTrackUid(viewUid, trackUid)];
  }

  /*
   * Iteratate over all of the views in this component
   */
  iterateOverViews() {
    const viewIds = [];

    for (const viewId in this.state.views) {
      viewIds.push(viewId);
    }

    return viewIds;
  }

  iterateOverTracksInView(viewId) {
    const allTracks = [];
    const tracks = this.state.views[viewId].tracks;

    for (const trackType in tracks) {
      for (const track of tracks[trackType]) {
        if (track.type === 'combined' && track.contents) {
          for (const subTrack of track.contents) {
            allTracks.push({ viewId, trackId: subTrack.uid, track: subTrack });
          }
        } else {
          allTracks.push({ viewId, trackId: track.uid, track: track});
        }
      }
    }

    return allTracks;
  }

  /**
   * Iterate over all the tracks in this component.
   */
  iterateOverTracks() {
    const allTracks = [];
    for (const viewId in this.state.views) {
      const tracks = this.state.views[viewId].tracks;

      for (const trackType in tracks) {
        for (const track of tracks[trackType]) {
          if (track.type === 'combined' && track.contents) {
            for (const subTrack of track.contents) {
              allTracks.push({ viewId, trackId: subTrack.uid, track: subTrack });
            }
          } else {
            allTracks.push({ viewId, trackId: track.uid, track: track });
          }
        }
      }
    }

    return allTracks;
  }

  setMouseTool(mouseTool) {
    this.setState({ mouseTool });
  }

  /**
   * Syncing the values of locked scales
   *
   * Arguments
   * ---------
   *  viewUid: string
   *    The id of the view containing the track whose value scale initially changed
   *  trackUid: string
   *    The id of the track that whose value scale changed
   *
   * Returns
   * -------
   *    Nothing
   */
  syncValueScales(viewUid, trackUid) {
    const uid = this.combineViewAndTrackUid(viewUid, trackUid);
    const sourceTrack = getTrackByUid(this.state.views[viewUid].tracks, trackUid);

    if (this.valueScaleLocks[uid]) {
      const lockGroupValues = dictValues(this.valueScaleLocks[uid]);

      // /let trackObj = this.tiledPlots[viewUid].trackRenderer.getTrackObject(trackUid);
      const lockedTracks = lockGroupValues
        .filter(x => this.tiledPlots[x.view])
        .map(x =>
        this.tiledPlots[x.view].trackRenderer.getTrackObject(x.track));

      const minValues = lockedTracks
        // exclude tracks that don't set min and max values
        .filter(x => x.minRawValue && x.maxRawValue)
        .map(x => x.minRawValue())
        .filter(x => x);

      const maxValues = lockedTracks
        // exclude tracks that don't set min and max values
        .filter(x => x.minRawValue && x.maxRawValue)
        .map(x => x.maxRawValue())
        .filter(x => x);

      const allMin = Math.min(...minValues);
      const allMax = Math.max(...maxValues);

      for (const lockedTrack of lockedTracks) {
        // set the newly calculated minimum and maximum values
        // using d3 style setters
        if (lockedTrack.minValue) { lockedTrack.minValue(allMin); }
        if (lockedTrack.maxValue) { lockedTrack.maxValue(allMax); }

        if (!lockedTrack.valueScale) {
          // this track probably hasn't loaded the tiles to
          // create a valueScale
          continue;
        }

        lockedTrack.valueScale.domain([allMin, allMax]);

        if  (
          sourceTrack.options &&
          typeof sourceTrack.options.scaleStartPercent !== 'undefined' &&
          typeof sourceTrack.options.scaleEndPercent !== 'undefined'
        ) {
          lockedTrack.options.scaleStartPercent = sourceTrack.options.scaleStartPercent;
          lockedTrack.options.scaleEndPercent = sourceTrack.options.scaleEndPercent;
        }

        // the second parameter forces a rerender even though
        // the options haven't changed
        lockedTrack.rerender(lockedTrack.options, true);
      }
    }
  }

  handleNewTilesLoaded(viewUid, trackUid) {
    // this.syncValueScales(viewUid, trackUid);
    this.animate();
  }

  notifyDragChangedListeners(dragging) {
    // iterate over viewId
    dictValues(this.draggingChangedListeners).forEach((l) => {
      // iterate over listenerId
      dictValues(l).forEach(listener => listener(dragging));
    });
  }

  addDraggingChangedListener(viewUid, listenerUid, eventHandler) {
    /**
       * Add a listener that will be called every time the view is updated.
       *
       * @param viewUid: The uid of the view being observed
       * @param listenerUid: The uid of the listener
       * @param eventHandler: The handler to be called when the scales change
       *    Event handler is called with parameters (xScale, yScale)
       */
    if (!this.draggingChangedListeners.hasOwnProperty(viewUid)) {
      this.draggingChangedListeners[viewUid] = {};
    }

    this.draggingChangedListeners[viewUid][listenerUid] = eventHandler;

    eventHandler(true);
    eventHandler(false);
  }

  removeDraggingChangedListener(viewUid, listenerUid) {
    /**
       * Remove a scale change event listener
       *
       * @param viewUid: The view that it's listening on.
       * @param listenerUid: The uid of the listener itself.
       */
    if (this.draggingChangedListeners.hasOwnProperty(viewUid)) {
      const listeners = this.draggingChangedListeners[viewUid];


      if (listeners.hasOwnProperty(listenerUid)) {
        // make sure the listener doesn't think we're still
        // dragging
        listeners[listenerUid](false);
        delete listeners[listenerUid];
      }
    }
  }

  addScalesChangedListener(viewUid, listenerUid, eventHandler) {
    /**
       * Add an event listener that will be called every time the scale
       * of the view with uid viewUid is changed.
       *
       * @param viewUid: The uid of the view being observed
       * @param listenerUid: The uid of the listener
       * @param eventHandler: The handler to be called when the scales change
       *    Event handler is called with parameters (xScale, yScale)
       */
    if (!this.scalesChangedListeners.hasOwnProperty(viewUid)) {
      this.scalesChangedListeners[viewUid] = {};
    }

    this.scalesChangedListeners[viewUid][listenerUid] = eventHandler;

    if (!this.xScales[viewUid] || !this.yScales[viewUid]) { return; }

    // call the handler for the first time
    eventHandler(this.xScales[viewUid], this.yScales[viewUid]);
  }

  removeScalesChangedListener(viewUid, listenerUid) {
    /**
       * Remove a scale change event listener
       *
       * @param viewUid: The view that it's listening on.
       * @param listenerUid: The uid of the listener itself.
       */
    if (this.scalesChangedListeners.hasOwnProperty(viewUid)) {
      const listeners = this.scalesChangedListeners[viewUid];

      if (listeners.hasOwnProperty(listenerUid)) { delete listeners[listenerUid]; }
    }
  }

  createSVG() {
    const outputSVG = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n';
    const svg = document.createElement('svg');
    svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    for (const tiledPlot of dictValues(this.tiledPlots)) {
      if (!tiledPlot) continue; //probalby opened and closed

      for (const trackDefObject of dictValues(tiledPlot.trackRenderer.trackDefObjects)) {
        if (trackDefObject.trackObject.exportSVG) {
          const trackSVG = trackDefObject.trackObject.exportSVG()[0];

          svg.appendChild(trackSVG);
        }
      }
    }
    return svg;
  }

  createSVGString() {
    const svg = this.createSVG();

    const svgText = new XMLSerializer().serializeToString(svg);
    const beautyText = vkbeautify.xml(svgText);

    return vkbeautify.xml(svgText);
  }

  createDataURI() {
    let pngString = this.canvasElement.toDataURL();

    return pngString;
  }

  handleExportSVG() {
    download('export.svg', this.createSVGString());
  }

  handleScalesChanged(uid, xScale, yScale, notify = true) {
    /*
       * The scales of some view have changed (presumably in response to zooming).
       *
       * Mark the new scales and update any locked views.
       *
       * @param uid: The view of whom the scales have changed.
       */
    this.xScales[uid] = xScale;
    this.yScales[uid] = yScale;

    if (notify) {
      if (this.scalesChangedListeners.hasOwnProperty(uid)) {
        dictValues(this.scalesChangedListeners[uid]).forEach((x) => {
          x(xScale, yScale);
        });
      }
    }

    if (this.zoomLocks[uid]) {
      // this view is locked to another
      const lockGroup = this.zoomLocks[uid];
      const lockGroupItems = dictItems(lockGroup);


      const [centerX, centerY, k] = scalesCenterAndK(this.xScales[uid], this.yScales[uid]);


      for (let i = 0; i < lockGroupItems.length; i++) {
        const key = lockGroupItems[i][0];
        const value = lockGroupItems[i][1];

        if (!this.xScales[key] || !this.yScales[key]) { continue; }

        if (key == uid) // no need to notify oneself that the scales have changed
        { continue; }

        const [keyCenterX, keyCenterY, keyK] = scalesCenterAndK(this.xScales[key],
          this.yScales[key]);

        const dx = value[0] - lockGroup[uid][0];
        const dy = value[1] - lockGroup[uid][1];
        const rk = value[2] / lockGroup[uid][2];

        // let newCenterX = centerX + dx;
        // let newCenterY = centerY + dy;
        const newK = k * rk;

        if (!this.setCenters[key]) { continue; }

        // the key here is the target of zoom lock, so we want to keep its
        // x center and y center unchanged
        const [newXScale, newYScale] = this.setCenters[key](keyCenterX,
          keyCenterY,
          newK, false);

        // because the setCenters call above has a 'false' notify, the new scales won't
        // be propagated from there, so we have to store them here
        this.xScales[key] = newXScale;
        this.yScales[key] = newYScale;

        // notify the listeners of all locked views that the scales of
        // this view have changed
        if (this.scalesChangedListeners.hasOwnProperty(key)) {
          dictValues(this.scalesChangedListeners[key]).forEach((x) => {
            x(newXScale, newYScale);
          });
        }
      }
    }

    if (this.locationLocks[uid]) {
      // this view is locked to another
      const lockGroup = this.locationLocks[uid];
      const lockGroupItems = dictItems(lockGroup);

      const [centerX, centerY, k] = scalesCenterAndK(this.xScales[uid], this.yScales[uid]);


      for (let i = 0; i < lockGroupItems.length; i++) {
        const key = lockGroupItems[i][0];
        const value = lockGroupItems[i][1];

        if (!this.xScales[key] || !this.yScales[key]) { continue; }

        const [keyCenterX, keyCenterY, keyK] = scalesCenterAndK(this.xScales[key],
          this.yScales[key]);

        if (key == uid) // no need to notify oneself that the scales have changed
        { continue; }

        const dx = value[0] - lockGroup[uid][0];
        const dy = value[1] - lockGroup[uid][1];


        const newCenterX = centerX + dx;
        const newCenterY = centerY + dy;

        if (!this.setCenters[key]) { continue; }

        const [newXScale, newYScale] = this.setCenters[key](newCenterX,
          newCenterY,
          keyK, false);

        // because the setCenters call above has a 'false' notify, the new scales won't
        // be propagated from there, so we have to store them here
        this.xScales[key] = newXScale;
        this.yScales[key] = newYScale;

        // notify the listeners of all locked views that the scales of
        // this view have changed
        if (this.scalesChangedListeners.hasOwnProperty(key)) {
          dictValues(this.scalesChangedListeners[key]).forEach((x) => {
            x(newXScale, newYScale);
          });
        }
      }
    }

    this.animate();

    // Call view change handler
    this.triggerViewChangeDb();
  }

  handleProjectViewport(uid) {
    /**
     * We want to show the extent of this viewport on another view.
     */


    this.setState({
      chooseTrackHandler: (viewUid, trackUid) => this.handleViewportProjected(uid, viewUid, trackUid),
    });
  }

  handleZoomToData(viewUid) {
    /**
     * Adjust the zoom level so that all of the data is visible
     *
     * @param viewUid: The view uid for which to adjust the zoom level
     */
    if (!this.tiledPlots[viewUid])
      throw `View uid ${viewUid} does not exist in the current viewConfig`;

    this.tiledPlots[viewUid].handleZoomToData();
  }


  handleYankFunction(uid, yankFunction) {
    /**
         * We want to yank some attributes from another view.
         *
         * This will create a view selection overlay and then call the selected
         * provided function.
         */

    this.setState({
      chooseViewHandler: uid2 => yankFunction(uid, uid2),
      mouseOverOverlayUid: uid,
    });
  }

  handleUnlock(uid, lockGroups) {
    /**
       * We want to unlock uid from the zoom group that it's in.
       *
       * @param uid: The uid of a view.
       */

    // if this function is being called, lockGroup has to exist
    const lockGroup = lockGroups[uid];
    const lockGroupKeys = dictKeys(lockGroup);

    if (lockGroupKeys.length == 2) {
      // there's only two items in this lock group so we need to
      // remove them both (no point in having one view locked to itself)
      delete lockGroups[lockGroupKeys[0]];
      delete lockGroups[lockGroupKeys[1]];

      return;
    }
    // delete this view from the zoomLockGroup
    if (lockGroups[uid]) {
      if (lockGroups[uid][uid]) { delete lockGroups[uid][uid]; }
    }

    // remove the handler
    if (lockGroups[uid]) { delete lockGroups[uid]; }
  }

  viewScalesLockData(uid) {
    if (!this.xScales[uid] || !this.yScales[uid]) {
      console.warn("View scale lock doesn't correspond to existing uid: ", uid);
      return;
    }

    return scalesCenterAndK(this.xScales[uid], this.yScales[uid]);
  }

  addLock(uid1, uid2, lockGroups, lockData) {
    /*
       * :param uid1 (string): The uid of the first element to be locked (e.g. viewUid)
       * :param uid2 (string): The uid of the second element to be locked (e.g. viewUid)
       * :param lockGroups (dict): The set of locks where to store this lock (e.g. this.locationLocks)
       * :parma lockData (function): A function that takes two uids and calculates some extra data
       *    to store with this lock data (e.g. scalesCenterAndK(this.xScales[uid1], this.yScales[uid1]))
       */
    let group1Members = [];
    let group2Members = [];

    if (!lockGroups[uid1]) {
      // view1 isn't already in a group
      group1Members = [[uid1, lockData.bind(this)(uid1)]];
    } else {
      // view1 is already in a group
      group1Members = dictItems(lockGroups[uid1])
        .filter(x => lockData(x[0])) // make sure we can create the necessary data for this lock
        // in the case of location locks, this implies that the
        // views it's locking exist
        .map(x =>
          // x is [uid, [centerX, centerY, k]]
          [x[0], lockData(x[0])],
        );
    }

    if (!lockGroups[uid2]) {
      // view1 isn't already in a group
      group2Members = [[uid2, lockData.bind(this)(uid2)]];
    } else {
      // view2 is already in a group
      group2Members = dictItems(lockGroups[uid2])
        .filter(x => lockData(x[0])) // make sure we can create the necessary data for this lock
        // in the case of location locks, this implies that the
        // views it's locking exist
        .map(x =>
          // x is [uid, [centerX, centerY, k]]
          [x[0], lockData(x[0])],
        );
    }

    const allMembers = group1Members.concat(group2Members);

    const groupDict = dictFromTuples(allMembers);

    allMembers.forEach((m) => { lockGroups[m[0]] = groupDict; });
  }

  handleLocationLockChosen(uid1, uid2) {
    /* Views uid1 and uid2 need to be locked so that they always maintain the current
         * zoom and translation difference.
         * @param uid1: The view that the lock was called from
         * @param uid2: The view that the lock was called on (the view that was selected)
         */
    if (uid1 == uid2) {
      this.setState({
        chooseViewHandler: null,
      });

      return; // locking a view to itself is silly
    }

    this.addLock(uid1, uid2, this.locationLocks, this.viewScalesLockData.bind(this));


    this.setState({
      chooseViewHandler: null,
    });
  }

  handleZoomLockChosen(uid1, uid2) {
    /* Views uid1 and uid2 need to be locked so that they always maintain the current
         * zoom and translation difference.
         * @param uid1: The view that the lock was called from
         * @param uid2: The view that the lock was called on (the view that was selected)
         */

    if (uid1 == uid2) {
      this.setState({
        chooseViewHandler: null,
      });

      return; // locking a view to itself is silly
    }

    this.addLock(uid1, uid2, this.zoomLocks, this.viewScalesLockData.bind(this));


    this.setState({
      chooseViewHandler: null,
    });
  }

  handleViewportProjected(fromView, toView, toTrack) {
    /**
     * We want to project the viewport of fromView onto toTrack of toView.
     *
     * @param fromView: The uid of the view that we want to project
     * @param toView: The uid of the view that we want to project to
     * @param toTrack: The track we want to project to
     *
     * Returns
     * -------
     *
     *  newTrackUid: string
     *      The uid of the newly created viewport projection track
     */
    let newTrackUid = null;

    if (fromView == toView) {
      alert('A view can not show its own viewport.');
    } else {
      const hostTrack = getTrackByUid(this.state.views[toView].tracks, toTrack);
      const position = getTrackPositionByUid(this.state.views[toView].tracks, toTrack);
      newTrackUid = slugid.nice();

      const projectionTypes = {
        top: 'horizontal',
        bottom: 'horizontal',
        center: 'center',
        left: 'vertical',
        right: 'vertical' };

      const newTrack = {
        uid: newTrackUid,
        type: `viewport-projection-${projectionTypes[position]}`,
        fromViewUid: fromView,
      };

      this.addCallbacks(toView, newTrack);
      this.handleTrackAdded(toView, newTrack, position, hostTrack);
    }
    this.setState({
      chooseTrackHandler: null,
    });

    return newTrackUid;
  }

  handleLocationYanked(uid1, uid2) {
    /**
         * Uid1 is copying the center of uid2
         */
    // where we're taking the zoom from
    const sourceXScale = this.xScales[uid2];
    const sourceYScale = this.yScales[uid2];

    const targetXScale = this.xScales[uid1];
    const targetYScale = this.yScales[uid1];


    const [targetCenterX, targetCenterY, targetK] = scalesCenterAndK(targetXScale, targetYScale);
    const [sourceCenterX, sourceCenterY, sourceK] = scalesCenterAndK(sourceXScale, sourceYScale);


    // set target center
    this.setCenters[uid1](sourceCenterX, sourceCenterY, targetK, true);


    this.setState({
      chooseViewHandler: null,
    });
  }

  handleZoomYanked(uid1, uid2) {
    /**
         * Uid1 yanked the zoom of uid2, now  make sure that they're synchronized.
         */

    // where we're taking the zoom from
    const sourceXScale = this.xScales[uid2];
    const sourceYScale = this.yScales[uid2];

    const targetXScale = this.xScales[uid1];
    const targetYScale = this.yScales[uid1];

    const [targetCenterX, targetCenterY, targetK] = scalesCenterAndK(targetXScale, targetYScale);
    const [sourceCenterX, sourceCenterY, sourceK] = scalesCenterAndK(sourceXScale, sourceYScale);


    // set target center
    this.setCenters[uid1](targetCenterX, targetCenterY, sourceK, true);


    this.setState({
      chooseViewHandler: null,
    });
  }


  handleTrackPositionChosen(viewUid, position) {
    /**
       * The user has chosen a position for the new track. The actual
       * track selection will be handled by TiledPlot
       *
       * We just need to close the menu here.
       */
    this.setState({
      addTrackPosition: position,
      addTrackPositionView: viewUid,
    });
  }

  /**
   * Update the height of each row in the layout so that it takes up all
   * of the available space in the div.
   */
  updateRowHeight() {
    if (!(this.props.options && this.props.options.bounded)) {
      // not bounded so we don't need to update the row height
      return;
    }

    // const width = this.element.parentNode.clientWidth;
    const height = this.element.parentNode.clientHeight;

    let maxHeight = 0;
    for (const view of dictValues(this.state.views)) {
      maxHeight = Math.max(maxHeight, view.layout.y + view.layout.h);
    }

    this.handleDragStart();
    this.handleDragStop();

    const MARGIN_HEIGHT = this.state.viewConfig.editable ? 10 : 0;

    const marginHeight = (MARGIN_HEIGHT * maxHeight) - 1;
    const availableHeight = height - marginHeight;

    // const currentRowHeight = this.state.rowHeight;
    const prospectiveRowHeight = availableHeight / maxHeight; // maxHeight is the number of
    // rows necessary to display this view

    const chosenRowHeight = Math.floor(prospectiveRowHeight);

    // for (const view of dictValues(this.state.views)) {
    //   const {
    //     totalWidth,
    //     totalHeight,
    //     topHeight,
    //     bottomHeight,
    //     leftWidth,
    //     rightWidth,
    //     centerWidth,
    //     centerHeight,
    //     minNecessaryHeight
    //   } = this.calculateViewDimensions(view);

    //   // If the view is bounded, then we always fit everything inside the container
    //   //
    //   // It used to be that if the viewconfig was too long, we just let it overflow,
    //   // but I think it's better that it's always contained.

    //   /*
    //         if (minNecessaryHeight > view.layout.h * (prospectiveRowHeight + MARGIN_HEIGHT)) {
    //             // we don't have space for one of the containers, so let them exceed the bounds
    //             // of the box
    //             chosenRowHeight = currentRowHeight;
    //             break;
    //         }
    //         */
    // }

    this.setState({
      rowHeight: chosenRowHeight,
    });
  }

  handleLayoutChange(layout, layouts) {
    /**
       * Notify the children that the layout has changed so that they
       * know to redraw themselves
       */

    if (!this.element) { return; }

    for (const l of layout) {
      const view = this.state.views[l.i];

      if (view) {
        view.layout = l;
      }
    }

    // some of the views have changed their height
    /*
      this.setState({
          views: this.state.views
      });
      */

    this.updateRowHeight();

    this.refreshView(LONG_DRAG_TIMEOUT);
  }

  clearDragTimeout() {
    /**
       * Maybe somebody started dragging again before the previous drag
       * timeout fired. In that case, we need to clear this timeout so
       * that it doesn't override a previously set one.
       */
    if (this.dragTimeout) {
      clearTimeout(this.dragTimeout);
      this.dragTimeout = null;
    }
  }

  forceRefreshView() {
    // force everything to rerender

    this.setState(this.state);
  }

  refreshView(timeout = SHORT_DRAG_TIMEOUT) {
    this.clearDragTimeout();

    this.notifyDragChangedListeners(true);

    this.clearDragTimeout();
    this.dragTimeout = setTimeout(() => {
      this.notifyDragChangedListeners(false);
    }, timeout);
  }

  handleDragStart(layout, oldItem, newItem, placeholder, e, element) {
    this.clearDragTimeout();
    this.notifyDragChangedListeners(true);
  }

  handleDragStop() {
    // wait for the CSS transitions to end before
    // turning off the dragging state
    //
    this.clearDragTimeout();
    this.dragTimeout = setTimeout(() => {
      this.notifyDragChangedListeners(false);
    }, LONG_DRAG_TIMEOUT);
  }

  resizeHandler() {
    objVals(this.viewHeaders).filter(x => x).forEach(viewHeader => viewHeader.checkWidth());
  }

  fillInMinWidths(tracksDict) {
    /**
         * If tracks don't have specified dimensions, add in the known
         * minimums
         *
         * Operates on the tracks stored for this TiledPlot.
         */
    const horizontalLocations = ['top', 'bottom'];

    // first make sure all track types are specified
    // this will make the code later on simpler
    if (!('center' in tracksDict)) { tracksDict.center = []; }
    if (!('left' in tracksDict)) { tracksDict.left = []; }
    if (!('right' in tracksDict)) { tracksDict.right = []; }
    if (!('top' in tracksDict)) { tracksDict.top = []; }
    if (!('bottom' in tracksDict)) { tracksDict.bottom = []; }

    for (let j = 0; j < horizontalLocations.length; j++) {
      const tracks = tracksDict[horizontalLocations[j]];

      // e.g. no 'top' tracks
      if (!tracks) { continue; }

      for (let i = 0; i < tracks.length; i++) {
        const trackInfo = TRACKS_INFO_BY_TYPE[tracks[i].type];

        if (!('height' in tracks[i]) || (trackInfo && tracks[i].height < trackInfo.minHeight)) {
          if (trackInfo && trackInfo.minHeight) {
            tracks[i].height = trackInfo.minHeight;
          } else { tracks[i].height = this.minHorizontalHeight; }
        }
      }
    }

    const verticalLocations = ['left', 'right'];

    for (let j = 0; j < verticalLocations.length; j++) {
      const tracks = tracksDict[verticalLocations[j]];

      // e.g. no 'left' tracks
      if (!tracks) { continue; }

      for (let i = 0; i < tracks.length; i++) {
        const trackInfo = TRACKS_INFO_BY_TYPE[tracks[i].type];

        if (!('width' in tracks[i]) || (trackInfo && tracks[i].width < trackInfo.minWidth)) {
          //
          if (trackInfo && trackInfo.minWidth) { tracks[i].width = trackInfo.minWidth; } else { tracks[i].width = this.minVerticalWidth; }
        }
      }
    }

    return tracksDict;
  }


  calculateViewDimensions(view) {
    /**
       * Get the dimensions for this view, counting just the tracks
       * that are present in it
       *
       * @param view: A view containing a list of tracks as a member.
       * @return: A width and a height pair (e.g. [width, height])
       */
    const defaultHorizontalHeight = 20;
    const defaultVerticalWidth = 0;
    const defaultCenterHeight = 100;
    const defaultCenterWidth = 100;
    let currHeight = this.horizontalMargin * 2;
    let currWidth = this.verticalMargin * 2; // currWidth will generally be ignored because it will just be set to
    // the width of the enclosing container
    let minNecessaryHeight = 0;
    minNecessaryHeight += 10; // the header

    const MIN_VERTICAL_HEIGHT = 20;

    if (view.tracks.top) {
      // tally up the height of the top tracks

      for (let i = 0; i < view.tracks.top.length; i++) {
        const track = view.tracks.top[i];
        currHeight += track.height ? track.height : defaultHorizontalHeight;
        minNecessaryHeight += track.height ? track.height : defaultHorizontalHeight;
      }
    }

    if (view.tracks.bottom) {
      // tally up the height of the top tracks

      for (let i = 0; i < view.tracks.bottom.length; i++) {
        const track = view.tracks.bottom[i];
        currHeight += track.height ? track.height : defaultHorizontalHeight;
        minNecessaryHeight += track.height ? track.height : defaultHorizontalHeight;
      }
    }

    if ((view.tracks.left && view.tracks.left.length > 0) ||
          (view.tracks.right && view.tracks.right.length > 0) ||
            (view.tracks.center && view.tracks.center.length > 0)) { minNecessaryHeight += MIN_VERTICAL_HEIGHT; }

    let leftHeight = 0;
    if (view.tracks.left) {
      // tally up the height of the top tracks

      for (let i = 0; i < view.tracks.left.length; i++) {
        const track = view.tracks.left[i];
        const thisHeight = track.height ? track.height : defaultCenterHeight;
        currWidth += track.width ? track.width : defaultVerticalWidth;

        leftHeight = Math.max(leftHeight, thisHeight);
      }
    }

    let rightHeight = 0;

    if (view.tracks.right) {
      // tally up the height of the top tracks

      for (let i = 0; i < view.tracks.right.length; i++) {
        const track = view.tracks.right[i];
        const thisHeight = track.height ? track.height : defaultCenterHeight;
        currWidth += track.width ? track.width : defaultVerticalWidth;

        rightHeight = Math.max(rightHeight, thisHeight);
      }
    }

    const sideHeight = Math.max(leftHeight, rightHeight);

    let centerHeight = 0;
    let centerWidth = 0;
    if (view.tracks.center && dictValues(view.tracks.center).length > 0) {
      if (!view.tracks.center[0].contents || view.tracks.center[0].contents.length > 0) {
        let centerHeight = null;
        let centerWidth = null;

        if (view.tracks.center[0].contents) {
          // combined track in the center
          for (const track of view.tracks.center[0].contents) {
            centerHeight = Math.max(centerHeight, track.height ? track.height : defaultCenterHeight);
            centerWidth = Math.max(centerWidth, track.width ? track.width : defaultCenterWidth);
          }
        } else {
          centerHeight = view.tracks.center[0].height ? view.tracks.center[0].height : defaultCenterHeight;
          centerWidth = view.tracks.center[0].width ? view.tracks.center[0].width : defaultCenterWidth;
        }

        currHeight += centerHeight;
        currWidth += centerWidth;
      }
    } else if (((view.tracks.top && dictValues(view.tracks.top).length > 1) ||
                  (view.tracks.bottom && dictValues(view.tracks.bottom).length > 1)) &&
              ((view.tracks.left && dictValues(view.tracks.left).length) ||
               (view.tracks.right && dictValues(view.tracks.right).length))) {
      centerWidth = defaultCenterWidth;
      centerHeight = defaultCenterHeight;
    }

    // make the total height the greater of the left height
    // and the center height
    if (sideHeight > centerHeight) { currHeight += sideHeight; } else { currHeight += centerHeight; }

    let topHeight = 0;
    let bottomHeight = 0;
    let leftWidth = 0;
    let rightWidth = 0;

    if ('top' in view.tracks) {
      topHeight = view.tracks.top
        .map(x => (x.height ? x.height : defaultHorizontalHeight))
        .reduce((a, b) => a + b, 0);
    }
    if ('bottom' in view.tracks) {
      bottomHeight = view.tracks.bottom
        .map(x => (x.height ? x.height : defaultHorizontalHeight))
        .reduce((a, b) => a + b, 0);
    }
    if ('left' in view.tracks) {
      leftWidth = view.tracks.left
        .map(x => (x.width ? x.width : defaultVerticalWidth))
        .reduce((a, b) => a + b, 0);
    }
    if ('right' in view.tracks) {
      rightWidth = view.tracks.right
        .map(x => (x.width ? x.width : defaultVerticalWidth))
        .reduce((a, b) => a + b, 0);
    }

    return { totalWidth: currWidth,
      totalHeight: currHeight,
      topHeight,
      bottomHeight,
      leftWidth,
      rightWidth,
      centerWidth,
      centerHeight,
      minNecessaryHeight };
  }

  generateViewLayout(view) {
    let layout = null;

    if ('layout' in view) {
      layout = view.layout;
    } else {
      const minTrackHeight = 30;
      const elementWidth = this.element.clientWidth;

      let { totalWidth, totalHeight,
        topHeight, bottomHeight,
        leftWidth, rightWidth,
        centerWidth, centerHeight } = this.calculateViewDimensions(view);

      if (view.searchBox) { totalHeight += 30; }

      const heightGrid = Math.ceil(totalHeight / this.rowHeight);

      layout = {
        x: 0,
        y: 0,
        w: NUM_GRID_COLUMNS,
        h: DEFAULT_NEW_VIEW_HEIGHT,
      };

      // the height should be adjusted when the layout changes


      /*
        if ('center' in view.tracks || 'left' in view.tracks || 'right' in view.tracks) {
            let desiredHeight = ((elementWidth - leftWidth - rightWidth - 2 * this.horizontalMargin) );
            desiredHeight +=  topHeight + bottomHeight + 2*this.verticalMargin + 20;

            // how much height is left in the browser?

            // limit the height of the container to the window height
            // the number 160 is relatively arbitrary and should be
            // replaced with a concrete measure of the element below and
            // above the canvas area
            let availableHeight = window.innerHeight - 160;

            if (desiredHeight > availableHeight )
                desiredHeight = availableHeight;

            // stretch the view out
            layout.h = Math.ceil(desiredHeight / this.rowHeight);
        }
        else
            layout.h = heightGrid;

        layout.minH = heightGrid;
        layout.i = slugid.nice();
        */
    }

    return layout;
  }

  handleClearView(viewUid) {
    /**
     * Remove all the tracks from a view
     *
     * @param {viewUid} Thie view's identifier
     */
    const views = this.state.views;

    views[viewUid].tracks.top = [];
    views[viewUid].tracks.bottom = [];
    views[viewUid].tracks.center = [];
    views[viewUid].tracks.left = [];
    views[viewUid].tracks.right = [];

    this.setState({
      views: views,
    });
  }

  handleCloseView(uid) {
    /**
       * A view needs to be closed. Remove it from from the viewConfig and then clean
       * up all of its connections (zoom links, workers, etc...)
       *
       * @param {uid} This view's identifier
       */

    // check if this is the only view
    // if it is, don't close it (display an error message)
    if (dictValues(this.state.views).length == 1) {
      return;
    }

    // if this view was zoom locked to another, we need to unlock it
    this.handleUnlock(uid, this.zoomLocks);
    delete this.state.views[uid];

    const viewsByUid = this.removeInvalidTracks(this.state.views);

    // might want to notify the views that they're beig closed
    this.setState({
      views: viewsByUid,
    });
  }

  handleSeriesAdded(viewId, newTrack, position, hostTrack) {
    /**
         * We're adding a new dataset to an existing track
         *
         * @param newTrack: The new track to be added.
         * @param position: Where the new series should be placed.
         *  (This could also be inferred from the hostTrack, but since
         *  we already have it, we might as well use it)
         * @param hostTrack: The track that will host the new series.
         */

    // is the host track a combined track?
    // if so, easy, just append the new track to its contents
    // if not, remove the current track from the track list
    // create a new combined track, add the current and the new
    // tracks and then update the whole track list
    const tracks = this.state.views[viewId].tracks;

    if (hostTrack.type == 'combined') {
      hostTrack.contents.push(newTrack);
    } else {
      const newHost = { type: 'combined',
        uid: slugid.nice(),
        height: hostTrack.height,
        width: hostTrack.width,
        contents: [hostTrack, newTrack] };

      const positionTracks = tracks[position];

      for (let i = 0; i < positionTracks.length; i++) {
        if (positionTracks[i].uid == hostTrack.uid) { positionTracks[i] = newHost; }
      }
    }

    this.setState({
      views: this.state.views,
    });
  }

  handleNoTrackAdded() {
    if (this.state.addTrackPosition) {
      // we've already added the track, remove the add track dialog
      this.setState({
        addTrackPosition: null,
      });
    }
  }

  handleTracksAdded(viewId, newTracks, position, host) {
    /**
         * Add multiple new tracks (likely from the AddTrackModal dialog)
         *
         * @param trackInfo: A JSON object that can be used as a track
         *                   definition
         * @param position: The position the track is being added to
         * @param host: If this track is being added to another track
         */
    this.storeTrackSizes(viewId);

    for (const newTrack of newTracks) { this.handleTrackAdded(viewId, newTrack, position, host); }
  }

  handleChangeTrackType(viewUid, trackUid, newType) {
    /**
     * Change the type of a track. For example, convert a line to a bar track.
     *
     * Parameters
     * ----------
     *  viewUid: string
     *    The view containing the track to be changed
     *  trackUid: string
     *    The uid identifying the existin track
     *  newType: string
     *    The type to switch this track to.
     */
    const view = this.state.views[viewUid];
    let trackConfig = getTrackByUid(view.tracks, trackUid);

    // this track needs a new uid so that it will be rerendered
    trackConfig.uid = slugid.nice();
    trackConfig.type = newType;

    this.setState({
      views: this.state.views,
    });
  }

  handleTrackAdded(viewId, newTrack, position, host = null) {
    /**
         * A track was added from the AddTrackModal dialog.
         *
         * @param trackInfo: A JSON object that can be used as a track
         *                   definition
         * @param position: The position the track is being added to
         * @param host: If this track is being added to another track
         *
         * Returns
         * -------
         *
         *  { uid: "", width: }:
         *      The trackConfig object describing this track.
         */
    this.addDefaultOptions(newTrack);

    // make sure the new track has a uid
    if (!newTrack.uid)
      newTrack.uid = slugid.nice();

    if (newTrack.contents) {
      // add default options to combined tracks
      for (const ct of newTrack.contents) { this.addDefaultOptions(ct); }
    }

    this.addNameToTrack(newTrack);

    if (this.state.addTrackPosition) {
      // we've already added the track, remove the add track dialog
      this.setState({
        addTrackPosition: null,
      });
    }

    if (host) {
      // we're adding a series rather than a whole new track
      this.handleSeriesAdded(viewId, newTrack, position, host);
      return;
    }

    newTrack.width = TRACKS_INFO_BY_TYPE[newTrack.type].minWidth ? TRACKS_INFO_BY_TYPE[newTrack.type].minWidth
      : this.minVerticalWidth;
    newTrack.height = TRACKS_INFO_BY_TYPE[newTrack.type].minHeight ? TRACKS_INFO_BY_TYPE[newTrack.type].minHeight
      : this.minHorizontalHeight;

    const tracks = this.state.views[viewId].tracks;
    if (position == 'left' || position == 'top') {
      // if we're adding a track on the left or the top, we want the
      // new track to appear at the begginning of the track list
      tracks[position].unshift(newTrack);
    } else if (position == 'center') {
      // we're going to have to either overlay the existing track with a new one
      // or add another one on top
      if (tracks.center.length == 0) {
        // no existing tracks
        const newCombined = {
          uid: slugid.nice(),
          type: 'combined',
          contents: [
            newTrack],
        };
        tracks.center = [newCombined];
      } else {
        // center track exists
        if (tracks.center[0].type == 'combined') {
          // if it's a combined track, we just need to add this track to the
          // contents
          tracks.center[0].contents.push(newTrack);
        } else {
          // if it's not, we have to create a new combined track
          const newCombined = {
            uid: slugid.nice(),
            type: 'combined',
            contents: [
              tracks.center[0],
              newTrack],
          };

          tracks.center = [newCombined];
        }
      }
    } else {
      // otherwise, we want it at the end of the track list
      if (!tracks[position])
        // this position wasn't defined in the original viewconf
        tracks[position] = [];
      tracks[position].push(newTrack);
    }

    this.adjustLayoutToTrackSizes(this.state.views[viewId]);

    return newTrack;
  }

  storeTrackSizes(viewId) {
    /**
         * Go through each track and store its size in the viewconf.
         *
         * This is so that sizes don't get lost when the view is unbounded
         * and new tracks are added.
         *
         * Parameters
         * ----------
         *
         *  viewId : string
         *      The id of the view whose tracks we're measuring
         *
         * Returns
         * -------
         *
         *  Nothing
         */
    const looseTracks = positionedTracksToAllTracks(this.state.views[viewId].tracks);

    for (const track of looseTracks) {
      const trackObj = this.tiledPlots[viewId].trackRenderer.getTrackObject(track.uid);

      track.width = trackObj.dimensions[0];
      track.height = trackObj.dimensions[1];
    }
  }

  adjustLayoutToTrackSizes(view) {
    /*
         * Adjust the layout to match the size of the contained tracks. If tracks
         * are added, the layout size needs to expand. If they're removed, it needs
         * to contract.
         *
         * This function should be called from handleTrackAdded and handleCloseTrack.
         *
         * Parameters
         * ----------
         *
         *  view : {...}
         *      The definition from the viewconf
         */
    // if the view is too short, expand the view so that it fits this track
    if (!view.layout) { return; }

    let totalTrackHeight = 0;

    // we are not checking for this.viewHeaders because this function may be
    // called before the component is mounted
    if (this.state.viewConfig.editable) {
      totalTrackHeight += VIEW_HEADER_HEIGHT;
    }

    // the tracks are larger than the height of the current view, so we need
    // to extend it
    const { totalHeight } = this.calculateViewDimensions(view);
    totalTrackHeight += totalHeight;

    const MARGIN_HEIGHT = this.state.viewConfig.editable ? 10 : 0;

    if (!this.props.options.bounded) {
      view.layout.h = Math.ceil(
        (totalTrackHeight + MARGIN_HEIGHT) /
              (this.state.rowHeight + MARGIN_HEIGHT),
      );
    }
  }

  handleCloseTrack(viewId, uid) {
    const tracks = this.state.views[viewId].tracks;

    this.handleUnlockValueScale(viewId, uid);

    for (const trackType in tracks) {
      const theseTracks = tracks[trackType];
      const newTracks = theseTracks.filter(d => d.uid != uid);

      if (newTracks.length == theseTracks.length) {
        // no whole tracks need to removed, see if any of the combined tracks
        // contain series which need to go
        const combinedTracks = newTracks.filter(x => x.type == 'combined');

        combinedTracks.forEach((ct) => {
          ct.contents = ct.contents.filter(x => x.uid != uid);
        });
      } else {
        tracks[trackType] = newTracks;
      }
    }

    this.storeTrackSizes(viewId);
    this.adjustLayoutToTrackSizes(this.state.views[viewId]);

    this.setState({
      views: this.state.views,
    });

    return this.state.views;
  }

  handleLockValueScale(fromViewUid, fromTrackUid) {
    this.setState({
      chooseTrackHandler: (toViewUid, toTrackUid) =>
        this.handleValueScaleLocked(fromViewUid, fromTrackUid, toViewUid, toTrackUid),
    });
  }

  combineViewAndTrackUid(viewUid, trackUid) {
    // see if we've already created a uid for this view / track combo
    const uid = `${viewUid}.${trackUid}`;

    this.combinedUidToViewTrack[uid] = { view: viewUid, track: trackUid };

    if (this.viewTrackUidsToCombinedUid[viewUid]) {
      if (this.viewTrackUidsToCombinedUid[trackUid]) { return this.viewTrackUidsToCombinedUid[viewUid][trackUid]; }

      this.viewTrackUidsToCombinedUid[viewUid][trackUid] = uid;
    } else {
      this.viewTrackUidsToCombinedUid[viewUid] = {};
      this.viewTrackUidsToCombinedUid[viewUid][trackUid] = uid;
    }


    return uid;
  }

  handleUnlockValueScale(viewUid, trackUid) {
    // if it's combined track, unlock each individual component
    if (this.tiledPlots[viewUid].trackRenderer.getTrackObject(trackUid).createdTracks) {
      // if the from view is a combined track, recurse and add links between its child tracks
      const childTrackUids = dictKeys(this.tiledPlots[viewUid]
        .trackRenderer
        .getTrackObject(trackUid)
        .createdTracks);
      for (const childTrackUid of childTrackUids) {
        this.handleUnlock(this.combineViewAndTrackUid(viewUid, childTrackUid), this.valueScaleLocks);
      }
    } else {
      this.handleUnlock(this.combineViewAndTrackUid(viewUid, trackUid), this.valueScaleLocks);
    }
  }


  handleValueScaleLocked(fromViewUid, fromTrackUid, toViewUid, toTrackUid) {
    if (this.tiledPlots[fromViewUid].trackRenderer.getTrackObject(fromTrackUid).createdTracks) {
      // if the from view is a combined track, recurse and add links between its child tracks
      const childTrackUids = dictKeys(this.tiledPlots[fromViewUid]
        .trackRenderer
        .getTrackObject(fromTrackUid)
        .createdTracks);
      for (const childTrackUid of childTrackUids) {
        this.handleValueScaleLocked(fromViewUid, childTrackUid, toViewUid, toTrackUid);
      }

      return;
    }

    if (this.tiledPlots[toViewUid].trackRenderer.getTrackObject(toTrackUid).createdTracks) {
      // if the from view is a combined track, recurse and add links between its child tracks
      const childTrackUids = dictKeys(this.tiledPlots[toViewUid]
        .trackRenderer
        .getTrackObject(toTrackUid)
        .createdTracks);
      for (const childTrackUid of childTrackUids) {
        this.handleValueScaleLocked(fromViewUid, fromTrackUid, toViewUid, childTrackUid);
      }

      return;
    }

    const fromUid = this.combineViewAndTrackUid(fromViewUid, fromTrackUid);
    const toUid = this.combineViewAndTrackUid(toViewUid, toTrackUid);

    this.addLock(fromUid, toUid, this.valueScaleLocks, uid => this.combinedUidToViewTrack[uid]);

    this.syncValueScales(fromViewUid, fromTrackUid);

    this.setState({
      chooseTrackHandler: null,
    });
  }

  addCallbacks(viewUid, track) {
    /**
       * Add callbacks for functions that need them
       *
       * Done in place.
       *
       * @param track: A view with tracks.
       */
    if (track.type == 'viewport-projection-center'
          || track.type == 'viewport-projection-horizontal'
          || track.type == 'viewport-projection-vertical'
    ) {
      const fromView = track.fromViewUid;

      track.registerViewportChanged = (trackId, listener) => this.addScalesChangedListener(fromView, trackId, listener),
      track.removeViewportChanged = trackId => this.removeScalesChangedListener(fromView, trackId),
      track.setDomainsCallback = (xDomain, yDomain) => {
        const tXScale = scaleLinear().domain(xDomain).range(this.xScales[fromView].range());
        const tYScale = scaleLinear().domain(yDomain).range(this.yScales[fromView].range());

        const [tx, ty, k] = scalesCenterAndK(tXScale, tYScale);
        this.setCenters[fromView](tx, ty, k, false);

        let zoomLocked = false;
        let locationLocked = false;

        // if we drag the brush and this view is locked to others, we don't
        // want the movement we induce in them to come back and modify this
        // view and set up a feedback loop
        if (viewUid in this.zoomLocks) { zoomLocked = fromView in this.zoomLocks[viewUid]; }
        if (zoomLocked) { this.handleUnlock(viewUid, this.zoomLocks); }

        if (viewUid in this.locationLocks) { locationLocked = fromView in this.locationLocks[viewUid]; }
        if (locationLocked) { this.handleUnlock(viewUid, this.locationLocks); }

        this.handleScalesChanged(fromView, tXScale, tYScale, true);

        if (zoomLocked) { this.addLock(viewUid, fromView, this.zoomLocks, this.viewScalesLockData); }
        if (locationLocked) { this.addLock(viewUid, fromView, this.locationLocks, this.viewScalesLockData); }
      };
    }
  }

  deserializeLocationLocks(viewConfig) {
    this.locationLocks = {};

    if (viewConfig.locationLocks) {
      for (const viewUid of dictKeys(viewConfig.locationLocks.locksByViewUid)) {
        this.locationLocks[viewUid] = viewConfig.locationLocks
          .locksDict[viewConfig.locationLocks.locksByViewUid[viewUid]];
      }
    }
  }

  deserializeZoomLocks(viewConfig) {
    this.zoomLocks = {};

    //
    if (viewConfig.zoomLocks) {
      for (const viewUid of dictKeys(viewConfig.zoomLocks.locksByViewUid)) {
        this.zoomLocks[viewUid] = viewConfig.zoomLocks
          .locksDict[viewConfig.zoomLocks.locksByViewUid[viewUid]];
      }
    }
  }

  deserializeValueScaleLocks(viewConfig) {
    if (viewConfig.valueScaleLocks) {
        for (let viewUid of dictKeys(viewConfig.valueScaleLocks.locksByViewUid)) {
            this.valueScaleLocks[viewUid] = viewConfig.valueScaleLocks
                .locksDict[viewConfig.valueScaleLocks.locksByViewUid[viewUid]];
        }
    }
  }

  serializeLocks(locks) {
    const locksDict = {};
    const locksByViewUid = {};

    for (const viewUid of dictKeys(locks)) {
      let lockUid = locks[viewUid] && locks[viewUid].uid;

      if (!lockUid) {
        // otherwise, assign this locationLock its own uid
        lockUid = slugid.nice();
      }
      locks[viewUid].uid = lockUid;

      // make a note that we've seen this lock
      locksDict[lockUid] = locks[viewUid];

      // note that this view has a reference to this lock
      locksByViewUid[viewUid] = locks[viewUid].uid;
    }

    // remove the uids we just added
    // for (let viewUid of dictKeys(locks)) {
    //   if (locks[viewUid].hasOwnProperty('uid')) {
    //     locks[viewUid].uid = undefined;
    //     delete locks[viewUid].uid;
    //   }
    // }

    return { locksByViewUid, locksDict };
  }

  getViewsAsString() {
    const newJson = JSON.parse(JSON.stringify(this.state.viewConfig));
    newJson.views = dictItems(this.state.views).map((k) => {
      const newView = JSON.parse(JSON.stringify(k[1]));
      const uid = k[0];

      for (const track of positionedTracksToAllTracks(newView.tracks)) {

        if (track.server) {
          const url = parse(track.server, {});

          if (!url.hostname.length) {
            // no hostname specified in the track source servers so we'll add the
            // current URL's
            const hostString = window.location.host;
            const protocol = window.location.protocol;
            const newUrl = `${protocol}//${hostString}${url.pathname}`

            track.server = newUrl;
          }
        }

        if ('serverUidKey' in track) { delete track.serverUidKey; }
        if ('uuid' in track) { delete track.uuid; }
        if ('private' in track) { delete track.private; }
        if ('maxZoom' in track) { delete track.maxZoom; }
        if ('coordSystem' in track) { delete track.coordSystem; }
        if ('coordSystem2' in track) { delete track.coordSystem2; }
        if ('datatype' in track) { delete track.datatype; }
        if ('maxWidth' in track) { delete track.maxWidth; }
        if ('datafile' in track) { delete track.datafile; }
        if ('filetype' in track) { delete track.filetype; }
        if ('binsPerDimension' in track) { delete track.binsPerDimension; }
      }
      //

      newView.uid = uid;
      newView.initialXDomain = this.xScales[uid].domain();
      newView.initialYDomain = this.yScales[uid].domain();

      return newView;
    });

    newJson.zoomLocks = this.serializeLocks(this.zoomLocks);
    newJson.locationLocks = this.serializeLocks(this.locationLocks);
    newJson.valueScaleLocks = this.serializeLocks(this.valueScaleLocks);

    const data = JSON.stringify(newJson, null, 2);
    return data;
  }

  handleExportViewAsJSON() {
    const data = this.getViewsAsString();
    const file = new Blob([data], { type: 'text/json' });

    download('viewconf.json', data);
  }

  handleExportViewsAsLink() {
    const wrapper = `{"viewconf":${this.getViewsAsString()}}`;

    this.width = this.element.clientWidth;
    this.height = this.element.clientHeight;

    this.setState({
      exportLinkModalOpen: true,
      exportLinkLocation: null,
    });

    request(this.state.viewConfig.exportViewUrl)
      .header('X-Requested-With', 'XMLHttpRequest')
      .header('Content-Type', 'application/json')
      .post(wrapper, (error, response) => {
        if (response) {
          const content = JSON.parse(response.response);
          const portString = window.location.port === '' ? '' : `:${window.location.port}`;
          this.setState({
            // exportLinkLocation: this.state.viewConfig.exportViewUrl + "?d=" + content.uid
            exportLinkLocation: `http://${window.location.hostname}${portString}/app/?config=${content.uid}`,
          });
        } else {
          console.error('error:', error);
        }
      });
  }

  handleDataDomainChanged(viewUid, newXDomain, newYDomain) {
    /*
         * The initial[XY]Domain of a view has changed. Update its definition
         * and rerender.
         */
    const views = this.state.views;

    views[viewUid].initialXDomain = newXDomain;
    views[viewUid].initialYDomain = newYDomain;

    this.setState({ views });
  }

  viewPositionAvailable(pX, pY, w, h) {
    /**
       * Check if we can place a view at this position
       */
    const pEndX = pX + w;
    const pEndY = pY + h;

    if (pX + w > NUM_GRID_COLUMNS) {
      // this view will go over the right edge of our grid
      return false;
    }

    const sortedViews = dictValues(this.state.views);

    // check if this position
    for (let j = 0; j < sortedViews.length; j++) {
      const svX = sortedViews[j].layout.x;
      const svY = sortedViews[j].layout.y;

      const svEndX = svX + sortedViews[j].layout.w;
      const svEndY = svY + sortedViews[j].layout.h;

      const intersects = false;

      if (pX < svEndX && pEndX > svX) {
        // x range intersects
        if (pY < svEndY && pEndY > svY) {
          // y range intersects
          return false;
        }
      }
    }

    return true;
  }

  handleAddView(view) {
    /**
       * User clicked on the "Add View" button. We'll duplicate the last
       * view.
       */

    const views = dictValues(this.state.views);
    const lastView = view;

    const potentialPositions = [];

    for (let i = 0; i < views.length; i++) {
      let pX = views[i].layout.x + views[i].layout.w;
      let pY = views[i].layout.y;

      // can we place the new view to the right of this view?
      if (this.viewPositionAvailable(pX, pY, view.layout.w, view.layout.h)) { potentialPositions.push([pX, pY]); }

      pX = views[i].layout.x;
      pY = views[i].layout.y + views[i].layout.h;
      // can we place the new view below this view
      if (this.viewPositionAvailable(pX, pY, view.layout.w, view.layout.h)) { potentialPositions.push([pX, pY]); }
    }


    potentialPositions.sort((a, b) => {
      const n = a[1] - b[1];

      if (n == 0) {
        return a[0] - b[0];
      }

      return n;
    });

    /*
      for (let i = 0; i < views.length; i++) {
          let view = views[i];

          if ('layout' in view) {
              if ('minH' in view.layout)
                    maxY += Math.max(maxY, view.layout.y + view.layout.minH);
              else
                    maxY += Math.max(maxY, view.layout.y + 1);
          }
      }
      */

    const jsonString = JSON.stringify(lastView);

    const newView = JSON.parse(jsonString); // ghetto copy

    // place this new view below all the others
    newView.layout.x = potentialPositions[0][0];
    newView.layout.y = potentialPositions[0][1];

    // give it its own unique id
    newView.uid = slugid.nice();
    newView.layout.i = newView.uid;

    positionedTracksToAllTracks(newView.tracks).forEach(t => this.addCallbacks(newView.uid, t));

    this.state.views[newView.uid] = newView;

    this.setState({
      views: this.state.views,
    });

    /*
      this.state
      freshViewConfig.views.push(newView);
      let newViewConfigText = JSON.stringify(freshViewConfig);

      this.props.onNewConfig(newViewConfigText);
      */
  }

  addNameToTrack(track) {
    /**
       * Add a name to this track based on its track type.
       *
       * Name is added in-place.
       *
       * The list of track information can be found in config.js:TRACKS_INFO
       */
    const typeToName = {};
    TRACKS_INFO.forEach((x) => {
      if (x.name) { typeToName[x.type] = x.name; }
    });

    if (track.type in typeToName) { track.name = typeToName[track.type]; }

    return track;
  }

  addUidsToTracks(allTracks) {
    /**
         * Add track names to the ones that have known names in config.js
         */

    allTracks.forEach((t) => {
      if (!t.uid) { t.uid = slugid.nice(); }
    });

    return allTracks;
  }

  addNamesToTracks(allTracks) {
    /**
         * Add track names to the ones that have known names in config.js
         */

    allTracks.forEach((t) => {
      if (!t.name) { this.addNameToTrack(t); }
    });

    return allTracks;
  }

  handleSelectedAssemblyChanged(viewUid, newAssembly, newAutocompleteId, newServer) {
    /*
     * A new assembly was selected in the GenomePositionSearchBox.
     * Update the corresponding
     * view's entry
     *
     * Arguments
     * ---------
     *
     * viewUid: string
     *      The uid of the view this genomepositionsearchbox belongs to
     * newAssembly: string
     *      The new assembly it should display coordinates for
     *
     * Returns
     * -------
     *
     *  Nothing
     */
    const views = this.state.views;

    views[viewUid].genomePositionSearchBox.chromInfoId = newAssembly;
    views[viewUid].genomePositionSearchBox.autocompleteId = newAutocompleteId;
    views[viewUid].genomePositionSearchBox.autocompleteServer = newServer;
  }

  createGenomePostionSearchBoxEntry(existingGenomePositionSearchBox, suggestedAssembly) {
    /*
         * Create genomePositionSearchBox settings. If existing settings for this view exist,
         * then use those. Otherwise use defaults.
         *
         * Arguments:
         *     existingGenomePositionSearchBox:
         *          {
         *              autocompleteServer: string (e.g. higlass.io/api/v1),
         *              autocompleteId: string (e.g. Xz1f)
         *              chromInfoServer: string (e.g. higlass.io/api/v1)
         *              chromInfoId: string (e.g. hg19)
         *              visible: boolean (e.g. true)
         *           }
         *          If there's already information about which assembly and autocomplete
         *          source to use, it should be in this format.
         *
         *      suggestedAssembly:
         *          Guess which assembly should be displayed based on the tracks visible.
         *          In all meaningful scenarios, all tracks should be of the same assembly
         *          but in case they're not, suggest the most common one
         *
         * Return:
         *      A valid genomePositionSearchBox object
         *
         */
    let newGpsb = existingGenomePositionSearchBox;
    const defaultGpsb = {
      autocompleteServer: DEFAULT_SERVER,
      // "autocompleteId": "OHJakQICQD6gTD7skx4EWA",
      chromInfoServer: DEFAULT_SERVER,
      visible: false,
    };

    if (!newGpsb) { newGpsb = JSON.parse(JSON.stringify(defaultGpsb)); }

    if (!newGpsb.autocompleteServer) { newGpsb.autocompleteServer = defaultGpsb.autocompleteServer; }

    /*
         * If we don't have an autocompleteId, we'll try to look it up in
         * the autocomplete server
         */
    /*
        if (!newGpsb.autocompleteId)
            newGpsb.autocompleteId = defaultGpsb.autocompleteId;
        */

    if (!newGpsb.chromInfoId) {
      newGpsb.chromInfoId = suggestedAssembly;
    }

    if (!newGpsb.chromInfoServer) { newGpsb.chromInfoServer = defaultGpsb.chromInfoServer; }

    if (!newGpsb.visible) { newGpsb.visible = false; }

    return newGpsb;
  }

  handleTogglePositionSearchBox(viewUid) {
    /*
         * Show or hide the genome position search box for a given view
         */

    const view = this.state.views[viewUid];
    view.genomePositionSearchBoxVisible = !view.genomePositionSearchBoxVisible;

    const positionedTracks = positionedTracksToAllTracks(view.tracks);

    // count the number of tracks that are part of some assembly
    const assemblyCounts = {};
    for (const track of positionedTracks) {
      if (!track.coordSystem) { continue; }

      if (!assemblyCounts[track.coordSystem]) { assemblyCounts[track.coordSystem] = 0; }

      assemblyCounts[track.coordSystem] += 1;
    }

    const sortedAssemblyCounts = dictItems(assemblyCounts).sort((a, b) => b[1] - a[1]);
    let selectedAssembly = 'hg19'; // always the default if nothing is otherwise selected

    if (sortedAssemblyCounts.length) { selectedAssembly = sortedAssemblyCounts[0][0]; }

    view.genomePositionSearchBox = this.createGenomePostionSearchBoxEntry(view.genomePositionSearchBox,
      selectedAssembly);
    view.genomePositionSearchBox.visible = !view.genomePositionSearchBox.visible;

    this.refreshView();

    this.setState({
      views: this.state.views,
      configMenuUid: null,
    });
  }

  handleTrackOptionsChanged(viewUid, trackUid, newOptions) {
    // some track's options changed...
    // redraw the track  and store the changes in the config file
    const view = this.state.views[viewUid];
    const track = getTrackByUid(view.tracks, trackUid);

    if (!track)
      return;

    track.options = Object.assign(track.options, newOptions);

    if (this.mounted) {
      this.setState({
        views: this.state.views,
      });
    }
  }

  isTrackValid(track, viewUidsPresent) {
    /**
         * Determine whether a track is valid and can be displayed.
         *
         * Tracks can be invalid due to inconsistent input such as
         * referral to views that don't exist
         *
         * @param track (object): A track definition
         * @param viewUidsPresent (Set): The view uids which are available
         */

    if (track.type == 'viewport-projection-center') {
      if (!viewUidsPresent.has(track.fromViewUid)) {
        return false;
      }
    }

    return true;
  }

  removeInvalidTracks(viewsByUid) {
    /**
         * Remove tracks which can no longer be shown (possibly because the views they
         * refer to no longer exist
         */
    const viewUidsSet = new Set(dictKeys(viewsByUid));

    for (const v of dictValues(viewsByUid)) {
      for (const trackOrientation of ['left', 'top', 'center', 'right', 'bottom']) {
        if (v.tracks.hasOwnProperty(trackOrientation)) {
          // filter out invalid tracks
          v.tracks[trackOrientation] = v.tracks[trackOrientation]
            .filter(t => this.isTrackValid(t, viewUidsSet));

          // filter out invalid tracks in combined tracks
          v.tracks[trackOrientation].forEach((t) => {
            if (t.type == 'combined') {
              t.contents = t.contents
                .filter(c => this.isTrackValid(c, viewUidsSet));
            }
          });
        }
      }
    }

    return viewsByUid;
  }

  processViewConfig(viewConfig) {
    const views = viewConfig.views;
    let viewsByUid = {};

    if (!viewConfig.views || viewConfig.views.length == 0)
      throw 'No views provided in viewConfig';

    views.forEach((v) => {
      this.fillInMinWidths(v.tracks);

      // if a view doesn't have a uid, assign it one
      if (!v.uid) { v.uid = slugid.nice(); }

      viewsByUid[v.uid] = v;

      if (!v.initialXDomain) {
        throw 'No initialXDomain in provided viewconf';
      } else {
        v.initialXDomain[0] = +v.initialXDomain[0];
        v.initialXDomain[1] = +v.initialXDomain[1];

      }

      // if there's no y domain specified just use the x domain instead
      // effectively centers the view on the diagonal
      if (!v.initialYDomain) {
        v.initialYDomain = [v.initialXDomain[0], v.initialXDomain[1]];
      } else {
        v.initialXDomain[0] = +v.initialXDomain[0];
        v.initialXDomain[1] = +v.initialXDomain[1];
      }

      if (!this.xScales[v.uid])
        this.xScales[v.uid] = scaleLinear().domain(v.initialXDomain);
      if (!this.yScales[v.uid])
        this.yScales[v.uid] = scaleLinear().domain(v.initialYDomain);

      // Add names to all the tracks
      let looseTracks = positionedTracksToAllTracks(v.tracks);

      this.deserializeZoomLocks(viewConfig);
      this.deserializeLocationLocks(viewConfig);
      this.deserializeValueScaleLocks(viewConfig);

      // give tracks their default names (e.g. 'type': 'top-axis'
      // will get a name of 'Top Axis'
      looseTracks = this.addUidsToTracks(looseTracks);
      looseTracks = this.addNamesToTracks(looseTracks);

      looseTracks.forEach(t => this.addCallbacks(v.uid, t));

      // make sure that the layout for this view refers to this view
      if (v.layout) { v.layout.i = v.uid; }

      // add default options (as specified in config.js
      // (e.g. line color, heatmap color scales, etc...)
      looseTracks.forEach((t) => {
        this.addDefaultOptions(t);

        if (t.contents) {
          // add default options to combined tracks
          for (const ct of t.contents) { this.addDefaultOptions(ct); }
        }
      });
    });

    viewsByUid = this.removeInvalidTracks(viewsByUid);

    return viewsByUid;
  }

  handleWindowFocused() {
    /*
         * The window housing this view gained focus. That means the bounding boxes
         * may have changed so we need to redraw everything.
         *
         */


  }

  offRangeSelection(listenerId) {
    this.rangeSelectionListener.splice(listenerId, 1);
  }

  onRangeSelection(callback) {
    return this.rangeSelectionListener.push(callback) - 1;
  }

  rangeSelectionHandler(range) {
    this.rangeSelection = range;
    this.rangeSelectionListener.forEach(
      callback => callback(range),
    );
  }

  offViewChange(listenerId) {
    this.viewChangeListener.splice(listenerId, 1);
  }

  onViewChange(callback) {
    return this.viewChangeListener.push(callback) - 1;
  }

  triggerViewChange() {
    this.viewChangeListener.forEach(
      callback => callback(this.getViewsAsString()),
    );
  }

  getGenomeLocation(viewId) {
    return chromInfo
      .get(this.state.views[viewId].chromInfoPath)
      .then(chromInfo => scalesToGenomeLoci(
        this.xScales[viewId], this.yScales[viewId], chromInfo,
      ));
  }

  offLocationChange(viewId, listenerId) {
    this.removeScalesChangedListener(viewId, listenerId);
  }

  onLocationChange(viewId, callback, callbackId) {
    const viewsIds = Object.keys(this.state.views);

    if (!viewsIds.length) {
      // HiGlass was probably initialized with an URL instead of a viewconfig
      // and that remote viewConfig is not yet loaded.
      this.unsetOnLocationChange.push({
        viewId, callback, callbackId
      });
      return;
    }

    if (
      typeof viewId === 'undefined' || viewsIds.indexOf(viewId) === -1
    ) {
      console.error(
        '🦄 listen to me: you forgot to give me a propper view ID. ' +
        'I can\'t do nothing without that. 💩',
      );
      return;
    }

    const view = this.state.views[viewId];

    // Set chromInfo if not available
    if (!this.chromInfo) {
      this.setChromInfo(
        view.chromInfoPath,
        () => { this.onLocationChange(viewId, callback, callbackId); },
      );
      return;
    }

    // Convert scales into genomic locations
    const middleLayerListener = (xScale, yScale) => {
      callback(scalesToGenomeLoci(xScale, yScale, this.chromInfo));
    };

    let newListenerId = 1;
    if (this.scalesChangedListeners[view.uid]) {
      newListenerId = Object.keys(this.scalesChangedListeners[view.uid])
        .filter(listenerId => listenerId.indexOf(LOCATION_LISTENER_PREFIX) === 0)
        .map(listenerId => parseInt(listenerId.slice(LOCATION_LISTENER_PREFIX.length + 1), 10))
        .reduce((max, value) => Math.max(max, value), 0) + 1;
    }

    this.addScalesChangedListener(
      view.uid,
      `${LOCATION_LISTENER_PREFIX}.${newListenerId}`,
      middleLayerListener,
    );

    if (callbackId) {
      callbackId(`${LOCATION_LISTENER_PREFIX}.${newListenerId}`);
    }
  }

  /**
   * List all the views that are at the given position view position
   */
  getTiledPlotAtPosition(x, y) {
    let foundTiledPlot;

    const views = dictValues(this.state.views);

    for (let i = 0; i < views.length; i++) {
      const tiledPlot = this.tiledPlots[views[i].uid];

      const area = this.tiledAreasDivs[views[i].uid].getBoundingClientRect();

      const top = area.top;
      const bottom = top + area.height;
      const left = area.left;
      const right = left + area.width;

      const withinX = x >= left && x <= right;
      const withinY = y >= top && y <= bottom;

      if (withinX && withinY) {
        foundTiledPlot = tiledPlot;
        break;
      }
    }

    return foundTiledPlot;
  }

  /**
   * Handle mousemove events by republishing the event using pubSub.
   *
   * @param {object}  e  Event object.
   */
  mouseMoveHandler(e) {
    if (!this.topDiv) return;

    const relPos = clientPoint(this.topDiv, e);
    const hoveredTiledPlot = this.getTiledPlotAtPosition(e.clientX, e.clientY);

    const hoveredTracks = hoveredTiledPlot
      ? hoveredTiledPlot.listTracksAtPosition(relPos[0], relPos[1], true)
      : undefined;

    const hoveredTrack = hoveredTracks && hoveredTracks.length > 0
      ? hoveredTracks[0].originalTrack || hoveredTracks[0]
      : undefined;

    const relTrackPos = hoveredTrack
      ? [
        relPos[0] - hoveredTrack.position[0],
        relPos[1] - hoveredTrack.position[1],
      ]
      : relPos;

    let dataX = -1;
    let dataY = -1;

    if (hoveredTrack) {
      dataX = !hoveredTrack.flipText
        ? hoveredTrack._xScale.invert(relTrackPos[0])  // dataX
        : hoveredTrack._xScale.invert(relTrackPos[1]);  // dataY

      dataY = hoveredTrack.is2d
        ? hoveredTrack._yScale.invert(relTrackPos[1])
        : dataX;
    }

    pubSub.publish(
      'app.mouseMove',
      {
        x: relPos[0],
        y: relPos[1],
        relTrackX: relTrackPos[0],
        relTrackY: relTrackPos[1],
        dataX,
        dataY,
        isFrom2dTrack: hoveredTrack && hoveredTrack.is2d,
        isFromVerticalTrack: hoveredTrack && hoveredTrack.flipText
      }
    );
  }

  /**
   * Handle mousemove and zoom events.
   */
  mouseMoveZoomHandler(data) {
    apiPublish('mouseMoveZoom', data);
  }

  setChromInfo(chromInfoPath, callback) {
    ChromosomeInfo(chromInfoPath, (newChromInfo) => {
      this.chromInfo = newChromInfo;
      callback();
    });
  }

  render() {
    this.tiledAreasDivs = {};
    this.tiledAreas = (
      <div
        styleName="styles.tiled-area"
      />
    );

    // The component needs to be mounted in order for the initial view to have
    // the right width
    if (this.mounted) {
      this.tiledAreas = dictValues(this.state.views).map((view) => {
        const zoomFixed = typeof view.zoomFixed !== 'undefined'
          ? view.zoomFixed
          : this.props.zoomFixed;

        // only show the add track menu for the tiled plot it was selected for
        const addTrackPositionMenuPosition =
          view.uid === this.state.addTrackPositionMenuUid
            ? this.state.addTrackPositionMenuPosition
            : null;

        let overlay = null;
        if (this.state.chooseViewHandler) {
          let background = 'transparent';

          if (this.state.mouseOverOverlayUid === view.uid) background = 'green';

          overlay = (
            <div
              className="tiled-plot-overlay"
              onClick={() => this.state.chooseViewHandler(view.uid)}
              onMouseEnter={() => this.handleOverlayMouseEnter(view.uid)}
              onMouseLeave={() => this.handleOverlayMouseLeave(view.uid)}
              onMouseMove={() => this.handleOverlayMouseEnter(view.uid)}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                background,
                opacity: 0.3,
              }}
            />
          );
        }

        const tiledPlot = (
          <TiledPlot
            // Reserved props
            key={`tp${view.uid}`}
            ref={(c) => { this.tiledPlots[view.uid] = c; }}

            // Custom props
            addTrackPosition={
              this.state.addTrackPositionView === view.uid ?
                this.state.addTrackPosition : null
            }
            addTrackPositionMenuPosition={addTrackPositionMenuPosition}
            canvasElement={this.state.canvasElement}
            chooseTrackHandler={
              this.state.chooseTrackHandler ?
                trackId => this.state.chooseTrackHandler(view.uid, trackId) :
                null
            }
            chromInfoPath={view.chromInfoPath}
            editable={this.state.viewConfig.editable}
            horizontalMargin={this.horizontalMargin}
            initialXDomain={view.initialXDomain}
            initialYDomain={view.initialYDomain}
            mouseTool={this.state.mouseTool}
            onChangeTrackType={(trackId, newType) =>
              this.handleChangeTrackType(view.uid, trackId, newType)}
            onCloseTrack={uid => this.handleCloseTrack(view.uid, uid)}
            onDataDomainChanged={
              (xDomain, yDomain) =>
                this.handleDataDomainChanged(view.uid, xDomain, yDomain)
            }
            onLockValueScale={uid => this.handleLockValueScale(view.uid, uid)}
            onMouseMoveZoom={this.mouseMoveZoomHandler.bind(this)}
            onNewTilesLoaded={trackUid => this.handleNewTilesLoaded(view.uid, trackUid)}
            onNoTrackAdded={this.handleNoTrackAdded.bind(this)}
            onRangeSelection={this.rangeSelectionHandler.bind(this)}
            onScalesChanged={(x, y) => this.handleScalesChanged(view.uid, x, y)}
            onTrackOptionsChanged={
              (trackId, options) =>
                this.handleTrackOptionsChanged(view.uid, trackId, options)
            }
            onTrackPositionChosen={this.handleTrackPositionChosen.bind(this)}
            onTracksAdded={
              (newTracks, position, host) =>
                this.handleTracksAdded(view.uid, newTracks, position, host)
            }
            onUnlockValueScale={uid => this.handleUnlockValueScale(view.uid, uid)}
            onValueScaleChanged={uid => this.syncValueScales(view.uid, uid)}
            pixiStage={this.pixiStage}
            registerDraggingChangedListener={(listener) => {
              this.addDraggingChangedListener(view.uid, view.uid, listener);
            }}
            removeDraggingChangedListener={
              listener =>
                this.removeDraggingChangedListener(view.uid, view.uid, listener)
            }
            setCentersFunction={(c) => { this.setCenters[view.uid] = c; }}
            svgElement={this.state.svgElement}
            trackSourceServers={this.state.viewConfig.trackSourceServers}
            tracks={view.tracks}
            uid={view.uid}
            verticalMargin={this.verticalMargin}
            // dragging={this.state.dragging}
            zoomable={!zoomFixed}
          />
        );

        const getGenomePositionSearchBox = (isFocused, onFocus) => {
          if (!view.genomePositionSearchBox) return null;

          return (
            <GenomePositionSearchBox
              // Reserved props
              key={`gpsb${view.uid}`}
              ref={(c) => { this.genomePositionSearchBoxes[view.uid] = c; }}

              // Custom props
              autocompleteId={view.genomePositionSearchBox.autocompleteId}
              autocompleteServer={view.genomePositionSearchBox.autocompleteServer}
              chromInfoId={view.genomePositionSearchBox.chromInfoId}
              chromInfoServer={view.genomePositionSearchBox.chromInfoServer}
              isFocused={isFocused}
              // the chromInfoId is either specified in the viewconfig or guessed based on
              // the visible tracks (see createGenomePositionSearchBoxEntry)
              onFocus={onFocus}
              onSelectedAssemblyChanged={(x, y, server) =>
                this.handleSelectedAssemblyChanged(view.uid, x, y, server)}
              registerViewportChangedListener={listener =>
                this.addScalesChangedListener(view.uid, view.uid, listener)}
              removeViewportChangedListener={() =>
                this.removeScalesChangedListener(view.uid, view.uid)}
              setCenters={(centerX, centerY, k, animate, animateTime) =>
                this.setCenters[view.uid](centerX, centerY, k, false, animate, animateTime)}
              trackSourceServers={this.state.viewConfig.trackSourceServers}
              twoD={true}
            />
          );
        };

        const multiTrackHeader = this.state.viewConfig.editable && !this.state.viewConfig.hideHeader ? (
          <ViewHeader
            // Reserved props
            ref={(c) => { this.viewHeaders[view.uid] = c; }}

            // Custom props
            getGenomePositionSearchBox={getGenomePositionSearchBox}
            isGenomePositionSearchBoxVisible={
              view.genomePositionSearchBox &&
              view.genomePositionSearchBox.visible
            }
            onAddView={() => this.handleAddView(view)}
            onClearView={() => this.handleClearView(view.uid)}
            onCloseView={() => this.handleCloseView(view.uid)}
            onExportSVG={this.handleExportSVG.bind(this)}
            onExportViewsAsJSON={this.handleExportViewAsJSON.bind(this)}
            onExportViewsAsLink={this.handleExportViewsAsLink.bind(this)}
            onLockLocation={uid =>
              this.handleYankFunction(uid, this.handleLocationLockChosen.bind(this))}
            onLockZoom={uid =>
              this.handleYankFunction(uid, this.handleZoomLockChosen.bind(this))}
            onLockZoomAndLocation={uid => this.handleYankFunction(uid, (a, b) => {
              this.handleZoomLockChosen(a, b);
              this.handleLocationLockChosen(a, b);
            })}
            onProjectViewport={this.handleProjectViewport.bind(this)}
            onTakeAndLockZoomAndLocation={(uid) => {
              this.handleYankFunction(uid, (a, b) => {
                this.handleZoomYanked(a, b);
                this.handleLocationYanked(a, b);
                this.handleZoomLockChosen(a, b);
                this.handleLocationLockChosen(a, b);
              });
            }}
            onTogglePositionSearchBox={this.handleTogglePositionSearchBox.bind(this)}
            onTrackPositionChosen={position => this.handleTrackPositionChosen(view.uid, position)}
            onUnlockLocation={uid => this.handleUnlock(uid, this.locationLocks)}
            onUnlockZoom={uid => this.handleUnlock(uid, this.zoomLocks)}
            onUnlockZoomAndLocation={(uid) => {
              this.handleUnlock(uid, this.zoomLocks);
              this.handleUnlock(uid, this.locationLocks);
            }}
            onYankLocation={uid =>
              this.handleYankFunction(uid, this.handleLocationYanked.bind(this))}
            onYankZoom={uid => this.handleYankFunction(uid, this.handleZoomYanked.bind(this))}
            onYankZoomAndLocation={uid =>
              this.handleYankFunction(uid, (a, b) => {
                this.handleZoomYanked(a, b);
                this.handleLocationYanked(a, b);
              })
            }
            onZoomToData={uid => this.handleZoomToData(uid)}
            viewUid={view.uid}
          />
        ) : null;

        return (
          <div
            key={view.uid}
            ref={(c) => { this.tiledAreasDivs[view.uid] = c; }}
            styleName="styles.tiled-area"
          >
            {multiTrackHeader}
            {tiledPlot}
            {overlay}
          </div>
        );
      });
    }

    const exportLinkModal = this.state.exportLinkModalOpen ?
      (<ExportLinkModal
        height={this.height}
        linkLocation={this.state.exportLinkLocation}
        onDone={() => this.setState({ exportLinkModalOpen: false })}
        width={this.width}
      />)
      : null;

    let layouts = this.mounted ? dictValues(this.state.views)
      .filter(x => x.layout).map(x => x.layout) : [];
    layouts = JSON.parse(JSON.stringify(layouts)); // make sure to copy the layouts

    const gridLayout = (
      <ReactGridLayout
        // Reserved props
        ref={(c) => { this.gridLayout = c; }}

        // Custom props
        cols={12}
        width={this.state.width}
        draggableHandle={`.${stylesMTHeader['multitrack-header-grabber']}`}
        isDraggable={this.state.viewConfig.editable}
        isResizable={this.state.viewConfig.editable}
        layout={layouts}
        margin={this.state.viewConfig.editable ? [10, 10] : [0, 0]}
        measureBeforeMount={false}
        onBreakpointChange={this.onBreakpointChange.bind(this)}
        onDragStart={this.handleDragStart.bind(this)}
        onDragStop={this.handleDragStop.bind(this)}
        onLayoutChange={this.handleLayoutChange.bind(this)}
        onResize={this.resizeHandler.bind(this)}
        rowHeight={this.state.rowHeight}
        // for some reason, this becomes 40 within the react-grid component
        // (try resizing the component to see how much the height changes)
        // Programming by coincidence FTW :-/
        // WidthProvider option
        // I like to have it animate on mount. If you don't, delete
        // `useCSSTransforms` (it's default `true`)
        // and set `measureBeforeMount={true}`.
        useCSSTransforms={this.mounted}
      >
        {this.tiledAreas}
      </ReactGridLayout>
    );

    return (
      <div
        key={this.uid}
        ref={(c) => { this.topDiv = c; }}
        className="higlass"
        styleName="styles.higlass"
        onMouseMove={this.mouseMoveHandler.bind(this)}
      >
        <canvas
          key={this.uid}
          ref={(c) => { this.canvasElement = c; }}
          styleName="styles.higlass-canvas"
        />
        <div
          ref={(c) => { this.divDrawingSurface = c; }}
          styleName="styles.higlass-drawing-surface"
        />
        {gridLayout}
        <svg
          ref={(c) => { this.svgElement = c; }}
          styleName="styles.higlass-svg"
        />
        {exportLinkModal}
      </div>
    );
  }
}

HiGlassComponent.defaultProps = {
  options: {},
  zoomFixed: false,
};

HiGlassComponent.propTypes = {
  options: PropTypes.object,
  viewConfig: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
  ]).isRequired,
  zoomFixed: PropTypes.bool,
};

export default HiGlassComponent;
