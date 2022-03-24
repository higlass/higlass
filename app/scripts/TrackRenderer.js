import React from 'react';
import PropTypes from 'prop-types';

import { zoom, zoomIdentity } from 'd3-zoom';
import { select, event, clientPoint } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import slugid from 'slugid';

import PixiTrack from './PixiTrack';
import HeatmapTiledPixiTrack from './HeatmapTiledPixiTrack';
import Id2DTiledPixiTrack from './Id2DTiledPixiTrack';
import IdHorizontal1DTiledPixiTrack from './IdHorizontal1DTiledPixiTrack';
import IdVertical1DTiledPixiTrack from './IdVertical1DTiledPixiTrack';
import TopAxisTrack from './TopAxisTrack';
import LeftAxisTrack from './LeftAxisTrack';
import CombinedTrack from './CombinedTrack';
import BedLikeTrack from './BedLikeTrack';
import OverlayTrack from './OverlayTrack';

import HorizontalLine1DPixiTrack from './HorizontalLine1DPixiTrack';
import HorizontalPoint1DPixiTrack from './HorizontalPoint1DPixiTrack';
import HorizontalMultivecTrack from './HorizontalMultivecTrack';
import BarTrack from './BarTrack';
import DivergentBarTrack from './DivergentBarTrack';
import Horizontal1dHeatmapTrack from './Horizontal1dHeatmapTrack';

import CNVIntervalTrack from './CNVIntervalTrack';
import LeftTrackModifier from './LeftTrackModifier';
import Track from './Track';
import HorizontalGeneAnnotationsTrack from './HorizontalGeneAnnotationsTrack';
import ArrowheadDomainsTrack from './ArrowheadDomainsTrack';
import Annotations2dTrack from './Annotations2dTrack';
import Annotations1dTrack from './Annotations1dTrack';

import Horizontal2DDomainsTrack from './Horizontal2DDomainsTrack';

import SquareMarkersTrack from './SquareMarkersTrack';
import Chromosome2DLabels from './Chromosome2DLabels';
import ChromosomeGrid from './ChromosomeGrid';
import Chromosome2DAnnotations from './Chromosome2DAnnotations';
import HorizontalChromosomeLabels from './HorizontalChromosomeLabels';

import HorizontalHeatmapTrack from './HorizontalHeatmapTrack';
import UnknownPixiTrack from './UnknownPixiTrack';
import ValueIntervalTrack from './ValueIntervalTrack';
import ViewportTracker2D from './ViewportTracker2D';
import ViewportTrackerHorizontal from './ViewportTrackerHorizontal';
import ViewportTrackerVertical from './ViewportTrackerVertical';

import HorizontalRule from './HorizontalRule';
import VerticalRule from './VerticalRule';
import CrossRule from './CrossRule';

import OSMTilesTrack from './OSMTilesTrack';
import OSMTileIdsTrack from './OSMTileIdsTrack';
import MapboxTilesTrack from './MapboxTilesTrack';
import RasterTilesTrack from './RasterTilesTrack';

import SVGTrack from './SVGTrack';

// Higher-order components
import withPubSub from './hocs/with-pub-sub';
import getDataFetcher from './data-fetchers/get-data-fetcher';
import withTheme from './hocs/with-theme';

// Utils
import {
  colorToHex,
  dictItems,
  forwardEvent,
  scalesCenterAndK,
  trimTrailingSlash,
} from './utils';

// Configs
import {
  AVAILABLE_FOR_PLUGINS,
  GLOBALS,
  THEME_DARK,
  TRACKS_INFO_BY_TYPE,
} from './configs';

// Styles
import '../styles/TrackRenderer.module.scss';

const SCROLL_TIMEOUT = 100;

class TrackRenderer extends React.Component {
  /**
   * Maintain a list of tracks, and re-render them whenever either
   * their size changes or the zoom level changes
   *
   * Zooming changes the domain of the scales.
   *
   * Resizing changes the range. Both trigger a rerender.
   */
  constructor(props) {
    super(props);
    this.dragging = false; // is this element being dragged?
    this.element = null;
    this.closing = false;

    this.yPositionOffset = 0;
    this.xPositionOffset = 0;
    this.scrollTop = 0;

    this.scrollTimeout = null;
    this.activeTransitions = 0;

    this.zoomTransform = zoomIdentity;
    this.windowScrolledBound = this.windowScrolled.bind(this);
    this.zoomStartedBound = this.zoomStarted.bind(this);
    this.zoomedBound = this.zoomed.bind(this);
    this.zoomEndedBound = this.zoomEnded.bind(this);

    this.uid = slugid.nice();
    this.viewUid = this.props.uid;

    this.availableForPlugins = AVAILABLE_FOR_PLUGINS;
    this.availableForPlugins.services.pubSub = this.props.pubSub;
    this.availableForPlugins.services.pixiRenderer = this.props.pixiRenderer;

    this.mounted = false;

    // create a zoom behavior that we'll just use to transform selections
    // without having it fire an "onZoom" event
    this.emptyZoomBehavior = zoom();

    // a lot of the updates in TrackRenderer happen in response to
    // componentWillReceiveProps so we need to perform them with the
    // newest set of props. When cWRP is called, this.props still contains
    // the old props, so we need to store them in a new variable
    this.currentProps = props;
    this.prevPropsStr = '';

    // catch any zooming behavior within all of the tracks in this plot
    // this.zoomTransform = zoomIdentity();
    this.zoomBehavior = zoom()
      .filter(() => {
        if (event.target.classList.contains('no-zoom')) {
          return false;
        }
        if (event.target.classList.contains('react-resizable-handle')) {
          return false;
        }
        return true;
      })
      .on('start', this.zoomStartedBound)
      .on('zoom', this.zoomedBound)
      .on('end', this.zoomEndedBound);

    this.zoomTransform = zoomIdentity;
    this.prevZoomTransform = zoomIdentity;

    this.initialXDomain = [0, 1];
    this.initialYDomain = [0, 1];
    this.xDomainLimits = [-Infinity, Infinity];
    this.yDomainLimits = [-Infinity, Infinity];
    this.zoomLimits = [0, Infinity];

    this.prevCenterX =
      this.currentProps.paddingLeft +
      this.currentProps.leftWidth +
      this.currentProps.centerWidth / 2;
    this.prevCenterY =
      this.currentProps.paddingTop +
      this.currentProps.topHeight +
      this.currentProps.centerHeight / 2;

    // The offset of the center from the original. Used to keep the scales centered on resize events
    this.cumCenterXOffset = 0;
    this.cumCenterYOffset = 0;

    this.setUpInitialScales(
      this.currentProps.initialXDomain,
      this.currentProps.initialYDomain,
      this.currentProps.xDomainLimits,
      this.currentProps.yDomainLimits,
      this.currentProps.zoomLimits,
    );

    this.setUpScales();

    // maintain a list of trackDefObjects which correspond to the input
    // tracks
    // Each object will contain a trackDef
    // {'top': 100, 'left': 50,... 'track': {'source': 'http:...', 'type': 'heatmap'}}
    // And a trackObject which will be responsible for rendering it
    this.trackDefObjects = {};

    this.metaTracks = {};

    this.pubSubs = [];

    // if there's plugin tracks, they'll define new track
    // types and we'll want to use their information when
    // we look up the orientation of a track
    if (window.higlassTracksByType) {
      // Extend `TRACKS_INFO_BY_TYPE` with the configs of plugin tracks.
      Object.keys(window.higlassTracksByType).forEach((pluginTrackType) => {
        TRACKS_INFO_BY_TYPE[pluginTrackType] =
          window.higlassTracksByType[pluginTrackType].config;
      });
    }

    this.boundForwardEvent = this.forwardEvent.bind(this);
    this.boundScrollEvent = this.scrollEvent.bind(this);
    this.boundForwardContextMenu = this.forwardContextMenu.bind(this);
    this.dispatchEventBound = this.dispatchEvent.bind(this);
    this.zoomToDataPosHandlerBound = this.zoomToDataPosHandler.bind(this);
    this.onScrollHandlerBound = this.onScrollHandler.bind(this);
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillMount() {
    this.pubSubs = [];
    this.pubSubs.push(
      this.props.pubSub.subscribe('scroll', this.windowScrolledBound),
    );
    this.pubSubs.push(
      this.props.pubSub.subscribe('app.event', this.dispatchEventBound),
    );
    this.pubSubs.push(
      this.props.pubSub.subscribe(
        'zoomToDataPos',
        this.zoomToDataPosHandlerBound,
      ),
    );
    this.pubSubs.push(
      this.props.pubSub.subscribe('app.scroll', this.onScrollHandlerBound),
    );
  }

  componentDidMount() {
    this.elementPos = this.element.getBoundingClientRect();
    this.elementSelection = select(this.element);
    this.svgTrackAreaSelection = select(this.svgTrackArea);

    this.pStage = new GLOBALS.PIXI.Graphics();
    this.pMask = new GLOBALS.PIXI.Graphics();
    this.pOutline = new GLOBALS.PIXI.Graphics();
    this.pBackground = new GLOBALS.PIXI.Graphics();

    this.pStage.addChild(this.pMask);
    this.pStage.addChild(this.pOutline);

    this.currentProps.pixiStage.addChild(this.pStage);

    this.pStage.mask = this.pMask;

    if (!this.props.isRangeSelection) this.addZoom();

    // need to be mounted to make sure that all the renderers are
    // created before starting to draw tracks
    if (!this.currentProps.svgElement || !this.currentProps.canvasElement) {
      return;
    }

    this.svgElement = this.currentProps.svgElement;
    this.syncTrackObjects(this.currentProps.positionedTracks);
    this.syncMetaTracks(this.currentProps.metaTracks);

    this.currentProps.setCentersFunction(this.setCenter.bind(this));
    this.currentProps.registerDraggingChangedListener(
      this.draggingChanged.bind(this),
    );

    this.draggingChanged(true);
    this.addEventTracker();

    // Init zoom and scale extent
    const transExt = [
      [this.xScale(this.xDomainLimits[0]), this.yScale(this.yDomainLimits[0])],
      [this.xScale(this.xDomainLimits[1]), this.yScale(this.yDomainLimits[1])],
    ];

    const svgBBox = this.svgElement.getBoundingClientRect();

    const ext = [
      [Math.max(transExt[0][0], 0), Math.max(transExt[0][1], 0)],
      [
        Math.min(transExt[1][0], svgBBox.width),
        Math.min(transExt[1][1], svgBBox.height),
      ],
    ];

    this.zoomBehavior
      .extent(ext)
      .translateExtent(transExt)
      .scaleExtent(this.zoomLimits);
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps) {
    /**
     * The size of some tracks probably changed, so let's just
     * redraw them.
     */
    // don't initiate this component if it has nothing to draw on
    if (!nextProps.svgElement || !nextProps.canvasElement) {
      return;
    }

    const nextPropsStr = this.updatablePropsToString(nextProps);
    this.currentProps = nextProps;

    if (this.prevPropsStr === nextPropsStr) return;

    this.setBackground();

    for (const uid in this.trackDefObjects) {
      const track = this.trackDefObjects[uid].trackObject;

      track.delayDrawing = true;
    }

    this.prevPropsStr = nextPropsStr;

    this.setUpInitialScales(
      nextProps.initialXDomain,
      nextProps.initialYDomain,
      nextProps.xDomainLimits,
      nextProps.yDomainLimits,
      nextProps.zoomLimits,
    );

    this.setUpScales(
      nextProps.width !== this.props.width ||
        nextProps.height !== this.props.height,
    );

    this.svgElement = nextProps.svgElement;

    const transExt = [
      [this.xScale(this.xDomainLimits[0]), this.yScale(this.yDomainLimits[0])],
      [this.xScale(this.xDomainLimits[1]), this.yScale(this.yDomainLimits[1])],
    ];

    const svgBBox = this.svgElement.getBoundingClientRect();

    const ext = [
      [Math.max(transExt[0][0], 0), Math.max(transExt[0][1], 0)],
      [
        Math.min(transExt[1][0], svgBBox.width),
        Math.min(transExt[1][1], svgBBox.height),
      ],
    ];

    this.zoomBehavior
      .extent(ext)
      .translateExtent(transExt)
      .scaleExtent(this.zoomLimits);

    this.syncTrackObjects(nextProps.positionedTracks);
    this.syncMetaTracks(nextProps.metaTracks);

    for (const track of nextProps.positionedTracks) {
      // tracks all the way down
      const options = track.track.options;
      const trackObject = this.trackDefObjects[track.track.uid].trackObject;
      trackObject.rerender(options);

      if (track.track.hasOwnProperty('contents')) {
        const ctDefs = {};
        for (const ct of track.track.contents) {
          ctDefs[ct.uid] = ct;
        }

        for (const uid in trackObject.createdTracks) {
          trackObject.createdTracks[uid].rerender(ctDefs[uid].options);
        }
      }
    }
    this.props.onNewTilesLoaded();

    for (const uid in this.trackDefObjects) {
      const track = this.trackDefObjects[uid].trackObject;

      track.delayDrawing = false;
      track.draw();
    }
  }

  componentDidUpdate(prevProps) {
    // If the initial domain changed, a new view config
    // probably has loaded. Reset the element's zoomTransform in this case.
    // In D3, an element’s transform is stored internally as element.__zoom
    if (
      this.props.initialXDomain[0] !== prevProps.initialXDomain[0] ||
      this.props.initialXDomain[1] !== prevProps.initialXDomain[1] ||
      this.props.initialYDomain[0] !== prevProps.initialYDomain[0] ||
      this.props.initialYDomain[1] !== prevProps.initialYDomain[1]
    ) {
      this.element.__zoom = zoomIdentity;
    }

    if (prevProps.isRangeSelection !== this.props.isRangeSelection) {
      if (this.props.isRangeSelection) {
        this.removeZoom();
      } else {
        this.addZoom();
      }
    }

    if (prevProps.zoomable !== this.props.zoomable) {
      if (this.props.zoomable) {
        this.addZoom();
      } else {
        this.removeZoom();
      }
    }

    this.addEventTracker();
  }

  componentWillUnmount() {
    /**
     * This view has been removed so we need to get rid of all the tracks it contains
     */
    this.mounted = false;
    this.removeTracks(Object.keys(this.trackDefObjects));
    this.removeMetaTracks(Object.keys(this.metaTracks));
    this.currentProps.removeDraggingChangedListener(this.draggingChanged);

    this.currentProps.pixiStage.removeChild(this.pStage);

    this.pMask.destroy(true);
    this.pStage.destroy(true);

    this.pubSubs.forEach((subscription) =>
      this.props.pubSub.unsubscribe(subscription),
    );
    this.pubSubs = [];

    this.removeEventTracker();
  }

  /* --------------------------- Custom Methods ----------------------------- */

  /**
   * Dispatch a forwarded event on the main DOM element
   *
   * @param  {Object}  e  Event to be dispatched.
   */
  dispatchEvent(e) {
    if (e.sourceUid === this.uid && e.type !== 'contextmenu') {
      forwardEvent(e, this.element);
    }
  }

  /**
   * Check of a view position (i.e., pixel coords) is within this view
   *
   * @param  {Number}  x  X position to be tested.
   * @param  {Number}  y  Y position to be tested.
   * @return  {Boolean}   If `true` position is within this view.
   */
  isWithin(x, y) {
    if (!this.element) return false;

    const withinX =
      x >= this.elementPos.left &&
      x <= this.elementPos.width + this.elementPos.left;
    const withinY =
      y >= this.elementPos.top &&
      y <= this.elementPos.height + this.elementPos.top;

    return withinX && withinY;
  }

  zoomToDataPosHandler({ pos, animateTime, isMercator }) {
    this.zoomToDataPos(...pos, animateTime, isMercator);
  }

  addZoom() {
    if (!this.elementSelection || !this.currentProps.zoomable) return;

    this.elementSelection.call(this.zoomBehavior);
    this.zoomBehavior.transform(this.elementSelection, this.zoomTransform);
  }

  removeZoom() {
    if (this.elementSelection) {
      this.zoomEnded();
      this.elementSelection.on('.zoom', null);
    }
  }

  /*
   * Add a mask to make sure that the tracks displayed in this view
   * don't overflow its bounds.
   */
  setMask() {
    this.pMask.clear();
    this.pMask.beginFill();
    this.pMask.drawRect(
      this.xPositionOffset,
      this.yPositionOffset,
      this.currentProps.width,
      this.currentProps.height,
    );
    this.pMask.endFill();

    // show the bounds of this view
    /*
    this.pOutline.clear();
    this.pOutline.lineStyle(1, '#000', 1);
    this.pOutline.drawRect(
      this.xPositionOffset, this.yPositionOffset, this.currentProps.width, this.currentProps.height
    );
    */
  }

  setBackground() {
    const defBgColor = this.props.theme === THEME_DARK ? 'black' : 'white';
    const bgColor = colorToHex(
      (this.currentProps.viewOptions &&
        this.currentProps.viewOptions.backgroundColor) ||
        defBgColor,
    );

    this.pBackground.clear();
    this.pBackground.beginFill(bgColor);
    this.pBackground.drawRect(
      this.xPositionOffset,
      this.yPositionOffset,
      this.currentProps.width,
      this.currentProps.height,
    );
    this.pBackground.endFill();
  }

  windowScrolled() {
    this.removeZoom();

    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollTimeout = setTimeout(() => {
      this.addZoom();
    }, SCROLL_TIMEOUT);
  }

  setUpInitialScales(
    initialXDomain = [0, 1],
    initialYDomain = [0, 1],
    xDomainLimits = [-Infinity, Infinity],
    yDomainLimits = [-Infinity, Infinity],
    zoomLimits = [0, Infinity],
  ) {
    // Make sure the initial domain is within the limits first
    zoomLimits[0] = zoomLimits[0] === null ? 0 : zoomLimits[0];
    zoomLimits[1] = zoomLimits[1] === null ? Infinity : zoomLimits[1];

    // make sure the two scales are equally wide:
    const xWidth = initialXDomain[1] - initialXDomain[0];
    const yCenter = (initialYDomain[0] + initialYDomain[1]) / 2;
    // initialYDomain = [yCenter - xWidth / 2, yCenter + xWidth / 2];

    // stretch out the y-scale so that views aren't distorted (i.e. maintain
    // a 1 to 1 ratio)
    initialYDomain[0] = yCenter - xWidth / 2;
    initialYDomain[1] = yCenter + xWidth / 2;

    // if the inital domains haven't changed, then we don't have to
    // worry about resetting anything
    // initial domains should only change when loading a new viewconfig
    if (
      initialXDomain[0] === this.initialXDomain[0] &&
      initialXDomain[1] === this.initialXDomain[1] &&
      initialYDomain[0] === this.initialYDomain[0] &&
      initialYDomain[1] === this.initialYDomain[1] &&
      xDomainLimits[0] === this.xDomainLimits[0] &&
      xDomainLimits[1] === this.xDomainLimits[1] &&
      yDomainLimits[0] === this.yDomainLimits[0] &&
      yDomainLimits[1] === this.yDomainLimits[1] &&
      zoomLimits[0] === this.zoomLimits[0] &&
      zoomLimits[1] === this.zoomLimits[1]
    )
      return;

    // only update the initial domain
    this.initialXDomain = initialXDomain;
    this.initialYDomain = initialYDomain;
    this.xDomainLimits = xDomainLimits;
    this.yDomainLimits = yDomainLimits;
    this.zoomLimits = zoomLimits;

    // Reset the local record of the zoom transform to avoid
    // pan & zoom jumps when saving the viewconfig
    this.zoomTransform = zoomIdentity;
    this.prevZoomTransform = zoomIdentity;

    this.cumCenterYOffset = 0;
    this.cumCenterXOffset = 0;

    this.drawableToDomainX = scaleLinear()
      .domain([
        this.currentProps.paddingLeft + this.currentProps.leftWidth,
        this.currentProps.paddingLeft +
          this.currentProps.leftWidth +
          this.currentProps.centerWidth,
      ])
      .range([initialXDomain[0], initialXDomain[1]]);

    let startY;
    let endY;
    if (this.currentProps.centerWidth === 0) {
      // If the width of the center track is zero, we do not want to make startY and endY equal.
      startY = this.currentProps.paddingTop + this.currentProps.topHeight;
      endY =
        this.currentProps.paddingTop +
        this.currentProps.topHeight +
        this.currentProps.centerHeight;
    } else {
      startY =
        this.currentProps.paddingTop +
        this.currentProps.topHeight +
        this.currentProps.centerHeight / 2 -
        this.currentProps.centerWidth / 2;
      endY =
        this.currentProps.paddingTop +
        this.currentProps.topHeight +
        this.currentProps.centerHeight / 2 +
        this.currentProps.centerWidth / 2;
    }
    this.drawableToDomainY = scaleLinear()
      .domain([startY, endY])
      .range([initialYDomain[0], initialYDomain[1]]);

    this.prevCenterX =
      this.currentProps.paddingLeft +
      this.currentProps.leftWidth +
      this.currentProps.centerWidth / 2;
    this.prevCenterY =
      this.currentProps.paddingTop +
      this.currentProps.topHeight +
      this.currentProps.centerHeight / 2;
  }

  updatablePropsToString(props) {
    return JSON.stringify({
      positionedTracks: props.positionedTracks,
      initialXDomain: props.initialXDomain,
      initialYDomain: props.initialYDomain,
      width: props.width,
      height: props.height,
      paddingLeft: props.paddingLeft,
      paddingTop: props.paddingTop,
      leftWidth: props.leftWidth,
      topHeight: props.topHeight,
      dragging: props.dragging,
      viewOptions: props.viewOptions,
    });
  }

  draggingChanged(draggingStatus) {
    this.dragging = draggingStatus;

    this.timedUpdatePositionAndDimensions();
  }

  setUpScales(notify = false) {
    const currentCenterX =
      this.currentProps.paddingLeft +
      this.currentProps.leftWidth +
      this.currentProps.centerWidth / 2;
    const currentCenterY =
      this.currentProps.paddingTop +
      this.currentProps.topHeight +
      this.currentProps.centerHeight / 2;

    // we need to maintain two scales:
    // 1. the scale that is shown
    // 2. the scale that the zooming behavior acts on
    //
    // These need to be separated because the zoom behavior acts on a larger
    // region than the visible scale shows

    // if the window is resized, we don't want to change the scale, but we do
    // want to move the center point. this needs to be tempered by the zoom
    // factor so that we keep the visible center point in the center
    const centerDomainXOffset =
      (this.drawableToDomainX(currentCenterX) -
        this.drawableToDomainX(this.prevCenterX)) /
      this.zoomTransform.k;
    const centerDomainYOffset =
      (this.drawableToDomainY(currentCenterY) -
        this.drawableToDomainY(this.prevCenterY)) /
      this.zoomTransform.k;

    this.cumCenterYOffset += centerDomainYOffset;
    this.cumCenterXOffset += centerDomainXOffset;

    this.prevCenterY = currentCenterY;
    this.prevCenterX = currentCenterX;

    // the domain of the visible (not drawable area)
    const visibleXDomain = [
      this.drawableToDomainX(0) - this.cumCenterXOffset,
      this.drawableToDomainX(this.currentProps.width) - this.cumCenterXOffset,
    ];
    const visibleYDomain = [
      this.drawableToDomainY(0) - this.cumCenterYOffset,
      this.drawableToDomainY(this.currentProps.height) - this.cumCenterYOffset,
    ];

    // [drawableToDomain(0), drawableToDomain(1)]: the domain of the visible area
    // if the screen has been resized, then the domain width should remain the same

    // this.xScale should always span the region that the zoom behavior is being called on
    this.xScale = scaleLinear()
      .domain(visibleXDomain)
      .range([0, this.currentProps.width]);

    this.yScale = scaleLinear()
      .domain(visibleYDomain)
      .range([0, this.currentProps.height]);

    for (const uid in this.trackDefObjects) {
      const track = this.trackDefObjects[uid].trackObject;

      // e.g. when the track is resized... we want to redraw it
      track.refScalesChanged(this.xScale, this.yScale);
      // track.draw();
    }

    this.applyZoomTransform(notify);
  }

  /**
   * Get a track's viewconf definition by its object
   */
  getTrackDef(trackObjectIn) {
    const trackDefItems = dictItems(this.trackDefObjects);

    for (const [, { trackDef, trackObject }] of trackDefItems) {
      if (trackObject === trackObjectIn) {
        return trackDef.track;
      }
      if (trackDef.track.contents) {
        // this is a combined track
        for (const subTrackDef of trackDef.track.contents) {
          if (trackObject.createdTracks[subTrackDef.uid] === trackObjectIn) {
            return subTrackDef;
          }
        }
      }
    }

    return null;
  }

  /*
   * Fetch the trackObject for a track with a given ID
   */
  getTrackObject(trackId) {
    const trackDefItems = dictItems(this.trackDefObjects);

    for (let i = 0; i < trackDefItems.length; i++) {
      const uid = trackDefItems[i][0];
      const trackObject = trackDefItems[i][1].trackObject;

      if (uid === trackId) {
        return trackObject;
      }

      // maybe this track is in a combined track
      if (trackObject.createdTracks) {
        const createdTrackItems = dictItems(trackObject.createdTracks);

        for (let j = 0; j < createdTrackItems.length; j++) {
          const createdTrackUid = createdTrackItems[j][0];
          const createdTrackObject = createdTrackItems[j][1];

          if (createdTrackUid === trackId) {
            return createdTrackObject;
          }
        }
      }
    }

    return undefined;
  }

  timedUpdatePositionAndDimensions() {
    if (this.closing || !this.element) return;

    this.elementPos = this.element.getBoundingClientRect();

    if (this.dragging) {
      this.yPositionOffset =
        this.element.getBoundingClientRect().top -
        this.currentProps.canvasElement.getBoundingClientRect().top +
        this.scrollTop;
      this.xPositionOffset =
        this.element.getBoundingClientRect().left -
        this.currentProps.canvasElement.getBoundingClientRect().left;

      this.setMask();
      this.setBackground();

      const updated = this.updateTrackPositions();

      if (updated) {
        // only redraw if positions changed
        this.applyZoomTransform(true);
      }

      requestAnimationFrame(this.timedUpdatePositionAndDimensions.bind(this));
    }
  }

  syncMetaTracks(trackDefinitions) {
    const knownMetaTrackIds = Object.keys(this.metaTracks);
    const newMetaTracks = new Set(trackDefinitions.map((def) => def.uid));

    // Add new meta tracks
    this.addMetaTracks(
      trackDefinitions.filter((def) => !this.metaTracks[def.uid]),
    );

    // Update existing meta tracks
    this.updateMetaTracks(
      trackDefinitions.filter((def) => this.metaTracks[def.uid]),
    );

    // Remove old meta tracks
    this.removeMetaTracks(
      knownMetaTrackIds.filter((def) => !newMetaTracks.has(def)),
    );
  }

  syncTrackObjects(trackDefinitions) {
    /**
     * Make sure we have a track object for every passed track definition.
     *
     * If we get a track definition for which we have no Track object, we
     * create a new one.
     *
     * If we have a track object for which we have no definition, we remove
     * the object.
     *
     * All the others we ignore.
     *
     * Track definitions should be of the following form:
     *
     * { height:  100, width: 50, top: 30, left: 40, track: {...}}
     *
     * @param trackDefinitions: The definition of the track
     * @return: Nothing
     */
    this.prevTrackDefinitions = JSON.stringify(trackDefinitions);

    const receivedTracksDict = {};
    for (let i = 0; i < trackDefinitions.length; i++) {
      receivedTracksDict[trackDefinitions[i].track.uid] = trackDefinitions[i];
    }

    const knownTracks = new Set(Object.keys(this.trackDefObjects));
    const receivedTracks = new Set(Object.keys(receivedTracksDict));

    // track definitions we don't have objects for
    const enterTrackDefs = new Set(
      [...receivedTracks].filter((x) => !knownTracks.has(x)),
    );

    // track objects for which there is no definition
    // (i.e. they no longer need to exist)
    const exitTracks = new Set(
      [...knownTracks].filter((x) => !receivedTracks.has(x)),
    );

    // we already have these tracks, but need to change their dimensions
    const updateTrackDefs = new Set(
      [...receivedTracks].filter((x) => knownTracks.has(x)),
    );

    // update existing tracks
    this.updateExistingTrackDefs(
      [...updateTrackDefs].map((x) => receivedTracksDict[x]),
    );

    // add new tracks and update them (setting dimensions and positions)
    this.addNewTracks([...enterTrackDefs].map((x) => receivedTracksDict[x]));
    this.updateExistingTrackDefs(
      [...enterTrackDefs].map((x) => receivedTracksDict[x]),
    );

    this.removeTracks([...exitTracks]);
  }

  /**
   * Add new meta tracks
   *
   * @param  {Array}  metaTrackDefs  Definitions of meta tracks to be added.
   */
  addMetaTracks(metaTrackDefs) {
    metaTrackDefs
      .filter((metaTrackDef) => !this.metaTracks[metaTrackDef.uid])
      .forEach((metaTrackDef) => {
        this.metaTracks[metaTrackDef.uid] = {
          trackDef: metaTrackDef,
          trackObject: this.createMetaTrack(metaTrackDef),
        };
      });
  }

  addNewTracks(newTrackDefinitions) {
    /**
     * We need to create new track objects for the given track
     * definitions.
     */
    if (!this.currentProps.pixiStage) {
      return;
    } // we need a pixi stage to start rendering
    // the parent component where it lives probably
    // hasn't been mounted yet

    for (let i = 0; i < newTrackDefinitions.length; i++) {
      const newTrackDef = newTrackDefinitions[i];
      const newTrackObj = this.createTrackObject(newTrackDef.track);

      // newTrackObj.refXScale(this.xScale);
      // newTrackObj.refYScale(this.yScale);

      newTrackObj.refScalesChanged(this.xScale, this.yScale);

      this.trackDefObjects[newTrackDef.track.uid] = {
        trackDef: newTrackDef,
        trackObject: newTrackObj,
      };

      const zoomedXScale = this.zoomTransform.rescaleX(this.xScale);
      const zoomedYScale = this.zoomTransform.rescaleY(this.yScale);

      newTrackObj.setDimensions([newTrackDef.width, newTrackDef.height]);
      newTrackObj.zoomed(zoomedXScale, zoomedYScale);
    }

    // this could be replaced with a call that only applies the zoom
    // transform to the newly added tracks
    this.applyZoomTransform(false);
  }

  updateMetaTracks() {
    // Nothing
  }

  updateExistingTrackDefs(newTrackDefs) {
    for (let i = 0; i < newTrackDefs.length; i++) {
      this.trackDefObjects[newTrackDefs[i].track.uid].trackDef =
        newTrackDefs[i];

      // if it's a CombinedTrack, we have to see if its contents have changed
      // e.g. somebody may have added a new Series
      if (newTrackDefs[i].track.type === 'combined') {
        this.trackDefObjects[newTrackDefs[i].track.uid].trackObject
          .updateContents(
            newTrackDefs[i].track.contents,
            this.createTrackObject.bind(this),
          )
          .refScalesChanged(this.xScale, this.yScale);
      }
    }

    const updated = this.updateTrackPositions();
    // this.applyZoomTransform();
    if (updated) {
      // only redraw if positions changed
      this.applyZoomTransform(false);
    }
  }

  updateTrackPositions() {
    let updated = false;

    for (const uid in this.trackDefObjects) {
      const trackDef = this.trackDefObjects[uid].trackDef;
      const trackObject = this.trackDefObjects[uid].trackObject;

      const prevPosition = trackObject.position;
      const prevDimensions = trackObject.dimensions;

      const newPosition = [
        this.xPositionOffset + trackDef.left,
        this.yPositionOffset + trackDef.top,
      ];
      const newDimensions = [trackDef.width, trackDef.height];

      // check if any of the track's positions have changed
      // before trying to update them

      if (
        !prevPosition ||
        newPosition[0] !== prevPosition[0] ||
        newPosition[1] !== prevPosition[1]
      ) {
        trackObject.setPosition(newPosition);
        updated = true;
      }

      if (
        !prevDimensions ||
        newDimensions[0] !== prevDimensions[0] ||
        newDimensions[1] !== prevDimensions[1]
      ) {
        trackObject.setDimensions(newDimensions);
        updated = true;
      }

      // const widthDifference = trackDef.width - this.currentProps.width;
      // const heightDifference = trackDef.height - this.currentProps.height;
    }

    // report on whether any track positions or dimensions have changed
    // so that downstream code can decide whether to redraw
    return updated;
  }

  removeMetaTracks(trackIds) {
    trackIds.forEach((id) => {
      this.metaTracks[id].trackObject.remove();
      this.metaTracks[id] = undefined;
      delete this.metaTracks[id];
    });
  }

  removeTracks(trackUids) {
    for (let i = 0; i < trackUids.length; i++) {
      this.trackDefObjects[trackUids[i]].trackObject.remove();
      delete this.trackDefObjects[trackUids[i]];
    }
  }

  /**
   * Set the center of this view to a paticular X and Y coordinate
   * @param  {number}  centerX  Centeral X data? position.
   * @param  {number}  centerY  Central Y data? position.
   * @param  {number}  sourceK  Source zoom level? @Pete what's the source?
   * @param  {boolean}  notify  If `true` notify listeners that the scales
   *   have changed. This can be turned off to prevent circular updates when
   *   scales are locked.
   * @param  {boolean}  animate  If `true` transition smoothly from the
   *   current to the desired location.
   * @param  {number}  animateTime  Animation time in milliseconds. Only used
   *   when `animate` is true.
   */
  setCenter(
    centerX,
    centerY,
    sourceK,
    notify = false,
    animateTime = 0,
    xScale = this.xScale,
    yScale = this.yScale,
  ) {
    const refK = this.xScale.invert(1) - this.xScale.invert(0);

    const k = refK / sourceK;

    const middleViewX =
      this.currentProps.paddingLeft +
      this.currentProps.leftWidth +
      this.currentProps.centerWidth / 2;
    const middleViewY =
      this.currentProps.paddingTop +
      this.currentProps.topHeight +
      this.currentProps.centerHeight / 2;

    // After applying the zoom transform, the xScale of the target centerX
    // should be equal to the middle of the viewport
    // xScale(centerX) * k + translate[0] = middleViewX
    const translateX = middleViewX - xScale(centerX) * k;
    const translateY = middleViewY - yScale(centerY) * k;

    let last;

    const setZoom = () => {
      const newTransform = zoomIdentity
        .translate(translateX, translateY)
        .scale(k);

      this.zoomTransform = newTransform;
      this.emptyZoomBehavior.transform(this.elementSelection, newTransform);

      last = this.applyZoomTransform(notify);
    };

    if (animateTime) {
      let selection = this.elementSelection;

      this.activeTransitions += 1;

      if (!document.hidden) {
        // only transition if the window is hidden
        selection = selection.transition().duration(animateTime);
      }

      selection
        .call(
          this.zoomBehavior.transform,
          zoomIdentity.translate(translateX, translateY).scale(k),
        )
        .on('end', () => {
          setZoom();
          this.activeTransitions -= 1;
        });
    } else {
      setZoom();
    }

    return last;
  }

  valueScaleMove(movement) {
    // mouse wheel from zoom event
    // const cp = clientPoint(this.props.canvasElement, event.sourceEvent);
    for (const track of this.getTracksAtPosition(...this.zoomStartPos)) {
      track.movedY(movement);
    }

    this.zoomTransform = this.zoomStartTransform;
  }

  valueScaleZoom(orientation) {
    // mouse move probably from a drag event
    const mdy = event.sourceEvent.deltaY;
    const mdm = event.sourceEvent.deltaMode;

    const myWheelDelta = (dy, dm) => (dy * (dm ? 120 : 1)) / 500;
    const mwd = myWheelDelta(mdy, mdm);

    const cp = clientPoint(this.props.canvasElement, event.sourceEvent);

    for (const track of this.getTracksAtPosition(...cp)) {
      const yPos =
        orientation === '1d-horizontal'
          ? cp[1] - track.position[1]
          : cp[0] - track.position[0];
      track.zoomedY(yPos, 2 ** mwd);
    }

    // reset the zoom transform
    this.zoomTransform = this.zoomStartTransform;
  }

  /**
   * Respond to a zoom event.
   *
   * We need to update our local record of the zoom transform and apply it
   * to all the tracks.
   */
  zoomed() {
    // the orientation of the track where we started zooming
    // if it's a 1d-horizontal, then mousemove events shouldn't
    // move the center track vertically
    let trackOrientation = null;

    // see what orientation of track we're over so that we decide
    // whether to move the value scale or the position scale
    if (this.zoomStartPos) {
      const tracksAtZoomStart = this.getTracksAtPosition(...this.zoomStartPos);
      if (tracksAtZoomStart.length) {
        const trackAtZoomStart = tracksAtZoomStart[0];
        const trackDef = this.getTrackDef(trackAtZoomStart);

        if (TRACKS_INFO_BY_TYPE[trackDef.type]) {
          // some track types (like overlay-track don't have a track info)
          trackOrientation = TRACKS_INFO_BY_TYPE[trackDef.type].orientation;
        }

        if (trackAtZoomStart instanceof LeftTrackModifier) {
          // this is a LeftTrackModifier track so it's vertical
          trackOrientation = '1d-vertical';
        }
      }
    }

    if (trackOrientation && event.sourceEvent) {
      // if somebody is holding down the shift key and is zooming over
      // a 1d track, try to apply value scale zooming
      if (event.shiftKey || this.valueScaleZooming) {
        if (event.sourceEvent.deltaY !== undefined) {
          this.valueScaleZoom(trackOrientation);
          return;
        }

        if (trackOrientation === '1d-horizontal') {
          this.valueScaleMove(event.sourceEvent.movementY);
        } else if (trackOrientation === '1d-vertical') {
          this.valueScaleMove(event.sourceEvent.movementX);
        }
      }

      // if somebody is dragging along a 1d track, do value scale moving
      if (trackOrientation === '1d-horizontal' && event.sourceEvent.movementY) {
        this.valueScaleMove(event.sourceEvent.movementY);
      } else if (
        trackOrientation === '1d-vertical' &&
        event.sourceEvent.movementX
      ) {
        this.valueScaleMove(event.sourceEvent.movementX);
      }
    }

    this.zoomTransform = !this.currentProps.zoomable
      ? zoomIdentity
      : event.transform;

    const zooming = this.prevZoomTransform.k !== this.zoomTransform.k;

    // if there is dragging along a 1d track, only allow panning
    // along the axis of the track
    if (!zooming) {
      if (trackOrientation === '1d-horizontal') {
        // horizontal tracks shouldn't allow movement in the y direction
        // don't move along y axis
        this.zoomTransform = zoomIdentity
          .translate(this.zoomTransform.x, this.prevZoomTransform.y)
          .scale(this.zoomTransform.k);
      } else if (trackOrientation === '1d-vertical') {
        // vertical tracks shouldn't allow movement in the x axis
        this.zoomTransform = zoomIdentity
          .translate(this.prevZoomTransform.x, this.zoomTransform.y)
          .scale(this.zoomTransform.k);
      }

      this.element.__zoom = this.zoomTransform;
    }

    this.applyZoomTransform(true);

    this.prevZoomTransform = this.zoomTransform;
    this.props.pubSub.publish('app.zoom', event);
    if (event.sourceEvent) {
      event.sourceEvent.stopPropagation();
      event.sourceEvent.preventDefault();
    }
  }

  /**
   * Return a list of tracks under this position.
   *
   * The position should be relative to this.props.canvasElement.
   *
   * @param  {Number} x The query x position
   * @param  {Number} y The query y position
   * @return {Array}   An array of tracks at this position
   */
  getTracksAtPosition(x, y) {
    const foundTracks = [];

    let tracksToVisit = [];

    for (const uid in this.trackDefObjects) {
      const track = this.trackDefObjects[uid].trackObject;

      if (track.childTracks) {
        tracksToVisit = tracksToVisit.concat(track.childTracks);
      } else {
        tracksToVisit.push(track);
      }
    }

    for (const track of tracksToVisit) {
      const withinX =
        track.position[0] <= x && x <= track.position[0] + track.dimensions[0];
      const withinY =
        track.position[1] <= y && y <= track.position[1] + track.dimensions[1];

      if (withinX && withinY) {
        foundTracks.push(track);
      }
    }

    return foundTracks;
  }

  zoomStarted() {
    this.zooming = true;

    if (event.sourceEvent) {
      this.zoomStartPos = clientPoint(
        this.props.canvasElement,
        event.sourceEvent,
      );

      if (event.sourceEvent.shiftKey) {
        this.valueScaleZooming = true;
      }
    }

    // store the current transform because we'll need to
    // revert it if this turns out to be a value scale zoom
    this.zoomStartTransform = this.zoomTransform;
    this.props.pubSub.publish('app.zoomStart');
  }

  zoomEnded() {
    this.zooming = false;

    this.zoomStartPos = null;

    if (this.valueScaleZooming) {
      this.valueScaleZooming = false;
      this.element.__zoom = this.zoomStartTransform;
    }

    this.props.pubSub.publish('app.zoomEnd');
  }

  applyZoomTransform(notify = true) {
    const props = this.currentProps;
    const paddingleft = props.paddingLeft + props.leftWidth;
    const paddingTop = props.paddingTop + props.topHeight;

    // These props are apparently used elsewhere, for example the context menu
    this.zoomedXScale = this.zoomTransform.rescaleX(this.xScale);
    this.zoomedYScale = this.zoomTransform.rescaleY(this.yScale);

    const newXScale = scaleLinear()
      .domain(
        [paddingleft, paddingleft + props.centerWidth].map(
          this.zoomedXScale.invert,
        ),
      )
      .range([0, props.centerWidth]);

    const newYScale = scaleLinear()
      .domain(
        [paddingTop, paddingTop + props.centerHeight].map(
          this.zoomedYScale.invert,
        ),
      )
      .range([0, props.centerHeight]);

    for (const uid in this.trackDefObjects) {
      const track = this.trackDefObjects[uid].trackObject;
      const trackDef = this.trackDefObjects[uid].trackDef;

      let orientation = 'unknown';

      if (TRACKS_INFO_BY_TYPE[trackDef.track.type]) {
        orientation = TRACKS_INFO_BY_TYPE[trackDef.track.type].orientation;
      }

      if (orientation === 'whole') {
        // whole tracks need different scales which go beyond the ends of
        // center track and encompass the whole view
        const trackXScale = scaleLinear()
          .domain(
            [props.paddingLeft, props.width - props.paddingLeft].map(
              this.zoomedXScale.invert,
            ),
          )
          .range([0, props.width - 2 * props.paddingLeft]);

        const trackYScale = scaleLinear()
          .domain(
            [props.paddingTop, props.height - props.paddingTop].map(
              this.zoomedYScale.invert,
            ),
          )
          .range([0, props.height - 2 * props.paddingTop]);

        track.zoomed(trackXScale, trackYScale);
        continue;
      }

      if (this.trackDefObjects[uid].trackDef.track.position === 'gallery') {
        // gallery tracks need different scales which go beyond the ends of
        // center track and encompass the center view plus the gallery's width

        const trackXScale = scaleLinear()
          .domain(
            [
              props.paddingLeft + props.leftWidthNoGallery,
              props.paddingLeft +
                props.leftWidth +
                props.centerWidth +
                props.galleryDim,
            ].map(this.zoomedXScale.invert),
          )
          .range([0, props.centerWidth + 2 * props.galleryDim]);

        const trackYScale = scaleLinear()
          .domain(
            [
              props.paddingTop + props.topHeightNoGallery,
              props.paddingTop +
                props.topHeight +
                props.centerHeight +
                props.galleryDim,
            ].map(this.zoomedYScale.invert),
          )
          .range([0, props.centerHeight - 2 * props.galleryDim]);

        track.zoomed(
          trackXScale.copy(),
          trackYScale.copy(),
          this.zoomTransform.k,
        );
        continue;
      }

      track.zoomed(
        newXScale.copy(),
        newYScale.copy(),
        this.zoomTransform.k,
        this.zoomTransform.x + this.xPositionOffset,
        this.zoomTransform.y + this.yPositionOffset,
        props.paddingLeft + props.leftWidth,
        props.paddingTop + props.topHeight,
      );
    }

    this.currentXScale = newXScale;
    this.currentYScale = newYScale;

    if (notify) {
      this.currentProps.onScalesChanged(newXScale, newYScale);
    }

    return [newXScale, newYScale];
  }

  createMetaTrack(track) {
    switch (track.type) {
      default: {
        // Check if a plugin track is available
        const pluginTrack = this.props.pluginTracks[track.type];

        if (pluginTrack && pluginTrack.isMetaTrack) {
          const context = {
            getTrackObject: this.getTrackObject.bind(this),
            onNewTilesLoaded: () => {
              this.currentProps.onNewTilesLoaded(track.uid);
            },
            definition: track,
          };
          try {
            return new pluginTrack.track( // eslint-disable-line new-cap
              AVAILABLE_FOR_PLUGINS,
              context,
              track.options,
            );
          } catch (e) {
            console.error(
              'Plugin meta track',
              track.type,
              'failed to instantiate.',
              e,
            );
          }
        }

        console.warn(`Unknown meta track of type: ${track.type}`);
        return new UnknownPixiTrack(
          this.pStage,
          { name: 'Unknown Track Type', type: track.type },
          () => this.currentProps.onNewTilesLoaded(track.uid),
        );
      }
    }
  }

  createTrackObject(track) {
    const trackObject = this.createLocationAgnosticTrackObject(track);
    if (track.position === 'left' || track.position === 'right') {
      if (TRACKS_INFO_BY_TYPE[track.type].orientation === '1d-horizontal') {
        return new LeftTrackModifier(trackObject);
      }
    }
    return trackObject;
  }

  createLocationAgnosticTrackObject(track) {
    const handleTilesetInfoReceived = (x) => {
      this.currentProps.onTilesetInfoReceived(track.uid, x);
    };

    // See if this track has a data config section.
    // If it doesn't, we assume that it has the standard
    // server / tilesetUid sections
    // if the track has no data server, then this will just
    // be blank and we can go on our merry way
    let dataConfig = track.data;
    if (!dataConfig) {
      dataConfig = {
        server: trimTrailingSlash(track.server),
        tilesetUid: track.tilesetUid,
      };
    }

    if (track.coordSystem) {
      dataConfig.coordSystem = track.coordSystem;
    }

    const dataFetcher = getDataFetcher(
      dataConfig,
      this.props.pubSub,
      this.props.pluginDataFetchers,
    );

    // To simplify the context creation via ES6 object shortcuts.
    const context = {
      id: track.uid,
      viewUid: this.viewUid,
      pubSub: this.props.pubSub,
      scene: this.pStage,
      dataConfig,
      dataFetcher,
      getLockGroupExtrema: () => {
        return this.currentProps.getLockGroupExtrema(track.uid);
      },
      handleTilesetInfoReceived,
      animate: () => {
        this.currentProps.onNewTilesLoaded(track.uid);
      },
      svgElement: this.svgElement,
      isValueScaleLocked: () => {
        return this.currentProps.isValueScaleLocked(track.uid);
      },
      onValueScaleChanged: () => {
        this.currentProps.onValueScaleChanged(track.uid);
      },
      onTrackOptionsChanged: (newOptions) => {
        this.currentProps.onTrackOptionsChanged(track.uid, newOptions);
      },
      onMouseMoveZoom: this.props.onMouseMoveZoom,
      chromInfoPath: track.chromInfoPath,
      isShowGlobalMousePosition: () => this.props.isShowGlobalMousePosition,
      getTheme: () => this.props.theme,
    };

    // for horizontal and vertical rules
    if (track.y) {
      context.yPosition = track.y;
    }

    if (track.x) {
      context.xPosition = track.x;
    }

    // for viewport-projection-horizontal and viewport-projection-center
    if (track.projectionXDomain) {
      context.projectionXDomain = track.projectionXDomain;
    }

    // for viewport-projection-vertical and viewport-projection-center
    if (track.projectionYDomain) {
      context.projectionYDomain = track.projectionYDomain;
    }

    const options = track.options;

    switch (track.type) {
      case 'left-axis':
        return new LeftAxisTrack(context, options);

      case 'top-axis':
        return new TopAxisTrack(context, options);

      case 'heatmap':
        return new HeatmapTiledPixiTrack(context, options);

      case 'multivec':
      case 'vector-heatmap':
      case 'horizontal-multivec': // legacy, included for backwards compatiblity
      case 'horizontal-vector-heatmap': // legacy, included for backwards compatiblity
      case 'vertical-multivec': // legacy, included for backwards compatiblity
      case 'vertical-vector-heatmap': // legacy, included for backwards compatiblity
        return new HorizontalMultivecTrack(context, options);

      case '1d-heatmap':
      case 'horizontal-1d-heatmap': // legacy, included for backwards compatiblity
      case 'vertical-1d-heatmap': // legacy, included for backwards compatiblity
        return new Horizontal1dHeatmapTrack(context, options);

      case 'line':
      case 'horizontal-line': // legacy, included for backwards compatiblity
      case 'vertical-line': // legacy, included for backwards compatiblity
        return new HorizontalLine1DPixiTrack(context, options);

      case 'point':
      case 'horizontal-point': // legacy, included for backwards compatiblity
      case 'vertical-point': // legacy, included for backwards compatiblity
        return new HorizontalPoint1DPixiTrack(context, options);

      case 'bar':
      case 'horizontal-bar': // legacy, included for backwards compatiblity
      case 'vertical-bar': // legacy, included for backwards compatiblity
        return new BarTrack(context, options);

      case 'divergent-bar':
      case 'horizontal-divergent-bar': // legacy, included for backwards compatiblity
      case 'vertical-divergent-bar': // legacy, included for backwards compatiblity
        return new DivergentBarTrack(context, options);

      case 'horizontal-1d-tiles':
        return new IdHorizontal1DTiledPixiTrack(context, options);

      case 'vertical-1d-tiles':
        return new IdVertical1DTiledPixiTrack(context, options);

      case '2d-tiles':
        return new Id2DTiledPixiTrack(context, options);

      case 'stacked-interval':
      case 'top-stacked-interval': // legacy, included for backwards compatiblity
      case 'left-stacked-interval': // legacy, included for backwards compatiblity
        return new CNVIntervalTrack(context, options);

      case 'viewport-projection-center':
        // TODO: Fix this so that these functions are defined somewhere else
        if (
          track.registerViewportChanged &&
          track.removeViewportChanged &&
          track.setDomainsCallback
        ) {
          context.registerViewportChanged = track.registerViewportChanged;
          context.removeViewportChanged = track.removeViewportChanged;
          context.setDomainsCallback = track.setDomainsCallback;
          return new ViewportTracker2D(context, options);
        }
        return new Track(context, options);

      case 'viewport-projection-horizontal':
        // TODO: Fix this so that these functions are defined somewhere else
        if (
          track.registerViewportChanged &&
          track.removeViewportChanged &&
          track.setDomainsCallback
        ) {
          context.registerViewportChanged = track.registerViewportChanged;
          context.removeViewportChanged = track.removeViewportChanged;
          context.setDomainsCallback = track.setDomainsCallback;
          return new ViewportTrackerHorizontal(context, options);
        }
        return new Track(context, options);

      case 'viewport-projection-vertical':
        // TODO: Fix this so that these functions are defined somewhere else
        if (
          track.registerViewportChanged &&
          track.removeViewportChanged &&
          track.setDomainsCallback
        ) {
          context.registerViewportChanged = track.registerViewportChanged;
          context.removeViewportChanged = track.removeViewportChanged;
          context.setDomainsCallback = track.setDomainsCallback;
          return new ViewportTrackerVertical(context, options);
        }
        return new Track(context, options);

      case 'gene-annotations':
      case 'horizontal-gene-annotations': // legacy, included for backwards compatiblity
      case 'vertical-gene-annotations': // legacy, included for backwards compatiblity
        return new HorizontalGeneAnnotationsTrack(context, options);

      case '2d-rectangle-domains':
      case 'arrowhead-domains':
        return new ArrowheadDomainsTrack(context, options);

      case 'horizontal-1d-annotations':
        return new Annotations1dTrack(context, options);

      case 'vertical-1d-annotations':
        // Fix this: LeftTrackModifier is doing a whole bunch of things not
        // needed by this track but the current setup is not consistent.
        return new Annotations1dTrack(context, options, true);

      case '2d-annotations':
        return new Annotations2dTrack(context, options);

      case 'linear-2d-rectangle-domains':
      case 'horizontal-2d-rectangle-domains': // legacy, included for backwards compatiblity
      case 'vertical-2d-rectangle-domains': // legacy, included for backwards compatiblity
        return new Horizontal2DDomainsTrack(context, options);

      case 'square-markers':
        return new SquareMarkersTrack(context, options);

      case 'combined':
        context.tracks = track.contents;
        context.createTrackObject = this.createTrackObject.bind(this);
        return new CombinedTrack(context, options);

      case '2d-chromosome-labels':
        return new Chromosome2DLabels(context, options);

      case 'horizontal-chromosome-grid':
        context.orientation = '1d-horizontal';
        return new ChromosomeGrid(context, options);

      case 'vertical-chromosome-grid':
        context.orientation = '1d-vertical';
        return new ChromosomeGrid(context, options);

      case '2d-chromosome-grid':
        return new ChromosomeGrid(context, options);

      case 'chromosome-labels':
      case 'horizontal-chromosome-labels': // legacy, included for backwards compatiblity
      case 'vertical-chromosome-labels': // legacy, included for backwards compatiblity
        // chromInfoPath is passed in for backwards compatibility
        // it can be used to provide custom chromosome sizes
        return new HorizontalChromosomeLabels(context, options);

      case 'linear-heatmap':
      case 'horizontal-heatmap': // legacy, included for backwards compatiblity
      case 'vertical-heatmap': // legacy, included for backwards compatiblity
        return new HorizontalHeatmapTrack(context, options);

      case '2d-chromosome-annotations':
        return new Chromosome2DAnnotations(context, options);

      case '1d-value-interval':
      case 'horizontal-1d-value-interval': // legacy, included for backwards compatiblity
      case 'vertical-1d-value-interval': // legacy, included for backwards compatiblity
        return new ValueIntervalTrack(context, options);

      case 'osm':
      case 'osm-tiles':
        return new OSMTilesTrack(context, options);

      case 'osm-2d-tile-ids':
        return new OSMTileIdsTrack(context, options);

      case 'mapbox':
      case 'mapbox-tiles':
        return new MapboxTilesTrack(context, options);

      case 'raster-tiles':
        return new RasterTilesTrack(context, options);

      case 'bedlike':
      case 'vertical-bedlike': // legacy, included for backwards compatiblity
        return new BedLikeTrack(context, options);

      case 'overlay-track':
        return new OverlayTrack(context, options);

      case 'overlay-chromosome-grid-track':
        context.isOverlay = true;
        return new ChromosomeGrid(context, options);

      case 'horizontal-rule':
        return new HorizontalRule(context, options);

      case 'vertical-rule':
        return new VerticalRule(context, options);

      case 'cross-rule':
        // This needs to be harmonized.
        context.x = track.x;
        context.y = track.y;
        return new CrossRule(context, options);

      case 'simple-svg':
        return new SVGTrack(context, options);
      case 'empty':
        return new PixiTrack(context, options);

      default: {
        // Check if a plugin track is available
        const pluginTrack = this.props.pluginTracks[track.type];

        if (pluginTrack && !pluginTrack.isMetaTrack) {
          context.AVAILABLE_FOR_PLUGINS = AVAILABLE_FOR_PLUGINS;
          context.baseEl = this.baseEl;
          context.definition = track;

          if (
            track.registerViewportChanged &&
            track.removeViewportChanged &&
            track.setDomainsCallback
          ) {
            context.registerViewportChanged = track.registerViewportChanged;
            context.removeViewportChanged = track.removeViewportChanged;
            context.setDomainsCallback = track.setDomainsCallback;
          }

          try {
            return new pluginTrack.track( // eslint-disable-line new-cap
              AVAILABLE_FOR_PLUGINS,
              context,
              options,
            );
          } catch (e) {
            console.error(
              'Plugin track',
              track.type,
              'failed to instantiate.',
              e,
            );
          }
        }

        console.warn('Unknown track type:', track.type);

        return new UnknownPixiTrack(context, {
          name: 'Unknown Track Type',
          type: track.type,
        });
      }
    }
  }

  /**
   * Zoom to a location given the data coordinates
   * @param   {number}  dataXStart  Data start X coordinate.
   * @param   {number}  dataXEnd  Data end X coordinate.
   * @param   {number}  dataYStart  Data start Y coordinate.
   * @param   {number}  dataYEnd  Data end Y coordinate.
   * @param   {number}  animateTime  Animation time in milliseconds.
   * @param   {function}  projector  If not `null` a projector function that
   *   provides adjusted x and y scales.
   */
  zoomToDataPos(
    dataXStart,
    dataXEnd,
    dataYStart,
    dataYEnd,
    animateTime = 3000,
    projector = null,
  ) {
    const [centerX, centerY, k] = scalesCenterAndK(
      this.xScale.copy().domain([dataXStart, dataXEnd]),
      this.yScale.copy().domain([dataYStart, dataYEnd]),
    );

    const projectedScales = projector
      ? projector(this.xScale, this.yScale)
      : [this.xScale, this.yScale];

    this.setCenter(
      centerX,
      centerY,
      k,
      false,
      animateTime,
      projectedScales[0],
      projectedScales[1],
    );
  }

  forwardContextMenu(e) {
    // Do never forward the contextmenu event when ALT is being hold down.
    if (this.props.disableTrackMenu || e.altKey) return;

    e.preventDefault();

    setTimeout(() => {
      // For right clicks only. Publish the contextmenu event
      this.props.pubSub.publish('contextmenu', e);
    }, 0);
  }

  addEventTracker() {
    if (!this.eventTracker || this.eventTracker === this.eventTrackerOld)
      return;
    if (!this.eventTrackerOld) this.eventTrackerOld = this.eventTracker;

    this.eventTracker = this.eventTrackerOld;

    this.eventTracker.addEventListener('click', this.boundForwardEvent);
    this.eventTracker.addEventListener(
      'contextmenu',
      this.boundForwardContextMenu,
    );
    this.eventTracker.addEventListener('dblclick', this.boundForwardEvent);
    this.eventTracker.addEventListener('wheel', this.boundForwardEvent);
    this.eventTracker.addEventListener('dragstart', this.boundForwardEvent);
    this.eventTracker.addEventListener('selectstart', this.boundForwardEvent);

    this.eventTracker.addEventListener('mouseover', this.boundForwardEvent);
    this.eventTracker.addEventListener('mouseenter', this.boundForwardEvent);
    this.eventTracker.addEventListener('mousedown', this.boundForwardEvent);
    this.eventTracker.addEventListener('mouseup', this.boundForwardEvent);
    this.eventTracker.addEventListener('mouseout', this.boundForwardEvent);
    this.eventTracker.addEventListener('mouseleave', this.boundForwardEvent);

    this.eventTracker.addEventListener('touchstart', this.boundForwardEvent);
    this.eventTracker.addEventListener('touchend', this.boundForwardEvent);
    this.eventTracker.addEventListener('touchmove', this.boundForwardEvent);
    this.eventTracker.addEventListener('touchcancel', this.boundForwardEvent);

    this.eventTracker.addEventListener('pointerover', this.boundForwardEvent);
    this.eventTracker.addEventListener('pointerenter', this.boundForwardEvent);
    this.eventTracker.addEventListener('pointerdown', this.boundForwardEvent);
    this.eventTracker.addEventListener('pointerup', this.boundForwardEvent);
    this.eventTracker.addEventListener('pointercancel', this.boundForwardEvent);
    this.eventTracker.addEventListener('pointerout', this.boundForwardEvent);
    this.eventTracker.addEventListener('pointerleave', this.boundForwardEvent);

    window.addEventListener('scroll', this.boundScrollEvent);
  }

  removeEventTracker() {
    if (!this.eventTracker) return;

    this.eventTracker.removeEventListener('click', this.boundForwardEvent);
    this.eventTracker.removeEventListener(
      'contextmenu',
      this.boundForwardContextMenu,
    );
    this.eventTracker.removeEventListener('dblclick', this.boundForwardEvent);
    this.eventTracker.removeEventListener('wheel', this.boundForwardEvent);
    this.eventTracker.removeEventListener('dragstart', this.boundForwardEvent);
    this.eventTracker.removeEventListener(
      'selectstart',
      this.boundForwardEvent,
    );

    this.eventTracker.removeEventListener('mouseover', this.boundForwardEvent);
    this.eventTracker.removeEventListener('mouseenter', this.boundForwardEvent);
    this.eventTracker.removeEventListener('mousedown', this.boundForwardEvent);
    this.eventTracker.removeEventListener('mouseup', this.boundForwardEvent);
    this.eventTracker.removeEventListener('mouseout', this.boundForwardEvent);
    this.eventTracker.removeEventListener('mouseleave', this.boundForwardEvent);

    this.eventTracker.removeEventListener('touchstart', this.boundForwardEvent);
    this.eventTracker.removeEventListener('touchend', this.boundForwardEvent);
    this.eventTracker.removeEventListener(
      'touchcancel',
      this.boundForwardEvent,
    );

    this.eventTracker.removeEventListener(
      'pointerover',
      this.boundForwardEvent,
    );
    this.eventTracker.removeEventListener(
      'pointerenter',
      this.boundForwardEvent,
    );
    this.eventTracker.removeEventListener(
      'pointerdown',
      this.boundForwardEvent,
    );
    this.eventTracker.removeEventListener('pointerup', this.boundForwardEvent);
    this.eventTracker.removeEventListener(
      'pointercancel',
      this.boundForwardEvent,
    );
    this.eventTracker.removeEventListener('pointerout', this.boundForwardEvent);
    this.eventTracker.removeEventListener(
      'pointerleave',
      this.boundForwardEvent,
    );

    window.removeEventListener('scroll', this.boundScrollEvent);
  }

  scrollEvent() {
    this.elementPos = this.element.getBoundingClientRect();
  }

  forwardEvent(e) {
    e.sourceUid = this.uid;
    e.forwarded = true;
    this.props.pubSub.publish('app.event', e);
  }

  onScrollHandler(scrollTop) {
    this.scrollTop = scrollTop;
  }

  /* ------------------------------- Render ------------------------------- */

  render() {
    return (
      <div
        ref={(c) => {
          this.baseEl = c;
        }}
        className="track-renderer-div"
        style={{
          height: this.currentProps.height,
          width: this.currentProps.width,
        }}
        styleName="track-renderer"
      >
        <div
          ref={(c) => {
            this.element = c;
          }}
          className="track-renderer-element"
          styleName="track-renderer-element"
        />
        <div
          ref={(c) => {
            this.eventTracker = c;
          }}
          className="track-renderer-events"
          styleName="track-renderer-events"
        >
          {this.currentProps.children}
        </div>
      </div>
    );
  }
}

TrackRenderer.defaultProps = {
  pluginDataFetchers: {},
  pluginTracks: {},
  canvasElement: null,
  centerHeight: 0,
  centerWidth: 0,
  children: [],
  galleryDim: 0,
  height: 0,
  initialXDomain: [],
  initialYDomain: [],
  isShowGlobalMousePosition: false,
  isRangeSelection: false,
  leftWidth: 0,
  leftWidthNoGallery: 0,
  paddingLeft: 0,
  paddingTop: 0,
  positionedTracks: [],
  topHeight: 0,
  topHeightNoGallery: 0,
  width: 0,
  metaTracks: [],
};

TrackRenderer.propTypes = {
  canvasElement: PropTypes.object,
  centerHeight: PropTypes.number,
  centerWidth: PropTypes.number,
  children: PropTypes.array,
  disableTrackMenu: PropTypes.bool,
  galleryDim: PropTypes.number,
  height: PropTypes.number,
  initialXDomain: PropTypes.array,
  initialYDomain: PropTypes.array,
  isShowGlobalMousePosition: PropTypes.bool,
  isRangeSelection: PropTypes.bool,
  leftWidth: PropTypes.number,
  leftWidthNoGallery: PropTypes.number,
  paddingLeft: PropTypes.number,
  paddingTop: PropTypes.number,
  metaTracks: PropTypes.array,
  onMouseMoveZoom: PropTypes.func,
  onNewTilesLoaded: PropTypes.func.isRequired,
  onScalesChanged: PropTypes.func.isRequired,
  pixiRenderer: PropTypes.object.isRequired,
  pixiStage: PropTypes.object.isRequired,
  pluginDataFetchers: PropTypes.object,
  pluginTracks: PropTypes.object,
  positionedTracks: PropTypes.array,
  pubSub: PropTypes.object.isRequired,
  setCentersFunction: PropTypes.func,
  svgElement: PropTypes.object.isRequired,
  theme: PropTypes.symbol.isRequired,
  topHeight: PropTypes.number,
  topHeightNoGallery: PropTypes.number,
  viewOptions: PropTypes.object,
  width: PropTypes.number,
  xDomainLimits: PropTypes.array,
  yDomainLimits: PropTypes.array,
  valueScaleZoom: PropTypes.bool,
  zoomable: PropTypes.bool.isRequired,
  zoomDomain: PropTypes.array,
};

export default withPubSub(withTheme(TrackRenderer));
