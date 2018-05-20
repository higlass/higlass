import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import * as PIXI from 'pixi.js';

import { zoom, zoomIdentity } from 'd3-zoom';
import { select, event } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import slugid from 'slugid';

import HeatmapTiledPixiTrack from './HeatmapTiledPixiTrack';
import Id2DTiledPixiTrack from './Id2DTiledPixiTrack';
import IdHorizontal1DTiledPixiTrack from './IdHorizontal1DTiledPixiTrack';
import IdVertical1DTiledPixiTrack from './IdVertical1DTiledPixiTrack';
import TopAxisTrack from './TopAxisTrack';
import LeftAxisTrack from './LeftAxisTrack';
import CombinedTrack from './CombinedTrack';
import BedLikeTrack from './BedLikeTrack';

import HorizontalLine1DPixiTrack from './HorizontalLine1DPixiTrack';
import HorizontalPoint1DPixiTrack from './HorizontalPoint1DPixiTrack';
import HorizontalMultivecTrack from './HorizontalMultivecTrack';
import BarTrack from './BarTrack';
import DivergentBarTrack from './DivergentBarTrack';

import CNVIntervalTrack from './CNVIntervalTrack';
import LeftTrackModifier from './LeftTrackModifier';
import Track from './Track';
import HorizontalGeneAnnotationsTrack from './HorizontalGeneAnnotationsTrack';
import ArrowheadDomainsTrack from './ArrowheadDomainsTrack';
import Annotations2dTrack from './Annotations2dTrack';

import Horizontal2DDomainsTrack from './Horizontal2DDomainsTrack';

import SquareMarkersTrack from './SquareMarkersTrack';
import Chromosome2DLabels from './Chromosome2DLabels';
import Chromosome2DGrid from './Chromosome2DGrid';
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
import MapboxTilesTrack from './MapboxTilesTrack';

// Utils
import {
  colorToHex,
  dictItems,
  forwardEvent,
  scalesCenterAndK,
  trimTrailingSlash,
} from './utils';

// Services
import { pubSub } from './services';

// Configs
import {
  AVAILABLE_FOR_PLUGINS
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

    this.scrollTimeout = null;
    this.activeTransitions = 0;

    this.zoomTransform = zoomIdentity;
    this.windowScrolledBound = this.windowScrolled.bind(this);
    this.zoomStartedBound = this.zoomStarted.bind(this);
    this.zoomedBound = this.zoomed.bind(this);
    this.zoomEndedBound = this.zoomEnded.bind(this);

    this.uid = slugid.nice();

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

    this.prevCenterX = (
      this.currentProps.marginLeft +
      this.currentProps.leftWidth +
      (this.currentProps.centerWidth / 2)
    );
    this.prevCenterY = (
      this.currentProps.marginTop +
      this.currentProps.topHeight +
      (this.currentProps.centerHeight / 2)
    );

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
  }

  componentWillMount() {
    this.pubSubs = [];
    this.pubSubs.push(
      pubSub.subscribe('scroll', this.windowScrolledBound),
    );
    this.pubSubs.push(
      pubSub.subscribe('app.event', this.dispatchEvent.bind(this)),
    );
    this.pubSubs.push(
      pubSub.subscribe('zoomToDataPos', this.zoomToDataPosHandler.bind(this)),
    );
  }

  componentDidMount() {
    this.elementPos = this.element.getBoundingClientRect();
    this.elementSelection = select(this.element);
    this.svgTrackAreaSelection = select(this.svgTrackArea);

    this.pStage = new PIXI.Graphics();
    this.pMask = new PIXI.Graphics();
    this.pBackground = new PIXI.Graphics();

    this.pStage.addChild(this.pMask);
    this.pStage.addChild(this.pBackground);

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
    this.currentProps.registerDraggingChangedListener(this.draggingChanged.bind(this));

    this.draggingChanged(true);
    this.addEventTracker();

    // Init zoom and scale extent
    const transExt = [
      [this.xScale(this.xDomainLimits[0]), this.yScale(this.yDomainLimits[0])],
      [this.xScale(this.xDomainLimits[1]), this.yScale(this.yDomainLimits[1])]
    ];

    const svgBBox = this.svgElement.getBoundingClientRect();

    const ext = [
      [Math.max(transExt[0][0], 0), Math.max(transExt[0][1], 0)],
      [Math.min(transExt[1][0], svgBBox.width), Math.min(transExt[1][1], svgBBox.height)],
    ];

    this.zoomBehavior
      .extent(ext)
      .translateExtent(transExt)
      .scaleExtent(this.zoomLimits);
  }

  componentWillReceiveProps(nextProps) {
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
    this.currentProps.canvasElement = ReactDOM.findDOMNode(nextProps.canvasElement);

    this.svgElement = nextProps.svgElement;

    const transExt = [
      [this.xScale(this.xDomainLimits[0]), this.yScale(this.yDomainLimits[0])],
      [this.xScale(this.xDomainLimits[1]), this.yScale(this.yDomainLimits[1])]
    ];

    const svgBBox = this.svgElement.getBoundingClientRect();

    const ext = [
      [Math.max(transExt[0][0], 0), Math.max(transExt[0][1], 0)],
      [Math.min(transExt[1][0], svgBBox.width), Math.min(transExt[1][1], svgBBox.height)],
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
    if (prevProps.isRangeSelection !== this.props.isRangeSelection) {
      if (this.props.isRangeSelection) {
        this.removeZoom();
      } else {
        this.addZoom();
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

    this.pubSubs.forEach(subscription => pubSub.unsubscribe(subscription));
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

    if (this.isWithin(e.clientX, e.clientY)) {
      if (e.type !== 'contextmenu') forwardEvent(e, this.element);
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


    const withinX = (
      x >= this.elementPos.left
      && x <= this.elementPos.width + this.elementPos.left
    );
    const withinY = (
      y >= this.elementPos.top
      && y <= this.elementPos.height + this.elementPos.top
    );
    return withinX && withinY;
  }

  zoomToDataPosHandler({ pos, animateTime, isMercator }) {
    this.zoomToDataPos(...pos, animateTime, isMercator);
  }

  addZoom() {
    if (!this.elementSelection) return;

    // add back the previous transform
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
      this.currentProps.height
    );
    this.pMask.endFill();
  }

  setBackground() {
    let backgroundColor = (this.currentProps.viewOptions && this.currentProps.viewOptions.backgroundColor) || 'white';
    backgroundColor = colorToHex(backgroundColor);

    this.pBackground.clear();
    this.pBackground.beginFill(backgroundColor);
    this.pBackground.drawRect(
      this.xPositionOffset,
      this.yPositionOffset,
      this.currentProps.width,
      this.currentProps.height
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
    initialYDomain[0] = yCenter - (xWidth / 2);
    initialYDomain[1] = yCenter + (xWidth / 2);

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
    ) return;

    // only update the initial domain
    this.initialXDomain = initialXDomain;
    this.initialYDomain = initialYDomain;
    this.xDomainLimits = xDomainLimits;
    this.yDomainLimits = yDomainLimits;
    this.zoomLimits = zoomLimits;

    this.cumCenterYOffset = 0;
    this.cumCenterXOffset = 0;

    this.drawableToDomainX = scaleLinear()
      .domain([
        this.currentProps.marginLeft + this.currentProps.leftWidth,
        this.currentProps.marginLeft + this.currentProps.leftWidth + this.currentProps.centerWidth,
      ])
      .range([initialXDomain[0], initialXDomain[1]]);

    this.drawableToDomainY = scaleLinear()
      .domain([
        (
          this.currentProps.marginTop +
          this.currentProps.topHeight +
          (this.currentProps.centerHeight / 2) -
          (this.currentProps.centerWidth / 2)
        ),
        (
          this.currentProps.marginTop +
          this.currentProps.topHeight +
          (this.currentProps.centerHeight / 2) +
          (this.currentProps.centerWidth / 2)
        ),
      ])
      .range([initialYDomain[0], initialYDomain[1]]);

    this.prevCenterX = (
      this.currentProps.marginLeft +
      this.currentProps.leftWidth +
      (this.currentProps.centerWidth / 2)
    );
    this.prevCenterY = (
      this.currentProps.marginTop +
      this.currentProps.topHeight +
      (this.currentProps.centerHeight / 2)
    );
  }

  updatablePropsToString(props) {
    return JSON.stringify({
      positionedTracks: props.positionedTracks,
      initialXDomain: props.initialXDomain,
      initialYDomain: props.initialYDomain,
      width: props.width,
      height: props.height,
      marginLeft: props.marginLeft,
      marginRight: props.marginRight,
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
    const currentCenterX = (
      this.currentProps.marginLeft
      + this.currentProps.leftWidth
      + (this.currentProps.centerWidth / 2)
    );
    const currentCenterY = (
      this.currentProps.marginTop
      + this.currentProps.topHeight
      + (this.currentProps.centerHeight / 2)
    );

    // we need to maintain two scales:
    // 1. the scale that is shown
    // 2. the scale that the zooming behavior acts on
    //
    // These need to be separated because the zoom behavior acts on a larger
    // region than the visible scale shows

    // if the window is resized, we don't want to change the scale, but we do
    // want to move the center point. this needs to be tempered by the zoom
    // factor so that we keep the visible center point in the center
    const centerDomainXOffset = (
      (
        this.drawableToDomainX(currentCenterX)
        - this.drawableToDomainX(this.prevCenterX)
      ) / this.zoomTransform.k
    );
    const centerDomainYOffset = (
      (
        this.drawableToDomainY(currentCenterY)
        - this.drawableToDomainY(this.prevCenterY)
      ) / this.zoomTransform.k
    );

    this.cumCenterYOffset += centerDomainYOffset;
    this.cumCenterXOffset += centerDomainXOffset;

    this.prevCenterY = currentCenterY;
    this.prevCenterX = currentCenterX;

    // the domain of the visible (not drawable area)
    const visibleXDomain = [
      this.drawableToDomainX(0) - this.cumCenterXOffset,
      this.drawableToDomainX(this.currentProps.width) - this.cumCenterXOffset
    ];
    const visibleYDomain = [
      this.drawableToDomainY(0) - this.cumCenterYOffset,
      this.drawableToDomainY(this.currentProps.height) - this.cumCenterYOffset
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

      // track.refXScale(this.xScale);
      // track.refYScale(this.yScale);

      // e.g. when the track is resized... we want to redraw it
      track.refScalesChanged(this.xScale, this.yScale);
      // track.draw();
    }

    this.applyZoomTransform(notify);
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
      this.yPositionOffset = (
        this.element.getBoundingClientRect().top -
        this.currentProps.canvasElement.getBoundingClientRect().top
      );
      this.xPositionOffset = (
        this.element.getBoundingClientRect().left -
        this.currentProps.canvasElement.getBoundingClientRect().left
      );

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
    const newMetaTracks = new Set(trackDefinitions.map(def => def.uid));

    // Add new meta tracks
    this.addMetaTracks(
      trackDefinitions.filter(def => !this.metaTracks[def.uid])
    );

    // Update existing meta tracks
    this.updateMetaTracks(
      trackDefinitions.filter(def => this.metaTracks[def.uid])
    );

    // Remove old meta tracks
    this.removeMetaTracks(
      knownMetaTrackIds.filter(def => !newMetaTracks.has(def))
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
    const enterTrackDefs = new Set([...receivedTracks]
      .filter(x => !knownTracks.has(x)));

    // track objects for which there is no definition
    // (i.e. they no longer need to exist)
    const exitTracks = new Set([...knownTracks]
      .filter(x => !receivedTracks.has(x)));


    // we already have these tracks, but need to change their dimensions
    const updateTrackDefs = new Set([...receivedTracks]
      .filter(x => knownTracks.has(x)));

    // update existing tracks
    this.updateExistingTrackDefs([...updateTrackDefs].map(x => receivedTracksDict[x]));

    // add new tracks and update them (setting dimensions and positions)
    this.addNewTracks([...enterTrackDefs].map(x => receivedTracksDict[x]));
    this.updateExistingTrackDefs([...enterTrackDefs].map(x => receivedTracksDict[x]));

    this.removeTracks([...exitTracks]);
  }

  /**
   * Add new meta tracks
   *
   * @param  {Array}  metaTrackDefs  Definitions of meta tracks to be added.
   */
  addMetaTracks(metaTrackDefs) {
    metaTrackDefs
      .filter(metaTrackDef => !this.metaTracks[metaTrackDef.uid])
      .forEach((metaTrackDef) => {
        this.metaTracks[metaTrackDef.uid] = {
          trackDef: metaTrackDef,
          trackObject: this.createMetaTrack(metaTrackDef)
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
        trackObject: newTrackObj
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
      this.trackDefObjects[newTrackDefs[i].track.uid].trackDef = newTrackDefs[i];

      // if it's a CombinedTrack, we have to see if its contents have changed
      // e.g. somebody may have added a new Series
      if (newTrackDefs[i].track.type === 'combined') {
        this.trackDefObjects[newTrackDefs[i].track.uid]
          .trackObject
          .updateContents(newTrackDefs[i].track.contents, this.createTrackObject.bind(this))
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
        this.yPositionOffset + trackDef.top
      ];
      const newDimensions = [trackDef.width, trackDef.height];

      // check if any of the track's positions have changed
      // before trying to update them

      if (
        !prevPosition
        || newPosition[0] !== prevPosition[0]
        || newPosition[1] !== prevPosition[1]
      ) {
        trackObject.setPosition(newPosition);
        updated = true;
      }

      if (
        !prevDimensions
        || newDimensions[0] !== prevDimensions[0]
        || newDimensions[1] !== prevDimensions[1]
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

    const middleViewX = (
      this.currentProps.marginLeft +
      this.currentProps.leftWidth +
      (this.currentProps.centerWidth / 2)
    );
    const middleViewY = (
      this.currentProps.marginTop +
      this.currentProps.topHeight +
      (this.currentProps.centerHeight / 2)
    );

    // After applying the zoom transform, the xScale of the target centerX
    // should be equal to the middle of the viewport
    // xScale(centerX) * k + translate[0] = middleViewX
    const translateX = middleViewX - (xScale(centerX) * k);
    const translateY = middleViewY - (yScale(centerY) * k);

    let last;

    const setZoom = () => {
      const newTransform = zoomIdentity.translate(translateX, translateY).scale(k);

      this.zoomTransform = newTransform;
      this.emptyZoomBehavior.transform(this.elementSelection, newTransform);

      last = this.applyZoomTransform(notify);
    };

    if (animateTime) {
      let selection = this.elementSelection;

      this.activeTransitions += 1;

      if (!document.hidden) {
        // only transition if the window is hidden
        selection = selection
          .transition()
          .duration(animateTime);
      }

      selection.call(
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

  /**
   * Respond to a zoom event.
   *
   * We need to update our local record of the zoom transform and apply it
   * to all the tracks.
   */
  zoomed() {
    this.zoomTransform = !this.currentProps.zoomable
      ? zoomIdentity
      : event.transform;

    this.applyZoomTransform(true);

    pubSub.publish('app.zoom', event);
  }

  zoomStarted() {
    this.zooming = true;

    pubSub.publish('app.zoomStart');
  }

  zoomEnded() {
    this.zooming = false;

    pubSub.publish('app.zoomEnd');
  }

  applyZoomTransform(notify = true) {
    const props = this.currentProps;
    const marginleft = props.marginLeft + props.leftWidth;
    const marginTop = props.marginTop + props.topHeight;

    // These props are apparently used elsewhere, for example the context menu
    this.zoomedXScale = this.zoomTransform.rescaleX(this.xScale);
    this.zoomedYScale = this.zoomTransform.rescaleY(this.yScale);

    const newXScale = scaleLinear()
      .domain([
        marginleft, marginleft + props.centerWidth
      ].map(this.zoomedXScale.invert))
      .range([0, props.centerWidth]);

    const newYScale = scaleLinear()
      .domain([
        marginTop, marginTop + props.centerHeight
      ].map(this.zoomedYScale.invert))
      .range([0, props.centerHeight]);

    for (const uid in this.trackDefObjects) {
      const track = this.trackDefObjects[uid].trackObject;

      if (this.trackDefObjects[uid].trackDef.track.position === 'whole') {
        // whole tracks need different scales which go beyond the ends of
        // center track and encompass the whole view

        const trackXScale = scaleLinear()
          .domain(
            [
              props.marginLeft,
              props.width - props.marginLeft
            ].map(this.zoomedXScale.invert))
          .range(
            [0, props.width - (2 * props.marginLeft)]
          );

        const trackYScale = scaleLinear()
          .domain(
            [
              props.marginTop,
              props.height - props.marginTop
            ].map(this.zoomedYScale.invert))
          .range([0, props.height - (2 * props.marginTop)]);

        track.zoomed(
          trackXScale,
          trackYScale,
        );
        continue;
      }

      if (this.trackDefObjects[uid].trackDef.track.position === 'gallery') {
        // gallery tracks need different scales which go beyond the ends of
        // center track and encompass the center view plus the gallery's width

        const trackXScale = scaleLinear()
          .domain(
            [
              props.marginLeft + props.leftWidthNoGallery,
              props.marginLeft + props.leftWidth + props.centerWidth + props.galleryDim,
            ].map(this.zoomedXScale.invert))
          .range(
            [0, props.centerWidth + (2 * props.galleryDim)]
          );

        const trackYScale = scaleLinear()
          .domain(
            [
              props.marginTop + props.topHeightNoGallery,
              props.marginTop + props.topHeight + props.centerHeight + props.galleryDim,
            ].map(this.zoomedYScale.invert))
          .range([0, props.centerHeight - (2 * props.galleryDim)]);

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
        props.marginLeft + props.leftWidth,
        props.marginTop + props.topHeight,
      );
    }

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
          try {
            return new pluginTrack.track(
              AVAILABLE_FOR_PLUGINS,
              track,
              this.getTrackObject.bind(this),
              () => this.currentProps.onNewTilesLoaded(track.uid),
            );
          } catch (e) {
            console.error(
              'Plugin meta track', track.type, 'failed to instantiate.', e
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
        tilesetUid: track.tilesetUid
      };
    }

    switch (track.type) {
      case 'left-axis':
        return new LeftAxisTrack(this.svgElement);

      case 'top-axis':
        return new TopAxisTrack(this.svgElement);

      case 'heatmap':
        return new HeatmapTiledPixiTrack(
          this.pStage,
          dataConfig,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
          this.svgElement,
          () => this.currentProps.onValueScaleChanged(track.uid),
          newOptions =>
            this.currentProps.onTrackOptionsChanged(track.uid, newOptions),
          this.props.onMouseMoveZoom
        );

      case 'horizontal-multivec':
        return new HorizontalMultivecTrack(
          this.pStage,
          dataConfig,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
          this.svgElement,
          () => this.currentProps.onValueScaleChanged(track.uid),
          newOptions =>
            this.currentProps.onTrackOptionsChanged(track.uid, newOptions),
        );

      case 'horizontal-line':
        return new HorizontalLine1DPixiTrack(
          this.pStage,
          dataConfig,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
          () => this.currentProps.onValueScaleChanged(track.uid),
          this.props.onMouseMoveZoom,
        );

      case 'vertical-line':
        return new LeftTrackModifier(
          new HorizontalLine1DPixiTrack(
            this.pStage,
            dataConfig,
            handleTilesetInfoReceived,
            track.options,
            () => this.currentProps.onNewTilesLoaded(track.uid),
            () => this.currentProps.onValueScaleChanged(track.uid),
          ),
        );

      case 'horizontal-point':
        return new HorizontalPoint1DPixiTrack(
          this.pStage,
          dataConfig,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
          () => this.currentProps.onValueScaleChanged(track.uid),
        );

      case 'vertical-point':
        return new LeftTrackModifier(
          new HorizontalPoint1DPixiTrack(
            this.pStage,
            dataConfig,
            handleTilesetInfoReceived,
            track.options,
            () => this.currentProps.onNewTilesLoaded(track.uid),
            () => this.currentProps.onValueScaleChanged(track.uid),
          ),
        );

      case 'horizontal-bar':
        return new BarTrack(
          this.pStage,
          dataConfig,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
          () => this.currentProps.onValueScaleChanged(track.uid),
        );

      case 'horizontal-divergent-bar':
        return new DivergentBarTrack(
          this.pStage,
          dataConfig,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
          () => this.currentProps.onValueScaleChanged(track.uid),
        );

      case 'vertical-bar':
        return new LeftTrackModifier(new BarTrack(
          this.pStage,
          dataConfig,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
          () => this.currentProps.onValueScaleChanged(track.uid),
        ));

      case 'horizontal-1d-tiles':
        return new IdHorizontal1DTiledPixiTrack(
          this.pStage,
          dataConfig,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
        );

      case 'vertical-1d-tiles':
        return new IdVertical1DTiledPixiTrack(
          this.pStage,
          dataConfig,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
        );

      case '2d-tiles':
        return new Id2DTiledPixiTrack(
          this.pStage,
          dataConfig,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
        );

      case 'top-stacked-interval':
        return new CNVIntervalTrack(
          this.pStage,
          dataConfig,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
          () => this.currentProps.onValueScaleChanged(track.uid),
        );

      case 'left-stacked-interval':
        return new LeftTrackModifier(
          new CNVIntervalTrack(
            this.pStage,
            dataConfig,
            handleTilesetInfoReceived,
            track.options,
            () => this.currentProps.onNewTilesLoaded(track.uid),
            () => this.currentProps.onValueScaleChanged(track.uid),
          ),
        );

      case 'viewport-projection-center':
        // TODO: Fix this so that these functions are defined somewhere else
        if (
          track.registerViewportChanged &&
          track.removeViewportChanged &&
          track.setDomainsCallback
        ) {
          return new ViewportTracker2D(
            this.svgElement,
            track.registerViewportChanged,
            track.removeViewportChanged,
            track.setDomainsCallback,
            track.options,
          );
        }
        return new Track();

      case 'viewport-projection-horizontal':
        // TODO: Fix this so that these functions are defined somewhere else
        if (
          track.registerViewportChanged &&
          track.removeViewportChanged &&
          track.setDomainsCallback
        ) {
          return new ViewportTrackerHorizontal(
            this.svgElement,
            track.registerViewportChanged,
            track.removeViewportChanged,
            track.setDomainsCallback,
            track.options,
          );
        }
        return new Track();

      case 'viewport-projection-vertical':
        // TODO: Fix this so that these functions are defined somewhere else
        if (
          track.registerViewportChanged &&
          track.removeViewportChanged &&
          track.setDomainsCallback
        ) {
          return new ViewportTrackerVertical(
            this.svgElement,
            track.registerViewportChanged,
            track.removeViewportChanged,
            track.setDomainsCallback,
            track.options,
          );
        }
        return new Track();

      case 'horizontal-gene-annotations':
        return new HorizontalGeneAnnotationsTrack(
          this.pStage,
          dataConfig,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
        );

      case 'vertical-gene-annotations':
        return new LeftTrackModifier(
          new HorizontalGeneAnnotationsTrack(
            this.pStage,
            dataConfig,
            handleTilesetInfoReceived,
            track.options,
            () => this.currentProps.onNewTilesLoaded(track.uid),
          ),
        );

      case '2d-rectangle-domains':
      case 'arrowhead-domains':
        return new ArrowheadDomainsTrack(
          this.pStage,
          dataConfig,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
        );

      case '2d-annotations':
        return new Annotations2dTrack(
          this.pStage,
          dataConfig,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid)
        );

      case 'vertical-2d-rectangle-domains':
        return new LeftTrackModifier(
          new Horizontal2DDomainsTrack(
            this.pStage,
            dataConfig,
            handleTilesetInfoReceived,
            track.options,
            () => this.currentProps.onNewTilesLoaded(track.uid),
          ),
        );

      case 'horizontal-2d-rectangle-domains':
        return new Horizontal2DDomainsTrack(
          this.pStage,
          dataConfig,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
        );

      case 'square-markers':
        return new SquareMarkersTrack(
          this.pStage,
          dataConfig,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
        );

      case 'combined':
        return new CombinedTrack(
          track.contents,
          this.createTrackObject.bind(this),
        );

      case '2d-chromosome-labels':
        return new Chromosome2DLabels(
          this.pStage,
          dataConfig,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
        );

      case '2d-chromosome-grid':
        return new Chromosome2DGrid(
          this.pStage,
          dataConfig,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
          track.chromInfoPath,
        );

      case 'horizontal-chromosome-labels':
        // chromInfoPath is passed in for backwards compatibility
        // it can be used to provide custom chromosome sizes
        return new HorizontalChromosomeLabels(
          this.pStage,
          dataConfig,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
          track.chromInfoPath,
        );

      case 'vertical-chromosome-labels':
        // chromInfoPath is passed in for backwards compatibility
        // it can be used to provide custom chromosome sizes
        return new LeftTrackModifier(
          new HorizontalChromosomeLabels(
            this.pStage,
            dataConfig,
            handleTilesetInfoReceived,
            track.options,
            () => this.currentProps.onNewTilesLoaded(track.uid),
            track.chromInfoPath,
          ),
        );
      case 'horizontal-heatmap':
        return new HorizontalHeatmapTrack(
          this.pStage,
          dataConfig,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
          this.svgElement,
          () => this.currentProps.onValueScaleChanged(track.uid),
          newOptions =>
            this.currentProps.onTrackOptionsChanged(track.uid, newOptions),
        );

      case 'vertical-heatmap':
        return new LeftTrackModifier(
          new HorizontalHeatmapTrack(
            this.pStage,
            dataConfig,
            handleTilesetInfoReceived,
            track.options,
            () => this.currentProps.onNewTilesLoaded(track.uid),
            this.svgElement,
            () => this.currentProps.onValueScaleChanged(track.uid),
            newOptions =>
              this.currentProps.onTrackOptionsChanged(track.uid, newOptions),
          ),
        );

      case '2d-chromosome-annotations':
        return new Chromosome2DAnnotations(
          this.pStage,
          track.chromInfoPath,
          track.options,
        );

      case 'horizontal-1d-value-interval':
        return new ValueIntervalTrack(
          this.pStage,
          dataConfig,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
        );

      case 'vertical-1d-value-interval':
        return new LeftTrackModifier(new ValueIntervalTrack(
          this.pStage,
          dataConfig,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid)),
        );

      case 'osm-tiles':
        return new OSMTilesTrack(
          this.pStage,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
        );

      case 'mapbox-tiles':
        return new MapboxTilesTrack(
          this.pStage,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
          track.accessToken
        );

      case 'bedlike':
        return new BedLikeTrack(
          this.pStage,
          dataConfig,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
        );

      case 'horizontal-rule':
        return new HorizontalRule(
          this.pStage,
          track.y,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
        );

      case 'vertical-rule':
        return new VerticalRule(
          this.pStage,
          track.x,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
        );

      case 'cross-rule':
        return new CrossRule(
          this.pStage,
          track.x,
          track.y,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
        );

      case 'vertical-bedlike':
        return new LeftTrackModifier(
          new BedLikeTrack(
            this.pStage,
            dataConfig,
            handleTilesetInfoReceived,
            track.options,
            () => this.currentProps.onNewTilesLoaded(track.uid),
          )
        );

      default: {
        // Check if a plugin track is available
        const pluginTrack = this.props.pluginTracks[track.type];

        if (pluginTrack && !pluginTrack.isMetaTrack) {
          try {
            return new pluginTrack.track(
              AVAILABLE_FOR_PLUGINS,
              this.pStage,
              track,
              dataConfig,
              handleTilesetInfoReceived,
              () => this.currentProps.onNewTilesLoaded(track.uid),
              this.baseEl,
            );
          } catch (e) {
            console.error(
              'Plugin track', track.type, 'failed to instantiate.', e
            );
          }
        }

        console.warn('Unknown track type:', track.type);

        return new UnknownPixiTrack(
          this.pStage,
          { name: 'Unknown Track Type', type: track.type },
          () => this.currentProps.onNewTilesLoaded(track.uid),
        );
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
      projectedScales[1]
    );
  }

  forwardContextMenu(e) {
    // Do never forward the contextmenu event when ALT is being hold down.
    if (e.altKey) return;

    e.preventDefault();

    setTimeout(() => {
      // For right clicks only. Publish the contextmenu event
      pubSub.publish('contextmenu', e);
    }, 0);
  }

  addEventTracker() {
    if (!this.eventTracker || this.eventTracker === this.eventTrackerOld) return;
    if (!this.eventTrackerOld) this.eventTrackerOld = this.eventTracker;

    this.eventTracker = this.eventTrackerOld;

    this.eventTracker.addEventListener('click', this.forwardEvent.bind(this));
    this.eventTracker.addEventListener('contextmenu', this.forwardContextMenu.bind(this));
    this.eventTracker.addEventListener('dblclick', this.forwardEvent.bind(this));
    this.eventTracker.addEventListener('wheel', this.forwardEvent.bind(this));
    this.eventTracker.addEventListener('dragstart', this.forwardEvent.bind(this));
    this.eventTracker.addEventListener('selectstart', this.forwardEvent.bind(this));

    this.eventTracker.addEventListener('mouseover', this.forwardEvent.bind(this));
    this.eventTracker.addEventListener('mouseenter', this.forwardEvent.bind(this));
    this.eventTracker.addEventListener('mousedown', this.forwardEvent.bind(this));
    this.eventTracker.addEventListener('mousemove', this.forwardEvent.bind(this));
    this.eventTracker.addEventListener('mouseup', this.forwardEvent.bind(this));
    this.eventTracker.addEventListener('mouseout', this.forwardEvent.bind(this));
    this.eventTracker.addEventListener('mouseleave', this.forwardEvent.bind(this));

    this.eventTracker.addEventListener('touchstart', this.forwardEvent.bind(this));
    this.eventTracker.addEventListener('touchmove', this.forwardEvent.bind(this));
    this.eventTracker.addEventListener('touchend', this.forwardEvent.bind(this));
    this.eventTracker.addEventListener('touchcancel', this.forwardEvent.bind(this));

    this.eventTracker.addEventListener('pointerover', this.forwardEvent.bind(this));
    this.eventTracker.addEventListener('pointerenter', this.forwardEvent.bind(this));
    this.eventTracker.addEventListener('pointerdown', this.forwardEvent.bind(this));
    this.eventTracker.addEventListener('pointermove', this.forwardEvent.bind(this));
    this.eventTracker.addEventListener('pointerup', this.forwardEvent.bind(this));
    this.eventTracker.addEventListener('pointercancel', this.forwardEvent.bind(this));
    this.eventTracker.addEventListener('pointerout', this.forwardEvent.bind(this));
    this.eventTracker.addEventListener('pointerleave', this.forwardEvent.bind(this));
  }

  removeEventTracker() {
    if (!this.eventTracker) return;

    this.eventTracker.removeEventListener('click', this.forwardEvent.bind(this));
    this.eventTracker.removeEventListener('contextmenu', this.forwardContextMenu.bind(this));
    this.eventTracker.removeEventListener('dblclick', this.forwardEvent.bind(this));
    this.eventTracker.removeEventListener('wheel', this.forwardEvent.bind(this));
    this.eventTracker.removeEventListener('dragstart', this.forwardEvent.bind(this));
    this.eventTracker.removeEventListener('selectstart', this.forwardEvent.bind(this));

    this.eventTracker.removeEventListener('mouseover', this.forwardEvent.bind(this));
    this.eventTracker.removeEventListener('mouseenter', this.forwardEvent.bind(this));
    this.eventTracker.removeEventListener('mousedown', this.forwardEvent.bind(this));
    this.eventTracker.removeEventListener('mousemove', this.forwardEvent.bind(this));
    this.eventTracker.removeEventListener('mouseup', this.forwardEvent.bind(this));
    this.eventTracker.removeEventListener('mouseout', this.forwardEvent.bind(this));
    this.eventTracker.removeEventListener('mouseleave', this.forwardEvent.bind(this));

    this.eventTracker.removeEventListener('touchstart', this.forwardEvent.bind(this));
    this.eventTracker.removeEventListener('touchmove', this.forwardEvent.bind(this));
    this.eventTracker.removeEventListener('touchend', this.forwardEvent.bind(this));
    this.eventTracker.removeEventListener('touchcancel', this.forwardEvent.bind(this));

    this.eventTracker.removeEventListener('pointerover', this.forwardEvent.bind(this));
    this.eventTracker.removeEventListener('pointerenter', this.forwardEvent.bind(this));
    this.eventTracker.removeEventListener('pointerdown', this.forwardEvent.bind(this));
    this.eventTracker.removeEventListener('pointermove', this.forwardEvent.bind(this));
    this.eventTracker.removeEventListener('pointerup', this.forwardEvent.bind(this));
    this.eventTracker.removeEventListener('pointercancel', this.forwardEvent.bind(this));
    this.eventTracker.removeEventListener('pointerout', this.forwardEvent.bind(this));
    this.eventTracker.removeEventListener('pointerleave', this.forwardEvent.bind(this));
  }

  forwardEvent(e) {
    pubSub.publish('app.event', e);
  }

  /* ------------------------------- Render ------------------------------- */

  render() {
    return (
      <div
        ref={(c) => { this.baseEl = c; }}
        className="track-renderer-div"
        style={{
          height: this.currentProps.height,
          width: this.currentProps.width,
        }}
        styleName="track-renderer"
      >
        <div
          ref={(c) => { this.element = c; }}
          className="track-renderer-element"
          styleName="track-renderer-element"
        />
        <div
          ref={(c) => { this.eventTracker = c; }}
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
  pluginTracks: {},
  canvasElement: null,
  centerHeight: 0,
  centerWidth: 0,
  children: [],
  galleryDim: 0,
  height: 0,
  initialXDomain: [],
  initialYDomain: [],
  isRangeSelection: false,
  leftWidth: 0,
  leftWidthNoGallery: 0,
  marginLeft: 0,
  marginTop: 0,
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
  galleryDim: PropTypes.number,
  height: PropTypes.number,
  initialXDomain: PropTypes.array,
  initialYDomain: PropTypes.array,
  xDomainLimits: PropTypes.array,
  yDomainLimits: PropTypes.array,
  zoomDomain: PropTypes.array,
  isRangeSelection: PropTypes.bool,
  leftWidth: PropTypes.number,
  leftWidthNoGallery: PropTypes.number,
  marginLeft: PropTypes.number,
  marginTop: PropTypes.number,
  onMouseMoveZoom: PropTypes.func,
  onScalesChanged: PropTypes.func.isRequired,
  pixiStage: PropTypes.object.isRequired,
  pluginTracks: PropTypes.object,
  positionedTracks: PropTypes.array,
  metaTracks: PropTypes.array,
  setCentersFunction: PropTypes.func,
  svgElement: PropTypes.object.isRequired,
  topHeight: PropTypes.number,
  topHeightNoGallery: PropTypes.number,
  viewOptions: PropTypes.object,
  width: PropTypes.number,
};

export default TrackRenderer;
