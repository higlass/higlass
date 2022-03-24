import React from 'react';
import PropTypes from 'prop-types';
import { select, clientPoint } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import slugid from 'slugid';
import * as PIXI from 'pixi.js';
import ReactDOM from 'react-dom';
import ReactGridLayout from 'react-grid-layout';
import { ResizeSensor, ElementQueries } from 'css-element-queries';
import vkbeautify from 'vkbeautify';
import parse from 'url-parse';
import createPubSub, { globalPubSub } from 'pub-sub-es';

import TiledPlot from './TiledPlot';
import GenomePositionSearchBox from './GenomePositionSearchBox';
import ExportLinkDialog from './ExportLinkDialog';
import ViewHeader from './ViewHeader';
import ChromosomeInfo from './ChromosomeInfo';
import ViewConfigEditor from './ViewConfigEditor';

import createSymbolIcon from './symbol';
import { all as icons } from './icons';
import createApi from './api';

// Higher-order components
import { Provider as PubSubProvider } from './hocs/with-pub-sub';
import { Provider as ModalProvider } from './hocs/with-modal';
import { Provider as ThemeProvider } from './hocs/with-theme';

// Services
import {
  chromInfo,
  createDomEvent,
  setTileProxyAuthHeader,
  tileProxy,
  requestsInFlight,
} from './services';

// Utils
import {
  debounce,
  dictFromTuples,
  dictItems,
  dictKeys,
  dictValues,
  download,
  fillInMinWidths,
  forwardEvent,
  getElementDim,
  getTrackByUid,
  getTrackObjById,
  getTrackPositionByUid,
  hasParent,
  // loadChromInfos,
  numericifyVersion,
  objVals,
  scalesCenterAndK,
  scalesToGenomeLoci,
  toVoid,
  visitPositionedTracks,
} from './utils';

// Configs
import {
  DEFAULT_SERVER,
  DEFAULT_CONTAINER_PADDING_X,
  DEFAULT_CONTAINER_PADDING_Y,
  DEFAULT_VIEW_MARGIN,
  DEFAULT_VIEW_PADDING,
  GLOBALS,
  MOUSE_TOOL_MOVE,
  MOUSE_TOOL_SELECT,
  LOCATION_LISTENER_PREFIX,
  LONG_DRAG_TIMEOUT,
  SHORT_DRAG_TIMEOUT,
  THEME_DARK,
  THEME_LIGHT,
  TRACKS_INFO_BY_TYPE,
} from './configs';

// Styles
import styles from '../styles/HiGlass.module.scss'; // eslint-disable-line no-unused-vars
import stylesMTHeader from '../styles/ViewHeader.module.scss'; // eslint-disable-line no-unused-vars

import stylesGlobal from '../styles/HiGlass.scss'; // eslint-disable-line no-unused-vars

const NUM_GRID_COLUMNS = 12;
const DEFAULT_NEW_VIEW_HEIGHT = 12;
const VIEW_HEADER_HEIGHT = 20;
const SIZE_MODE_DEFAULT = 'default';
const SIZE_MODE_BOUNDED = 'bounded';
const SIZE_MODE_OVERFLOW = 'overflow';
const SIZE_MODE_SCROLL = 'scroll';

class HiGlassComponent extends React.Component {
  constructor(props) {
    super(props);

    // Check React version
    if (numericifyVersion(React.version) < 15.6) {
      console.warn(
        'HiGlass requires React v15.6 or higher. Current version: ',
        React.version,
      );
    }

    this.pubSub = createPubSub();
    this.domEvent = createDomEvent(this.pubSub);

    this.pubSubs = [];

    this.minHorizontalHeight = 20;
    this.minVerticalWidth = 20;
    this.resizeSensor = null;

    this.uid = slugid.nice();
    this.tiledPlots = {};
    this.genomePositionSearchBoxes = {};

    // keep track of the xScales of each Track Renderer
    this.xScales = {};
    this.yScales = {};
    this.projectionXDomains = {};
    this.projectionYDomains = {};
    this.topDiv = null;
    this.zoomToDataExtentOnInit = new Set();

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

    // axis-specific location lock
    this.locationLocksAxisWise = { x: {}, y: {} };

    // locks that keep the value scales synchronized between
    // *tracks* (which can be in different views)
    this.valueScaleLocks = {};

    this.prevAuthToken = props.options.authToken;
    this.setCenters = {};

    this.plusImg = {};
    this.configImg = {};

    // allow a different PIXI to be passed in case the
    // caller wants to use a different version
    GLOBALS.PIXI = (props.options && props.options.PIXI) || PIXI;

    this.viewMarginTop =
      +props.options.viewMarginTop >= 0
        ? +props.options.viewMarginTop
        : DEFAULT_VIEW_MARGIN;
    this.viewMarginBottom =
      +props.options.viewMarginBottom >= 0
        ? +props.options.viewMarginBottom
        : DEFAULT_VIEW_MARGIN;
    this.viewMarginLeft =
      +props.options.viewMarginLeft >= 0
        ? +props.options.viewMarginLeft
        : DEFAULT_VIEW_MARGIN;
    this.viewMarginRight =
      +props.options.viewMarginRight >= 0
        ? +props.options.viewMarginRight
        : DEFAULT_VIEW_MARGIN;

    this.viewPaddingTop =
      +props.options.viewPaddingTop >= 0
        ? +props.options.viewPaddingTop
        : DEFAULT_VIEW_PADDING;
    this.viewPaddingBottom =
      +props.options.viewPaddingBottom >= 0
        ? +props.options.viewPaddingBottom
        : DEFAULT_VIEW_PADDING;
    this.viewPaddingLeft =
      +props.options.viewPaddingLeft >= 0
        ? +props.options.viewPaddingLeft
        : DEFAULT_VIEW_PADDING;
    this.viewPaddingRight =
      +props.options.viewPaddingRight >= 0
        ? +props.options.viewPaddingRight
        : DEFAULT_VIEW_PADDING;

    this.genomePositionSearchBox = null;
    this.viewHeaders = {};

    this.boundRefreshView = () => {
      this.refreshView(LONG_DRAG_TIMEOUT);
    };

    this.unsetOnLocationChange = [];

    this.setTheme(props.options.theme, props.options.isDarkTheme);

    this.viewconfLoaded = false;

    const { viewConfig } = this.props;
    const views = this.loadIfRemoteViewConfig(this.props.viewConfig);

    if (props.options.authToken) {
      setTileProxyAuthHeader(props.options.authToken);
    }

    this.pixiRoot = new GLOBALS.PIXI.Container();
    this.pixiRoot.interactive = true;

    this.pixiStage = new GLOBALS.PIXI.Container();
    this.pixiStage.interactive = true;
    this.pixiRoot.addChild(this.pixiStage);

    this.pixiMask = new GLOBALS.PIXI.Graphics();
    this.pixiRoot.addChild(this.pixiMask);
    this.pixiStage.mask = this.pixiMask;

    this.element = null;
    this.scrollTop = 0;

    let mouseTool = MOUSE_TOOL_MOVE;

    if (this.props.options) {
      switch (this.props.options.mouseTool) {
        case MOUSE_TOOL_SELECT:
          mouseTool = MOUSE_TOOL_SELECT;
          break;
        default:
          break;
      }
    }

    if (this.props.options.pluginTracks) {
      window.higlassTracksByType = Object.assign(
        window.higlassTracksByType || {},
        this.props.options.pluginTracks,
      );
    }

    const pluginTracks = {};
    try {
      if (window.higlassTracksByType) {
        Object.entries(window.higlassTracksByType).forEach(
          ([trackType, trackDef]) => {
            pluginTracks[trackType] = trackDef;
          },
        );
      }
    } catch (e) {
      console.warn('Broken config of a plugin track');
    }

    if (this.props.options.pluginDataFetchers) {
      window.higlassDataFetchersByType = Object.assign(
        window.higlassDataFetchersByType || {},
        this.props.options.pluginDataFetchers,
      );
    }

    const pluginDataFetchers = window.higlassDataFetchersByType;

    const rowHeight = this.props.options.pixelPreciseMarginPadding ? 1 : 30;

    this.mounted = false;
    this.pluginTracks = pluginTracks;
    this.pluginDataFetchers = pluginDataFetchers;

    this.state = {
      currentBreakpoint: 'lg',
      width: 0,
      height: 0,
      rowHeight,
      svgElement: null,
      canvasElement: null,
      views,
      viewConfig,
      addTrackPositionMenuPosition: null,
      typedEditable: undefined,
      mouseOverOverlayUid: null,
      mouseTool,
      isDarkTheme: false,
      rangeSelection1dSize: [0, Infinity],
      rangeSelectionToInt: false,
      modal: null,
    };

    // monitor whether this element is attached to the DOM so that
    // we can determine whether to add the resizesensor
    this.attachedToDOM = false;

    // Set up API
    const {
      public: api,
      destroy: apiDestroy,
      publish: apiPublish,
      stack: apiStack,
    } = createApi(this, this.pubSub);
    this.api = api;
    this.apiDestroy = apiDestroy;
    this.apiPublish = apiPublish;
    this.apiStack = apiStack;

    this.viewChangeListener = [];

    this.triggerViewChangeDb = debounce(this.triggerViewChange.bind(this), 250);

    this.pubSubs = [];
    this.rangeSelection = [null, null];

    this.prevMouseHoverTrack = null;
    this.zooming = false;

    // Bound functions
    this.appClickHandlerBound = this.appClickHandler.bind(this);
    this.keyDownHandlerBound = this.keyDownHandler.bind(this);
    this.keyUpHandlerBound = this.keyUpHandler.bind(this);
    this.resizeHandlerBound = this.resizeHandler.bind(this);
    this.resizeHandlerBound = this.resizeHandler.bind(this);
    this.dispatchEventBound = this.dispatchEvent.bind(this);
    this.animateOnMouseMoveHandlerBound = this.animateOnMouseMoveHandler.bind(
      this,
    );
    this.zoomStartHandlerBound = this.zoomStartHandler.bind(this);
    this.zoomEndHandlerBound = this.zoomEndHandler.bind(this);
    this.zoomHandlerBound = this.zoomHandler.bind(this);
    this.trackDroppedHandlerBound = this.trackDroppedHandler.bind(this);
    this.trackDimensionsModifiedHandlerBound = this.trackDimensionsModifiedHandler.bind(
      this,
    );
    this.animateBound = this.animate.bind(this);
    this.animateOnGlobalEventBound = this.animateOnGlobalEvent.bind(this);
    this.requestReceivedHandlerBound = this.requestReceivedHandler.bind(this);
    this.wheelHandlerBound = this.wheelHandler.bind(this);
    this.mouseMoveHandlerBound = this.mouseMoveHandler.bind(this);
    this.onMouseLeaveHandlerBound = this.onMouseLeaveHandler.bind(this);
    this.onBlurHandlerBound = this.onBlurHandler.bind(this);
    this.openModalBound = this.openModal.bind(this);
    this.closeModalBound = this.closeModal.bind(this);
    this.handleEditViewConfigBound = this.handleEditViewConfig.bind(this);
    this.onScrollHandlerBound = this.onScrollHandler.bind(this);

    // for typed shortcuts (e.g. e-d-i-t) to toggle editable
    this.typedText = '';
    this.typedTextTimeout = null;

    this.modal = {
      open: this.openModalBound,
      close: this.closeModalBound,
    };

    this.setBroadcastMousePositionGlobally(
      this.props.options.broadcastMousePositionGlobally ||
        this.props.options.globalMousePosition,
    );
    this.setShowGlobalMousePosition(
      this.props.options.showGlobalMousePosition ||
        this.props.options.globalMousePosition,
    );
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillMount() {
    this.domEvent.register('keydown', document);
    this.domEvent.register('keyup', document);
    this.domEvent.register('scroll', document);
    this.domEvent.register('resize', window);
    this.domEvent.register('orientationchange', window);

    this.domEvent.register('wheel', window);
    this.domEvent.register('mousedown', window, true);
    this.domEvent.register('mouseup', window, true);
    this.domEvent.register('click', window, true);
    this.domEvent.register('mousemove', window);
    this.domEvent.register('touchmove', window);
    this.domEvent.register('touchstart', window);
    this.domEvent.register('touchend', window);
    this.domEvent.register('touchcancel', window);
    this.domEvent.register('blur', window);

    this.pubSubs.push(
      this.pubSub.subscribe('app.click', this.appClickHandlerBound),
      this.pubSub.subscribe('blur', this.onBlurHandlerBound),
      this.pubSub.subscribe('keydown', this.keyDownHandlerBound),
      this.pubSub.subscribe('keyup', this.keyUpHandlerBound),
      this.pubSub.subscribe('resize', this.resizeHandlerBound),
      this.pubSub.subscribe('wheel', this.wheelHandlerBound),
      this.pubSub.subscribe('orientationchange', this.resizeHandlerBound),
      this.pubSub.subscribe('app.event', this.dispatchEventBound),
      this.pubSub.subscribe(
        'app.animateOnMouseMove',
        this.animateOnMouseMoveHandlerBound,
      ),
      this.pubSub.subscribe('trackDropped', this.trackDroppedHandlerBound),
      this.pubSub.subscribe(
        'trackDimensionsModified',
        this.trackDimensionsModifiedHandlerBound,
      ),
      this.pubSub.subscribe('app.zoomStart', this.zoomStartHandlerBound),
      this.pubSub.subscribe('app.zoomEnd', this.zoomEndHandlerBound),
      this.pubSub.subscribe('app.zoom', this.zoomHandlerBound),
      this.pubSub.subscribe(
        'requestReceived',
        this.requestReceivedHandlerBound,
      ),
    );

    if (this.props.getApi) {
      this.props.getApi(this.api);
    }
  }

  get sizeMode() {
    // eslint-disable-next-line no-nested-ternary
    return typeof this.props.options.sizeMode === 'undefined'
      ? this.props.options.bounded
        ? 'bounded'
        : SIZE_MODE_DEFAULT
      : this.props.options.sizeMode;
  }

  setBroadcastMousePositionGlobally(isBroadcastMousePositionGlobally = false) {
    this.isBroadcastMousePositionGlobally = isBroadcastMousePositionGlobally;
  }

  setShowGlobalMousePosition(isShowGlobalMousePosition = false) {
    this.isShowGlobalMousePosition = isShowGlobalMousePosition;

    if (this.isShowGlobalMousePosition && !this.globalMousePositionListener) {
      this.globalMousePositionListener = globalPubSub.subscribe(
        'higlass.mouseMove',
        this.animateOnGlobalEventBound,
      );
      this.pubSubs.push(this.globalMousePositionListener);
    }

    if (this.isShowGlobalMousePosition && !this.globalMousePositionListener) {
      const index = this.pubSubs.findIndex(
        (listener) => listener === this.globalMousePositionListener,
      );

      globalPubSub.unsubscribe(this.globalMousePositionListener);

      if (index >= 0) this.pubSubs.splice(index, 1);

      this.globalMousePositionListener = undefined;
    }
  }

  zoomStartHandler() {
    this.hideHoverMenu();
    this.zooming = true;
  }

  zoomEndHandler() {
    this.zooming = false;
  }

  zoomHandler(evt) {
    if (!evt.sourceEvent) return;

    this.mouseMoveHandler(evt.sourceEvent);
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

    Object.values(this.state.views).forEach((view) => {
      this.adjustLayoutToTrackSizes(view);

      if (!view.layout) {
        view.layout = this.generateViewLayout(view);
      } else {
        view.layout.i = view.uid;
      }
    });

    const rendererOptions = {
      width: this.state.width,
      height: this.state.height,
      view: this.canvasElement,
      antialias: true,
      transparent: true,
      resolution: 2,
      autoResize: true,
    };

    switch (PIXI.VERSION[0]) {
      case '4':
        console.warn(
          'Deprecation warning: please update Pixi.js to version 5!',
        );
        if (this.props.options.renderer === 'canvas') {
          this.pixiRenderer = new GLOBALS.PIXI.CanvasRenderer(rendererOptions);
        } else {
          this.pixiRenderer = new GLOBALS.PIXI.WebGLRenderer(rendererOptions);
        }
        break;

      default:
        console.warn(
          'Deprecation warning: please update Pixi.js to version 5! ' +
            'This version of Pixi.js is unsupported. Good luck 🤞',
        );
      // eslint-disable-next-line
      case '5':
        if (this.props.options.renderer === 'canvas') {
          this.pixiRenderer = new GLOBALS.PIXI.CanvasRenderer(rendererOptions);
        } else {
          this.pixiRenderer = new GLOBALS.PIXI.Renderer(rendererOptions);
        }
        break;
    }

    // PIXI.RESOLUTION=2;
    this.fitPixiToParentContainer();

    // keep track of the width and height of this element, because it
    // needs to be reflected in the size of our drawing surface
    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState({
      svgElement: this.svgElement,
      canvasElement: this.canvasElement,
    });

    this.waitForDOMAttachment(() => {
      ElementQueries.listen();

      this.resizeSensor = new ResizeSensor(
        this.element.parentNode,
        this.updateAfterResize.bind(this),
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
    icons.forEach((icon) =>
      createSymbolIcon(baseSvg, icon.id, icon.paths, icon.viewBox),
    );
  }

  getTrackObject(viewUid, trackUid) {
    return this.tiledPlots[viewUid].trackRenderer.getTrackObject(trackUid);
  }

  getTrackRenderer(viewUid) {
    return this.tiledPlots[viewUid].trackRenderer;
  }

  /**
   * Check if the passed in viewConfig is remote (i.e. is a string).
   * If it is, fetch it before proceeding
   */
  loadIfRemoteViewConfig(viewConfig) {
    let views = {};
    if (typeof viewConfig === 'string') {
      // Load external viewConfig
      tileProxy.json(
        viewConfig,
        (error, remoteViewConfig) => {
          viewConfig = remoteViewConfig;
          this.setState({
            views: this.processViewConfig(
              JSON.parse(JSON.stringify(remoteViewConfig)),
            ),
            viewConfig: remoteViewConfig,
          });
          this.unsetOnLocationChange.forEach(
            ({ viewId, callback, callbackId }) => {
              this.onLocationChange(viewId, callback, callbackId);
            },
          );
        },
        this.pubSub,
      );
    } else {
      views = this.processViewConfig(JSON.parse(JSON.stringify(viewConfig)));
      if (this.mounted) {
        this.setState({
          viewConfig,
        });
      }
    }

    return views;
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(newProps) {
    const viewsByUid = this.loadIfRemoteViewConfig(newProps.viewConfig);

    if (newProps.options.authToken !== this.prevAuthToken) {
      // we go a new auth token so we should reload everything
      setTileProxyAuthHeader(newProps.options.authToken);

      for (const viewId of this.iterateOverViews()) {
        const trackRenderer = this.getTrackRenderer(viewId);
        const trackDefinitions = JSON.parse(trackRenderer.prevTrackDefinitions);

        // this will remove all the tracks and then recreate them
        // re-requesting all tiles with the new auth key
        trackRenderer.syncTrackObjects([]);
        trackRenderer.syncTrackObjects(trackDefinitions);
      }

      this.prevAuthToken = newProps.options.authToken;
    }

    // make sure that the current view is tall enough to display
    // all the tracks (if unbounded, which is checked in adjustLayout...)
    for (const view of dictValues(viewsByUid)) {
      this.adjustLayoutToTrackSizes(view);
    }

    this.setState({
      views: viewsByUid,
    });
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillUpdate() {
    // let width = this.element.clientWidth;
    // let height = this.element.clientHeight;

    this.pixiRenderer.render(this.pixiRoot);
  }

  componentDidUpdate() {
    this.setTheme(this.props.options.theme, this.props.options.isDarkTheme);

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

    this.domEvent.unregister('keydown', document);
    this.domEvent.unregister('keyup', document);
    this.domEvent.unregister('scroll', document);
    this.domEvent.unregister('wheel', window);
    this.domEvent.unregister('mousedown', window);
    this.domEvent.unregister('mouseup', window);
    this.domEvent.unregister('click', window);
    this.domEvent.unregister('mousemove', window);
    this.domEvent.unregister('touchmove', window);
    this.domEvent.unregister('touchstart', window);
    this.domEvent.unregister('touchend', window);
    this.domEvent.unregister('touchcancel', window);

    this.pubSubs.forEach((subscription) =>
      this.pubSub.unsubscribe(subscription),
    );

    this.pubSubs = [];

    this.apiDestroy();
  }

  /* ---------------------------- Custom Methods ---------------------------- */

  setTheme(
    newTheme = this.props.options.theme,
    isDarkTheme = this.props.options.isDarkTheme,
  ) {
    if (typeof isDarkTheme !== 'undefined') {
      console.warn(
        'The option `isDarkTheme` is deprecated. Please use `theme` instead.',
      );
      this.theme = isDarkTheme ? 'dark' : 'light';
    } else {
      switch (newTheme) {
        case 'dark':
          this.theme = THEME_DARK;
          break;
        case 'light':
        case undefined:
          this.theme = THEME_LIGHT;
          break;
        default:
          console.warn(`Unknown theme "${newTheme}". Using light theme.`);
          this.theme = THEME_LIGHT;
          break;
      }
    }
  }

  dispatchEvent(e) {
    if (!this.canvasElement) return;

    forwardEvent(e, this.canvasElement);
  }

  trackDroppedHandler() {
    this.setState({
      draggingHappening: null,
    });
  }

  requestReceivedHandler() {
    if (!this.viewconfLoaded && requestsInFlight === 0) {
      this.viewconfLoaded = true;
      if (this.props.options.onViewConfLoaded) {
        this.props.options.onViewConfLoaded();
      }
    }
  }

  animateOnMouseMoveHandler(active) {
    if (active && !this.animateOnMouseMove) {
      this.pubSubs.push(
        this.pubSub.subscribe('app.mouseMove', this.animateBound),
      );
    }
    this.animateOnMouseMove = active;
  }

  fitPixiToParentContainer() {
    if (!this.element || !this.element.parentNode) {
      console.warn('No parentNode:', this.element);
      return;
    }

    const width = this.element.parentNode.clientWidth;
    const height = this.element.parentNode.clientHeight;

    this.pixiMask.beginFill(0xffffff).drawRect(0, 0, width, height).endFill();

    this.pixiRenderer.resize(width, height);

    this.pixiRenderer.view.style.width = `${width}px`;
    this.pixiRenderer.view.style.height = `${height}px`;

    this.pixiRenderer.render(this.pixiRoot);
  }

  /**
   * Add default track options. These can come from two places:
   *
   * 1. The track definitions (configs/tracks-info.js)
   * 2. The default options passed into the component
   *
   * Of these, #2 takes precendence over #1.
   *
   * @param {array} track The track to add default options to
   */
  addDefaultTrackOptions(track) {
    const trackInfo = this.getTrackInfo(track.type);
    if (!trackInfo) return;

    if (typeof track.options === 'undefined') {
      track.options = {};
    }

    const trackOptions = track.options ? track.options : {};

    if (this.props.options.defaultTrackOptions) {
      if (
        this.props.options.defaultTrackOptions.trackSpecific &&
        this.props.options.defaultTrackOptions.trackSpecific[track.type]
      ) {
        // track specific options take precedence over all options

        const options = this.props.options.defaultTrackOptions.trackSpecific[
          track.type
        ];

        for (const optionName in options) {
          track.options[optionName] =
            typeof track.options[optionName] !== 'undefined'
              ? track.options[optionName]
              : JSON.parse(JSON.stringify(options[optionName]));
        }
      }

      if (this.props.options.defaultTrackOptions.all) {
        const options = this.props.options.defaultTrackOptions.all;

        for (const optionName in options) {
          track.options[optionName] =
            typeof track.options[optionName] !== 'undefined'
              ? track.options[optionName]
              : JSON.parse(JSON.stringify(options[optionName]));
        }
      }
    }

    if (trackInfo.defaultOptions) {
      const defaultThemeOptions =
        trackInfo.defaultOptionsByTheme &&
        trackInfo.defaultOptionsByTheme[this.theme]
          ? trackInfo.defaultOptionsByTheme[this.theme]
          : {};

      const defaultOptions = Object.assign(
        {},
        trackInfo.defaultOptions,
        defaultThemeOptions,
      );

      if (!track.options) {
        track.options = JSON.parse(JSON.stringify(defaultOptions));
      } else {
        for (const optionName in defaultOptions) {
          track.options[optionName] =
            typeof track.options[optionName] !== 'undefined'
              ? track.options[optionName]
              : JSON.parse(JSON.stringify(defaultOptions[optionName]));
        }
      }
    } else {
      track.options = trackOptions;
    }
  }

  toggleTypedEditable() {
    this.setState({
      typedEditable: !this.isEditable(),
    });
  }

  /** Handle typed commands (e.g. e-d-i-t) */
  typedTextHandler(event) {
    if (!this.props.options.cheatCodesEnabled) {
      return;
    }

    this.typedText = this.typedText.concat(event.key);

    if (this.typedText.endsWith('hgedit')) {
      this.toggleTypedEditable();
      this.typedText = '';
    }

    // 1.5 seconds to type the next letter
    const TYPED_TEXT_TIMEOUT = 750;
    if (this.typedTextTimeout) {
      clearTimeout(this.typedTextTimeout);
    }

    // set a timeout for new typed text
    this.typedTextTimeout = setTimeout(() => {
      this.typedText = '';
    }, TYPED_TEXT_TIMEOUT);
  }

  keyDownHandler(event) {
    // handle typed commands (e.g. e-d-i-t)
    this.typedTextHandler(event);

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

  openModal(modal) {
    this.setState({
      // The following is only needed for testing purposes
      modal: React.cloneElement(modal, {
        ref: (c) => {
          this.modalRef = c;
        },
      }),
    });
  }

  closeModal() {
    this.modalRef = null;
    this.setState({ modal: null });
  }

  handleEditViewConfig() {
    const { viewConfig: viewConfigTmp } = this.state;
    this.setState({ viewConfigTmp });
    this.openModal(
      <ViewConfigEditor
        onCancel={() => {
          const { viewConfigTmp: viewConfig } = this.state;
          const views = this.processViewConfig(viewConfig);
          for (const view of dictValues(views)) {
            this.adjustLayoutToTrackSizes(view);
          }
          this.setState({
            views,
            viewConfig,
            viewConfigTmp: null,
          });
        }}
        onChange={(viewConfigJson) => {
          const viewConfig = JSON.parse(viewConfigJson);
          const views = this.processViewConfig(viewConfig);
          for (const view of dictValues(views)) {
            this.adjustLayoutToTrackSizes(view);
          }
          this.setState({ views, viewConfig });
        }}
        onSave={(viewConfigJson) => {
          const viewConfig = JSON.parse(viewConfigJson);
          const views = this.processViewConfig(viewConfig);
          for (const view of dictValues(views)) {
            this.adjustLayoutToTrackSizes(view);
          }
          this.setState({
            views,
            viewConfig,
            viewConfigTmp: null,
          });
        }}
        viewConfig={this.getViewsAsString()}
      />,
    );
  }

  animate() {
    if (this.isRequestingAnimationFrame) return;

    this.isRequestingAnimationFrame = true;

    requestAnimationFrame(() => {
      // component was probably unmounted
      if (!this.pixiRenderer) return;

      this.pixiRenderer.render(this.pixiRoot);

      this.isRequestingAnimationFrame = false;
    });
  }

  animateOnGlobalEvent({ sourceUid } = {}) {
    if (sourceUid !== this.uid && this.animateOnMouseMove) this.animate();
  }

  measureSize() {
    const [width, height] = getElementDim(this.element);

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
    this.resizeHandler();
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

  handleOverlayMouseLeave() {
    this.setState({
      mouseOverOverlayUid: null,
    });
  }

  /**
   * We want to lock the zoom of this view to the zoom of another view.
   *
   * First we pick which other view we want to lock to.
   *
   * The we calculate the current zoom offset and center offset. The differences
   * between the center of the two views will always remain the same, as will the
   * different between the zoom levels.
   */
  handleLockLocation(uid) {
    // create a view chooser and remove the config view menu
    this.setState({
      chooseViewHandler: (uid2) => this.handleLocationLockChosen(uid, uid2),
      mouseOverOverlayUid: uid,
    });
  }

  /**
   * Can views be added, removed or rearranged and are the view headers
   * visible?
   */
  isEditable() {
    if (this.state.typedEditable !== undefined) {
      // somebody typed "edit" so we need to follow the directive of
      // this cheat code over all other preferences
      return this.state.typedEditable;
    }

    if (!this.props.options || !('editable' in this.props.options)) {
      return this.state.viewConfig.editable;
    }

    return this.props.options.editable && this.state.viewConfig.editable;
  }

  /**
   * Can views be added, removed or rearranged and are the view headers
   * visible?
   */
  isTrackMenuDisabled() {
    if (
      this.props.options &&
      (this.props.options.editable === false ||
        this.props.options.tracksEditable === false)
    ) {
      return true;
    }

    return (
      this.state.viewConfig &&
      (this.state.viewConfig.tracksEditable === false ||
        this.state.viewConfig.editable === false)
    );
  }

  /**
   * Can views be added, removed or rearranged and are the view headers
   * visible?
   */
  isViewHeaderDisabled() {
    if (
      this.props.options &&
      (this.props.options.editable === false ||
        this.props.options.viewEditable === false)
    ) {
      return true;
    }

    return (
      this.state.viewConfig &&
      (this.state.viewConfig.viewEditable === false ||
        this.state.viewConfig.editable === false)
    );
  }

  /**
   * Iteratate over all of the views in this component
   */
  iterateOverViews() {
    const viewIds = [];

    for (const viewId in Object.keys(this.state.views)) {
      viewIds.push(viewId);
    }

    return viewIds;
  }

  iterateOverTracksInView(viewId) {
    const allTracks = [];
    const { tracks } = this.state.views[viewId];

    for (const trackType in tracks) {
      for (const track of tracks[trackType]) {
        if (track.type === 'combined' && track.contents) {
          for (const subTrack of track.contents) {
            allTracks.push({ viewId, trackId: subTrack.uid, track: subTrack });
          }
        } else {
          allTracks.push({ viewId, trackId: track.uid, track });
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
      const { tracks } = this.state.views[viewId];

      for (const trackType in tracks) {
        for (const track of tracks[trackType]) {
          if (track.type === 'combined' && track.contents) {
            for (const subTrack of track.contents) {
              allTracks.push({
                viewId,
                trackId: subTrack.uid,
                track: subTrack,
              });
            }
          } else {
            allTracks.push({ viewId, trackId: track.uid, track });
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
   * Checks if a track's value scale is locked with another track
   */
  isValueScaleLocked(viewUid, trackUid) {
    const uid = this.combineViewAndTrackUid(viewUid, trackUid);

    // the view must have been deleted
    if (!this.state.views[viewUid]) {
      return false;
    }

    if (this.valueScaleLocks[uid]) {
      return true;
    }
    return false;
  }

  /**
   * Computed the minimal and maximal values of all tracks that are in the same
   * lockGroup as a given track
   * @param   {string}  viewUid  The id of the view containing the track
   * @param   {string}  trackUid   The id of the track
   * @return  {array}  Tuple [min,max] containing the overall extrema - or null.
   */
  getLockGroupExtrema(viewUid, trackUid) {
    const uid = this.combineViewAndTrackUid(viewUid, trackUid);

    // the view must have been deleted
    if (!this.state.views[viewUid]) {
      return null;
    }

    if (!this.valueScaleLocks[uid]) {
      return null;
    }

    const lockGroup = this.valueScaleLocks[uid];

    const lockedTracks = Object.values(lockGroup)
      .filter((track) => this.tiledPlots[track.view])
      .map((track) =>
        this.tiledPlots[track.view].trackRenderer.getTrackObject(track.track),
      )
      // filter out stale locks with non-existant tracks
      .filter((track) => track)
      // if the track is a LeftTrackModifier we want the originalTrack
      .map((track) =>
        track.originalTrack === undefined ? track : track.originalTrack,
      );

    const minValues = lockedTracks
      // exclude tracks that don't set min and max values
      .filter((track) => track.minRawValue && track.maxRawValue)
      .map((track) =>
        lockGroup.ignoreOffScreenValues
          ? track.minVisibleValue(true)
          : track.minVisibleValueInTiles(true),
      );

    const maxValues = lockedTracks
      // exclude tracks that don't set min and max values
      .filter((track) => track.minRawValue && track.maxRawValue)
      .map((track) =>
        lockGroup.ignoreOffScreenValues
          ? track.maxVisibleValue(true)
          : track.maxVisibleValueInTiles(true),
      );

    if (
      minValues.length === 0 ||
      minValues.filter((x) => x === null || x === Infinity).length > 0
    ) {
      return null; // Data hasn't loaded completely
    }

    if (
      maxValues.length === 0 ||
      maxValues.filter((x) => x === null || x === -Infinity).length > 0
    ) {
      return null; // Data hasn't loaded completely
    }

    const allMin = Math.min(...minValues);
    const allMax = Math.max(...maxValues);

    return [allMin, allMax];
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

    if (!this.state.views[viewUid]) return;
    // the view must have been deleted

    const sourceTrack = getTrackByUid(
      this.state.views[viewUid].tracks,
      trackUid,
    );

    if (this.valueScaleLocks[uid]) {
      const lockGroup = this.valueScaleLocks[uid];

      const lockedTracks = Object.values(lockGroup)
        .filter((track) => this.tiledPlots[track.view])
        .map((track) =>
          this.tiledPlots[track.view].trackRenderer.getTrackObject(track.track),
        )
        // filter out locks with non-existant tracks
        .filter((track) => track)
        // if the track is a LeftTrackModifier we want the originalTrack
        .map((track) =>
          track.originalTrack === undefined ? track : track.originalTrack,
        );

      const lockGroupExtrema = this.getLockGroupExtrema(viewUid, trackUid);

      if (lockGroupExtrema === null) {
        return; // Data hasn't loaded completely
      }

      const allMin = lockGroupExtrema[0];
      const allMax = lockGroupExtrema[1];

      const epsilon = 1e-6;

      for (const lockedTrack of lockedTracks) {
        // set the newly calculated minimum and maximum values
        // using d3 style setters
        if (lockedTrack.minValue) {
          lockedTrack.minValue(allMin);
        }
        if (lockedTrack.maxValue) {
          lockedTrack.maxValue(allMax);
        }

        if (!lockedTrack.valueScale) {
          // this track probably hasn't loaded the tiles to
          // create a valueScale
          continue;
        }

        const hasScaleChanged =
          Math.abs(
            lockedTrack.minValue() - lockedTrack.valueScale.domain()[0],
          ) > epsilon ||
          Math.abs(
            lockedTrack.maxValue() - lockedTrack.valueScale.domain()[1],
          ) > epsilon;

        const hasBrushMoved =
          sourceTrack.options &&
          lockedTrack.options &&
          typeof sourceTrack.options.scaleStartPercent !== 'undefined' &&
          typeof sourceTrack.options.scaleEndPercent !== 'undefined' &&
          (Math.abs(
            lockedTrack.options.scaleStartPercent -
              sourceTrack.options.scaleStartPercent,
          ) > epsilon ||
            Math.abs(
              lockedTrack.options.scaleEndPercent -
                sourceTrack.options.scaleEndPercent,
            ) > epsilon);

        // If we do view based scaling we want to minimize the number of rerenders
        // Check if it is necessary to rerender
        if (
          lockedTrack.continuousScaling &&
          !hasScaleChanged &&
          !hasBrushMoved
        ) {
          continue;
        }

        lockedTrack.valueScale.domain([allMin, allMax]);

        // In TiledPixiTrack, we check if valueScale has changed before
        // calling onValueScaleChanged. If we don't update prevValueScale
        // here, that function won't get called and the value scales won't
        // stay synced
        lockedTrack.prevValueScale = lockedTrack.valueScale.copy();

        if (hasBrushMoved) {
          lockedTrack.options.scaleStartPercent =
            sourceTrack.options.scaleStartPercent;
          lockedTrack.options.scaleEndPercent =
            sourceTrack.options.scaleEndPercent;
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
      dictValues(l).forEach((listener) => listener(dragging));
    });
  }

  /**
   * Add a listener that will be called every time the view is updated.
   *
   * @param viewUid: The uid of the view being observed
   * @param listenerUid: The uid of the listener
   * @param eventHandler: The handler to be called when the scales change
   *    Event handler is called with parameters (xScale, yScale)
   */
  addDraggingChangedListener(viewUid, listenerUid, eventHandler) {
    if (!this.draggingChangedListeners.hasOwnProperty(viewUid)) {
      this.draggingChangedListeners[viewUid] = {};
    }

    this.draggingChangedListeners[viewUid][listenerUid] = eventHandler;

    eventHandler(true);
    eventHandler(false);
  }

  /**
   * Remove a scale change event listener
   *
   * @param viewUid: The view that it's listening on.
   * @param listenerUid: The uid of the listener itself.
   */
  removeDraggingChangedListener(viewUid, listenerUid) {
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

  /**
   * Add an event listener that will be called every time the scale
   * of the view with uid viewUid is changed.
   *
   * @param viewUid: The uid of the view being observed
   * @param listenerUid: The uid of the listener
   * @param eventHandler: The handler to be called when the scales change
   *    Event handler is called with parameters (xScale, yScale)
   */
  addScalesChangedListener(viewUid, listenerUid, eventHandler) {
    if (!this.scalesChangedListeners[viewUid]) {
      this.scalesChangedListeners[viewUid] = {};
    }

    this.scalesChangedListeners[viewUid][listenerUid] = eventHandler;

    if (!this.xScales[viewUid] || !this.yScales[viewUid]) {
      return;
    }

    // call the handler for the first time
    eventHandler(this.xScales[viewUid], this.yScales[viewUid]);
  }

  /**
   * Remove a scale change event listener
   *
   * @param viewUid: The view that it's listening on.
   * @param listenerUid: The uid of the listener itself.
   */
  removeScalesChangedListener(viewUid, listenerUid) {
    if (this.scalesChangedListeners[viewUid]) {
      const listeners = this.scalesChangedListeners[viewUid];

      if (listeners[listenerUid]) {
        delete listeners[listenerUid];
      }
    }
  }

  createSVG() {
    const svg = document.createElement('svg');
    svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('version', '1.1');

    for (const tiledPlot of dictValues(this.tiledPlots)) {
      if (!tiledPlot) continue; // probably opened and closed

      for (const trackDefObject of dictValues(
        tiledPlot.trackRenderer.trackDefObjects,
      )) {
        if (trackDefObject.trackObject.exportSVG) {
          const trackSVG = trackDefObject.trackObject.exportSVG();

          if (trackSVG) svg.appendChild(trackSVG[0]);
        }
      }
    }

    // FF is fussier than Chrome, and requires dimensions on the SVG,
    // if it is to be used as an image src.
    svg.setAttribute('width', this.canvasElement.style.width);
    svg.setAttribute('height', this.canvasElement.style.height);

    if (this.postCreateSVGCallback) {
      // Allow the callback function to modify the exported SVG string
      // before it is finalized and returned.
      const modifiedSvg = this.postCreateSVGCallback(svg);
      return modifiedSvg;
    }
    return svg;
  }

  createSVGString() {
    const svg = this.createSVG();

    let svgString = vkbeautify.xml(
      new window.XMLSerializer().serializeToString(svg),
    );

    svgString = svgString.replace(/<a0:/g, '<');
    svgString = svgString.replace(/<\/a0:/g, '</');
    // Remove duplicated xhtml namespace property
    svgString = svgString.replace(
      /(<svg[\n\r])(\s+xmlns="http:\/\/www\.w3\.org\/1999\/xhtml"[\n\r])/gm,
      '$1',
    );
    // Remove duplicated svg namespace
    svgString = svgString.replace(
      /(\s+<clipPath[\n\r]\s+)(xmlns="http:\/\/www\.w3\.org\/2000\/svg")/gm,
      '$1',
    );

    const xmlDeclaration =
      '<?xml version="1.0" encoding="UTF-8" standalone="no"?>';
    const doctype =
      '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

    return `${xmlDeclaration}\n${doctype}\n${svgString}`;
  }

  handleExportSVG() {
    download(
      'export.svg',
      new Blob([this.createSVGString()], { type: 'image/svg+xml' }),
    );
  }

  offPostCreateSVG() {
    this.postCreateSVGCallback = null;
  }

  onPostCreateSVG(callback) {
    this.postCreateSVGCallback = callback;
  }

  createPNGBlobPromise() {
    return new Promise((resolve) => {
      // It would seem easier to call canvas.toDataURL()...
      // Except that with webgl context, it swaps buffers after drawing
      // and you don't have direct access to what is on-screen.
      // (You end up getting a PNG of the desired dimensions, but it is empty.)
      //
      // We'd either need to
      // - Turn on preserveDrawingBuffer and rerender, and add a callback
      // - Or leave it off, and somehow synchronously export before the swap
      // - Or look into low-level stuff like copyBufferSubData.
      //
      // Basing it on the SVG also guarantees us that the two exports are the same.

      const svgString = this.createSVGString();

      const img = new Image(
        this.canvasElement.width,
        this.canvasElement.height,
      );
      img.src = `data:image/svg+xml;base64,${btoa(svgString)}`;
      img.onload = () => {
        const targetCanvas = document.createElement('canvas');
        // TODO: I have no idea why dimensions are doubled!
        targetCanvas.width = this.canvasElement.width / 2;
        targetCanvas.height = this.canvasElement.height / 2;
        targetCanvas.getContext('2d').drawImage(img, 0, 0);
        targetCanvas.toBlob((blob) => {
          resolve(blob);
        });
      };
    });
  }

  handleExportPNG() {
    this.createPNGBlobPromise().then((blob) => {
      download('export.png', blob);
    });
  }

  /*
   * The scales of some view have changed (presumably in response to zooming).
   *
   * Mark the new scales and update any locked views.
   *
   * @param uid: The view of whom the scales have changed.
   */
  handleScalesChanged(uid, xScale, yScale, notify = true) {
    this.xScales[uid] = xScale;
    this.yScales[uid] = yScale;

    if (notify) {
      if (uid in this.scalesChangedListeners) {
        dictValues(this.scalesChangedListeners[uid]).forEach((x) => {
          x(xScale, yScale);
        });
      }
    }

    if (this.zoomLocks[uid]) {
      // this view is locked to another
      const lockGroup = this.zoomLocks[uid];
      const lockGroupItems = dictItems(lockGroup);

      // eslint-disable-next-line no-unused-vars
      const [centerX, centerY, k] = scalesCenterAndK(
        this.xScales[uid],
        this.yScales[uid],
      );

      for (let i = 0; i < lockGroupItems.length; i++) {
        const key = lockGroupItems[i][0];
        const value = lockGroupItems[i][1];

        if (!this.xScales[key] || !this.yScales[key]) {
          continue;
        }

        if (key === uid) {
          // no need to notify oneself that the scales have changed
          continue;
        }

        // eslint-disable-next-line no-unused-vars
        const [keyCenterX, keyCenterY, keyK] = scalesCenterAndK(
          this.xScales[key],
          this.yScales[key],
        );

        const rk = value[2] / lockGroup[uid][2];

        // let newCenterX = centerX + dx;
        // let newCenterY = centerY + dy;
        const newK = k * rk;

        if (!this.setCenters[key]) {
          continue;
        }

        // the key here is the target of zoom lock, so we want to keep its
        // x center and y center unchanged
        const [newXScale, newYScale] = this.setCenters[key](
          keyCenterX,
          keyCenterY,
          newK,
          false,
        );

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

      // eslint-disable-next-line no-unused-vars
      const [centerX, centerY, k] = scalesCenterAndK(
        this.xScales[uid],
        this.yScales[uid],
      );

      for (let i = 0; i < lockGroupItems.length; i++) {
        const key = lockGroupItems[i][0];
        const value = lockGroupItems[i][1];

        if (!this.xScales[key] || !this.yScales[key]) {
          continue;
        }

        // eslint-disable-next-line no-unused-vars
        const [keyCenterX, keyCenterY, keyK] = scalesCenterAndK(
          this.xScales[key],
          this.yScales[key],
        );

        if (key === uid) {
          // no need to notify oneself that the scales have changed
          continue;
        }

        const dx = value[0] - lockGroup[uid][0];
        const dy = value[1] - lockGroup[uid][1];

        const newCenterX = centerX + dx;
        const newCenterY = centerY + dy;

        if (!this.setCenters[key]) {
          continue;
        }

        const [newXScale, newYScale] = this.setCenters[key](
          newCenterX,
          newCenterY,
          keyK,
          false,
        );

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

    if (this.locationLocksAxisWise.x[uid]) {
      // the x axis of this view is locked to an axis of another view
      const lockGroup = this.locationLocksAxisWise.x[uid].lock;
      const lockGroupItems = dictItems(lockGroup);

      // this means the x axis of this view (uid) is locked to the y axis of another view
      const lockCrossAxis = this.locationLocksAxisWise.x[uid].axis !== 'x';

      // eslint-disable-next-line no-unused-vars
      const [centerX, centerY, k] = scalesCenterAndK(
        this.xScales[uid],
        this.yScales[uid],
      );

      for (let i = 0; i < lockGroupItems.length; i++) {
        const key = lockGroupItems[i][0];
        const value = lockGroupItems[i][1];

        if (!this.xScales[key] || !this.yScales[key]) {
          continue;
        }

        // eslint-disable-next-line no-unused-vars
        const [keyCenterX, keyCenterY, keyK] = scalesCenterAndK(
          this.xScales[key],
          this.yScales[key],
        );

        if (key === uid) {
          // no need to notify oneself that the scales have changed
          continue;
        }

        const dx = value[0] - lockGroup[uid][0];

        const newCenterX = centerX + dx;

        if (!this.setCenters[key]) {
          continue;
        }

        const [newXScale, newYScale] = this.setCenters[key](
          lockCrossAxis ? keyCenterX : newCenterX,
          lockCrossAxis ? newCenterX : keyCenterY,
          keyK,
          false,
        );

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

    if (this.locationLocksAxisWise.y[uid]) {
      // the y axis of this view is locked to an axis of another view
      const lockGroup = this.locationLocksAxisWise.y[uid].lock;
      const lockGroupItems = dictItems(lockGroup);

      // this means the y axis of this view (uid) is locked to the x axis of another view
      const lockCrossAxis = this.locationLocksAxisWise.y[uid].axis !== 'y';

      // eslint-disable-next-line no-unused-vars
      const [centerX, centerY, k] = scalesCenterAndK(
        this.xScales[uid],
        this.yScales[uid],
      );

      for (let i = 0; i < lockGroupItems.length; i++) {
        const key = lockGroupItems[i][0];
        const value = lockGroupItems[i][1];

        if (!this.xScales[key] || !this.yScales[key]) {
          continue;
        }

        // eslint-disable-next-line no-unused-vars
        const [keyCenterX, keyCenterY, keyK] = scalesCenterAndK(
          this.xScales[key],
          this.yScales[key],
        );

        if (key === uid) {
          // no need to notify oneself that the scales have changed
          continue;
        }

        const dy = value[1] - lockGroup[uid][1];

        const newCenterY = centerY + dy;

        if (!this.setCenters[key]) {
          continue;
        }

        const [newXScale, newYScale] = this.setCenters[key](
          lockCrossAxis ? newCenterY : keyCenterX,
          lockCrossAxis ? keyCenterY : newCenterY,
          keyK,
          false,
        );

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
      chooseTrackHandler: (viewUid, trackUid) =>
        this.handleViewportProjected(uid, viewUid, trackUid),
    });
  }

  /**
   * Adjust the zoom level so that all of the data is visible
   *
   * @param viewUid: The view uid for which to adjust the zoom level
   */
  handleZoomToData(viewUid) {
    if (viewUid && !this.tiledPlots[viewUid]) {
      throw new Error(
        `View uid ${viewUid} does not exist in the current viewConfig`,
      );
    }

    if (viewUid) {
      this.tiledPlots[viewUid].handleZoomToData();
    } else {
      Object.values(this.tiledPlots).forEach((tiledPlot) =>
        tiledPlot.handleZoomToData(),
      );
    }
  }

  /**
   * Reset the viewport to the initial x and y domain
   * @param  {number} viewId - ID of the view for which the viewport should be
   *  reset.
   */
  resetViewport(viewId) {
    if (viewId && !this.tiledPlots[viewId]) {
      throw new Error(
        `View uid ${viewId} does not exist in the current viewConfig`,
      );
    }

    if (viewId) {
      this.tiledPlots[viewId].resetViewport();
    } else {
      Object.values(this.tiledPlots).forEach((tiledPlot) =>
        tiledPlot.resetViewport(),
      );
    }
  }

  /**
   * We want to yank some attributes from another view.
   *
   * This will create a view selection overlay and then call the selected
   * provided function.
   */
  handleYankFunction(uid, yankFunction) {
    this.setState({
      chooseViewHandler: (uid2) => yankFunction(uid, uid2),
      mouseOverOverlayUid: uid,
    });
  }

  /**
   * We want to unlock uid from the zoom group that it's in.
   *
   * @param uid: The uid of a view.
   */
  handleUnlock(uid, lockGroups) {
    // if this function is being called, lockGroup has to exist
    const lockGroup = lockGroups[uid];
    const lockGroupKeys = dictKeys(lockGroup);

    if (lockGroupKeys.length === 2) {
      // there's only two items in this lock group so we need to
      // remove them both (no point in having one view locked to itself)
      delete lockGroups[lockGroupKeys[0]];
      delete lockGroups[lockGroupKeys[1]];

      return;
    }
    // delete this view from the zoomLockGroup
    if (lockGroups[uid]) {
      if (lockGroups[uid][uid]) {
        delete lockGroups[uid][uid];
      }
    }

    // remove the handler
    if (lockGroups[uid]) {
      delete lockGroups[uid];
    }
  }

  viewScalesLockData(uid) {
    if (!this.xScales[uid] || !this.yScales[uid]) {
      console.warn("View scale lock doesn't correspond to existing uid: ", uid);
      return null;
    }

    return scalesCenterAndK(this.xScales[uid], this.yScales[uid]);
  }

  /*
   * :param uid1 (string): The uid of the first element to be locked (e.g. viewUid)
   * :param uid2 (string): The uid of the second element to be locked (e.g. viewUid)
   * :param lockGroups (dict): The set of locks where to store this lock (e.g. this.locationLocks)
   * :parma lockData (function): A function that takes two uids and calculates some extra data
   * to store with this lock data (e.g. scalesCenterAndK(this.xScales[uid1], this.yScales[uid1]))
   */
  addLock(uid1, uid2, lockGroups, lockData) {
    let group1Members = [];
    let group2Members = [];

    if (!lockGroups[uid1]) {
      // view1 isn't already in a group
      group1Members = [[uid1, lockData.bind(this)(uid1)]];
    } else {
      // view1 is already in a group
      group1Members = dictItems(lockGroups[uid1])
        .filter((x) => lockData(x[0])) // make sure we can create the necessary data for this lock
        // in the case of location locks, this implies that the
        // views it's locking exist
        .map((x) => [x[0], lockData(x[0])]); // x is [uid, [centerX, centerY, k]]
    }

    if (!lockGroups[uid2]) {
      // view1 isn't already in a group
      group2Members = [[uid2, lockData.bind(this)(uid2)]];
    } else {
      // view2 is already in a group
      group2Members = dictItems(lockGroups[uid2])
        .filter((x) => lockData.bind(this)(x[0]))
        // make sure we can create the necessary data for this lock
        // in the case of location locks, this implies that the
        // views it's locking exist
        .map((x) =>
          // x is [uid, [centerX, centerY, k]]
          [x[0], lockData.bind(this)(x[0])],
        );
    }

    const allMembers = group1Members.concat(group2Members);

    const groupDict = dictFromTuples(allMembers);

    allMembers.forEach((m) => {
      lockGroups[m[0]] = groupDict;
    });
  }

  /* Views uid1 and uid2 need to be locked so that they always maintain the current
   * zoom and translation difference.
   * @param uid1: The view that the lock was called from
   * @param uid2: The view that the lock was called on (the view that was selected)
   */
  handleLocationLockChosen(uid1, uid2) {
    if (uid1 === uid2) {
      this.setState({
        chooseViewHandler: null,
      });

      return; // locking a view to itself is silly
    }

    this.addLock(
      uid1,
      uid2,
      this.locationLocks,
      this.viewScalesLockData.bind(this),
    );

    this.setState({
      chooseViewHandler: null,
    });
  }

  /* Views uid1 and uid2 need to be locked so that they always maintain the current
   * zoom and translation difference.
   * @param uid1: The view that the lock was called from
   * @param uid2: The view that the lock was called on (the view that was selected)
   */
  handleZoomLockChosen(uid1, uid2) {
    if (uid1 === uid2) {
      this.setState({
        chooseViewHandler: null,
      });

      return; // locking a view to itself is silly
    }

    this.addLock(
      uid1,
      uid2,
      this.zoomLocks,
      this.viewScalesLockData.bind(this),
    );

    this.setState({
      chooseViewHandler: null,
    });
  }

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
  handleViewportProjected(fromView, toView, toTrack) {
    let newTrackUid = null;

    if (fromView === toView) {
      console.warn('A view can not show its own viewport.');
    } else {
      const hostTrack = getTrackByUid(this.state.views[toView].tracks, toTrack);
      const position = getTrackPositionByUid(
        this.state.views[toView].tracks,
        toTrack,
      );
      newTrackUid = slugid.nice();

      const projectionTypes = {
        top: 'horizontal',
        bottom: 'horizontal',
        center: 'center',
        left: 'vertical',
        right: 'vertical',
      };

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

  /**
   * Uid1 is copying the center of uid2
   */
  handleLocationYanked(uid1, uid2) {
    // where we're taking the zoom from
    const sourceXScale = this.xScales[uid2];
    const sourceYScale = this.yScales[uid2];

    const targetXScale = this.xScales[uid1];
    const targetYScale = this.yScales[uid1];

    // eslint-disable-next-line no-unused-vars
    const [targetCenterX, targetCenterY, targetK] = scalesCenterAndK(
      targetXScale,
      targetYScale,
    );
    // eslint-disable-next-line no-unused-vars
    const [sourceCenterX, sourceCenterY, sourceK] = scalesCenterAndK(
      sourceXScale,
      sourceYScale,
    );

    // set target center
    this.setCenters[uid1](sourceCenterX, sourceCenterY, targetK, true);

    this.setState({
      chooseViewHandler: null,
    });
  }

  /**
   * Uid1 yanked the zoom of uid2, now  make sure that they're synchronized.
   */
  handleZoomYanked(uid1, uid2) {
    // where we're taking the zoom from
    const sourceXScale = this.xScales[uid2];
    const sourceYScale = this.yScales[uid2];

    const targetXScale = this.xScales[uid1];
    const targetYScale = this.yScales[uid1];

    // eslint-disable-next-line no-unused-vars
    const [targetCenterX, targetCenterY, targetK] = scalesCenterAndK(
      targetXScale,
      targetYScale,
    );
    // eslint-disable-next-line no-unused-vars
    const [sourceCenterX, sourceCenterY, sourceK] = scalesCenterAndK(
      sourceXScale,
      sourceYScale,
    );

    // set target center
    this.setCenters[uid1](targetCenterX, targetCenterY, sourceK, true);

    this.setState({
      chooseViewHandler: null,
    });
  }

  /**
   * The user has chosen a position for the new track. The actual
   * track selection will be handled by TiledPlot
   *
   * We just need to close the menu here.
   */
  handleTrackPositionChosen(viewUid, position) {
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
    if (
      !this.props.options ||
      this.sizeMode !== SIZE_MODE_BOUNDED ||
      this.props.options.pixelPreciseMarginPadding
    ) {
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

    const MARGIN_HEIGHT = this.isEditable() ? 10 : 0;

    const marginHeight = MARGIN_HEIGHT * maxHeight - 1;
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

  /**
   * Notify the children that the layout has changed so that they
   * know to redraw themselves
   */
  handleLayoutChange(layout) {
    if (!this.element) return;

    layout.forEach((l) => {
      const view = this.state.views[l.i];

      if (view) {
        // Bad design pattern. We directly manipulate the state and rely on
        // `this.updateRowHeight()` to trigger that the state updated
        view.layout.x = l.x;
        view.layout.y = l.y;
        view.layout.w = l.w;
        view.layout.h = l.h;
        view.layout.i = l.i;
      }
    });

    // The following method actually trigger a state update
    this.updateRowHeight();
    this.refreshView(LONG_DRAG_TIMEOUT);
  }

  /**
   * Maybe somebody started dragging again before the previous drag
   * timeout fired. In that case, we need to clear this timeout so
   * that it doesn't override a previously set one.
   */
  clearDragTimeout() {
    if (this.dragTimeout) {
      clearTimeout(this.dragTimeout);
      this.dragTimeout = null;
    }
  }

  getTrackInfo(trackType) {
    if (TRACKS_INFO_BY_TYPE[trackType]) {
      return TRACKS_INFO_BY_TYPE[trackType];
    }

    if (this.pluginTracks && this.pluginTracks[trackType]) {
      return this.pluginTracks[trackType].config;
    }

    if (window.higlassTracksByType && window.higlassTracksByType[trackType]) {
      return window.higlassTracksByType[trackType].config;
    }

    console.warn(
      'Track type not found:',
      trackType,
      '(check app/scripts/config/ for a list of defined track types)',
    );
    return undefined;
  }

  forceRefreshView() {
    // force everything to rerender
    this.setState(this.state); // eslint-disable-line react/no-access-state-in-setstate
  }

  refreshView(timeout = SHORT_DRAG_TIMEOUT) {
    this.clearDragTimeout();

    this.notifyDragChangedListeners(true);

    this.clearDragTimeout();
    this.dragTimeout = setTimeout(() => {
      this.notifyDragChangedListeners(false);
    }, timeout);
  }

  handleDragStart(/* layout, oldItem, newItem, placeholder, e, element */) {
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
    objVals(this.viewHeaders)
      .filter((x) => x)
      .forEach((viewHeader) => viewHeader.checkWidth());
  }

  /**
   * Get the dimensions for this view, counting just the tracks
   * that are present in it
   *
   * @param view: A view containing a list of tracks as a member.
   * @return: A width and a height pair (e.g. [width, height])
   */
  calculateViewDimensions(view) {
    const defaultHorizontalHeight = 20;
    const defaultVerticalWidth = 0;
    const defaultCenterHeight = 100;
    const defaultCenterWidth = 100;
    let currHeight =
      this.viewMarginTop +
      this.viewMarginBottom +
      this.viewPaddingTop +
      this.viewPaddingBottom;
    let currWidth =
      this.viewMarginLeft +
      this.viewMarginRight +
      this.viewPaddingLeft +
      this.viewPaddingRight;
    // currWidth will generally be ignored because it will just be set to
    // the width of the enclosing container
    let minNecessaryHeight = 0;
    minNecessaryHeight += 10; // the header

    const MIN_VERTICAL_HEIGHT = 20;

    if (view.tracks.top) {
      // tally up the height of the top tracks

      for (let i = 0; i < view.tracks.top.length; i++) {
        const track = view.tracks.top[i];
        currHeight += track.height ? track.height : defaultHorizontalHeight;
        minNecessaryHeight += track.height
          ? track.height
          : defaultHorizontalHeight;
      }
    }

    if (view.tracks.bottom) {
      // tally up the height of the top tracks

      for (let i = 0; i < view.tracks.bottom.length; i++) {
        const track = view.tracks.bottom[i];
        currHeight += track.height ? track.height : defaultHorizontalHeight;
        minNecessaryHeight += track.height
          ? track.height
          : defaultHorizontalHeight;
      }
    }

    if (
      (view.tracks.left && view.tracks.left.length > 0) ||
      (view.tracks.right && view.tracks.right.length > 0) ||
      (view.tracks.center && view.tracks.center.length > 0)
    ) {
      minNecessaryHeight += MIN_VERTICAL_HEIGHT;
    }

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
      if (
        !view.tracks.center[0].contents ||
        view.tracks.center[0].contents.length > 0
      ) {
        let height = null;
        let width = null;

        if (view.tracks.center[0].contents) {
          // combined track in the center
          for (const track of view.tracks.center[0].contents) {
            height = Math.max(
              height,
              track.height ? track.height : defaultCenterHeight,
            );
            width = Math.max(
              width,
              track.width ? track.width : defaultCenterWidth,
            );
          }
        } else {
          height = view.tracks.center[0].height
            ? view.tracks.center[0].height
            : defaultCenterHeight;
          width = view.tracks.center[0].width
            ? view.tracks.center[0].width
            : defaultCenterWidth;
        }

        currHeight += height;
        currWidth += width;
      }
    } else if (
      ((view.tracks.top && dictValues(view.tracks.top).length > 1) ||
        (view.tracks.bottom && dictValues(view.tracks.bottom).length > 1)) &&
      ((view.tracks.left && dictValues(view.tracks.left).length) ||
        (view.tracks.right && dictValues(view.tracks.right).length))
    ) {
      centerWidth = defaultCenterWidth;
      centerHeight = defaultCenterHeight;
    }

    // make the total height the greater of the left height
    // and the center height
    if (sideHeight > centerHeight) {
      currHeight += sideHeight;
    } else {
      currHeight += centerHeight;
    }

    let topHeight = 0;
    let bottomHeight = 0;
    let leftWidth = 0;
    let rightWidth = 0;

    if ('top' in view.tracks) {
      topHeight = view.tracks.top
        .map((x) => (x.height ? x.height : defaultHorizontalHeight))
        .reduce((a, b) => a + b, 0);
    }
    if ('bottom' in view.tracks) {
      bottomHeight = view.tracks.bottom
        .map((x) => (x.height ? x.height : defaultHorizontalHeight))
        .reduce((a, b) => a + b, 0);
    }
    if ('left' in view.tracks) {
      leftWidth = view.tracks.left
        .map((x) => (x.width ? x.width : defaultVerticalWidth))
        .reduce((a, b) => a + b, 0);
    }
    if ('right' in view.tracks) {
      rightWidth = view.tracks.right
        .map((x) => (x.width ? x.width : defaultVerticalWidth))
        .reduce((a, b) => a + b, 0);
    }

    return {
      totalWidth: currWidth,
      totalHeight: currHeight,
      topHeight,
      bottomHeight,
      leftWidth,
      rightWidth,
      centerWidth,
      centerHeight,
      minNecessaryHeight,
    };
  }

  calculateZoomLimits(view, initialXDomain) {
    const limits = [0, Infinity];

    // By default, highest zoom resolution is 1bp
    const viewConfLimit = view.zoomLimits || [1, null];
    const diffX = initialXDomain[1] - initialXDomain[0];

    if (viewConfLimit.length !== 2) {
      return limits;
    }

    if (viewConfLimit[0] !== null && viewConfLimit[0] > 0) {
      const upperLimit = diffX / viewConfLimit[0];
      limits[1] = Math.max(upperLimit, 1);
      if (upperLimit < 1) {
        console.warn(`Invalid zoom limits. Lower limit set to ${diffX}`);
      }
    }

    if (viewConfLimit[1] !== null && viewConfLimit[1] > viewConfLimit[0]) {
      const lowerLimit = diffX / viewConfLimit[1];
      limits[0] = Math.min(lowerLimit, 1);
      if (lowerLimit > 1) {
        console.warn(`Invalid zoom limits. Upper limit set to ${diffX}`);
      }
    }
    return limits;
  }

  generateViewLayout(view) {
    let layout = null;

    if ('layout' in view) {
      ({ layout } = view.layout);
    } else {
      /*
      const minTrackHeight = 30;
      const elementWidth = this.element.clientWidth;

      let { totalWidth, totalHeight,
        topHeight, bottomHeight,
        leftWidth, rightWidth,
        centerWidth, centerHeight } = this.calculateViewDimensions(view);

      if (view.searchBox) { totalHeight += 30; }

      const heightGrid = Math.ceil(totalHeight / this.rowHeight);

      */

      // we're keeping this simple, just make the view 12x12
      layout = {
        x: 0,
        y: 0,
        w: NUM_GRID_COLUMNS,
        h: DEFAULT_NEW_VIEW_HEIGHT,
      };

      // the height should be adjusted when the layout changes

      /*
        if ('center' in view.tracks || 'left' in view.tracks || 'right' in view.tracks) {
            let desiredHeight = ((elementWidth - leftWidth - rightWidth - 2 * this.viewMarginTop) );
            desiredHeight +=  topHeight + bottomHeight + 2*this.viewMarginBottom + 20;

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

  /**
   * Remove all the tracks from a view
   *
   * @param {viewUid} Thie view's identifier
   */
  handleClearView(viewUid) {
    const { views } = this.state;

    views[viewUid].tracks.top = [];
    views[viewUid].tracks.bottom = [];
    views[viewUid].tracks.center = [];
    views[viewUid].tracks.left = [];
    views[viewUid].tracks.right = [];
    views[viewUid].tracks.whole = [];

    this.setState({
      views,
    });
  }

  /**
   * A view needs to be closed. Remove it from from the viewConfig and then clean
   * up all of its connections (zoom links, workers, etc...)
   *
   * @param {uid} This view's identifier
   */
  handleCloseView(uid) {
    // check if this is the only view
    // if it is, don't close it (display an error message)
    if (dictValues(this.state.views).length === 1) {
      return;
    }

    // if this view was zoom locked to another, we need to unlock it
    this.handleUnlock(uid, this.zoomLocks);

    // might want to notify the views that they're beig closed
    this.setState((prevState) => {
      delete prevState.views[uid];

      const viewsByUid = this.removeInvalidTracks(prevState.views);
      return {
        views: viewsByUid,
      };
    });
  }

  /**
   * We're adding a new dataset to an existing track
   *
   * @param newTrack: The new track to be added.
   * @param position: Where the new series should be placed.
   *  (This could also be inferred from the hostTrack, but since
   *  we already have it, we might as well use it)
   * @param hostTrack: The track that will host the new series.
   */
  handleSeriesAdded(viewId, newTrack, position, hostTrack) {
    // is the host track a combined track?
    // if so, easy, just append the new track to its contents
    // if not, remove the current track from the track list
    // create a new combined track, add the current and the new
    // tracks and then update the whole track list
    const { tracks } = this.state.views[viewId];

    if (hostTrack.type === 'combined') {
      hostTrack.contents.push(newTrack);

      if (newTrack.type === 'heatmap') {
        // For stacked heatmaps we will adjust some options automatically for convenience
        this.compatibilityfyStackedHeatmaps(newTrack, hostTrack);
      }
    } else {
      const newHost = {
        type: 'combined',
        uid: slugid.nice(),
        height: hostTrack.height,
        width: hostTrack.width,
        contents: [hostTrack, newTrack],
      };

      const positionTracks = tracks[position];

      for (let i = 0; i < positionTracks.length; i++) {
        if (positionTracks[i].uid === hostTrack.uid) {
          positionTracks[i] = newHost;
        }
      }
    }

    this.setState((prevState) => ({
      views: prevState.views,
    }));
  }

  handleNoTrackAdded() {
    if (this.state.addTrackPosition) {
      // we've already added the track, remove the add track dialog
      this.setState({
        addTrackPosition: null,
      });
    }
  }

  /**
   * Add multiple new tracks (likely from the AddTrackModal dialog)
   *
   * @param trackInfo: A JSON object that can be used as a track
   *                   definition
   * @param position: The position the track is being added to
   * @param host: If this track is being added to another track
   */
  handleTracksAdded(viewId, newTracks, position, host) {
    this.storeTrackSizes(viewId);

    for (const newTrack of newTracks) {
      this.handleTrackAdded(viewId, newTrack, position, host);
    }
  }

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
  handleChangeTrackType(viewUid, trackUid, newType) {
    const view = this.state.views[viewUid];
    const trackConfig = getTrackByUid(view.tracks, trackUid);

    // this track needs a new uid so that it will be rerendered
    const oldUid = trackConfig.uid;
    trackConfig.uid = slugid.nice();
    trackConfig.type = newType;
    const newUid = trackConfig.uid;

    this.updateTrackLocks(viewUid, oldUid, newUid);
    this.setState((prevState) => ({
      views: prevState.views,
    }));
  }

  /**
   * Change the data source for a track. E.g. when adding or
   * removing a divisor.
   *
   * Parameters
   * ----------
   *  viewUid: string
   *    The view containing the track to be changed
   *  trackUid: string
   *    The uid identifying the existin track
   *  newData: object
   *    The new data source section
   */
  handleChangeTrackData(viewUid, trackUid, newData) {
    const view = this.state.views[viewUid];
    const trackConfig = getTrackByUid(view.tracks, trackUid);

    // this track needs a new uid so that it will be rerendered
    trackConfig.uid = slugid.nice();
    trackConfig.data = newData;

    this.setState((prevState) => ({
      views: prevState.views,
    }));
  }

  /**
   * A track was added from the AddTrackModal dialog.
   *
   * @param trackInfo: A JSON object that can be used as a track
   *                   definition
   * @param position: The position the track is being added to
   * @param host: If this track is being added to another track
   *
   * @returns {Object}: A trackConfig (\{ uid: "", width: x \})
   *  describing this track
   */
  handleTrackAdded(viewId, newTrack, position, host = null) {
    this.addDefaultTrackOptions(newTrack);

    // make sure the new track has a uid
    if (!newTrack.uid) newTrack.uid = slugid.nice();

    if (newTrack.contents) {
      // add default options to combined tracks
      for (const ct of newTrack.contents) {
        this.addDefaultTrackOptions(ct);
      }
    }

    if (this.state.addTrackPosition) {
      // we've already added the track, remove the add track dialog
      this.setState({
        addTrackPosition: null,
      });
    }

    if (host) {
      // we're adding a series rather than a whole new track
      this.handleSeriesAdded(viewId, newTrack, position, host);
      return null;
    }

    newTrack.position = position;

    const trackInfo = this.getTrackInfo(newTrack.type);

    newTrack.width =
      trackInfo.defaultWidth ||
      (trackInfo.defaultOptions && trackInfo.defaultOptions.minWidth) ||
      this.minVerticalWidth;
    newTrack.height =
      trackInfo.defaultHeight ||
      (trackInfo.defaultOptions && trackInfo.defaultOptions.minHeight) ||
      this.minHorizontalHeight;

    const { tracks } = this.state.views[viewId];

    let numTracks = 0;
    visitPositionedTracks(tracks, () => numTracks++);

    if (position === 'left' || position === 'top') {
      // if we're adding a track on the left or the top, we want the
      // new track to appear at the begginning of the track list
      tracks[position].unshift(newTrack);
    } else if (position === 'center') {
      // we're going to have to either overlay the existing track with a new one
      // or add another one on top
      if (tracks.center.length === 0) {
        // no existing tracks
        const newCombined = {
          uid: slugid.nice(),
          type: 'combined',
          contents: [newTrack],
        };
        tracks.center = [newCombined];
      } else if (tracks.center[0].type === 'combined') {
        // if it's a combined track, we just need to add this track to the
        // contents
        tracks.center[0].contents.push(newTrack);

        if (newTrack.type === 'heatmap') {
          // For stacked heatmaps we will adjust some options automatically for convenience
          this.compatibilityfyStackedHeatmaps(newTrack, tracks.center[0]);
        }
      } else {
        // if it's not, we have to create a new combined track
        const newCombined = {
          uid: slugid.nice(),
          type: 'combined',
          contents: [tracks.center[0], newTrack],
        };

        tracks.center = [newCombined];

        if (newTrack.type === 'heatmap') {
          this.compatibilityfyStackedHeatmaps(newTrack, newCombined);
        }
      }
    } else {
      // otherwise, we want it at the end of the track list
      if (!tracks[position]) {
        // this position wasn't defined in the original viewconf
        tracks[position] = [];
      }

      tracks[position].push(newTrack);
    }

    this.adjustLayoutToTrackSizes(this.state.views[viewId]);

    if (Object.keys(this.state.views).length === 1 && numTracks === 0) {
      // Zoom to data extent since this is the first track we added and we only
      // have one view

      // This doesn't work because the tilesetInfo is probably not there yet
      this.handleZoomToData(viewId);

      // This might work but sometimes `TiledPlot.handleTilesetInfoReceived`
      // isn't triggered. E.g., when adding `dm6` as `chromosome-labels`.
      this.zoomToDataExtentOnInit.add(viewId);
    }

    return newTrack;
  }

  /**
   * We're adding a new heatmap to a combined track. We need to make sure that
   * their options are compatible.
   *
   * @param   {object}  newTrack  New heatmap track
   * @param   {object}  combinedTrack  Combined track the new heatmap is added to
   */
  compatibilityfyStackedHeatmaps(newTrack, combinedTrack) {
    let otherHeatmap;

    const hasHeatmaps = combinedTrack.contents.some((track) => {
      otherHeatmap = track;
      return track.type === 'heatmap';
    });

    if (hasHeatmaps) {
      // There already exist a heatmap let's set the background of the new
      // heatmap to `transparent`
      newTrack.options.backgroundColor = 'transparent';
      newTrack.options.showTooltip = otherHeatmap.options.showTooltip;
      newTrack.options.showMousePosition =
        otherHeatmap.options.showMousePosition;
      newTrack.options.mousePositionColor =
        otherHeatmap.options.mousePositionColor;
    }
  }

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
  storeTrackSizes(viewId) {
    visitPositionedTracks(this.state.views[viewId].tracks, (track) => {
      const trackObj = this.tiledPlots[viewId].trackRenderer.getTrackObject(
        track.uid,
      );

      if (trackObj) [track.width, track.height] = trackObj.dimensions;
    });
  }

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
  adjustLayoutToTrackSizes(view) {
    // if the view is too short, expand the view so that it fits this track
    if (!view.layout) return;

    const isEditable = this.isEditable();

    let totalTrackHeight = 0;

    // we are not checking for this.viewHeaders because this function may be
    // called before the component is mounted
    if (isEditable) totalTrackHeight += VIEW_HEADER_HEIGHT;

    // the tracks are larger than the height of the current view, so we need
    // to extend it
    const { totalHeight } = this.calculateViewDimensions(view);
    totalTrackHeight += totalHeight;

    const MARGIN_HEIGHT = this.isEditable() ? 10 : 0;

    totalTrackHeight += MARGIN_HEIGHT;
    const rowHeight = this.state.rowHeight + MARGIN_HEIGHT;

    if (this.sizeMode !== SIZE_MODE_BOUNDED) {
      view.layout.h = Math.ceil(totalTrackHeight / rowHeight);
    }
  }

  handleCloseTrack(viewId, uid) {
    const { tracks } = this.state.views[viewId];

    this.handleUnlockValueScale(viewId, uid);

    for (const trackType in tracks) {
      const theseTracks = tracks[trackType];
      const newTracks = theseTracks.filter((d) => d.uid !== uid);

      if (newTracks.length === theseTracks.length) {
        // no whole tracks need to removed, see if any of the combined tracks
        // contain series which need to go
        const combinedTracks = newTracks.filter((x) => x.type === 'combined');

        combinedTracks.forEach((ct) => {
          ct.contents = ct.contents.filter((x) => x.uid !== uid);
        });
      } else {
        tracks[trackType] = newTracks;
      }
    }

    this.storeTrackSizes(viewId);
    this.adjustLayoutToTrackSizes(this.state.views[viewId]);

    this.setState((prevState) => ({
      views: prevState.views,
    }));

    return this.state.views;
  }

  handleLockValueScale(fromViewUid, fromTrackUid) {
    this.setState({
      chooseTrackHandler: (toViewUid, toTrackUid) =>
        this.handleValueScaleLocked(
          fromViewUid,
          fromTrackUid,
          toViewUid,
          toTrackUid,
        ),
    });
  }

  combineViewAndTrackUid(viewUid, trackUid) {
    // see if we've already created a uid for this view / track combo
    const uid = `${viewUid}.${trackUid}`;

    this.combinedUidToViewTrack[uid] = { view: viewUid, track: trackUid };

    if (this.viewTrackUidsToCombinedUid[viewUid]) {
      if (this.viewTrackUidsToCombinedUid[trackUid]) {
        return this.viewTrackUidsToCombinedUid[viewUid][trackUid];
      }

      this.viewTrackUidsToCombinedUid[viewUid][trackUid] = uid;
    } else {
      this.viewTrackUidsToCombinedUid[viewUid] = {};
      this.viewTrackUidsToCombinedUid[viewUid][trackUid] = uid;
    }

    return uid;
  }

  /**
   * Update all locks involving this track to use a new track uid.
   *
   * @param  {string} viewUid The view's uid
   * @param  {string} oldTrackUid The track's old uid
   * @param  {string} newTrackUid The track's new uid
   */
  updateTrackLocks(viewUid, oldTrackUid, newTrackUid) {
    // update location locks
    // update zoom locks
    // update value scale locks
    const oldLockGroupUid = this.combineViewAndTrackUid(viewUid, oldTrackUid);
    const newLockGroupUid = this.combineViewAndTrackUid(viewUid, newTrackUid);

    if (this.valueScaleLocks[oldLockGroupUid]) {
      const lockGroup = this.valueScaleLocks[oldLockGroupUid];
      this.valueScaleLocks[newLockGroupUid] = lockGroup;
      delete this.valueScaleLocks[oldLockGroupUid];
    }

    for (const lockGroupUid in this.valueScaleLocks) {
      if (this.valueScaleLocks[lockGroupUid][oldLockGroupUid]) {
        const oldEntry = this.valueScaleLocks[lockGroupUid][oldLockGroupUid];
        this.valueScaleLocks[lockGroupUid][newLockGroupUid] = oldEntry;
        oldEntry.track = newTrackUid;
        delete this.valueScaleLocks[lockGroupUid][oldLockGroupUid];
      }
    }
  }

  handleUnlockValueScale(viewUid, trackUid) {
    // if it's combined track, unlock each individual component
    if (
      this.tiledPlots[viewUid].trackRenderer.getTrackObject(trackUid)
        .createdTracks
    ) {
      // if the from view is a combined track, recurse and add links between its child tracks
      const childTrackUids = dictKeys(
        this.tiledPlots[viewUid].trackRenderer.getTrackObject(trackUid)
          .createdTracks,
      );
      for (const childTrackUid of childTrackUids) {
        this.handleUnlock(
          this.combineViewAndTrackUid(viewUid, childTrackUid),
          this.valueScaleLocks,
        );
      }
    } else {
      this.handleUnlock(
        this.combineViewAndTrackUid(viewUid, trackUid),
        this.valueScaleLocks,
      );
    }
  }

  handleValueScaleLocked(fromViewUid, fromTrackUid, toViewUid, toTrackUid) {
    if (
      this.tiledPlots[fromViewUid].trackRenderer.getTrackObject(fromTrackUid)
        .createdTracks
    ) {
      // if the from view is a combined track, recurse and add links between its child tracks
      const childTrackUids = dictKeys(
        this.tiledPlots[fromViewUid].trackRenderer.getTrackObject(fromTrackUid)
          .createdTracks,
      );
      for (const childTrackUid of childTrackUids) {
        this.handleValueScaleLocked(
          fromViewUid,
          childTrackUid,
          toViewUid,
          toTrackUid,
        );
      }

      return;
    }

    if (
      this.tiledPlots[toViewUid].trackRenderer.getTrackObject(toTrackUid)
        .createdTracks
    ) {
      // if the from view is a combined track, recurse and add links between its child tracks
      const childTrackUids = dictKeys(
        this.tiledPlots[toViewUid].trackRenderer.getTrackObject(toTrackUid)
          .createdTracks,
      );
      for (const childTrackUid of childTrackUids) {
        this.handleValueScaleLocked(
          fromViewUid,
          fromTrackUid,
          toViewUid,
          childTrackUid,
        );
      }

      return;
    }

    const fromUid = this.combineViewAndTrackUid(fromViewUid, fromTrackUid);
    const toUid = this.combineViewAndTrackUid(toViewUid, toTrackUid);

    this.addLock(
      fromUid,
      toUid,
      this.valueScaleLocks,
      (uid) => this.combinedUidToViewTrack[uid],
    );

    this.syncValueScales(fromViewUid, fromTrackUid);

    this.setState({
      chooseTrackHandler: null,
    });
  }

  /**
   * Add callbacks for functions that need them
   *
   * Done in place.
   *
   * @param track: A view with tracks.
   */
  addCallbacks(viewUid, track) {
    const trackInfo = this.getTrackInfo(track.type);
    if (
      track.type === 'viewport-projection-center' ||
      track.type === 'viewport-projection-horizontal' ||
      track.type === 'viewport-projection-vertical' ||
      (trackInfo && trackInfo.projection)
    ) {
      const fromView = track.fromViewUid;

      track.registerViewportChanged = (trackId, listener) =>
        this.addScalesChangedListener(fromView, trackId, listener);
      track.removeViewportChanged = (trackId) =>
        this.removeScalesChangedListener(fromView, trackId);
      track.setDomainsCallback = (xDomain, yDomain) => {
        if (!fromView) {
          // If there is no `fromView`, then there must be a `projectionXDomain` instead.
          // Update the viewconfig to reflect the new `projectionXDomain` array
          // on the `viewport-projection-horizontal` track.
          if (!this.projectionXDomains[viewUid]) {
            this.projectionXDomains[viewUid] = {};
          }
          if (!this.projectionYDomains[viewUid]) {
            this.projectionYDomains[viewUid] = {};
          }
          if (
            track.type === 'viewport-projection-horizontal' ||
            track.type === 'viewport-projection-center'
          ) {
            this.projectionXDomains[viewUid][track.uid] = xDomain;
          }
          if (
            track.type === 'viewport-projection-vertical' ||
            track.type === 'viewport-projection-center'
          ) {
            this.projectionYDomains[viewUid][track.uid] = yDomain;
          }
          this.triggerViewChangeDb();
          // Return early, since the remaining code uses the `fromView` variable.
          return;
        }
        const tXScale = scaleLinear()
          .domain(xDomain)
          .range(this.xScales[fromView].range());
        const tYScale = scaleLinear()
          .domain(yDomain)
          .range(this.yScales[fromView].range());

        const [tx, ty, k] = scalesCenterAndK(tXScale, tYScale);
        this.setCenters[fromView](tx, ty, k, false);

        let zoomLocked = false;
        let locationLocked = false;

        // if we drag the brush and this view is locked to others, we don't
        // want the movement we induce in them to come back and modify this
        // view and set up a feedback loop
        if (viewUid in this.zoomLocks) {
          zoomLocked = fromView in this.zoomLocks[viewUid];
        }
        if (zoomLocked) {
          this.handleUnlock(viewUid, this.zoomLocks);
        }

        if (viewUid in this.locationLocks) {
          locationLocked = fromView in this.locationLocks[viewUid];
        }
        if (locationLocked) {
          this.handleUnlock(viewUid, this.locationLocks);
        }

        this.handleScalesChanged(fromView, tXScale, tYScale, true);

        if (zoomLocked) {
          this.addLock(
            viewUid,
            fromView,
            this.zoomLocks,
            this.viewScalesLockData,
          );
        }
        if (locationLocked) {
          this.addLock(
            viewUid,
            fromView,
            this.locationLocks,
            this.viewScalesLockData,
          );
        }
      };
    }
  }

  validateLocks(locks) {
    // locks are organized like this:
    // { v1: { v1: [0,0,0], v2: [1,1,1]}}
    // v1 marks the name of a lock group and also
    // corresponds to a view uid (a view cannot belong)
    // to more than one lock group. The numbers are the
    // zoom, xOffset, yOffset values that were present when
    // the view was created

    const toRemove = [];

    for (const viewUid of dictKeys(locks)) {
      if (!locks[viewUid] || !locks[viewUid][viewUid]) {
        // we need to have the starting location of the
        // lock's namesake view
        toRemove.push(viewUid);
      }
    }

    for (const viewUid of toRemove) {
      if (locks[viewUid]) {
        console.warn(`View ${viewUid} not present in lock group. Removing...`);
        this.handleUnlock(viewUid, locks);
        delete locks[viewUid];
      }
    }
  }

  deserializeLocationLocks(viewConfig) {
    this.locationLocks = {};

    if (viewConfig.locationLocks) {
      for (const viewUid of dictKeys(viewConfig.locationLocks.locksByViewUid)) {
        if (
          typeof viewConfig.locationLocks.locksByViewUid[viewUid] !== 'object'
        ) {
          this.locationLocks[viewUid] =
            viewConfig.locationLocks.locksDict[
              viewConfig.locationLocks.locksByViewUid[viewUid]
            ];
        } else {
          // This means we need to link x and y axes separately.

          // x-axis specific locks. The x-axis of this view is linked with an axis in another view.
          if ('x' in viewConfig.locationLocks.locksByViewUid[viewUid]) {
            const lockInfo =
              viewConfig.locationLocks.locksDict[
                viewConfig.locationLocks.locksByViewUid[viewUid].x.lock
              ];
            this.locationLocksAxisWise.x[viewUid] = {
              lock: lockInfo,
              axis: viewConfig.locationLocks.locksByViewUid[viewUid].x.axis, // The axis of another view, either 'x' or 'y'
            };
          }

          // y-axis specific locks. The y-axis of this view is linked with an axis in another view.
          if ('y' in viewConfig.locationLocks.locksByViewUid[viewUid]) {
            const lockInfo =
              viewConfig.locationLocks.locksDict[
                viewConfig.locationLocks.locksByViewUid[viewUid].y.lock
              ];
            this.locationLocksAxisWise.y[viewUid] = {
              lock: lockInfo,
              axis: viewConfig.locationLocks.locksByViewUid[viewUid].y.axis, // The axis of another view, either 'x' or 'y'
            };
          }
        }
      }
    }

    this.validateLocks(this.locationLocks);
  }

  deserializeZoomLocks(viewConfig) {
    this.zoomLocks = {};

    //
    if (viewConfig.zoomLocks) {
      for (const viewUid of dictKeys(viewConfig.zoomLocks.locksByViewUid)) {
        this.zoomLocks[viewUid] =
          viewConfig.zoomLocks.locksDict[
            viewConfig.zoomLocks.locksByViewUid[viewUid]
          ];
      }
    }

    this.validateLocks(this.zoomLocks);
  }

  deserializeValueScaleLocks(viewConfig) {
    this.valueScaleLocks = {};

    if (viewConfig.valueScaleLocks) {
      for (const viewUid of dictKeys(
        viewConfig.valueScaleLocks.locksByViewUid,
      )) {
        this.valueScaleLocks[viewUid] =
          viewConfig.valueScaleLocks.locksDict[
            viewConfig.valueScaleLocks.locksByViewUid[viewUid]
          ];
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

  getViewsAsJson() {
    const newJson = JSON.parse(JSON.stringify(this.state.viewConfig));
    newJson.views = Object.values(this.state.views).map((k) => {
      const newView = JSON.parse(JSON.stringify(k));

      visitPositionedTracks(newView.tracks, (track) => {
        if (track.server) {
          const url = parse(track.server, {});

          if (!url.hostname.length) {
            // no hostname specified in the track source servers so we'll add
            // the current URL's
            const hostString = window.location.host;
            const { protocol } = window.location;
            const newUrl = `${protocol}//${hostString}${url.pathname}`;

            track.server = newUrl;
          }
        }

        if (
          (track.type === 'viewport-projection-center' ||
            track.type === 'viewport-projection-horizontal') &&
          this.projectionXDomains[k.uid] &&
          this.projectionXDomains[k.uid][track.uid]
        ) {
          // There is no "from" view attached to this projection track,
          // so the `projectionXDomain` field must be used.
          track.projectionXDomain = this.projectionXDomains[k.uid][track.uid];
        }
        if (
          (track.type === 'viewport-projection-center' ||
            track.type === 'viewport-projection-vertical') &&
          this.projectionYDomains[k.uid] &&
          this.projectionYDomains[k.uid][track.uid]
        ) {
          // There is no "from" view attached to this projection track,
          // so the `projectionYDomain` field must be used.
          track.projectionYDomain = this.projectionYDomains[k.uid][track.uid];
        }

        delete track.name;
        delete track.position;
        delete track.header;
        delete track.description;
        delete track.created;
        delete track.project;
        delete track.project_name;
        delete track.serverUidKey;
        delete track.uuid;
        delete track.private;
        delete track.maxZoom;
        delete track.coordSystem;
        delete track.coordSystem2;
        delete track.datatype;
        delete track.maxWidth;
        delete track.datafile;
        delete track.binsPerDimension;
        delete track.resolutions;
        delete track.aggregationModes;
      });

      newView.uid = k.uid;
      newView.initialXDomain = this.xScales[k.uid].domain();
      newView.initialYDomain = this.yScales[k.uid].domain();

      delete newView.layout.i;

      return newView;
    });

    newJson.zoomLocks = this.serializeLocks(this.zoomLocks);
    newJson.locationLocks = this.serializeLocks(this.locationLocks);
    newJson.valueScaleLocks = this.serializeLocks(this.valueScaleLocks);

    return newJson;
  }

  getViewsAsString() {
    return JSON.stringify(this.getViewsAsJson(), null, 2);
  }

  handleExportViewAsJSON() {
    const data = this.getViewsAsString();
    // const file = new Blob([data], { type: 'text/json' });

    download('viewconf.json', data);
  }

  handleExportViewsAsLink(
    url = this.state.viewConfig.exportViewUrl,
    fromApi = false,
  ) {
    const parsedUrl = new URL(url, window.location.origin);

    const req = fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: `{"viewconf":${this.getViewsAsString()}}`,
      credentials: 'same-origin',
    })
      .then((response) => {
        if (!response.ok) {
          throw response;
        }
        return response.json();
      })
      .catch((err) => {
        console.warn('err:', err);
      })
      .then((_json) => ({
        id: _json.uid,
        url: `${parsedUrl.origin}/l/?d=${_json.uid}`,
      }));

    if (!fromApi) {
      req
        .then((sharedView) => {
          this.openModal(
            <ExportLinkDialog
              onDone={() => {
                this.closeModalBound();
              }}
              url={sharedView.url}
            />,
          );
        })
        .catch((e) =>
          console.error('Exporting view config as link failed:', e),
        );
    }

    return req;
  }

  /*
   * The initial[XY]Domain of a view has changed. Update its definition
   * and rerender.
   */
  handleDataDomainChanged(viewUid, newXDomain, newYDomain) {
    const { views } = this.state;

    views[viewUid].initialXDomain = newXDomain;
    views[viewUid].initialYDomain = newYDomain;

    this.xScales[viewUid] = scaleLinear().domain(newXDomain);
    this.yScales[viewUid] = scaleLinear().domain(newYDomain);

    if (this.zoomLocks[viewUid]) {
      const lockGroup = this.zoomLocks[viewUid];
      const lockGroupItems = dictItems(lockGroup);

      for (let i = 0; i < lockGroupItems.length; i++) {
        const key = lockGroupItems[i][0];

        if (!(key in this.locationLocks)) {
          // only zoom to extent if both zoom and location
          // are locked
          continue;
        }

        views[key].initialXDomain = newXDomain;
        views[key].initialYDomain = newYDomain;

        this.xScales[key] = scaleLinear().domain(newXDomain);
        this.yScales[key] = scaleLinear().domain(newYDomain);
      }
    }

    this.setState({ views });
  }

  /**
   * Check if we can place a view at this position
   */
  viewPositionAvailable(pX, pY, w, h) {
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

  /**
   * User clicked on the "Add View" button. We'll duplicate the last
   * view.
   */
  handleAddView(view) {
    const views = dictValues(this.state.views);
    const lastView = view;

    const potentialPositions = [];

    if (view.layout.w === 12) {
      // this view is full width, we can cut it in half (#259)
      view.layout.w = 6;
    }

    for (let i = 0; i < views.length; i++) {
      let pX = views[i].layout.x + views[i].layout.w;
      let pY = views[i].layout.y;

      // can we place the new view to the right of this view?
      if (this.viewPositionAvailable(pX, pY, view.layout.w, view.layout.h)) {
        potentialPositions.push([pX, pY]);
      }

      pX = views[i].layout.x;
      pY = views[i].layout.y + views[i].layout.h;
      // can we place the new view below this view
      if (this.viewPositionAvailable(pX, pY, view.layout.w, view.layout.h)) {
        potentialPositions.push([pX, pY]);
      }
    }

    potentialPositions.sort((a, b) => {
      const n = a[1] - b[1];

      if (n === 0) {
        return a[0] - b[0];
      }

      return n;
    });

    const jsonString = JSON.stringify(lastView);

    const newView = JSON.parse(jsonString); // ghetto copy

    newView.initialXDomain = this.xScales[newView.uid].domain();
    newView.initialYDomain = this.yScales[newView.uid].domain();

    // place this new view below all the others

    [[newView.layout.x, newView.layout.y]] = potentialPositions;

    // give it its own unique id
    newView.uid = slugid.nice();
    newView.layout.i = newView.uid;

    visitPositionedTracks(newView.tracks, (track) => {
      this.addCallbacks(newView.uid, track);
    });

    this.setState((prevState) => {
      // eslint-disable-next-line no-shadow
      const views = JSON.parse(JSON.stringify(prevState.views));
      views[newView.uid] = newView;
      return { views };
    });
  }

  handleSelectedAssemblyChanged(
    viewUid,
    newAssembly,
    newAutocompleteId,
    newServer,
  ) {
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
    const { views } = this.state;

    views[viewUid].genomePositionSearchBox.chromInfoId = newAssembly;
    views[viewUid].genomePositionSearchBox.autocompleteId = newAutocompleteId;
    views[viewUid].genomePositionSearchBox.autocompleteServer = newServer;
  }

  createGenomePostionSearchBoxEntry(
    existingGenomePositionSearchBox,
    suggestedAssembly,
  ) {
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

    if (!newGpsb) {
      newGpsb = JSON.parse(JSON.stringify(defaultGpsb));
    }

    if (!newGpsb.autocompleteServer) {
      newGpsb.autocompleteServer = defaultGpsb.autocompleteServer;
    }

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

    if (!newGpsb.chromInfoServer) {
      newGpsb.chromInfoServer = defaultGpsb.chromInfoServer;
    }

    if (!newGpsb.visible) {
      newGpsb.visible = false;
    }

    return newGpsb;
  }

  handleTogglePositionSearchBox(viewUid) {
    /*
     * Show or hide the genome position search box for a given view
     */

    const view = this.state.views[viewUid];
    view.genomePositionSearchBoxVisible = !view.genomePositionSearchBoxVisible;

    // count the number of tracks that are part of some assembly
    const assemblyCounts = {};

    visitPositionedTracks(view.tracks, (track) => {
      if (track.coordSystem) {
        if (!assemblyCounts[track.coordSystem]) {
          assemblyCounts[track.coordSystem] = 0;
        }

        assemblyCounts[track.coordSystem] += 1;
      }
    });

    const sortedAssemblyCounts = dictItems(assemblyCounts).sort(
      (a, b) => b[1] - a[1],
    );
    let selectedAssembly = 'hg19'; // always the default if nothing is otherwise selected

    if (sortedAssemblyCounts.length) {
      selectedAssembly = sortedAssemblyCounts[0][0];
    }

    view.genomePositionSearchBox = this.createGenomePostionSearchBoxEntry(
      view.genomePositionSearchBox,
      selectedAssembly,
    );
    view.genomePositionSearchBox.visible = !view.genomePositionSearchBox
      .visible;

    this.refreshView();

    this.setState({
      configMenuUid: null,
    });
  }

  handleTrackOptionsChanged(viewUid, trackUid, newOptions) {
    // some track's options changed...
    // redraw the track  and store the changes in the config file
    const view = this.state.views[viewUid];
    const track = getTrackByUid(view.tracks, trackUid);

    if (!track) return;

    track.options = Object.assign(track.options, newOptions);

    if (this.mounted) {
      this.setState((prevState) => ({
        views: prevState.views,
      }));
      this.adjustSplitHeatmapTrackOptions(
        track,
        newOptions,
        view.tracks,
        viewUid,
      );
    }
  }

  /**
   * For convenience we adjust some options of split heatmap tracks when they are newly added.
   * This function has no effect when we get split heatmap tracks that are already correctly configured
   * (i.e. correctly set "lower-extend"/"upper-extend" options)
   * @param   {object}  track  Track whose options have changed
   * @param   {object}  options  New track options
   * @param   {list}  allTracks  All tracks
   * @param   {string}  viewUid  Related view UID
   */
  adjustSplitHeatmapTrackOptions(track, options, allTracks, viewUid) {
    if (track.type === 'heatmap') {
      if (
        options.extent === 'upper-right' &&
        allTracks.center[0].type === 'combined' &&
        allTracks.center[0].contents.length > 1
      ) {
        allTracks.center[0].contents.some((otherTrack) => {
          if (
            otherTrack.type === 'heatmap' &&
            otherTrack.uid !== track.uid &&
            otherTrack.options.extent !== 'lower-left'
          ) {
            // Automatically change the extent of the other track to
            // `lower-left``
            const otherNewOptions = Object.assign({}, otherTrack.options, {
              extent: 'lower-left',
              labelPosition: 'bottomLeft',
              colorbarPosition: 'bottomLeft',
            });

            // Automatically set positions of label and colorbar of the current track
            // to the opposite corner. We don't want overlapping labels.
            const originalNewOptions = Object.assign({}, options, {
              labelPosition: 'topRight',
              colorbarPosition: 'topRight',
            });

            this.handleTrackOptionsChanged(
              viewUid,
              otherTrack.uid,
              otherNewOptions,
            );

            this.handleTrackOptionsChanged(
              viewUid,
              track.uid,
              originalNewOptions,
            );
            return true;
          }
          return false;
        });
      }
      if (options.extent === 'lower-left') {
        if (
          options.extent === 'lower-left' &&
          allTracks.center[0].type === 'combined' &&
          allTracks.center[0].contents.length > 1
        ) {
          allTracks.center[0].contents.some((otherTrack) => {
            if (
              otherTrack.type === 'heatmap' &&
              otherTrack.uid !== track.uid &&
              otherTrack.options.extent !== 'upper-right'
            ) {
              // Automatically change the extent of the other track to
              // `upper-right``
              const otherNewOptions = Object.assign({}, otherTrack.options, {
                extent: 'upper-right',
                labelPosition: 'topRight',
                colorbarPosition: 'topRight',
              });

              // Automatically set positions of label and colorbar of the current track
              // to the opposite corner. We don't want overlapping labels.
              const originalNewOptions = Object.assign({}, options, {
                labelPosition: 'bottomLeft',
                colorbarPosition: 'bottomLeft',
              });

              this.handleTrackOptionsChanged(
                viewUid,
                otherTrack.uid,
                otherNewOptions,
              );

              this.handleTrackOptionsChanged(
                viewUid,
                track.uid,
                originalNewOptions,
              );
              return true;
            }
            return false;
          });
        }
      }
    }
  }

  handleViewOptionsChanged(viewUid, newOptions) {
    const view = this.state.views[viewUid];

    if (!view) {
      return;
    }

    view.options = Object.assign(view.options || {}, newOptions);

    if (this.mounted) {
      this.setState((prevState) => ({
        views: prevState.views,
      }));
    }
  }

  /**
   * Determine whether a track is valid and can be displayed.
   *
   * Tracks can be invalid due to inconsistent input such as
   * referral to views that don't exist
   *
   * @param track (object): A track definition
   * @param viewUidsPresent (Set): The view uids which are available
   */
  isTrackValid(track, viewUidsPresent) {
    if (track.type === 'viewport-projection-center') {
      if (!viewUidsPresent.has(track.fromViewUid)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Remove tracks which can no longer be shown (possibly because the views they
   * refer to no longer exist
   */
  removeInvalidTracks(viewsByUid) {
    const viewUidsSet = new Set(dictKeys(viewsByUid));

    for (const v of dictValues(viewsByUid)) {
      for (const trackOrientation of [
        'left',
        'top',
        'center',
        'right',
        'bottom',
      ]) {
        if (v.tracks && v.tracks.hasOwnProperty(trackOrientation)) {
          // filter out invalid tracks
          v.tracks[trackOrientation] = v.tracks[trackOrientation].filter((t) =>
            this.isTrackValid(t, viewUidsSet),
          );

          // filter out invalid tracks in combined tracks
          v.tracks[trackOrientation].forEach((t) => {
            if (t.type === 'combined') {
              t.contents = t.contents.filter((c) =>
                this.isTrackValid(c, viewUidsSet),
              );
            }
          });
        }
      }
    }

    return viewsByUid;
  }

  processViewConfig(viewConfig) {
    let { views } = viewConfig;
    let viewsByUid = {};

    if (!viewConfig.views || viewConfig.views.length === 0) {
      console.warn('No views provided in viewConfig');
      views = [
        {
          editable: true,
          tracks: {},
        },
      ];
    }

    views.forEach((v) => {
      if (v.tracks) {
        fillInMinWidths(v.tracks);
      }

      // if a view doesn't have a uid, assign it one
      if (!v.uid) {
        v.uid = slugid.nice();
      }

      viewsByUid[v.uid] = v;

      if (this.zoomToDataExtentOnInit.has(v.uid)) {
        this.zoomToDataExtentOnInit.delete(v.uid);
      }

      if (!v.initialXDomain) {
        v.initialXDomain = [0, 100];

        this.zoomToDataExtentOnInit.add(v.uid);
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

      if (!this.xScales[v.uid]) {
        this.xScales[v.uid] = scaleLinear().domain(v.initialXDomain);
      }
      if (!this.yScales[v.uid]) {
        this.yScales[v.uid] = scaleLinear().domain(v.initialYDomain);
      }

      visitPositionedTracks(v.tracks, (track) => {
        if (!track.uid) track.uid = slugid.nice();

        this.addCallbacks(v.uid, track);
        this.addDefaultTrackOptions(track);

        if (track.contents) {
          // add default options to combined tracks
          for (const ct of track.contents) this.addDefaultTrackOptions(ct);
        }
      });

      // make sure that the layout for this view refers to this view
      if (v.layout) {
        v.layout.i = v.uid;
      } else {
        v.layout = this.generateViewLayout(v);
      }
    });

    this.deserializeZoomLocks(viewConfig);
    this.deserializeLocationLocks(viewConfig);
    this.deserializeValueScaleLocks(viewConfig);

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

  /**
   * Handle range selection events.
   *
   * @description
   * Store active range selectio and forward the range selection event to the
   * API.
   *
   * @param  {Array}  range  Double array of the selected range.
   */
  rangeSelectionHandler(range) {
    this.rangeSelection = range;
    this.apiPublish('rangeSelection', range);
  }

  offViewChange(listenerId) {
    this.viewChangeListener.splice(listenerId, 1);
  }

  onViewChange(callback) {
    return this.viewChangeListener.push(callback) - 1;
  }

  triggerViewChange() {
    this.viewChangeListener.forEach((callback) =>
      callback(this.getViewsAsString()),
    );
  }

  getGenomeLocation(viewId) {
    return chromInfo
      .get(this.state.views[viewId].chromInfoPath)
      .then((chrInfo) =>
        scalesToGenomeLoci(this.xScales[viewId], this.yScales[viewId], chrInfo),
      );
  }

  offLocationChange(viewId, listenerId) {
    this.removeScalesChangedListener(viewId, listenerId);
  }

  zoomTo(viewUid, start1Abs, end1Abs, start2Abs, end2Abs, animateTime) {
    if (!(viewUid in this.setCenters)) {
      throw Error(
        `Invalid viewUid. Current uuids: ${Object.keys(this.setCenters).join(
          ',',
        )}`,
      );
    }

    if (Number.isNaN(+start1Abs) || Number.isNaN(+end1Abs)) {
      const coords = [start1Abs, end1Abs].join(', ');
      console.warn(
        [
          `Invalid coordinates (${coords}). All coordinates need to be numbers
        and should represent absolute coordinates (not chromosome
        coordinates).`,
        ].join(' '),
      );
      return;
    }

    if (
      Number.isNaN(+start2Abs) ||
      Number.isNaN(+end2Abs) ||
      start2Abs === null ||
      end2Abs === null
    ) {
      start2Abs = start1Abs;
      end2Abs = end1Abs;
    }

    const [centerX, centerY, k] = scalesCenterAndK(
      this.xScales[viewUid].copy().domain([start1Abs, end1Abs]),
      this.yScales[viewUid].copy().domain([start2Abs, end2Abs]),
    );

    this.setCenters[viewUid](centerX, centerY, k, false, animateTime);
  }

  zoomToGene(viewUid, geneName, padding, animateTime) {
    if (!(viewUid in this.setCenters)) {
      throw Error(
        `Invalid viewUid. Current uuids: ${Object.keys(this.setCenters).join(
          ',',
        )}`,
      );
    }

    if (
      !this.state.views[viewUid].genomePositionSearchBox ||
      !this.state.views[viewUid].genomePositionSearchBox.autocompleteServer ||
      !this.state.views[viewUid].genomePositionSearchBox.autocompleteId ||
      !this.state.views[viewUid].chromInfoPath
    ) {
      console.warn(
        'Please set chromInfoPath, autocompleteServer, and autocompleteId to use the zoomToGene API',
      );
      return;
    }

    this.suggestGene(viewUid, geneName, (suggestions) => {
      if (suggestions) {
        // extract the position of exact match
        const exactMatch = suggestions.find(
          (d) => d.geneName.toLowerCase() === geneName.toLowerCase(),
        );

        if (exactMatch) {
          const { chr, txStart, txEnd } = exactMatch;

          // extract absolute positions
          ChromosomeInfo(
            this.state.views[viewUid].chromInfoPath,
            (loadedChromInfo) => {
              // using the absolution positions, zoom to the position near a gene
              const startAbs =
                loadedChromInfo.chrToAbs([chr, txStart]) - padding;
              const endAbs = loadedChromInfo.chrToAbs([chr, txEnd]) + padding;

              const [centerX, centerY, k] = scalesCenterAndK(
                this.xScales[viewUid].copy().domain([startAbs, endAbs]),
                this.yScales[viewUid].copy().domain([startAbs, endAbs]),
              );

              this.setCenters[viewUid](centerX, centerY, k, false, animateTime);
            },
            this.pubSub,
          );
        } else {
          console.warn(`Couldn't find the gene symbol: ${geneName}`);
        }
      }
    });
  }

  suggestGene(viewUid, keyword, callback) {
    if (!(viewUid in this.setCenters)) {
      throw Error(
        `Invalid viewUid. Current uuids: ${Object.keys(this.setCenters).join(
          ',',
        )}`,
      );
    }

    if (
      !this.state.views[viewUid].genomePositionSearchBox ||
      !this.state.views[viewUid].genomePositionSearchBox.autocompleteServer ||
      !this.state.views[viewUid].genomePositionSearchBox.autocompleteId
    ) {
      console.warn(
        'Please set autocompleteServer and autocompleteId to use the suggestGene API',
      );
      return;
    }

    const autocompleteServer = this.state.views[viewUid].genomePositionSearchBox
      .autocompleteServer;
    const autocompleteId = this.state.views[viewUid].genomePositionSearchBox
      .autocompleteId;

    const url = `${autocompleteServer}/suggest/?d=${autocompleteId}&ac=${keyword.toLowerCase()}`;

    tileProxy
      .json(url, toVoid, this.pubSub)
      .then((suggestions) => {
        callback(suggestions);
      })
      .catch((error) => console.error(error));
  }

  onLocationChange(viewId, callback, callbackId) {
    const viewsIds = Object.keys(this.state.views);

    if (!viewsIds.length) {
      // HiGlass was probably initialized with an URL instead of a viewconfig
      // and that remote viewConfig is not yet loaded.
      this.unsetOnLocationChange.push({
        viewId,
        callback,
        callbackId,
      });
      return null;
    }

    viewId =
      typeof viewId === 'undefined' && viewsIds.length === 1
        ? viewsIds[0]
        : viewId;

    if (typeof viewId === 'undefined' || viewsIds.indexOf(viewId) === -1) {
      console.error(
        'onLocationChange either missing a viewId or passed an invalid viewId: ',
        viewId,
      );
      return null;
    }

    const view = this.state.views[viewId];

    // Convert scales into genomic locations
    const middleLayerListener = (xScale, yScale) => {
      callback({
        xDomain: xScale.domain(),
        yDomain: yScale.domain(),
        xRange: xScale.range(),
        yRange: yScale.range(),
      });
    };

    let newListenerId = 1;
    if (this.scalesChangedListeners[view.uid]) {
      newListenerId =
        Object.keys(this.scalesChangedListeners[view.uid])
          .filter(
            (listenerId) => listenerId.indexOf(LOCATION_LISTENER_PREFIX) === 0,
          )
          .map((listenerId) =>
            parseInt(listenerId.slice(LOCATION_LISTENER_PREFIX.length + 1), 10),
          )
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

    return newListenerId;
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

      const { top, left } = area;
      const bottom = top + area.height;
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
    if (!this.topDiv || this.state.modal) return;

    const absX = e.clientX;
    const absY = e.clientY;
    const relPos = clientPoint(this.topDiv, e);
    // We need to add the scrollTop
    relPos[1] += this.scrollTop;
    const hoveredTiledPlot = this.getTiledPlotAtPosition(absX, absY);

    const hoveredTracks = hoveredTiledPlot
      ? hoveredTiledPlot
          .listTracksAtPosition(relPos[0], relPos[1], true)
          .map((track) => track.originalTrack || track)
      : [];

    const hoveredTrack = hoveredTracks.find(
      (track) => !track.isAugmentationTrack,
    );

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
        ? hoveredTrack._xScale.invert(relTrackPos[0]) // dataX
        : hoveredTrack._xScale.invert(relTrackPos[1]); // dataY

      dataY = hoveredTrack.is2d
        ? hoveredTrack._yScale.invert(relTrackPos[1])
        : dataX;
    }

    const evt = {
      x: relPos[0],
      y: relPos[1],
      relTrackX:
        hoveredTrack && hoveredTrack.flipText ? relTrackPos[1] : relTrackPos[0],
      relTrackY:
        hoveredTrack && hoveredTrack.flipText ? relTrackPos[0] : relTrackPos[1],
      dataX,
      dataY,
      // See below why we need these derived boolean values
      isFrom2dTrack: !!(hoveredTrack && hoveredTrack.is2d),
      isFromVerticalTrack: !!(hoveredTrack && hoveredTrack.flipText),
      track: hoveredTrack,
      origEvt: e,
      sourceUid: this.uid,
      hoveredTracks,
      // See below why we need these derived boolean values
      noHoveredTracks: hoveredTracks.length === 0,
    };

    this.pubSub.publish('app.mouseMove', evt);

    if (this.isBroadcastMousePositionGlobally) {
      // In order to broadcast information globally with the
      // Broadcast Channel API we have to remove properties that reference local
      // objects as those can't be cloned and broadcasted to another context
      // (i.e., another browser window or tab).
      // This is also the reason why created some derived boolean variables,
      // like `noHoveredTracks`.
      const eventDataOnly = { ...evt };
      eventDataOnly.origEvt = undefined;
      eventDataOnly.track = undefined;
      eventDataOnly.hoveredTracks = undefined;
      delete eventDataOnly.origEvt;
      delete eventDataOnly.track;
      delete eventDataOnly.hoveredTracks;
      globalPubSub.publish('higlass.mouseMove', eventDataOnly);
    }

    this.apiPublish('cursorLocation', {
      absX,
      absY,
      relX: evt.x,
      relY: evt.y,
      relTrackX: evt.relTrackX,
      relTrackY: evt.relTrackY,
      dataX: evt.dataX,
      dataY: evt.dataY,
      isFrom2dTrack: evt.isFrom2dTrack,
      isFromVerticalTrack: evt.isFromVerticalTrack,
    });

    this.showHoverMenu(evt);
  }

  getMinMaxValue(viewId, trackId, ignoreOffScreenValues, ignoreFixedScale) {
    const track = getTrackObjById(this.tiledPlots, viewId, trackId);

    if (!track) {
      console.warn(`Track with ID: ${trackId} not found!`);
      return undefined;
    }

    if (!track.minVisibleValueInTiles || !track.maxVisibleValueInTiles) {
      console.warn(
        `Track ${trackId} doesn't support the retrieval of min or max values.`,
      );
      return undefined;
    }

    if (ignoreOffScreenValues && track.getAggregatedVisibleValue) {
      return [
        track.getAggregatedVisibleValue('min'),
        track.getAggregatedVisibleValue('max'),
      ];
    }

    return [
      track.minVisibleValueInTiles(ignoreFixedScale),
      track.maxVisibleValueInTiles(ignoreFixedScale),
    ];
  }

  /**
   * Show a menu displaying some information about the track under it
   */
  showHoverMenu(evt) {
    // each track should have a function that returns an HTML representation
    // of the data at a give position
    const mouseOverHtml =
      evt.track && evt.track.getMouseOverHtml
        ? evt.track.getMouseOverHtml(evt.relTrackX, evt.relTrackY)
        : '';

    if (evt.track !== this.prevMouseHoverTrack) {
      if (this.prevMouseHoverTrack && this.prevMouseHoverTrack.stopHover) {
        this.prevMouseHoverTrack.stopHover();
      }
    }

    this.prevMouseHoverTrack = evt.track;

    if (this.zooming) return;

    const data = mouseOverHtml && mouseOverHtml.length ? [1] : [];

    // try to select the mouseover div
    let mouseOverDiv = select('body')
      .selectAll('.track-mouseover-menu')
      .data(data);

    mouseOverDiv.exit().remove();

    mouseOverDiv
      .enter()
      .append('div')
      .classed('track-mouseover-menu', true)
      .classed(styles['track-mouseover-menu'], true);

    mouseOverDiv = select('body').selectAll('.track-mouseover-menu');
    const mousePos = clientPoint(select('body').node(), evt.origEvt);
    const normalizedMousePos = [
      mousePos[0] - window.scrollX,
      mousePos[1] - window.scrollY,
    ];

    /*
    mouseOverDiv.selectAll('.mouseover-marker')
      .data([1])
      .enter()
      .append('div')
      .classed('.mouseover-marker', true)
    */

    mouseOverDiv
      .style('left', `${normalizedMousePos[0]}px`)
      .style('top', `${normalizedMousePos[1]}px`);

    // probably not over a track so there's no mouseover rectangle
    if (!mouseOverDiv.node()) return;

    const bbox = mouseOverDiv.node().getBoundingClientRect();

    if (bbox.x + bbox.width > window.innerWidth) {
      // the overlay box is spilling outside of the track so switch
      // to showing it on the left
      mouseOverDiv.style('left', `${normalizedMousePos[0] - bbox.width}px`);
    }

    if (bbox.y + bbox.height > window.innerHeight) {
      // the overlay box is spilling outside of the track so switch
      // to showing it on the left
      mouseOverDiv.style('top', `${normalizedMousePos[1] - bbox.height}px`);
    }

    mouseOverDiv.html(mouseOverHtml);
  }

  /**
   * Hide the hover menu when e.g. the user starts zooming
   */
  hideHoverMenu() {
    select('body').selectAll('.track-mouseover-menu').remove();
  }

  /**
   * Handle internally broadcasted click events
   */
  appClickHandler(data) {
    this.apiPublish('click', data);
  }

  /**
   * Handle mousemove and zoom events.
   */
  mouseMoveZoomHandler(data) {
    this.apiPublish('mouseMoveZoom', data);
  }

  /**
   * Handle gene search events.
   */
  geneSearchHandler(data) {
    this.apiPublish('geneSearch', data);
  }

  /**
   * Handle mousedown events/
   */
  mouseDownHandler(evt) {}

  onScrollHandler() {
    if (this.props.options.sizeMode !== SIZE_MODE_SCROLL) return;
    this.scrollTop = this.scrollContainer.scrollTop;
    this.pixiStage.y = -this.scrollTop;
    this.pubSub.publish('app.scroll', this.scrollTop);
    this.animate();
  }

  setTrackValueScaleLimits(viewId, trackId, minValue, maxValue) {
    const track = getTrackObjById(this.tiledPlots, viewId, trackId);

    if (!track) {
      console.warn(`Could't find track: ${trackId}`);
      return;
    }

    if (track.setFixedValueScaleMin && track.setFixedValueScaleMax) {
      track.setFixedValueScaleMin(minValue);
      track.setFixedValueScaleMax(maxValue);

      track.rerender(track.options, true);
      track.animate();
    } else {
      console.warn("Track doesn't support fixed value scales.");
    }
  }

  setChromInfo(chromInfoPath, callback) {
    ChromosomeInfo(
      chromInfoPath,
      (newChromInfo) => {
        this.chromInfo = newChromInfo;
        callback();
      },
      this.pubSub,
    );
  }

  onMouseLeaveHandler() {
    this.pubSub.publish('app.mouseLeave');
    this.hideHoverMenu();
    this.animate();
  }

  onBlurHandler() {
    this.animate();
  }

  isZoomFixed(view) {
    return (
      this.props.zoomFixed ||
      this.props.options.zoomFixed ||
      this.state.viewConfig.zoomFixed ||
      this.props.options.sizeMode === SIZE_MODE_SCROLL ||
      (view && view.zoomFixed)
    );
  }

  /**
   * Handle trackDimensionsModified events
   * settings.viewId = id of the view
   * settings.trackId = id of the track
   * settings.height = new height of the track or undefined if current height should remain
   * settings.width = new width of the track or undefined if current width should remain
   */
  trackDimensionsModifiedHandler(settings) {
    const view = this.state.views[settings.viewId];

    if (!view) return;

    const track = getTrackByUid(view.tracks, settings.trackId);

    if (!track) return;

    if (settings.height !== undefined) {
      track.height = settings.height;
    }

    if (settings.width !== undefined) {
      track.width = settings.width;
    }
    this.adjustLayoutToTrackSizes(view);

    this.setState((prevState) => ({
      views: prevState.views,
    }));
  }

  wheelHandler(evt) {
    if (this.state.modal || this.props.options.sizeMode === SIZE_MODE_SCROLL)
      return;

    // The event forwarder wasn't written for React's SyntheticEvent
    const nativeEvent = evt.nativeEvent || evt;

    const isTargetCanvas = evt.target === this.canvasElement;

    if (!hasParent(nativeEvent.target, this.topDiv)) {
      // ignore events that don't come from within the
      // HiGlass container
      return;
    }

    if (this.isZoomFixed()) {
      // ignore events when in zoom fixed mode
      return;
    }

    const absX = nativeEvent.clientX;
    const absY = nativeEvent.clientY;
    const hoveredTiledPlot = this.getTiledPlotAtPosition(absX, absY);

    // Find the tracks at the wheel position
    if (this.apiStack.wheel && this.apiStack.wheel.length > 0) {
      const relPos = clientPoint(this.topDiv, nativeEvent);
      // We need to add the scrollTop
      relPos[1] += this.scrollTop;
      const hoveredTracks = hoveredTiledPlot
        ? hoveredTiledPlot
            .listTracksAtPosition(relPos[0], relPos[1], true)
            .map((track) => track.originalTrack || track)
        : [];
      const hoveredTrack = hoveredTracks.find(
        (track) => !track.isAugmentationTrack,
      );

      const relTrackPos = hoveredTrack
        ? [
            relPos[0] - hoveredTrack.position[0],
            relPos[1] - hoveredTrack.position[1],
          ]
        : relPos;

      const evtToPublish = {
        x: relPos[0],
        y: relPos[1],
        relTrackX:
          hoveredTrack && hoveredTrack.flipText
            ? relTrackPos[1]
            : relTrackPos[0],
        relTrackY:
          hoveredTrack && hoveredTrack.flipText
            ? relTrackPos[0]
            : relTrackPos[1],
        track: hoveredTrack,
        origEvt: nativeEvent,
        sourceUid: this.uid,
        hoveredTracks,
        noHoveredTracks: hoveredTracks.length === 0,
      };

      this.apiPublish('wheel', evtToPublish);
    }

    if (nativeEvent.forwarded || isTargetCanvas) {
      evt.stopPropagation();
      evt.preventDefault();

      return;
    }

    evt.preventDefault();

    // forward the wheel event back to the TrackRenderer that it should go to
    // this is so that we can zoom when there's a viewport projection present
    if (hoveredTiledPlot) {
      const { trackRenderer } = hoveredTiledPlot;
      nativeEvent.forwarded = true;

      if (nativeEvent) {
        forwardEvent(nativeEvent, trackRenderer.eventTracker);

        nativeEvent.preventDefault();
      }
    }
  }

  render() {
    this.tiledAreasDivs = {};
    this.tiledAreas = <div styleName="styles.tiled-area" />;

    // The component needs to be mounted in order for the initial view to have
    // the right width
    if (this.mounted) {
      this.tiledAreas = dictValues(this.state.views).map((view) => {
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
                zIndex: 1,
              }}
            />
          );
        }

        const tiledPlot = (
          <TiledPlot
            // Reserved props
            key={`tp${view.uid}`}
            ref={(c) => {
              this.tiledPlots[view.uid] = c;
            }}
            // Custom props
            addTrackPosition={
              this.state.addTrackPositionView === view.uid
                ? this.state.addTrackPosition
                : null
            }
            addTrackPositionMenuPosition={addTrackPositionMenuPosition}
            canvasElement={this.state.canvasElement}
            chooseTrackHandler={
              this.state.chooseTrackHandler
                ? (trackId) => this.state.chooseTrackHandler(view.uid, trackId)
                : null
            }
            chromInfoPath={view.chromInfoPath}
            disableTrackMenu={this.isTrackMenuDisabled()}
            draggingHappening={this.state.draggingHappening}
            editable={this.isEditable()}
            getLockGroupExtrema={(uid) =>
              this.getLockGroupExtrema(view.uid, uid)
            }
            initialXDomain={view.initialXDomain}
            initialYDomain={view.initialYDomain}
            isShowGlobalMousePosition={this.isShowGlobalMousePosition}
            isValueScaleLocked={(uid) => this.isValueScaleLocked(view.uid, uid)}
            marginBottom={this.viewMarginBottom}
            marginLeft={this.viewMarginLeft}
            marginRight={this.viewMarginRight}
            marginTop={this.viewMarginTop}
            metaTracks={view.metaTracks}
            mouseTool={this.state.mouseTool}
            onChangeTrackData={(trackId, newData) =>
              this.handleChangeTrackData(view.uid, trackId, newData)
            }
            onChangeTrackType={(trackId, newType) =>
              this.handleChangeTrackType(view.uid, trackId, newType)
            }
            onCloseTrack={(uid) => this.handleCloseTrack(view.uid, uid)}
            onDataDomainChanged={(xDomain, yDomain) =>
              this.handleDataDomainChanged(view.uid, xDomain, yDomain)
            }
            onLockValueScale={(uid) => this.handleLockValueScale(view.uid, uid)}
            onMouseMoveZoom={this.mouseMoveZoomHandler.bind(this)}
            onNewTilesLoaded={(trackUid) =>
              this.handleNewTilesLoaded(view.uid, trackUid)
            }
            onNoTrackAdded={this.handleNoTrackAdded.bind(this)}
            onRangeSelection={this.rangeSelectionHandler.bind(this)}
            onResizeTrack={this.triggerViewChangeDb}
            onScalesChanged={(x, y) => this.handleScalesChanged(view.uid, x, y)}
            onTrackOptionsChanged={(trackId, options) =>
              this.handleTrackOptionsChanged(view.uid, trackId, options)
            }
            onTrackPositionChosen={this.handleTrackPositionChosen.bind(this)}
            onTracksAdded={(newTracks, position, host) =>
              this.handleTracksAdded(view.uid, newTracks, position, host)
            }
            onUnlockValueScale={(uid) =>
              this.handleUnlockValueScale(view.uid, uid)
            }
            onValueScaleChanged={(uid) => this.syncValueScales(view.uid, uid)}
            overlays={view.overlays}
            paddingBottom={this.viewPaddingBottom}
            paddingLeft={this.viewPaddingLeft}
            paddingRight={this.viewPaddingRight}
            paddingTop={this.viewPaddingTop}
            pixiRenderer={this.pixiRenderer}
            pixiStage={this.pixiStage}
            pluginDataFetchers={this.pluginDataFetchers}
            pluginTracks={this.pluginTracks}
            rangeSelection1dSize={this.state.rangeSelection1dSize}
            rangeSelectionToInt={this.state.rangeSelectionToInt}
            registerDraggingChangedListener={(listener) =>
              this.addDraggingChangedListener(view.uid, view.uid, listener)
            }
            removeDraggingChangedListener={(listener) =>
              this.removeDraggingChangedListener(view.uid, view.uid, listener)
            }
            setCentersFunction={(c) => {
              this.setCenters[view.uid] = c;
            }}
            svgElement={this.state.svgElement}
            tracks={view.tracks}
            trackSourceServers={this.state.viewConfig.trackSourceServers}
            uid={view.uid}
            verticalMargin={this.verticalMargin}
            viewOptions={view.options}
            // dragging={this.state.dragging}
            xDomainLimits={view.xDomainLimits}
            yDomainLimits={view.yDomainLimits}
            zoomable={!this.isZoomFixed(view)}
            zoomLimits={this.calculateZoomLimits(view, view.initialXDomain)}
            zoomToDataExtentOnInit={() =>
              this.zoomToDataExtentOnInit.has(view.uid)
            }
          />
        );

        const getGenomePositionSearchBox = (isFocused, onFocus) => {
          if (!view.genomePositionSearchBox) return null;

          return (
            <GenomePositionSearchBox
              // Reserved props
              key={`gpsb${view.uid}`}
              ref={(c) => {
                this.genomePositionSearchBoxes[view.uid] = c;
              }}
              // Custom props
              autocompleteId={view.genomePositionSearchBox.autocompleteId}
              autocompleteServer={
                view.genomePositionSearchBox.autocompleteServer
              }
              chromInfoId={view.genomePositionSearchBox.chromInfoId}
              chromInfoPath={view.genomePositionSearchBox.chromInfoPath}
              chromInfoServer={view.genomePositionSearchBox.chromInfoServer}
              hideAvailableAssemblies={
                view.genomePositionSearchBox.hideAvailableAssemblies
              }
              isFocused={isFocused}
              // the chromInfoId is either specified in the viewconfig or guessed based on
              // the visible tracks (see createGenomePositionSearchBoxEntry)
              onFocus={onFocus}
              onGeneSearch={this.geneSearchHandler.bind(this)}
              onSelectedAssemblyChanged={(x, y, server) =>
                this.handleSelectedAssemblyChanged(view.uid, x, y, server)
              }
              registerViewportChangedListener={(listener) =>
                this.addScalesChangedListener(view.uid, view.uid, listener)
              }
              removeViewportChangedListener={() =>
                this.removeScalesChangedListener(view.uid, view.uid)
              }
              setCenters={(centerX, centerY, k, animateTime) =>
                this.setCenters[view.uid](
                  centerX,
                  centerY,
                  k,
                  false,
                  animateTime,
                )
              }
              trackSourceServers={this.state.viewConfig.trackSourceServers}
              twoD={true}
            />
          );
        };

        const multiTrackHeader =
          this.isEditable() &&
          !this.isViewHeaderDisabled() &&
          !this.state.viewConfig.hideHeader ? (
            <ViewHeader
              ref={(c) => {
                this.viewHeaders[view.uid] = c;
              }}
              getGenomePositionSearchBox={getGenomePositionSearchBox}
              isGenomePositionSearchBoxVisible={
                view.genomePositionSearchBox &&
                view.genomePositionSearchBox.visible
              }
              mouseTool={this.state.mouseTool}
              onAddView={() => this.handleAddView(view)}
              onClearView={() => this.handleClearView(view.uid)}
              onCloseView={() => this.handleCloseView(view.uid)}
              onEditViewConfig={this.handleEditViewConfigBound}
              onExportPNG={this.handleExportPNG.bind(this)}
              onExportSVG={this.handleExportSVG.bind(this)}
              onExportViewsAsJSON={this.handleExportViewAsJSON.bind(this)}
              onExportViewsAsLink={this.handleExportViewsAsLink.bind(this)}
              onLockLocation={(uid) =>
                this.handleYankFunction(
                  uid,
                  this.handleLocationLockChosen.bind(this),
                )
              }
              onLockZoom={(uid) =>
                this.handleYankFunction(
                  uid,
                  this.handleZoomLockChosen.bind(this),
                )
              }
              onLockZoomAndLocation={(uid) =>
                this.handleYankFunction(uid, (a, b) => {
                  this.handleZoomLockChosen(a, b);
                  this.handleLocationLockChosen(a, b);
                })
              }
              onProjectViewport={this.handleProjectViewport.bind(this)}
              onTakeAndLockZoomAndLocation={(uid) => {
                this.handleYankFunction(uid, (a, b) => {
                  this.handleZoomYanked(a, b);
                  this.handleLocationYanked(a, b);
                  this.handleZoomLockChosen(a, b);
                  this.handleLocationLockChosen(a, b);
                });
              }}
              onTogglePositionSearchBox={this.handleTogglePositionSearchBox.bind(
                this,
              )}
              onTrackPositionChosen={(position) =>
                this.handleTrackPositionChosen(view.uid, position)
              }
              onUnlockLocation={(uid) =>
                this.handleUnlock(uid, this.locationLocks)
              }
              onUnlockZoom={(uid) => this.handleUnlock(uid, this.zoomLocks)}
              onUnlockZoomAndLocation={(uid) => {
                this.handleUnlock(uid, this.zoomLocks);
                this.handleUnlock(uid, this.locationLocks);
              }}
              onViewOptionsChanged={(newOptions) =>
                this.handleViewOptionsChanged(view.uid, newOptions)
              }
              onYankLocation={(uid) =>
                this.handleYankFunction(
                  uid,
                  this.handleLocationYanked.bind(this),
                )
              }
              onYankZoom={(uid) =>
                this.handleYankFunction(uid, this.handleZoomYanked.bind(this))
              }
              onYankZoomAndLocation={(uid) =>
                this.handleYankFunction(uid, (a, b) => {
                  this.handleZoomYanked(a, b);
                  this.handleLocationYanked(a, b);
                })
              }
              onZoomToData={(uid) => this.handleZoomToData(uid)}
              viewUid={view.uid}
            />
          ) : null;

        return (
          <div
            key={view.uid}
            ref={(c) => {
              this.tiledAreasDivs[view.uid] = c;
            }}
            styleName="styles.tiled-area"
          >
            {multiTrackHeader}
            {tiledPlot}
            {overlay}
          </div>
        );
      });
    }

    let layouts = this.mounted
      ? Object.values(this.state.views)
          .filter((view) => view.layout)
          .map((view) => view.layout)
      : [];

    layouts = JSON.parse(JSON.stringify(layouts)); // make sure to copy the layouts

    const defaultContainerPaddingX = this.isEditable()
      ? DEFAULT_CONTAINER_PADDING_X
      : 0;
    const defaultContainerPaddingY = this.isEditable()
      ? DEFAULT_CONTAINER_PADDING_Y
      : 0;

    const containerPaddingX =
      +this.props.options.containerPaddingX >= 0
        ? +this.props.options.containerPaddingX
        : defaultContainerPaddingX;
    const containerPaddingY =
      +this.props.options.containerPaddingY >= 0
        ? +this.props.options.containerPaddingY
        : defaultContainerPaddingY;

    const gridLayout = (
      <ReactGridLayout
        // Reserved props
        ref={(c) => {
          this.gridLayout = c;
        }}
        // Custom props
        cols={12}
        containerPadding={[containerPaddingX, containerPaddingY]}
        draggableHandle={`.${stylesMTHeader['multitrack-header-grabber']}`}
        isDraggable={this.isEditable()}
        isResizable={this.isEditable()}
        layout={layouts}
        margin={this.isEditable() ? [10, 10] : [0, 0]}
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
        verticalCompact={this.state.viewConfig.compactLayout}
        width={this.state.width}
      >
        {this.tiledAreas}
      </ReactGridLayout>
    );

    let styleNames = 'styles.higlass';

    if (this.theme === THEME_DARK) {
      styleNames += ' styles.higlass-dark-theme';
    }

    if (
      this.props.options.sizeMode === SIZE_MODE_OVERFLOW ||
      this.props.options.sizeMode === SIZE_MODE_SCROLL
    ) {
      styleNames += ' styles.higlass-container-overflow';
    }

    let scrollStyleNames = '';
    if (this.props.options.sizeMode === SIZE_MODE_OVERFLOW) {
      scrollStyleNames = 'styles.higlass-scroll-container-overflow';
    } else if (this.props.options.sizeMode === SIZE_MODE_SCROLL) {
      scrollStyleNames = 'styles.higlass-scroll-container-scroll';
    }

    return (
      <div
        key={this.uid}
        ref={(c) => {
          this.topDiv = c;
        }}
        className="higlass"
        onMouseLeave={this.onMouseLeaveHandlerBound}
        onMouseMove={this.mouseMoveHandlerBound}
        styleName={styleNames}
      >
        <PubSubProvider value={this.pubSub}>
          <ModalProvider value={this.modal}>
            <ThemeProvider value={this.theme}>
              {this.state.modal}
              <canvas
                key={this.uid}
                ref={(c) => {
                  this.canvasElement = c;
                }}
                styleName="styles.higlass-canvas"
              />
              <div
                ref={(c) => {
                  this.scrollContainer = c;
                }}
                className="higlass-scroll-container"
                onScroll={this.onScrollHandlerBound}
                styleName={scrollStyleNames}
              >
                <div
                  ref={(c) => {
                    this.divDrawingSurface = c;
                  }}
                  className="higlass-drawing-surface"
                  styleName="styles.higlass-drawing-surface"
                >
                  {gridLayout}
                </div>
                <svg
                  ref={(c) => {
                    this.svgElement = c;
                  }}
                  style={{
                    // inline the styles so they aren't overriden by other css
                    // on the web page
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    left: 0,
                    top: 0,
                    pointerEvents: 'none',
                  }}
                  styleName="styles.higlass-svg"
                />
              </div>
            </ThemeProvider>
          </ModalProvider>
        </PubSubProvider>
      </div>
    );
  }
}

HiGlassComponent.defaultProps = {
  options: {},
  zoomFixed: false,
  compactLayout: true,
};

HiGlassComponent.propTypes = {
  getApi: PropTypes.func,
  options: PropTypes.object,
  viewConfig: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
    .isRequired,
  zoomFixed: PropTypes.bool,
  compactLayout: PropTypes.bool,
};

export default HiGlassComponent;
