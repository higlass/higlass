import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import * as PIXI from 'pixi.js';

import {zoom, zoomIdentity} from 'd3-zoom';
import {select,event} from 'd3-selection';
import {scaleLinear} from 'd3-scale';

import HeatmapTiledPixiTrack from './HeatmapTiledPixiTrack';
import Id2DTiledPixiTrack from './Id2DTiledPixiTrack';
import IdHorizontal1DTiledPixiTrack from './IdHorizontal1DTiledPixiTrack';
import IdVertical1DTiledPixiTrack from './IdVertical1DTiledPixiTrack';
import TopAxisTrack from './TopAxisTrack';
import LeftAxisTrack from './LeftAxisTrack';
import CombinedTrack from './CombinedTrack';

import HorizontalLine1DPixiTrack from './HorizontalLine1DPixiTrack';
import HorizontalPoint1DPixiTrack from './HorizontalPoint1DPixiTrack';
import BarTrack from './BarTrack';

import CNVIntervalTrack from './CNVIntervalTrack';
import LeftTrackModifier from './LeftTrackModifier';
import Track from './Track';
import HorizontalGeneAnnotationsTrack from './HorizontalGeneAnnotationsTrack';
import ArrowheadDomainsTrack from './ArrowheadDomainsTrack';

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

import OSMTilesTrack from './OSMTilesTrack';
import MapboxTilesTrack from './MapboxTilesTrack';

// Utils
import { dictItems } from './utils';

// Services
import { pubSub } from './services';

// Configs
import { ZOOM_TRANSITION_DURATION } from './configs';

// Styles
import '../styles/TrackRenderer.scss';


const SCROLL_TIMEOUT = 100;


export class TrackRenderer extends React.Component {
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
    this.dragging = false; //is this element being dragged?
    this.element = null;
    this.closing = false;

    this.yPositionOffset = 0;
    this.xPositionOffset = 0;

    this.scrollTimeout = null;

    this.zoomTransform = zoomIdentity;
    this.windowScrolledBound = this.windowScrolled.bind(this);
    this.zoomStartedBound = this.zoomStarted.bind(this);
    this.zoomedBound = this.zoomed.bind(this);
    this.zoomEndedBound = this.zoomEnded.bind(this);

    // create a zoom behavior that we'll just use to transform selections
    // without having it fire an "onZoom" event
    this.emptyZoomBehavior = zoom()

    // a lot of the updates in TrackRenderer happen in response to
    // componentWillReceiveProps so we need to perform them with the
    // newest set of props. When cWRP is called, this.props still contains
    // the old props, so we need to store them in a new variable
    this.currentProps = props;
    this.prevPropsStr = '';

    // catch any zooming behavior within all of the tracks in this plot
    //this.zoomTransform = zoomIdentity();
    this.zoomBehavior = zoom()
      .filter(() => {
        if (event.target.classList.contains('no-zoom'))
          return false;
        if (event.target.classList.contains('react-resizable-handle'))
          return false;
        return true;
      })
      .on('start', this.zoomStartedBound)
      .on('zoom', this.zoomedBound)
      .on('end', this.zoomEndedBound);

    this.initialXDomain = [0,1];
    this.initialYDomain = [0,1];

    this.prevCenterX = this.currentProps.marginLeft + this.currentProps.leftWidth + this.currentProps.centerWidth / 2;
    this.prevCenterY = this.currentProps.marginTop + this.currentProps.topHeight + this.currentProps.centerHeight / 2;

    // The offset of the center from the original. Used to keep the scales centered on resize events
    this.cumCenterXOffset = 0;
    this.cumCenterYOffset = 0;

    this.setUpInitialScales(
      this.currentProps.initialXDomain,
      this.currentProps.initialYDomain
    );

    this.setUpScales();

    // maintain a list of trackDefObjects which correspond to the input
    // tracks
    // Each object will contain a trackDef
    // {'top': 100, 'left': 50,... 'track': {'source': 'http:...', 'type': 'heatmap'}}
    // And a trackObject which will be responsible for rendering it
    this.trackDefObjects = {};

    this.pubSubs = [];
  }

  componentWillMount() {
    this.pubSubs = [];
    this.pubSubs.push(
      pubSub.subscribe('scroll', this.windowScrolledBound)
    );
  }

  componentDidMount() {
    this.element = ReactDOM.findDOMNode(this);
    this.divTrackAreaSelection = select(this.divTrackArea);
    this.svgTrackAreaSelection = select(this.svgTrackArea);

    this.pStage = new PIXI.Graphics();
    this.pMask = new PIXI.Graphics();

    this.pStage.addChild(this.pMask)

    this.currentProps.pixiStage.addChild(this.pStage);

    this.pStage.mask = this.pMask;

    if (!this.props.isRangeSelection) this.addZoom();

    this.canvasDom = ReactDOM.findDOMNode(this.currentProps.canvasElement);

    // need to be mounted to make sure that all the renderers are
    // created before starting to draw tracks
    if (!this.currentProps.svgElement || !this.currentProps.canvasElement)
      return;

    this.svgElement = this.currentProps.svgElement;
    this.syncTrackObjects(this.currentProps.positionedTracks);

    this.currentProps.setCentersFunction(this.setCenter.bind(this));
    this.currentProps.registerDraggingChangedListener(this.draggingChanged.bind(this));

    this.draggingChanged(true);
  }

  componentWillReceiveProps(nextProps) {
    /**
     * The size of some tracks probably changed, so let's just
     * redraw them.
     */

    // don't initiate this component if it has nothing to draw on
    if (!nextProps.svgElement || !nextProps.canvasElement)
      return;

    let nextPropsStr = this.updatablePropsToString(nextProps);
    this.currentProps = nextProps;

    if (this.prevPropsStr === nextPropsStr)
      return;

    for (let uid in this.trackDefObjects) {
      let track = this.trackDefObjects[uid].trackObject;

      track.delayDrawing = true;
    }

    this.prevPropsStr = nextPropsStr;

    this.setUpInitialScales(
      nextProps.initialXDomain,
      nextProps.initialYDomain
    );

    this.setUpScales(
      nextProps.width !== this.props.width ||
      nextProps.height !== this.props.height
    );
    this.canvasDom = ReactDOM.findDOMNode(nextProps.canvasElement);

    this.svgElement = nextProps.svgElement;

    this.syncTrackObjects(nextProps.positionedTracks);

    for (let track of nextProps.positionedTracks) {
      // tracks all the way down
      let options = track.track.options;
      let trackObject = this.trackDefObjects[track.track.uid].trackObject;
      trackObject.rerender(options);

      if (track.track.hasOwnProperty('contents')) {
        let ctDefs = {};
        for (let ct of track.track.contents) {
          ctDefs[ct.uid] = ct;
        }

        for (let uid in trackObject.createdTracks) {
          trackObject.createdTracks[uid].rerender(ctDefs[uid].options);
        }
      }
    }
    this.props.onNewTilesLoaded();

    for (let uid in this.trackDefObjects) {
      let track = this.trackDefObjects[uid].trackObject;

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
  }

  componentWillUnmount() {
    /**
     * This view has been removed so we need to get rid of all the tracks it contains
     */
    this.removeTracks(Object.keys(this.trackDefObjects));
    this.currentProps.removeDraggingChangedListener(this.draggingChanged);

    this.currentProps.pixiStage.removeChild(this.pStage);

    this.pubSubs.forEach(subscription => pubSub.unsubscribe(subscription));
    this.pubSubs = [];
  }

  /* --------------------------- Custom Methods ----------------------------- */

  addZoom() {
    if (!this.divTrackAreaSelection) { return; }

    // add back the previous transform
    this.divTrackAreaSelection.call(this.zoomBehavior);
    this.zoomBehavior.transform(this.divTrackAreaSelection, this.zoomTransform);
  }

  removeZoom() {
    if (this.divTrackAreaSelection) {
      this.zoomEnded();
      this.divTrackAreaSelection.on('.zoom', null);
    }
  }

  setMask() {
    /*
     * Add a mask to make sure that the tracks displayed in this view
     * don't overflow its bounds.
     */
    this.pMask.clear();
    this.pMask.beginFill();
    this.pMask.drawRect(this.xPositionOffset, this.yPositionOffset, this.currentProps.width, this.currentProps.height);
    this.pMask.endFill();

  }

  windowScrolled() {
    this.removeZoom();

    if (this.scrollTimeout)
      clearTimeout(this.scrollTimeout);

    this.scrollTimeout = setTimeout(() => {
      this.addZoom();
    }, SCROLL_TIMEOUT);
  }

  setUpInitialScales(initialXDomain, initialYDomain) {
    // make sure the two scales are equally wide:
    let xWidth = initialXDomain[1] - initialXDomain[0];
    let yCenter = (initialYDomain[0] + initialYDomain[1]) / 2;
    //initialYDomain = [yCenter - xWidth / 2, yCenter + xWidth / 2];

    // stretch out the y-scale so that views aren't distorted (i.e. maintain
    // a 1 to 1 ratio)
    initialYDomain[0] = yCenter - xWidth / 2,
    initialYDomain[1] = yCenter + xWidth / 2;

    if (
      initialXDomain == this.initialXDomain &&
      initialYDomain == this.initialYDomain
    ) {
      return;
    }


    // only update the initial domain
    this.initialXDomain = initialXDomain;
    this.initialYDomain = initialYDomain;

    this.cumCenterYOffset = 0;
    this.cumCenterXOffset = 0;

    this.drawableToDomainX = scaleLinear()
      .domain([this.currentProps.marginLeft + this.currentProps.leftWidth,
          this.currentProps.marginLeft + this.currentProps.leftWidth + this.currentProps.centerWidth])
      .range([initialXDomain[0], initialXDomain[1]]);

    let midXDomain = (initialXDomain[0] + initialXDomain[0]) / 2;
    let yDomainWidth = (initialXDomain[1] - initialXDomain[0]) * (this.currentProps.centerHeight / this.currentProps.centerWidth);

    this.drawableToDomainY = scaleLinear()
      .domain([this.currentProps.marginTop + this.currentProps.topHeight + this.currentProps.centerHeight / 2 - this.currentProps.centerWidth / 2,
          this.currentProps.marginTop + this.currentProps.topHeight + this.currentProps.centerHeight / 2 + this.currentProps.centerWidth / 2])
      .range([initialYDomain[0], initialYDomain[1]]);
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
      dragging: props.dragging
    });
  }

  draggingChanged(draggingStatus) {
    this.dragging = draggingStatus;

    this.timedUpdatePositionAndDimensions();
  }

  setUpScales(notify=false) {
    let currentCenterX = this.currentProps.marginLeft + this.currentProps.leftWidth + this.currentProps.centerWidth / 2;
    let currentCenterY = this.currentProps.marginTop + this.currentProps.topHeight + this.currentProps.centerHeight / 2;

    // we need to maintain two scales:
    // 1. the scale that is shown
    // 2. the scale that the zooming behavior acts on
    //
    // These need to be separated because the zoom behavior acts on a larger region
    // than the visible scale shows

    // if the window is resized, we don't want to change the scale, but we do want to move the center point
    // this needs to be tempered by the zoom factor so that we keep the visible center point in the center
    let centerDomainXOffset = (this.drawableToDomainX(currentCenterX) - this.drawableToDomainX(this.prevCenterX)) / this.zoomTransform.k;
    let centerDomainYOffset = (this.drawableToDomainY(currentCenterY) - this.drawableToDomainY(this.prevCenterY)) / this.zoomTransform.k;

    this.cumCenterYOffset += centerDomainYOffset;
    this.cumCenterXOffset += centerDomainXOffset;

    this.prevCenterY = currentCenterY;
    this.prevCenterX = currentCenterX;

    // the domain of the visible (not drawable area)
    let visibleXDomain = [this.drawableToDomainX(0) - this.cumCenterXOffset, this.drawableToDomainX(this.currentProps.width) - this.cumCenterXOffset]
    let visibleYDomain = [this.drawableToDomainY(0) - this.cumCenterYOffset, this.drawableToDomainY(this.currentProps.height) - this.cumCenterYOffset]

    // [drawableToDomain(0), drawableToDomain(1)]: the domain of the visible area
    // if the screen has been resized, then the domain width should remain the same

    //this.xScale should always span the region that the zoom behavior is being called on
    this.xScale = scaleLinear()
            .domain(visibleXDomain)
            .range([0, this.currentProps.width]);
    this.yScale = scaleLinear()
            .domain(visibleYDomain)
            .range([0, this.currentProps.height]);


    for (let uid in this.trackDefObjects) {
      let track = this.trackDefObjects[uid].trackObject;

      //track.refXScale(this.xScale);
      //track.refYScale(this.yScale);

      // e.g. when the track is resized... we want to redraw it
      track.refScalesChanged(this.xScale, this.yScale);
      //track.draw();
    }

    this.applyZoomTransform(notify);
  }

  getTrackObject(trackId) {
    /*
     * Fetch the trackObject for a track with a given ID
     *
     */
    let trackDefItems = dictItems(this.trackDefObjects);

    for (let i = 0; i < trackDefItems.length; i++) {
      let uid = trackDefItems[i][0];
      let trackObject = trackDefItems[i][1].trackObject;

      if (uid == trackId) {
        return trackObject
      }

      // maybe this track is in a combined track
      if (trackObject.createdTracks) {
        let createdTrackItems = dictItems(trackObject.createdTracks);

        for (let i = 0; i < createdTrackItems.length; i++) {
          let createdTrackUid = createdTrackItems[i][0];
          let createdTrackObject = createdTrackItems[i][1];

          if (createdTrackUid == trackId) {
            return createdTrackObject;
          }
        }
      }
    }
  }

  timedUpdatePositionAndDimensions() {
    if (this.closing)
      return;

    if (this.dragging) {
      this.yPositionOffset = this.element.getBoundingClientRect().top - this.canvasDom.getBoundingClientRect().top;
      this.xPositionOffset = this.element.getBoundingClientRect().left - this.canvasDom.getBoundingClientRect().left;

      this.setMask();

      let updated = this.updateTrackPositions();

      if (updated)  {
        //only redraw if positions changed
        this.applyZoomTransform(true);
      }

      requestAnimationFrame(this.timedUpdatePositionAndDimensions.bind(this));
    }
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
    let receivedTracksDict = {};
    for (let i = 0; i < trackDefinitions.length; i++)
      receivedTracksDict[trackDefinitions[i].track.uid] = trackDefinitions[i];

    let knownTracks = new Set(Object.keys(this.trackDefObjects));
    let receivedTracks = new Set(Object.keys(receivedTracksDict));

    // track definitions we don't have objects for
    let enterTrackDefs = new Set([...receivedTracks]
                .filter(x => !knownTracks.has(x)));

    // track objects for which there is no definition
    // (i.e. they no longer need to exist)
    let exitTracks = new Set([...knownTracks]
                .filter(x => !receivedTracks.has(x)));


    // we already have these tracks, but need to change their dimensions
    let updateTrackDefs = new Set([...receivedTracks]
                   .filter(x => knownTracks.has(x)));

    // update existing tracks
    this.updateExistingTrackDefs([...updateTrackDefs].map(x => receivedTracksDict[x]));

    // add new tracks and update them (setting dimensions and positions)
    this.addNewTracks([...enterTrackDefs].map(x => receivedTracksDict[x]));
    this.updateExistingTrackDefs([...enterTrackDefs].map(x => receivedTracksDict[x]));

    this.removeTracks([...exitTracks]);
  }

  addNewTracks(newTrackDefinitions) {
    /**
     * We need to create new track objects for the given track
     * definitions.
     */
    if (!this.currentProps.pixiStage)
      return;  // we need a pixi stage to start rendering
           // the parent component where it lives probably
           // hasn't been mounted yet

    for (let i = 0; i < newTrackDefinitions.length; i++) {
      let newTrackDef = newTrackDefinitions[i];
      let newTrackObj = this.createTrackObject(newTrackDef.track)

      //newTrackObj.refXScale(this.xScale);
      //newTrackObj.refYScale(this.yScale);

      newTrackObj.refScalesChanged(this.xScale, this.yScale);

      this.trackDefObjects[newTrackDef.track.uid] = {trackDef: newTrackDef,
        trackObject: newTrackObj};

      let zoomedXScale = this.zoomTransform.rescaleX(this.xScale);
      let zoomedYScale = this.zoomTransform.rescaleY(this.yScale);

      newTrackObj.setDimensions([newTrackDef.width, newTrackDef.height]);
      newTrackObj.zoomed(zoomedXScale, zoomedYScale);
    }

    // this could be replaced with a call that only applies the zoom
    // transform to the newly added tracks
    this.applyZoomTransform(false);
  }

  updateExistingTrackDefs(newTrackDefs) {
    for (let i = 0; i < newTrackDefs.length; i++) {
      this.trackDefObjects[newTrackDefs[i].track.uid].trackDef = newTrackDefs[i];

      // if it's a CombinedTrack, we have to see if its contents have changed
      // e.g. somebody may have added a new Series
      if (newTrackDefs[i].track.type == 'combined') {
        this.trackDefObjects[newTrackDefs[i].track.uid]
        .trackObject
        .updateContents(newTrackDefs[i].track.contents, this.createTrackObject.bind(this))
        .refScalesChanged(this.xScale, this.yScale);
      }
    }

    let updated = this.updateTrackPositions();
    //this.applyZoomTransform();
    if (updated)  {
      //only redraw if positions changed
      this.applyZoomTransform(false);
    }
  }

  updateTrackPositions() {
    let updated = false;

    for (let uid in this.trackDefObjects) {
      let trackDef = this.trackDefObjects[uid].trackDef;
      let trackObject = this.trackDefObjects[uid].trackObject;

      let prevPosition = trackObject.position;
      let prevDimensions = trackObject.dimensions;

      let newPosition = [this.xPositionOffset + trackDef.left, this.yPositionOffset + trackDef.top];
      let newDimensions = [trackDef.width, trackDef.height];

      // check if any of the track's positions have changed
      // before trying to update them

      if (!prevPosition || newPosition[0] != prevPosition[0] || newPosition[1] != prevPosition[1]) {
        trackObject.setPosition(newPosition);
        updated = true;
      }

      if (!prevDimensions || newDimensions[0] != prevDimensions[0] || newDimensions[1] != prevDimensions[1]) {
        trackObject.setDimensions(newDimensions);
        updated = true;
      }

      let widthDifference = trackDef.width - this.currentProps.width;
      let heightDifference = trackDef.height - this.currentProps.height;
    }

    // report on whether any track positions or dimensions have changed
    // so that downstream code can decide whether to redraw
    return updated;
  }


  removeTracks(trackUids) {
    for (let i = 0; i < trackUids.length; i++) {
      this.trackDefObjects[trackUids[i]].trackObject.remove();
      delete this.trackDefObjects[trackUids[i]];
    }
  }

  setCenter(centerX, centerY, sourceK, notify, animate=false, animateTime=ZOOM_TRANSITION_DURATION) {
    /*
     * Set the center of this view to a paticular X and Y coordinate
     *
     * @param notify: Notify listeners that the scales have changed. This
     *      can be turned off to prevent circular updates when scales are
     *      locked.
     */
    let refK = this.xScale.invert(1) - this.xScale.invert(0);

    let k = refK / sourceK;

    let middleViewX = this.currentProps.marginLeft + this.currentProps.leftWidth + this.currentProps.centerWidth / 2;
    let middleViewY = this.currentProps.marginTop + this.currentProps.topHeight + this.currentProps.centerHeight / 2;

    // After applying the zoom transform, the xScale of the target centerX
    // should be equal to the middle of the viewport
    // this.xScale(centerX) * k + translate[0] = middleViewX
    let translateX = middleViewX - this.xScale(centerX) * k;
    let translateY = middleViewY - this.yScale(centerY) * k;

    // the ref scale spans the width of the viewport

    let last;

    const setZoom = () => {
      let newTransform = zoomIdentity.translate(translateX, translateY).scale(k);

      this.zoomTransform = newTransform;
      this.emptyZoomBehavior.transform(this.divTrackAreaSelection, newTransform);

      last = this.applyZoomTransform(notify);
    }

    if (animate) {
      let selection = this.divTrackAreaSelection;

      if (!document.hidden) {
        // only transition if the window is hidden
        selection = selection
          .transition()
          .duration(animateTime)
      }

      selection.call(
          this.zoomBehavior.transform,
          zoomIdentity.translate(translateX, translateY).scale(k)
        )
        .on('end', setZoom);

    } else {
      setZoom();
    }

    return last;
  }

  zoomed() {
    /**
     * Respond to a zoom event.
     *
     * We need to update our local record of the zoom transform and apply it
     * to all the tracks.
     */
    this.zoomTransform = !this.currentProps.zoomable ?
      zoomIdentity : event.transform;

    this.applyZoomTransform(true);
  }

  zoomStarted() {
    this.zooming = true;
  }

  zoomEnded() {
    this.zooming = false;
  }

  applyZoomTransform(notify=true) {
    let zoomedXScale = this.zoomTransform.rescaleX(this.xScale);
    let zoomedYScale = this.zoomTransform.rescaleY(this.yScale);

    let newXScale = scaleLinear()
      .domain(
        [
          this.currentProps.marginLeft + this.currentProps.leftWidth,
          this.currentProps.marginLeft + this.currentProps.leftWidth + this.currentProps.centerWidth
        ].map(zoomedXScale.invert)
      )
      .range([0, this.currentProps.centerWidth]);

    let newYScale = scaleLinear()
      .domain(
        [
          this.currentProps.marginTop + this.currentProps.topHeight,
          this.currentProps.marginTop + this.currentProps.topHeight + this.currentProps.centerHeight
        ].map(zoomedYScale.invert)
      )
      .range([0, this.currentProps.centerHeight]);

    for (let uid in this.trackDefObjects) {
      let track = this.trackDefObjects[uid].trackObject;

      track.zoomed(
        newXScale.copy(),
        newYScale.copy(),
        this.zoomTransform.k,
        this.zoomTransform.x + this.xPositionOffset,
        this.zoomTransform.y + this.yPositionOffset,
        this.currentProps.marginLeft + this.currentProps.leftWidth,
        this.currentProps.marginTop + this.currentProps.topHeight
      );
    }

    if (notify) {
      this.currentProps.onScalesChanged(newXScale, newYScale);
    }

    return [newXScale, newYScale];
  }

  createTrackObject(track) {
    let handleTilesetInfoReceived = x => {
      this.currentProps.onTilesetInfoReceived(track.uid, x);
    }

    switch (track.type) {
      case 'left-axis':
        return new LeftAxisTrack(this.svgElement);

      case 'top-axis':
        return new TopAxisTrack(this.svgElement);

      case 'heatmap':
        return new HeatmapTiledPixiTrack(
          this.pStage,
          track.server,
          track.tilesetUid,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid)
        );

      case 'horizontal-line':
        return new HorizontalLine1DPixiTrack(
          this.pStage,
          track.server,
          track.tilesetUid,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid)
        );

      case 'vertical-line':
        return new LeftTrackModifier(
          new HorizontalLine1DPixiTrack(
            this.pStage,
            track.server,
            track.tilesetUid,
            handleTilesetInfoReceived,
            track.options,
            () => this.currentProps.onNewTilesLoaded(track.uid)
          )
        );

      case 'horizontal-point':
        return new HorizontalPoint1DPixiTrack(
          this.pStage,
          track.server,
          track.tilesetUid,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid)
        );

      case 'horizontal-bar':
        return new BarTrack(
          this.pStage,
          track.server,
          track.tilesetUid,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid)
        );

      case 'vertical-point':
        return new LeftTrackModifier(
          new HorizontalPoint1DPixiTrack(
            this.pStage,
            track.server,
            track.tilesetUid,
            handleTilesetInfoReceived,
            track.options,
            () => this.currentProps.onNewTilesLoaded(track.uid)
          )
        );

      case 'horizontal-1d-tiles':
        return new IdHorizontal1DTiledPixiTrack(
          this.pStage,
          track.server,
          track.tilesetUid,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid)
        );

      case 'vertical-1d-tiles':
        return new IdVertical1DTiledPixiTrack(
          this.pStage,
          track.server,
          track.tilesetUid,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid)
        );

      case '2d-tiles':
        return new Id2DTiledPixiTrack(
          this.pStage,
          track.server,
          track.tilesetUid,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid)
        );

      case 'top-stacked-interval':
        return new CNVIntervalTrack(
          this.pStage,
          track.server,
          track.tilesetUid,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid)
        );

      case 'left-stacked-interval':
        return new LeftTrackModifier(
          new CNVIntervalTrack(
            this.pStage,
            track.server,
            track.tilesetUid,
            handleTilesetInfoReceived,
            track.options,
            () => this.currentProps.onNewTilesLoaded(track.uid)
          )
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
            track.options
          );
        } else {
          return new Track();
        }

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
            track.options
          );
        } else {
          return new Track();
        }

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
            track.options
          );
        } else {
          return new Track();
        }

      case 'horizontal-gene-annotations':
        return new HorizontalGeneAnnotationsTrack(
          this.pStage,
          track.server,
          track.tilesetUid,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid)
        );

      case 'vertical-gene-annotations':
        return new LeftTrackModifier(
          new HorizontalGeneAnnotationsTrack(
            this.pStage,
            track.server,
            track.tilesetUid,
            handleTilesetInfoReceived,
            track.options,
            () => this.currentProps.onNewTilesLoaded(track.uid)
          )
        );

      case '2d-rectangle-domains':
        return new ArrowheadDomainsTrack(
          this.pStage,
          track.server,
          track.tilesetUid,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid)
        );

      case 'vertical-2d-rectangle-domains':
        return new LeftTrackModifier(
          new Horizontal2DDomainsTrack(
            this.pStage,
            track.server,
            track.tilesetUid,
            handleTilesetInfoReceived,
            track.options,
            () => this.currentProps.onNewTilesLoaded(track.uid)
          )
        );

      case 'horizontal-2d-rectangle-domains':
        return new Horizontal2DDomainsTrack(
          this.pStage,
          track.server,
          track.tilesetUid,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid)
        );

      case 'arrowhead-domains':
        return new ArrowheadDomainsTrack(
          this.pStage,
          track.server,
          track.tilesetUid,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid)
        );

      case 'square-markers':
        return new SquareMarkersTrack(
          this.pStage,
          track.server,
          track.tilesetUid,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid)
        );

      case 'combined':
        return new CombinedTrack(
          track.contents,
          this.createTrackObject.bind(this),
          handleTilesetInfoReceived,
          track.options
        );

      case '2d-chromosome-labels':
        return new Chromosome2DLabels(
          this.pStage,
          track.server,
          track.tilesetUid,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid)
        );

      case '2d-chromosome-grid':
        return new Chromosome2DGrid(
          this.pStage,
          track.server,
          track.tilesetUid,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
          track.chromInfoPath
        );

      case 'horizontal-chromosome-labels':
        // chromInfoPath is passed in for backwards compatibility
        // it can be used to provide custom chromosome sizes
        return new HorizontalChromosomeLabels(
          this.pStage,
          track.server,
          track.tilesetUid,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid),
          track.chromInfoPath
        );

      case 'vertical-chromosome-labels':
        // chromInfoPath is passed in for backwards compatibility
        // it can be used to provide custom chromosome sizes
        return new LeftTrackModifier(
          new HorizontalChromosomeLabels(
            this.pStage,
            track.server,
            track.tilesetUid,
            handleTilesetInfoReceived,
            track.options,
            () => this.currentProps.onNewTilesLoaded(track.uid),
            track.chromInfoPath
          )
        );
      case 'horizontal-heatmap':
        return new HorizontalHeatmapTrack(
          this.pStage,
          track.server,
          track.tilesetUid,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid)
         );

      case 'vertical-heatmap':
        return new LeftTrackModifier(
          new HorizontalHeatmapTrack(
            this.pStage,
            track.server,
            track.tilesetUid,
            handleTilesetInfoReceived,
            track.options,
            () => this.currentProps.onNewTilesLoaded(track.uid)
          )
        );

      case '2d-chromosome-annotations':
        return new Chromosome2DAnnotations(
          this.pStage,
          track.chromInfoPath,
          track.options
        );

      case 'horizontal-1d-value-interval':
        return new ValueIntervalTrack(
          this.pStage,
          track.server,
          track.tilesetUid,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid)
        );

      case 'horizontal-1d-value-interval':
        return new ValueIntervalTrack(
          this.pStage,
          track.server,
          track.tilesetUid,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid)
        );

      case 'vertical-1d-value-interval':
        return new LeftTrackModifier(new ValueIntervalTrack(
          this.pStage,
          track.server,
          track.tilesetUid,
          handleTilesetInfoReceived,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid))
        );

      case 'osm-tiles':
        return new OSMTilesTrack(
          this.pStage,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid)
        );

      case 'mapbox-tiles':
        return new MapboxTilesTrack(
          this.pStage,
          track.options,
          () => this.currentProps.onNewTilesLoaded(track.uid)
        );

      default:
        console.warn('WARNING: unknown track type:', track.type);
        return new UnknownPixiTrack(
          this.pStage,
          {name: 'Unknown Track Type'}
        );
    }
  }

  /* ------------------------------- Render ------------------------------- */

  render() {
    return(
      <div
        ref={(c) => this.divTrackArea = c}
        style={{
          height: this.currentProps.height,
          width: this.currentProps.width
        }}
        styleName="track-renderer"
      >
        {this.currentProps.children}
      </div>
    );
  }
}

TrackRenderer.propTypes = {
  canvasElement: PropTypes.object,
  centerHeight: PropTypes.number,
  centerWidth: PropTypes.number,
  children: PropTypes.array,
  height: PropTypes.number,
  initialXDomain: PropTypes.array,
  initialYDomain: PropTypes.array,
  isRangeSelection: PropTypes.bool,
  leftWidth: PropTypes.number,
  marginLeft: PropTypes.number,
  marginTop: PropTypes.number,
  onScalesChanged: PropTypes.func,
  pixiStage: PropTypes.object,
  positionedTracks: PropTypes.array,
  svgElement: PropTypes.object,
  topHeight: PropTypes.number,
  width: PropTypes.number
}

export default TrackRenderer;
