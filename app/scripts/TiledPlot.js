import { select, event, clientPoint, mouse } from 'd3-selection';

import slugid from 'slugid';
import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { ResizeSensor, ElementQueries } from 'css-element-queries';

import CenterTrack from './CenterTrack';
import TrackRenderer from './TrackRenderer';
import AddTrackModal from './AddTrackModal';
import ConfigTrackMenu from './ConfigTrackMenu';
import CloseTrackMenu from './CloseTrackMenu';
import PopupMenu from './PopupMenu';
import ContextMenuContainer from './ContextMenuContainer';
import HorizontalTiledPlot from './HorizontalTiledPlot';
import VerticalTiledPlot from './VerticalTiledPlot';
import ViewContextMenu from './ViewContextMenu.js';
// import {HeatmapOptions} from './HeatmapOptions';

// Services
import { chromInfo } from './services';

// Utils
import {
  getTrackByUid,
  getTrackPositionByUid,
  pixelToGenomeLoci,
} from './utils';

// Configs
import { MOUSE_TOOL_SELECT, TRACKS_INFO_BY_TYPE } from './configs';

// Styles
import styles from '../styles/TiledPlot.module.scss';
import stylesCenterTrack from '../styles/CenterTrack.module.scss'; // eslint-disable-line no-unused-vars

export class TiledPlot extends React.Component {
  constructor(props) {
    super(props);

    this.closing = false;
    // that the tracks will be drawn on

    const tracks = this.props.tracks;

    this.xScale = null;
    this.yScale = null;

    this.addUidsToTracks(tracks);

    // Add names to all the tracks
    this.trackToReplace = null;
    this.trackRenderer = null;

    this.addTrackModal = null;
    this.configTrackMenu = null;

    /*
    let trackOptions = this.props.editable ?
        {'track': this.props.tracks.center[0].contents[0],
        'configComponent': HeatmapOptions}
        : null;
    */

    // these values should be changed in componentDidMount
    this.state = {
      sizeMeasured: false,
      height: 10,
      width: 10,

      tracks,
      addTrackPosition: null,
      mouseOverOverlayUid: null,
      // trackOptions: null
      // trackOptions: trackOptions
      forceUpdate: 0, // a random value that will be assigned by crucial functions to force an update

      rangeSelection: [
        null,
        null,
      ],

      chromInfo: null,
      contextMenuPosition: null,
    };

    // these dimensions are computed in the render() function and depend
    // on the sizes of the tracks in each section
    this.topHeight = 0;
    this.bottomHeight = 0;

    this.leftWidth = 0;
    this.rightWidth = 0;

    this.centerHeight = 0;
    this.centerWidth = 0;

    this.dragTimeout = null;
    this.previousPropsStr = '';

    /*
    this.getChromInfo = chromInfo.get(this.props.chromInfoPath).then(
      chromInfo => this.setState({ chromInfo }),
    );
    */
  }

  waitForDOMAttachment(callback) {
    if (!this.mounted)
      return;

    const thisElement = ReactDOM.findDOMNode(this);

    if (document.body.contains(thisElement)) {
      callback();
    } else {
      requestAnimationFrame(() => this.waitForDOMAttachment(callback));
    }
  }

  componentDidMount() {
    this.mounted = true;
    this.element = ReactDOM.findDOMNode(this);

    // new ResizeSensor(this.element, this.measureSize.bind(this));
    this.waitForDOMAttachment(() => {
      ElementQueries.listen();
      this.resizeSensor = new ResizeSensor(
        this.element.parentNode, this.measureSize.bind(this),
      );

      this.measureSize();
    });
  }

  componentWillReceiveProps(newProps) {
    this.addUidsToTracks(newProps.tracks);

    this.setState({
      tracks: newProps.tracks,
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    const thisPropsStr = this.previousPropsStr;
    const nextPropsStr = this.updatablePropsToString(nextProps);

    const thisStateStr = JSON.stringify(this.state);
    const nextStateStr = JSON.stringify(nextState);

    let toUpdate = false;

    if (thisPropsStr != nextPropsStr) { toUpdate = true; }

    if (toUpdate || thisStateStr != nextStateStr) { toUpdate = true; }

    toUpdate = toUpdate || (this.props.chooseTrackHandler != nextProps.chooseTrackHandler);

    if (toUpdate) { this.previousPropsStr = nextPropsStr; }

    return toUpdate;
  }

  componentWillUpdate() {
    /**
     * Need to determine the offset of this element relative to the canvas on which stuff
     * will be drawn
     */
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      (prevState.rangeSelection !== this.state.rangeSelection) &&
      this.props.onRangeSelection
    ) {
      this.props.onRangeSelection(this.state.rangeSelection);
    }
  }

  componentWillUnmount() {
    this.closing = true;
  }

  addUidsToTracks(tracks) {
    for (const key in tracks) {
      for (let i = 0; i < tracks[key].length; i++) {
        tracks[key][i].uid = tracks[key][i].uid ? tracks[key][i].uid : slugid.nice();
      }
    }
  }

  contextMenuHandler(e) {
    if (e.altKey) return;

    e.preventDefault();

    const mousePos = [e.clientX, e.clientY];
    // Relative mouse position
    const canvasMousePos = clientPoint(this.divTiledPlot, e);

    // the x and y values of the rendered plots
    // will be used if someone decides to draw a horizontal or vertical
    // rule
    const xVal = this.trackRenderer.zoomedXScale.invert(canvasMousePos[0]);
    const yVal = this.trackRenderer.zoomedYScale.invert(canvasMousePos[1]);

    this.setState({
      contextMenuPosition: {
        left: mousePos[0],
        top: mousePos[1],
        canvasLeft: canvasMousePos[0] + this.trackRenderer.xPositionOffset,
        canvasTop: canvasMousePos[1] + this.trackRenderer.yPositionOffset,
      },

      contextMenuX: xVal,
      contextMenuY: yVal,
    });
  }

  measureSize() {
    const heightOffset = 0;
    const height = this.element.clientHeight - heightOffset;
    const width = this.element.clientWidth;

    // console.log('TiledPlot height:', height, 'width:', width);

    if (width > 0 && height > 0) {
      this.setState({
        sizeMeasured: true,
        width,
        height,
      });
    }
  }

  handleTrackOptionsChanged(trackUid, newOptions) {
    /**
     * The drawing options for a track have changed.
     */
    return this.props.onTrackOptionsChanged(trackUid, newOptions);
  }

  handleScalesChanged(x, y) {
    this.xScale = x;
    this.yScale = y;

    this.props.onScalesChanged(x, y);
  }

  handleTilesetInfoReceived(trackUid, tilesetInfo) {
    /**
     * We've received information about a tileset from the server. Register it
     * with the track definition.
     * @param trackUid (string): The identifier for the track
     * @param tilesetInfo (object): Information about the track (hopefully including
     *                              its name.
     */
    const track = getTrackByUid(this.props.tracks, trackUid);

    if (!track.options) { track.options = {}; }

    // track.options.name = tilesetInfo.name;
    track.name = tilesetInfo.name;
    track.maxWidth = tilesetInfo.max_width;
    track.transforms = tilesetInfo.transforms;
    track.header = tilesetInfo.header;
    track.binsPerDimension = tilesetInfo.bins_per_dimension;
    track.maxZoom = tilesetInfo.max_zoom;
    track.coordSystem = tilesetInfo.coordSystem;
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


  handleTrackPositionChosen(position) {
    this.handleAddTrack(position);

    // have our parent close the menu
    // parent needs to do it because the button is located in the parent's scope
    this.props.onTrackPositionChosen(position);
  }


  handleNoTrackAdded() {
    /*
     * User hit cancel on the AddTrack dialog so we need to
     * just close it and do nothin
     */
    this.trackToReplace = null;

    this.props.onNoTrackAdded();

    this.setState({
      addTrackPosition: null,
      addTrackHost: null,
    });
  }

  handleDivideSeries(seriesUid) {
    /*
     * We want to create a new series that consists of this series
     * being divided by another. Useful for comparing two tracks
     * by division.
     *
     * Will start working with just heatmaps and then progress to
     * other track types.
     */


  }

  handleAddSeries(trackUid) {
    const trackPosition = getTrackPositionByUid(this.props.tracks, trackUid);
    const track = getTrackByUid(this.props.tracks, trackUid);

    this.setState({
      addTrackPosition: trackPosition,
      addTrackHost: track,
    });
  }

  handleReplaceTrack(uid, orientation) {
    /**
     * @param uid (string): The uid of the track to replace
     * @param orientation (string): The place where to put the new track
     */

    this.trackToReplace = uid;
    this.handleAddTrack(orientation);
  }

  handleAddTrack(position) {
    this.setState({
      addTrackPosition: position,
      addTrackHost: null,
    });
  }

  handleResizeTrack(uid, width, height) {
    const tracks = this.state.tracks;

    for (const trackType in tracks) {
      const theseTracks = tracks[trackType];

      const filteredTracks = theseTracks.filter(d => d.uid == uid);

      if (filteredTracks.length > 0) {
        filteredTracks[0].width = width;
        filteredTracks[0].height = height;
      }
    }

    this.setState({
      tracks,
      forceUpdate: Math.random(),
    });
  }


  closeMenus() {
    this.setState({
      closeTrackMenuId: null,
      configTrackMenuId: null,
      contextMenuPosition: null,
    });
  }
  handleLockValueScale(uid) {
    this.closeMenus();

    this.props.onLockValueScale(uid);
  }

  handleUnlockValueScale(uid) {
    this.closeMenus();

    this.props.onUnlockValueScale(uid);
  }

  handleCloseTrack(uid) {
    this.closeMenus();

    this.props.onCloseTrack(uid);
  }

  handleChangeTrackType(uid, newType) {
    // close the config track menu
    this.closeMenus();

    // change the track type
    this.props.onChangeTrackType(uid, newType);
  }

  handleTracksAdded(newTracks, position, host) {
    /**
     * Arguments
     * ---------
     *  newTracks: {object}
     *      The description of the track, including its type
     *      and data source.
     *  position: string
     *      Where to place this track
     *  host: track
     *    The existing track that we're adding the new one to
     *
     * Returns
     * -------
     *
     *  { uid: "", width: }:
     *      The trackConfig object describing this track. Essentially
     *      the newTrack object passed in with some extra information
     *      (such as the uid) added.
     */
    if (this.trackToReplace) {
      this.handleCloseTrack(this.trackToReplace);
      this.trackToReplace = null;
    }

    // if host is defined, then we're adding a new series
    // further down the chain a combined track will be created
    this.props.onTracksAdded(newTracks, position, host);

    this.setState({
      addTrackPosition: null,
      addTrackHost: null,
    });

    return newTracks;
  }

  handleCloseTrackMenuOpened(uid, clickPosition) {
    this.setState({
      closeTrackMenuId: uid,
      closeTrackMenuLocation: clickPosition,
    });
  }

  handleCloseContextMenu() {
    this.setState({
      contextMenuPosition: null,
      contextMenuX: null,
      contextMenuY: null,
    });
  }


  handleCloseTrackMenuClosed() {
    this.setState({
      closeTrackMenuId: null,
    });
  }

  handleConfigTrackMenuOpened(uid, clickPosition) {
    // let orientation = getTrackPositionByUid(uid);
    this.closeMenus();

    this.setState({
      configTrackMenuId: uid,
      configTrackMenuLocation: clickPosition,
    });
  }

  handleConfigureTrack(track, configComponent) {
    this.setState({
      configTrackMenuId: null,
      trackOptions: { track, configComponent },
    });

    this.closeMenus();
  }

  handleSortEnd(sortedTracks) {
    // some tracks were reordered in the list so we need to reorder them in the original
    // dataset
    const tracks = this.state.tracks;

    // calculate the positions of the sortedTracks
    const positions = {};
    for (let i = 0; i < sortedTracks.length; i++) {
      positions[sortedTracks[i].uid] = i;
    }

    for (const trackType in tracks) {
      const theseTracks = tracks[trackType];
      if (!theseTracks.length) { continue; }

      if (theseTracks[0].uid in positions) {
        const newTracks = new Array(theseTracks.length);
        // this is the right track position
        for (let i = 0; i < theseTracks.length; i++) {
          newTracks[positions[theseTracks[i].uid]] = theseTracks[i];
        }

        tracks[trackType] = newTracks;
      }
    }

    this.setState({
      tracks,
      forceUpdate: Math.random(),
    });
  }

  createTracksAndLocations() {
    const tracksAndLocations = [];
    const tracks = this.state.tracks;

    for (const trackType of ['top', 'left', 'right', 'bottom', 'center', 'whole']) {
      if (!(trackType in tracks))
        continue;

      for (let i = 0; i < tracks[trackType].length; i++) { tracksAndLocations.push({ track: tracks[trackType][i], location: trackType }); }
    }

    return tracksAndLocations;
  }

  calculateTrackPosition(track, location) {
    /**
     * Calculate where a track is absoluately positioned within the drawing area
     *
     * @param track: The track object (with members, e.g. track.uid, track.width, track.height)
     * @param location: Where it's being plotted (e.g. 'top', 'bottom')
     * @return: The position of the track and it's height and width
     *          (e.g. {left: 10, top: 20, width: 30, height: 40}
     */
    let top = this.props.verticalMargin,
      left = this.props.horizontalMargin;

    if (location == 'top') {
      left += this.leftWidth;
      top += 0;

      for (let i = 0; i < this.state.tracks.top.length; i++) {
        if (this.state.tracks.top[i].uid == track.uid) { break; } else { top += this.state.tracks.top[i].height; }
      }

      return { left,
        top,
        width: this.centerWidth,
        height: track.height,
        track };
    } else if (location == 'bottom') {
      left += this.leftWidth;
      top += this.topHeight + this.centerHeight;

      for (let i = 0; i < this.state.tracks.bottom.length; i++) {
        if (this.state.tracks.bottom[i].uid == track.uid) { break; } else { top += this.state.tracks.bottom[i].height; }
      }

      return { left,
        top,
        width: this.centerWidth,
        height: track.height,
        track };
    } else if (location == 'left') {
      top += this.topHeight;

      for (let i = 0; i < this.state.tracks.left.length; i++) {
        if (this.state.tracks.left[i].uid == track.uid) { break; } else { left += this.state.tracks.left[i].width; }
      }

      return { left,
        top,
        width: track.width,
        height: this.centerHeight,
        track };
    } else if (location == 'right') {
      left += this.leftWidth + this.centerWidth;
      top += this.topHeight;

      for (let i = 0; i < this.state.tracks.right.length; i++) {
        if (this.state.tracks.right[i].uid == track.uid) { break; } else { left += this.state.tracks.right[i].width; }
      }

      return { left,
        top,
        width: track.width,
        height: this.centerHeight,
        track };
    } else if (location == 'center') {
      left += this.leftWidth;
      top += this.topHeight;

      return { left,
        top,
        width: this.centerWidth,
        height: this.centerHeight,
        track };
    } else {
      // fall back on 'whole' tracks
      if (location != 'whole') {
        console.warn('Track with unknown position present:', location, track);
      }

      return {
        top: this.props.verticalMargin,
        left: this.props.horizontalMargin,
        width: this.leftWidth + this.centerWidth + this.rightWidth,
        height: this.topHeight + this.centerHeight + this.bottomHeight,
        track
      }
    }
  }

  positionedTracks() {
    /**
     * Return the current set of tracks along with their positions
     * and dimensions
     */
    const tracksAndLocations = this.createTracksAndLocations()
      .map(({ track, location }) => this.calculateTrackPosition(track, location));


    return tracksAndLocations;
  }

  createTrackPositionTexts() {
    /**
     * Create little text fields that show the position and width of
     * each track, just to show that we can calculate that and pass
     * it to the rendering context.
     */
    const positionedTracks = this.positionedTracks();
    this.createTracksAndLocations();

    const trackElements = positionedTracks.map((trackPosition) => {
      const track = trackPosition.track;

      return (
        <div
          key={track.uid}
          style={{
            left: trackPosition.left,
            top: trackPosition.top,
            width: trackPosition.width,
            height: trackPosition.height,
            position: 'absolute',
          }}
        >
          {track.uid.slice(0, 2)}
        </div>
      );
    });

    return (trackElements);
  }

  handleExportTrackData(hostTrackUid, trackUid) {
    /*
     * Export the data present in a track. Whether a track can export data is defined
     * in the track type definition in config.js
     */
    const track = getTrackByUid(this.props.tracks, trackUid);
    let trackObject = null;

    if (hostTrackUid != trackUid) {
      // the track whose data we're trying to export is part of a combined track
      trackObject = this.trackRenderer.trackDefObjects[hostTrackUid].trackObject.createdTracks[track.uid];
    } else {
      trackObject = this.trackRenderer.trackDefObjects[hostTrackUid].trackObject.createdTracks[track.uid];
    }

    trackObject.exportData();
  }

  /**
   * List all the tracks that are under this mouse position
   */
  listTracksAtPosition(x, y, isReturnTrackObj = false) {
    const trackObjectsAtPosition = [];

    for (const uid in this.trackRenderer.trackDefObjects) {
      const trackObj = this.trackRenderer.trackDefObjects[uid].trackObject;

      if (trackObj.respondsToPosition(x, y)) {
        // check if this track wishes to respond to events at position x,y
        // by default, this is true
        // it is false in tracks like the horizontal and vertical rule which only
        // wish to be identified if the mouse is directly over them

        if (isReturnTrackObj) {
          // This should be much simpler to determine...
          trackObj.is2d = this.trackRenderer.trackDefObjects[uid].trackDef.track.type === 'combined'
            ? this.trackRenderer.trackDefObjects[uid].trackDef.track.contents
              .some(track => TRACKS_INFO_BY_TYPE[track.type].orientation)
            : TRACKS_INFO_BY_TYPE[
              this.trackRenderer.trackDefObjects[uid].trackDef.track.type
            ].orientation === '2d';

          trackObjectsAtPosition.push(trackObj);
        } else {
          trackObjectsAtPosition.push(
            this.trackRenderer.trackDefObjects[uid].trackDef.track
          );
        }
      }
    }

    return trackObjectsAtPosition;
  }

  listAllTrackObjects() {
    /**
     * Get a list of all the track objects in this
     * view.
     *
     * These are the objects that do the drawing, not the track
     * definitions in the viewconf.
     *
     * Returns
     * -------
     *  trackObjects: []
     *    A list of the track objects in this view
     */
    const trackObjectsToCheck = [];

    for (const uid in this.trackRenderer.trackDefObjects) {
      const tdo = this.trackRenderer.trackDefObjects[uid];

      // if this is a combined track then we need to recurse into its
      // subtracks
      if (tdo.trackObject.createdTracks) {
        for (const uid1 in tdo.trackObject.createdTracks) {
          const trackObject = tdo.trackObject.createdTracks[uid1];
          trackObjectsToCheck.push(trackObject);
        }
      } else {
        trackObjectsToCheck.push(tdo.trackObject);
      }
    }

    return trackObjectsToCheck;
  }

  handleZoomToData() {
    /**
     * Try to zoom in or out so that the bounds of the view correspond to the
     * extent of the data.
     */
    const minPos = [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];
    const maxPos = [Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];

    const trackObjectsToCheck = this.listAllTrackObjects();

    // go through every track definition
    for (const trackObject of trackObjectsToCheck) {
      // get the minimum and maximum positions of all the subtracks
      if (trackObject.tilesetInfo) {
        if (trackObject.tilesetInfo.min_pos) {
          for (let j = 0; j < trackObject.tilesetInfo.min_pos.length; j++) {
            if (trackObject.tilesetInfo.min_pos[j] < minPos[j]) { minPos[j] = trackObject.tilesetInfo.min_pos[j]; }

            if (trackObject.tilesetInfo.max_pos[j] > maxPos[j]) { maxPos[j] = trackObject.tilesetInfo.max_pos[j]; }
          }
        }
      }
    }

    // set the initial domain
    let newXDomain = [
      this.trackRenderer.currentProps.marginLeft + this.trackRenderer.currentProps.leftWidth,
      this.trackRenderer.currentProps.marginLeft + this.trackRenderer.currentProps.leftWidth + this.trackRenderer.currentProps.centerWidth,
    ].map(this.trackRenderer.zoomTransform.rescaleX(this.trackRenderer.xScale).invert);

    let newYDomain = [
      this.trackRenderer.currentProps.marginTop + this.trackRenderer.currentProps.topHeight,
      this.trackRenderer.currentProps.marginTop + this.trackRenderer.currentProps.topHeight + this.trackRenderer.currentProps.centerHeight,
    ].map(this.trackRenderer.zoomTransform.rescaleY(this.trackRenderer.yScale).invert);

    // reset the zoom transform
    this.trackRenderer.zoomTransform.k = 1;

    this.trackRenderer.zoomTransform.x = 0;
    this.trackRenderer.zoomTransform.y = 0;
    this.trackRenderer.applyZoomTransform();


    if (minPos[0] < Number.MAX_SAFE_INTEGER && maxPos[0] > Number.MIN_SAFE_INTEGER) { newXDomain = [minPos[0], maxPos[0]]; }

    if (minPos[1] < Number.MAX_SAFE_INTEGER && maxPos[1] > Number.MIN_SAFE_INTEGER) { newYDomain = [minPos[1], maxPos[1]]; }


    this.props.onDataDomainChanged(newXDomain, newYDomain);
  }

  updatablePropsToString(props) {
    return JSON.stringify({
      tracks: props.tracks,
      uid: props.uid,
      addTrackPosition: props.addTrackPosition,
      editable: props.editable,
      horizontalMargin: props.horizontalMargin,
      mouseTool: props.mouseTool,
      verticalTiledPlot: props.verticalMargin,
      initialXDomain: props.initialXDomain,
      initialYDomain: props.initialYDomain,
      trackSourceServers: props.trackSourceServers,
      zoomable: props.zoomable,
    });
  }

  rangeToGenomeLoci(range, scale) {
    if (!scale || !this.state.chromInfo) return null;

    return pixelToGenomeLoci(
      parseInt(scale.invert(range[0]), 10),
      parseInt(scale.invert(range[1]), 10),
      this.state.chromInfo,
    );
  }

  rangeSelectionEndHandler() {
    if (this.state.rangeSelectionMaster) {
      this.setState({
        is1dRangeSelection: null,
        rangeSelection: [null, null],
        rangeSelectionMaster: null,
      });
    }
  }

  rangeSelection1dHandler(axis) {
    const scale = axis === 'x' ? this.xScale : this.yScale;

    return (range) => {
      const newRangeSelection = this.state.is1dRangeSelection ?
        [null, null] : this.state.rangeSelection.slice();

      const accessor = !this.state.is1dRangeSelection && axis === 'y' ? 1 : 0;

      newRangeSelection[accessor] = this.rangeToGenomeLoci(range, scale);

      this.setState({
        rangeSelection: newRangeSelection,
      });
    };
  }

  rangeSelection1dStartHandler() {
    if (!this.state.rangeSelectionMaster) {
      this.setState({
        is1dRangeSelection: true,
        rangeSelectionMaster: true,
      });
    }
  }

  rangeSelection2dHandler(range) {
    this.setState({
      rangeSelection: [
        this.rangeToGenomeLoci(range[0], this.xScale),
        this.rangeToGenomeLoci(range[1], this.yScale),
      ],
    });
  }

  rangeSelection2dStartHandler() {
    if (!this.state.rangeSelectionMaster) {
      this.setState({
        is1dRangeSelection: false,
        rangeSelectionMaster: true,
      });
    }
  }

  getContextMenu() {
    if (this.state.contextMenuPosition) {
      const relevantTracks = this.listTracksAtPosition(
        this.state.contextMenuPosition.canvasLeft,
        this.state.contextMenuPosition.canvasTop
      );

      return (
        <PopupMenu
          onMenuClosed={this.closeMenus.bind(this)}
        >
          <ViewContextMenu
            closeMenu={this.closeMenus.bind(this)}
            coords={[this.state.contextMenuX, this.state.contextMenuY]}
            onAddSeries={this.handleAddSeries.bind(this)}
            // Can only add one new track at a time
            // because "whole" tracks are always drawn on top of each other,
            // the notion of Series is unnecessary and so 'host' is null
            onAddTrack={(newTrack) => {
              this.props.onTracksAdded([newTrack], 'whole', null);
              this.handleCloseContextMenu();
            }}
            onChangeTrackType={this.handleChangeTrackType.bind(this)}
            onCloseTrack={this.handleCloseTrack.bind(this)}
            onConfigureTrack={this.handleConfigureTrack.bind(this)}
            onExportData={this.handleExportTrackData.bind(this)}
            onLockValueScale={this.handleLockValueScale.bind(this)}
            onReplaceTrack={this.handleReplaceTrack.bind(this)}
            onTrackOptionsChanged={this.handleTrackOptionsChanged.bind(this)}
            onUnlockValueScale={this.handleUnlockValueScale.bind(this)}
            orientation={'left'}
            position={this.state.contextMenuPosition}
            tracks={relevantTracks}
          />
        </PopupMenu>
      );
    }

    return null;
  }

  render() {
    // left, top, right, and bottom have fixed heights / widths
    // the center will vary to accomodate their dimensions
    this.topHeight = this.props.tracks.top
      .map(x => x.height)
      .reduce((a, b) => a + b, 0);
    this.bottomHeight = this.props.tracks.bottom
      .map(x => x.height)
      .reduce((a, b) => a + b, 0);
    this.leftWidth = this.props.tracks.left
      .map(x => x.width)
      .reduce((a, b) => a + b, 0);
    this.rightWidth = this.props.tracks.right
      .map(x => x.width)
      .reduce((a, b) => a + b, 0);

    this.centerHeight = (
      this.state.height -
      this.topHeight -
      this.bottomHeight -
      (2 * this.props.verticalMargin)
    );
    this.centerWidth = (
      this.state.width -
      this.leftWidth -
      this.rightWidth -
      (2 * this.props.horizontalMargin)
    );

    const trackOutline = 'none';

    const topTracks = (
      <div
        key="topTracksDiv"
        style={{
          left: this.leftWidth + this.props.horizontalMargin,
          top: this.props.verticalMargin,
          width: this.centerWidth,
          height: this.topHeight,
          outline: trackOutline,
          position: 'absolute',
        }}
      >
        <HorizontalTiledPlot
          configTrackMenuId={this.state.configTrackMenuId}
          chromInfo={this.state.chromInfo}
          editable={this.props.editable}
          handleConfigTrack={this.handleConfigTrackMenuOpened.bind(this)}
          handleResizeTrack={this.handleResizeTrack.bind(this)}
          handleSortEnd={this.handleSortEnd.bind(this)}
          is1dRangeSelection={this.state.is1dRangeSelection}
          isRangeSelectionActive={this.props.mouseTool === MOUSE_TOOL_SELECT}
          onAddSeries={this.handleAddSeries.bind(this)}
          onCloseTrack={this.handleCloseTrack.bind(this)}
          onCloseTrackMenuOpened={this.handleCloseTrackMenuOpened.bind(this)}
          onConfigTrackMenuOpened={this.handleConfigTrackMenuOpened.bind(this)}
          onRangeSelection={this.rangeSelection1dHandler('x').bind(this)}
          onRangeSelectionEnd={this.rangeSelectionEndHandler.bind(this)}
          onRangeSelectionStart={this.rangeSelection1dStartHandler.bind(this)}
          rangeSelection={this.state.rangeSelection}
          resizeHandles={new Set(['bottom'])}
          scale={this.xScale}
          tracks={this.props.tracks.top}
          width={this.centerWidth}
        />
      </div>
    );

    const leftTracks = (
      <div
        key="leftTracksPlot"
        style={{
          left: this.props.horizontalMargin,
          top: this.topHeight + this.props.verticalMargin,
          width: this.leftWidth,
          height: this.centerHeight,
          outline: trackOutline,
          position: 'absolute',
        }}
      >
        <VerticalTiledPlot
          configTrackMenuId={this.state.configTrackMenuId}
          chromInfo={this.state.chromInfo}
          editable={this.props.editable}
          handleConfigTrack={this.handleConfigTrackMenuOpened.bind(this)}
          handleResizeTrack={this.handleResizeTrack.bind(this)}
          handleSortEnd={this.handleSortEnd.bind(this)}
          height={this.centerHeight}
          is1dRangeSelection={this.state.is1dRangeSelection}
          isRangeSelectionActive={this.props.mouseTool === MOUSE_TOOL_SELECT}
          onAddSeries={this.handleAddSeries.bind(this)}
          onCloseTrack={this.handleCloseTrack.bind(this)}
          onCloseTrackMenuOpened={this.handleCloseTrackMenuOpened.bind(this)}
          onConfigTrackMenuOpened={this.handleConfigTrackMenuOpened.bind(this)}
          onRangeSelection={this.rangeSelection1dHandler('y').bind(this)}
          onRangeSelectionEnd={this.rangeSelectionEndHandler.bind(this)}
          onRangeSelectionStart={this.rangeSelection1dStartHandler.bind(this)}
          rangeSelection={this.state.rangeSelection}
          resizeHandles={new Set(['right'])}
          scale={this.yScale}
          tracks={this.props.tracks.left}
        />
      </div>
    );

    const rightTracks = (
      <div style={{
        right: this.props.horizontalMargin,
        top: this.topHeight + this.props.verticalMargin,
        width: this.rightWidth,
        height: this.centerHeight,
        outline: trackOutline,
        position: 'absolute',
      }}
      >
        <VerticalTiledPlot
          configTrackMenuId={this.state.configTrackMenuId}
          chromInfo={this.state.chromInfo}
          editable={this.props.editable}
          handleConfigTrack={this.handleConfigTrackMenuOpened.bind(this)}
          handleResizeTrack={this.handleResizeTrack.bind(this)}
          handleSortEnd={this.handleSortEnd.bind(this)}
          height={this.centerHeight}
          is1dRangeSelection={this.state.is1dRangeSelection}
          isRangeSelectionActive={this.props.mouseTool === MOUSE_TOOL_SELECT}
          onAddSeries={this.handleAddSeries.bind(this)}
          onCloseTrack={this.handleCloseTrack.bind(this)}
          onCloseTrackMenuOpened={this.handleCloseTrackMenuOpened.bind(this)}
          onConfigTrackMenuOpened={this.handleConfigTrackMenuOpened.bind(this)}
          onRangeSelection={this.rangeSelection1dHandler('y').bind(this)}
          onRangeSelectionEnd={this.rangeSelectionEndHandler.bind(this)}
          onRangeSelectionStart={this.rangeSelection1dStartHandler.bind(this)}
          rangeSelection={this.state.rangeSelection}
          resizeHandles={new Set(['left'])}
          scale={this.yScale}
          tracks={this.props.tracks.right}
          tracksControlAlignLeft={true}
        />
      </div>
    );

    const bottomTracks = (
      <div style={{
        left: this.leftWidth + this.props.horizontalMargin,
        bottom: this.props.verticalMargin,
        width: this.centerWidth,
        height: this.bottomHeight,
        outline: trackOutline,
        position: 'absolute',
      }}
      >
        <HorizontalTiledPlot
          configTrackMenuId={this.state.configTrackMenuId}
          chromInfo={this.state.chromInfo}
          editable={this.props.editable}
          handleConfigTrack={this.handleConfigTrackMenuOpened.bind(this)}
          handleResizeTrack={this.handleResizeTrack.bind(this)}
          handleSortEnd={this.handleSortEnd.bind(this)}
          is1dRangeSelection={this.state.is1dRangeSelection}
          isRangeSelectionActive={this.props.mouseTool === MOUSE_TOOL_SELECT}
          onAddSeries={this.handleAddSeries.bind(this)}
          onCloseTrack={this.handleCloseTrack.bind(this)}
          onCloseTrackMenuOpened={this.handleCloseTrackMenuOpened.bind(this)}
          onConfigTrackMenuOpened={this.handleConfigTrackMenuOpened.bind(this)}
          onRangeSelection={this.rangeSelection1dHandler('x').bind(this)}
          onRangeSelectionEnd={this.rangeSelectionEndHandler.bind(this)}
          onRangeSelectionStart={this.rangeSelection1dStartHandler.bind(this)}
          rangeSelection={this.state.rangeSelection}
          resizeHandles={new Set(['top'])}
          scale={this.xScale}
          tracks={this.props.tracks.bottom}
          width={this.centerWidth}
        />
      </div>
    );

    let centerTrack = (
      <div
        style={{
          left: this.leftWidth + this.props.horizontalMargin,
          top: this.props.verticalMargin + this.topHeight,
          width: this.centerWidth,
          height: this.bottomHeight,
          outline: trackOutline,
        }}
        styleName="stylesCenterTrack.center-track-container"
      />
    );

    if (this.props.tracks.center.length) {
      centerTrack = (
        <div
          style={{
            left: this.leftWidth + this.props.horizontalMargin,
            top: this.props.verticalMargin + this.topHeight,
            width: this.centerWidth,
            height: this.centerHeight,
            outline: trackOutline,
          }}
          styleName="stylesCenterTrack.center-track-container"
        >
          <CenterTrack
            configTrackMenuId={this.state.configTrackMenuId}
            chromInfo={this.state.chromInfo}
            editable={this.props.editable}
            height={this.centerHeight}
            is1dRangeSelection={this.state.is1dRangeSelection}
            isRangeSelectionActive={this.props.mouseTool === MOUSE_TOOL_SELECT}
            onAddSeries={this.handleAddSeries.bind(this)}
            onCloseTrackMenuOpened={this.handleCloseTrackMenuOpened.bind(this)}
            onConfigTrackMenuOpened={this.handleConfigTrackMenuOpened.bind(this)}
            onRangeSelectionEnd={this.rangeSelectionEndHandler.bind(this)}
            onRangeSelectionStart={this.rangeSelection2dStartHandler.bind(this)}
            onRangeSelectionX={this.rangeSelection1dHandler('x').bind(this)}
            onRangeSelectionXY={this.rangeSelection2dHandler.bind(this)}
            onRangeSelectionY={this.rangeSelection1dHandler('y').bind(this)}
            rangeSelection={this.state.rangeSelection}
            scaleX={this.xScale}
            scaleY={this.yScale}
            tracks={this.props.tracks.center}
            uid={this.props.tracks.center[0].uid}
            width={this.centerWidth}
          />
        </div>
      );
    }

    this.createTrackPositionTexts();

    const positionedTracks = this.positionedTracks();

    let trackRenderer = null;
    if (this.state.sizeMeasured) {
      trackRenderer = (
        <TrackRenderer
          // Reserved props
          ref={(c) => { this.trackRenderer = c; }}

          // Custom props
          canvasElement={this.props.canvasElement}
          centerHeight={this.centerHeight}
          centerWidth={this.centerWidth}
          dragging={this.props.dragging}
          height={this.state.height}
          initialXDomain={this.props.initialXDomain}
          initialYDomain={this.props.initialYDomain}
          isRangeSelection={this.props.mouseTool === MOUSE_TOOL_SELECT}
          leftWidth={this.leftWidth}
          marginLeft={this.props.horizontalMargin}
          marginTop={this.props.verticalMargin}
          onMouseMoveZoom={this.props.onMouseMoveZoom}
          onNewTilesLoaded={this.props.onNewTilesLoaded}
          onScalesChanged={this.handleScalesChanged.bind(this)}
          onTilesetInfoReceived={this.handleTilesetInfoReceived.bind(this)}
          onTrackOptionsChanged={this.handleTrackOptionsChanged.bind(this)}
          onValueScaleChanged={this.props.onValueScaleChanged}
          pixiStage={this.props.pixiStage}
          positionedTracks={positionedTracks}
          registerDraggingChangedListener={this.props.registerDraggingChangedListener}
          removeDraggingChangedListener={this.props.removeDraggingChangedListener}
          setCentersFunction={this.props.setCentersFunction}
          svgElement={this.props.svgElement}
          topHeight={this.topHeight}
          uid={this.props.uid}
          width={this.state.width}
          zoomable={this.props.zoomable}
        >
          {topTracks}
          {leftTracks}
          {rightTracks}
          {bottomTracks}
          {centerTrack}
        </TrackRenderer>
      );
    }

    let configTrackMenu = null;
    let closeTrackMenu = null;

    if (this.state.configTrackMenuId) {
      configTrackMenu = (
        <PopupMenu
          onMenuClosed={this.closeMenus.bind(this)}
        >
          <ConfigTrackMenu
            closeMenu={this.closeMenus.bind(this)}
            onAddSeries={this.handleAddSeries.bind(this)}
            onAddTrack={this.handleAddTrack.bind(this)}
            onChangeTrackType={this.handleChangeTrackType.bind(this)}
            onCloseTrack={this.handleCloseTrack.bind(this)}
            onConfigureTrack={this.handleConfigureTrack.bind(this)}
            onExportData={this.handleExportTrackData.bind(this)}
            onLockValueScale={this.handleLockValueScale.bind(this)}
            onReplaceTrack={this.handleReplaceTrack.bind(this)}
            onTrackOptionsChanged={this.handleTrackOptionsChanged.bind(this)}
            onUnlockValueScale={this.handleUnlockValueScale.bind(this)}
            ref={c => this.configTrackMenu = c}
            position={this.state.configTrackMenuLocation}
            tracks={[getTrackByUid(this.props.tracks, this.state.configTrackMenuId)]}
            trackOrientation={getTrackPositionByUid(this.props.tracks, this.state.configTrackMenuId)}
          />
        </PopupMenu>
      );
    }

    if (this.state.closeTrackMenuId) {
      closeTrackMenu = (
        <PopupMenu
          onMenuClosed={this.handleCloseTrackMenuClosed.bind(this)}
        >
          <ContextMenuContainer
            position={this.state.closeTrackMenuLocation}
          >
            <CloseTrackMenu
              onCloseTrack={this.handleCloseTrack.bind(this)}
              tracks={[getTrackByUid(this.props.tracks, this.state.closeTrackMenuId)]}
            />
          </ContextMenuContainer>
        </PopupMenu>
      );
    }

    let overlays = null;
    if (this.props.chooseTrackHandler) {
      // We want to choose a track and call a function. To choose the track, we display
      // an overlay on top of each track
      overlays = positionedTracks.map((pTrack) => {
        let background = 'transparent';
        let border = 'none';

        if (this.state.mouseOverOverlayUid == pTrack.track.uid) {
          background = 'yellow';
          border = '1px solid black';
        }

        return (
          <div
            className={'tiled-plot-track-overlay'}
            key={pTrack.track.uid}

            // we want to remove the mouseOverOverlayUid so that next time we try
            // to choose an overlay track, the previously selected one isn't
            // automatically highlighted
            onClick={() => {
              this.setState({ mouseOverOverlayUid: null });
              this.props.chooseTrackHandler(pTrack.track.uid);
            }}
            onMouseEnter={() => this.handleOverlayMouseEnter(pTrack.track.uid)}
            onMouseLeave={() => this.handleOverlayMouseLeave(pTrack.track.uid)}
            style={{
              position: 'absolute',
              left: pTrack.left,
              top: pTrack.top,
              width: pTrack.width,
              height: pTrack.height,
              background,
              opacity: 0.4,
              border,
            }}
          />
        );
      });
    }

    let trackOptionsElement = null;

    if (this.xScale && this.yScale && this.props.editable && this.state.trackOptions) {
      const configComponent = this.state.trackOptions.configComponent;
      const track = this.state.trackOptions.track;

      trackOptionsElement = React.createElement(
        configComponent,
        {
          track,
          xScale: this.xScale,
          yScale: this.yScale,
          onCancel: () => {
            this.setState({
              trackOptions: null,
            },
            );
          },
          onTrackOptionsChanged: newOptions => newOptions,
          onSubmit: (newOptions) => {
            this.handleTrackOptionsChanged(
              this.state.trackOptions.track.uid,
              newOptions,
            );
            this.setState({
              trackOptions: null,
            });
          },
        },
      );
    }

    let addTrackModal = null;
    const position = this.state.addTrackPosition ?
      this.state.addTrackPosition : this.props.addTrackPosition;

    if (this.state.addTrackPosition || this.props.addTrackPosition) {
      addTrackModal =
        (<AddTrackModal
          host={this.state.addTrackHost}
          onCancel={this.handleNoTrackAdded.bind(this)}
          onTracksChosen={this.handleTracksAdded.bind(this)}
          position={position}
          ref={(c) => { this.addTrackModal = c; }}
          show={this.state.addTrackPosition != null || this.props.addTrackPosition != null}
          trackSourceServers={this.props.trackSourceServers}
        />);
    }

    // track renderer needs to enclose all the other divs so that it
    // can catch the zoom events
    return (
      <div
        ref={(c) => { this.divTiledPlot = c; }}
        className="tiled-plot-div"
        onContextMenu={this.contextMenuHandler.bind(this)}
        styleName="styles.tiled-plot"
      >
        {trackRenderer}
        {overlays}
        {addTrackModal}
        {configTrackMenu}
        {closeTrackMenu}
        {trackOptionsElement}
        {this.getContextMenu()}
      </div>
    );
  }
}

TiledPlot.propTypes = {
  addTrackPosition: PropTypes.string,
  canvasElement: PropTypes.object,
  chooseTrackHandler: PropTypes.func,
  chromInfoPath: PropTypes.string,
  dragging: PropTypes.bool,
  editable: PropTypes.bool,
  horizontalMargin: PropTypes.number,
  initialXDomain: PropTypes.array,
  initialYDomain: PropTypes.array,
  mouseTool: PropTypes.string,
  onCloseTrack: PropTypes.func,
  onDataDomainChanged: PropTypes.func,
  onLockValueScale: PropTypes.func,
  onMouseMoveZoom: PropTypes.func,
  onNoTrackAdded: PropTypes.func,
  onNewTilesLoaded: PropTypes.func,
  onRangeSelection: PropTypes.func,
  onScalesChanged: PropTypes.func,
  onTracksAdded: PropTypes.func,
  onTrackOptionsChanged: PropTypes.func,
  onTrackPositionChosen: PropTypes.func,
  onValueScaleChanged: PropTypes.func,
  onUnlockValueScale: PropTypes.func,
  registerDraggingChangedListener: PropTypes.func,
  removeDraggingChangedListener: PropTypes.func,
  setCentersFunction: PropTypes.func,
  pixiStage: PropTypes.object,
  svgElement: PropTypes.object,
  trackSourceServers: PropTypes.array,
  tracks: PropTypes.object,
  'tracks.top': PropTypes.array,
  'tracks.bottom': PropTypes.array,
  'tracks.left': PropTypes.array,
  'tracks.right': PropTypes.array,
  verticalMargin: PropTypes.number,
  uid: PropTypes.string,
  zoomable: PropTypes.bool,
};

export default TiledPlot;
