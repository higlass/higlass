import { clientPoint } from 'd3-selection';
import slugid from 'slugid';
import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { ResizeSensor, ElementQueries } from 'css-element-queries';

// Components
import ContextMenuItem from './ContextMenuItem';
import CenterTrack from './CenterTrack';
import DragListeningDiv from './DragListeningDiv';
import GalleryTracks from './GalleryTracks';
import TrackRenderer from './TrackRenderer';
import AddTrackModal from './AddTrackModal';
import ConfigTrackMenu from './ConfigTrackMenu';
import CloseTrackMenu from './CloseTrackMenu';
import PopupMenu from './PopupMenu';
import ContextMenuContainer from './ContextMenuContainer';
import HorizontalTiledPlot from './HorizontalTiledPlot';
import VerticalTiledPlot from './VerticalTiledPlot';
import ViewContextMenu from './ViewContextMenu';
// import {HeatmapOptions} from './HeatmapOptions';

// Higher-order components
import withPubSub from './hocs/with-pub-sub';

// Utils
import {
  dataToGenomicLoci,
  getTrackByUid,
  getTrackPositionByUid,
  isWithin,
  sum,
} from './utils';

// Configs
import {
  DEFAULT_TRACKS_FOR_DATATYPE,
  MOUSE_TOOL_SELECT,
  TRACKS_INFO_BY_TYPE,
  TRACK_LOCATIONS
} from './configs';

// Styles
import styles from '../styles/TiledPlot.module.scss'; // eslint-disable-line no-unused-vars
import stylesCenterTrack from '../styles/CenterTrack.module.scss'; // eslint-disable-line no-unused-vars

class TiledPlot extends React.Component {
  constructor(props) {
    super(props);

    this.closing = false;
    // that the tracks will be drawn on

    const { tracks } = this.props;
    this.canvasElement = null;

    this.tracksByUidInit = {};
    [
      ...(this.props.tracks.top || []),
      ...(this.props.tracks.right || []),
      ...(this.props.tracks.bottom || []),
      ...(this.props.tracks.left || []),
      ...(this.props.tracks.gallery || []),
      ...(this.props.tracks.center || []),
    ].forEach((track) => {
      if (track.type === 'combined') {
        // Damn this combined track...
        track.contents.forEach((track2) => {
          this.tracksByUidInit[track2.uid] = false;
        });
      } else {
        this.tracksByUidInit[track.uid] = false;
      }
    });

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
      init: false,
      addTrackPosition: null,
      mouseOverOverlayUid: null,
      // trackOptions: null
      // trackOptions: trackOptions
      forceUpdate: 0, // a random value that will be assigned by
      // crucial functions to force an update

      rangeSelection: [
        null,
        null,
      ],
      rangeSelectionEnd: false,

      chromInfo: null,
      defaultChromSizes: null,
      contextMenuCustomItems: null,
      contextMenuPosition: null,
      addDivisorDialog: null,
    };

    if (window.higlassTracksByType) {
      // Extend `TRACKS_INFO_BY_TYPE` with the configs of plugin tracks.
      Object.keys(window.higlassTracksByType).forEach((pluginTrackType) => {
        TRACKS_INFO_BY_TYPE[pluginTrackType] = window.higlassTracksByType[pluginTrackType].config;
      });
    }

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

    this.contextMenuHandlerBound = this.contextMenuHandler.bind(this);
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
    this.mounted = true;
    this.element = ReactDOM.findDOMNode(this);
    this.canvasElement = ReactDOM.findDOMNode(this.props.canvasElement);

    // new ResizeSensor(this.element, this.measureSize.bind(this));
    this.waitForDOMAttachment(() => {
      ElementQueries.listen();
      this.resizeSensor = new ResizeSensor(
        this.element.parentNode, this.measureSize.bind(this),
      );

      this.measureSize();
    });

    // add event listeners for drag and drop events
    this.addEventListeners();
    // this.getDefaultChromSizes();

    this.pubSubs = [];
    this.pubSubs.push(
      this.props.pubSub.subscribe('contextmenu', this.contextMenuHandlerBound)
    );
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

    const toUpdate = (
      thisPropsStr !== nextPropsStr
      || thisStateStr !== nextStateStr
      || this.props.chooseTrackHandler !== nextProps.chooseTrackHandler
    );

    if (toUpdate) this.previousPropsStr = nextPropsStr;

    return toUpdate;
  }

  componentWillUpdate() {
    /**
     * Need to determine the offset of this element relative to the canvas on which stuff
     * will be drawn
     */
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.rangeSelection !== this.state.rangeSelection) {
      let genomicRange = [null, null]; // Default range

      if (
        this.state.defaultChromSizes
        && this.state.rangeSelection.every(range => range && range.length)
      ) {
        // Convert data into genomic loci
        genomicRange = this.state.rangeSelection
          .map(range => dataToGenomicLoci(
            ...range,
            this.state.defaultChromSizes
          ));
      }

      this.props.onRangeSelection({
        dataRange: this.state.rangeSelection,
        genomicRange
      });
    }

    if (prevProps.tracks.center !== this.props.tracks.center) {
      // this.getDefaultChromSizes();
    }
  }

  componentWillUnmount() {
    this.closing = true;

    this.removeEventListeners();
    this.pubSubs.forEach(subscription => this.props.pubSub.unsubscribe(subscription));
  }

  addUidsToTracks(tracks) {
    for (const key in tracks) {
      for (let i = 0; i < tracks[key].length; i++) {
        tracks[key][i].uid = tracks[key][i].uid ? tracks[key][i].uid : slugid.nice();
      }
    }
  }

  /*
  getDefaultChromSizes() {
    try {
      const centralHeatmap = this.findCentralHeatmapTrack(
        this.props.tracks.center
      );
      this.getChromInfo = chromInfo
        .get(`${centralHeatmap.server}/chrom-sizes/?id=${centralHeatmap.tilesetUid}`)
        .then(defaultChromSizes => this.setState({ defaultChromSizes }));
    } catch (err) {  }
  }
  */

  contextMenuHandler(e) {
    if (!this.divTiledPlot) return;

    const bBox = this.divTiledPlot.getBoundingClientRect();
    const isClickWithin = isWithin(
      e.clientX, e.clientY,
      bBox.left, bBox.left + bBox.width,
      bBox.top, bBox.top + bBox.height,
    );

    if (!isClickWithin) return;

    const mousePos = [e.clientX, e.clientY];
    // Relative mouse position
    const canvasMousePos = clientPoint(this.divTiledPlot, e);

    // the x and y values of the rendered plots
    // will be used if someone decides to draw a horizontal or vertical
    // rule
    const xVal = this.trackRenderer.zoomedXScale.invert(canvasMousePos[0]);
    const yVal = this.trackRenderer.zoomedYScale.invert(canvasMousePos[1]);

    let contextMenuCustomItems = null;
    if (e.hgCustomItems) {
      contextMenuCustomItems = e.hgCustomItems.map(item => (
        <ContextMenuItem
          key={item.key}
          onClick={item.onClick}
        >
          {item.text}
        </ContextMenuItem>
      ));
    }

    this.setState({
      contextMenuCustomItems,
      contextMenuPosition: {
        left: mousePos[0],
        top: mousePos[1],
        canvasLeft: canvasMousePos[0] + this.trackRenderer.xPositionOffset,
        canvasTop: canvasMousePos[1] + this.trackRenderer.yPositionOffset,
      },
      contextMenuDataX: xVal,
      contextMenuDataY: yVal,
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

  /**
   * We've received information about a tileset from the server. Register it
   * with the track definition.
   * @param trackUid (string): The identifier for the track
   * @param tilesetInfo (object): Information about the track (hopefully including
   *                              its name.
   */
  handleTilesetInfoReceived(trackUid, tilesetInfo) {
    const track = getTrackByUid(this.props.tracks, trackUid);

    if (!track) {
      console.warn('Strange, track not found:', trackUid);
      return;
    }

    this.tracksByUidInit[track.uid] = true;
    this.checkAllTilesetInfoReceived();

    if (!track.options) { track.options = {}; }

    // track.options.name = tilesetInfo.name;
    track.name = tilesetInfo.name;
    track.maxWidth = tilesetInfo.max_width;
    track.transforms = tilesetInfo.transforms;
    track.aggregationModes = tilesetInfo.aggregation_modes;
    track.header = tilesetInfo.header;
    track.binsPerDimension = tilesetInfo.bins_per_dimension;
    if (tilesetInfo.resolutions) {
      track.maxZoom = tilesetInfo.resolutions.length - 1;
      track.resolutions = tilesetInfo.resolutions;
    } else {
      track.maxZoom = tilesetInfo.max_zoom;
    }
    track.coordSystem = tilesetInfo.coordSystem;
    track.datatype = tilesetInfo.datatype;
  }

  /**
   * Check if all track which are expecting a tileset info have been loaded.
   */
  checkAllTilesetInfoReceived() {
    // Do nothing is HiGlass initialized already
    if (this.state.init || !this.props.zoomToDataExtentOnInit) return;

    // Get the total number of track that are expecting a tilesetInfo
    const allTilesetInfos = Object.keys(this.trackRenderer.trackDefObjects)
      // Map track to a list of tileset infos
      .map((trackUuid) => {
        const track = this.trackRenderer.trackDefObjects[trackUuid].trackObject;
        if (track.childTracks) {
          return track.childTracks.map(childTrack => childTrack.tilesetInfo);
        }
        return track.tilesetInfo;
      })
      // Needed because of combined tracks
      .reduce((a, b) => a.concat(b), [])
      // We distinguish between tracks that need a tileset info and those whoch
      // don't by comparing `undefined` vs something else, i.e., tracks that
      // need a tileset info will be initialized with `this.tilesetInfo = null;`.
      .filter(tilesetInfo => typeof tilesetInfo !== 'undefined' && tilesetInfo !== true)
      .length;

    const loadedTilesetInfos = Object.values(this.tracksByUidInit)
      .filter(x => x).length;

    if (allTilesetInfos === loadedTilesetInfos) {
      this.setState({ init: true });
      this.handleZoomToData();
    }
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

  handleAddDivisor(series) {
    this.setState({
      addDivisorDialog: series
    });
  }

  /**
   * The user has selected a track that they wish to use to normalize another
   * track.
   */
  handleDivisorChosen(series, newTrack) {
    this.setState({
      addDivisorDialog: null,
    });

    const numerator = series.data
      ? {
        server: series.data.server,
        tilesetUid: series.data.tilesetUid
      }
      : {
        server: series.server,
        tilesetUid: series.tilesetUid
      };

    const denominator = {
      server: newTrack[0].server,
      tilesetUid: newTrack[0].uuid
    };

    this.handleChangeTrackData(series.uid,
      {
        type: 'divided',
        children: [
          numerator,
          denominator
        ]
      });
  }


  getAddDivisorDialog() {
    if (!this.state.addDivisorDialog) {
      return null;
    }

    const series = this.state.addDivisorDialog;

    const datatype = TRACKS_INFO_BY_TYPE[series.type].datatype[0];

    const atm = (
      <AddTrackModal
        ref={(c) => { this.addTrackModal = c; }}
        datatype={datatype}
        hidePlotTypeChooser={true}
        host={this.state.addTrackHost}
        onCancel={() => {
          this.setState({
            addDivisorDialog: null,
          });
        }}
        onTracksChosen={newTrack => this.handleDivisorChosen(series, newTrack)}
        show={this.state.addDivisorDialog !== null}
        trackSourceServers={this.props.trackSourceServers}
      />
    );

    return atm;
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
    const { tracks } = this.state;

    for (const trackType in tracks) {
      const theseTracks = tracks[trackType];

      const filteredTracks = theseTracks.filter(d => d.uid === uid);

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
      contextMenuCustomItems: null,
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

  /**
   * Change this tracks data section so that it
   * is either of type "divided" or the "divided"
   * type is removed
   */
  handleChangeTrackData(uid, newData) {
    this.closeMenus();

    this.props.onChangeTrackData(uid, newData);
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
      contextMenuCustomItems: null,
      contextMenuPosition: null,
      contextMenuDataX: null,
      contextMenuDataY: null,
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
    this.setState((prevState) => {
      // some tracks were reordered in the list so we need to reorder them in the original
      // dataset
      const tracks = prevState.tracks;

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
      return {
        tracks,
        forceUpdate: Math.random(),
      };
    });
  }

  createTracksAndLocations() {
    const tracksAndLocations = [];
    const { tracks } = this.state;

    TRACK_LOCATIONS.forEach((location) => {
      if (tracks[location]) {
        tracks[location].forEach((track) => {
          tracksAndLocations.push({ track, location });
        });
      }
    });

    return tracksAndLocations;
  }

  /**
   * Calculate where a track is absoluately positioned within the drawing area
   *
   * @param track: The track object (with members, e.g. track.uid, track.width,
   *   track.height)
   * @param location: Where it's being plotted (e.g. 'top', 'bottom')
   * @return: The position of the track and it's height and width
   *          (e.g. {left: 10, top: 20, width: 30, height: 40}
   */
  calculateTrackPosition(track, location) {
    let top = this.props.verticalMargin;
    let bottom = this.props.verticalMargin;
    let left = this.props.horizontalMargin;
    let right = this.props.horizontalMargin;
    let width = this.centerWidth;
    let { height } = track;
    let offsetX = 0;
    let offsetY = 0;

    switch (location) {
      case 'top':
        left += this.leftWidth;

        for (let i = 0; i < this.state.tracks.top.length; i++) {
          if (this.state.tracks.top[i].uid === track.uid) {
            break;
          } else {
            top += this.state.tracks.top[i].height;
          }
        }

        break;

      case 'bottom':
        left += this.leftWidth;
        top += this.topHeight + this.centerHeight + this.galleryDim;

        for (let i = 0; i < this.state.tracks.bottom.length; i++) {
          if (this.state.tracks.bottom[i].uid === track.uid) {
            break;
          } else {
            top += this.state.tracks.bottom[i].height;
          }
        }

        break;

      case 'left':
        top += this.topHeight;
        ({ width } = track);
        height = this.centerHeight;

        for (let i = 0; i < this.state.tracks.left.length; i++) {
          if (this.state.tracks.left[i].uid === track.uid) {
            break;
          } else {
            left += this.state.tracks.left[i].width;
          }
        }

        break;

      case 'right':
        left += this.leftWidth + this.centerWidth + this.galleryDim;
        top += this.topHeight;
        ({ width } = track);
        height = this.centerHeight;

        for (let i = 0; i < this.state.tracks.right.length; i++) {
          if (this.state.tracks.right[i].uid === track.uid) {
            break;
          } else {
            left += this.state.tracks.right[i].width;
          }
        }

        break;

      case 'center':
        left += this.leftWidth;
        top += this.topHeight;
        height = this.centerHeight;

        break;

      case 'gallery':
        left += this.leftWidthNoGallery;
        top += this.topHeightNoGallery;
        width = (
          this.state.width
          - this.leftWidthNoGallery
          - this.rightWidthNoGallery
          - (2 * this.props.horizontalMargin)
        );
        height = (
          this.state.height
          - this.topHeightNoGallery
          - this.bottomHeightNoGallery
          - (2 * this.props.verticalMargin)
        );
        offsetX = this.galleryDim;
        offsetY = this.galleryDim;

        for (let i = 0; i < this.state.tracks.gallery.length; i++) {
          if (this.state.tracks.gallery[i].uid === track.uid) {
            break;
          } else {
            width -= (2 * this.state.tracks.gallery[i].height);
            height -= (2 * this.state.tracks.gallery[i].height);
            left += this.state.tracks.gallery[i].height;
            top += this.state.tracks.gallery[i].height;
            offsetX -= this.state.tracks.gallery[i].height;
            offsetY -= this.state.tracks.gallery[i].height;
          }
        }

        for (let i = 0; i < this.state.tracks.right.length; i++) {
          right += this.state.tracks.right[i].width;
        }
        for (let i = 0; i < this.state.tracks.bottom.length; i++) {
          bottom += this.state.tracks.bottom[i].height;
        }

        track.offsetX = offsetX;
        track.offsetY = offsetY;
        track.offsetTop = top;
        track.offsetRight = right;
        track.offsetBottom = bottom;
        track.offsetLeft = left;

        break;

      case 'whole':
      default:
        width = this.leftWidth + this.centerWidth + this.rightWidth;
        height = this.topHeight + this.centerHeight + this.bottomHeight;
    }

    if (TRACK_LOCATIONS.indexOf(location) === -1) {
      console.warn('Track with unknown position present:', location, track);
    }

    return {
      left,
      top,
      width,
      height,
      track
    };
  }

  /**
   * Find a central heatmap track among all displayed tracks
   *
   * @param  {Array}  tracks  Tracks to be searched.
   * @return  {Object}  The first central heatmap track or `undefined`.
   */
  findCentralHeatmapTrack(tracks) {
    for (let i = 0; i < tracks.length; i++) {
      if (tracks[i].type === 'combined') {
        return this.findCentralHeatmapTrack(tracks[i].contents);
      }
      if (tracks[i].type === 'heatmap') return tracks[i];
    }
    return undefined;
  }

  trackUuidToOrientation(trackUuid) {
    /**
     * Obtain the orientation of the track defined
     * by the Uuid and return it.
     *
     * Parameters
     * ----------
     *  trackUuid: 'xsdfsd'
     *
     * Returns
     * -------
     *  orientation: '1d-horizontal'
     */

  }

  overlayTracks(positionedTracks) {
    /**
     * Return the current set of overlay tracks.
     *
     * These have no positions of their own because
     * they depend on other tracks to be drawn first.
     *
     * Parameters
     * ----------
     *  positionedTracks: The tracks along with their positions
     *
     * Returns
     * -------
     *  overlaysWithOrientationsAndPositions: []
     *
     */
    if (this.props.overlays) {
      const overlayDefs = this.props.overlays
        .filter(overlayTrack => overlayTrack.includes && overlayTrack.includes.length)
        .map((overlayTrack) => {
          const type = overlayTrack.type
            ? `overlay-${overlayTrack.type}-track`
            : 'overlay-track';

          const overlayDef = Object.assign({}, overlayTrack, {
            uid: overlayTrack.uid || slugid.nice(),
            includes: overlayTrack.includes,
            type,
            options: Object.assign(overlayTrack.options, {
              orientationsAndPositions: overlayTrack.includes.map((trackUuid) => {
                // translate a trackUuid into that track's orientation
                const includedTrack = getTrackByUid(this.props.tracks, trackUuid);
                const trackPos = includedTrack.position;
                if (!includedTrack) {
                  console.warn(`OverlayTrack included uid (${trackUuid}) not found in the track list`);
                  return null;
                }

                let orientation;
                if (trackPos === 'top' || trackPos === 'bottom') {
                  orientation = '1d-horizontal';
                }

                if (trackPos === 'left' || trackPos === 'right') {
                  orientation = '1d-vertical';
                }

                if (trackPos === 'center') {
                  orientation = '2d';
                }

                if (!orientation) {
                  console.warn('Only top, bottom, left, right, or center tracks can be overlaid at the moment');
                  return null;
                }

                const positionedTrack = positionedTracks.filter(
                  track => track.track.uid === trackUuid
                );

                if (!positionedTrack.length) {
                  // couldn't find a matching track, somebody must have included
                  // an invalid uuid
                  return null;
                }

                const position = {
                  left: positionedTrack[0].left,
                  top: positionedTrack[0].top,
                  width: positionedTrack[0].width,
                  height: positionedTrack[0].height,
                };

                return {
                  orientation,
                  position
                };
              })
                .filter(x => x) // filter out null entries
            })
          });

          // the 2 * verticalMargin is to make up for the space taken away
          // in render(): this.centerHeight = this.state.height...
          return {
            top: 0,
            left: 0,
            width: this.leftWidth + this.centerWidth + this.rightWidth,
            height: this.topHeight + this.centerHeight
            + this.bottomHeight
            + 2 * this.props.verticalMargin,
            track: overlayDef,
          };
        });

      return overlayDefs;
    }

    return [];
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
      const { track } = trackPosition;

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

    if (hostTrackUid !== trackUid) {
      // the track whose data we're trying to export is part of a combined track
      trackObject = this.trackRenderer
        .trackDefObjects[hostTrackUid].trackObject.createdTracks[track.uid];
    } else {
      ({ trackObject } = this.trackRenderer.trackDefObjects[hostTrackUid]);
    }

    trackObject.exportData();

    this.closeMenus();
  }

  /**
   * List all the tracks that are under this mouse position
   */
  listTracksAtPosition(x, y, isReturnTrackObj = false) {
    const trackObjectsAtPosition = [];

    if (!this.trackRenderer) return [];

    for (const uid in this.trackRenderer.trackDefObjects) {
      const trackObj = this.trackRenderer.trackDefObjects[uid].trackObject;

      if (trackObj.respondsToPosition(x, y)) {
        // check if this track wishes to respond to events at position x,y
        // by default, this is true
        // it is false in tracks like the horizontal and vertical rule which only
        // wish to be identified if the mouse is directly over them

        if (isReturnTrackObj) {
          if (this.props.tracks.center) {
            if (this.props.tracks.center.contents) {
              for (let i = 0; i < this.props.tracks.center.contents.length; i++) {
                if (this.props.tracks.center.contents[i].uid === uid) {
                  trackObj.is2d = true;
                }
              }
            } else if (this.props.tracks.center
                && this.props.tracks.center.length
                && this.props.tracks.center[0].uid === uid) {
              trackObj.is2d = true;
            }
          }

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
    const maxSafeInt = Number.MAX_SAFE_INTEGER;
    const minSafeInt = Number.MIN_SAFE_INTEGER;
    const minPos = [maxSafeInt, maxSafeInt];
    const maxPos = [minSafeInt, minSafeInt];

    const trackObjectsToCheck = this.listAllTrackObjects();

    // go through every track definition
    for (const trackObject of trackObjectsToCheck) {
      // get the minimum and maximum positions of all the subtracks
      if (trackObject.tilesetInfo) {
        if (trackObject.tilesetInfo.min_pos) {
          for (let j = 0; j < trackObject.tilesetInfo.min_pos.length; j++) {
            if (trackObject.tilesetInfo.min_pos[j] < minPos[j]) {
              minPos[j] = trackObject.tilesetInfo.min_pos[j];
            }

            if (trackObject.tilesetInfo.max_pos[j] > maxPos[j]) {
              maxPos[j] = trackObject.tilesetInfo.max_pos[j];
            }
          }
        }
      }
    }

    // set the initial domain
    const left = this.trackRenderer.currentProps.marginLeft
      + this.trackRenderer.currentProps.leftWidth;
    let newXDomain = [
      left,
      left + this.trackRenderer.currentProps.centerWidth,
    ].map(this.trackRenderer.zoomTransform.rescaleX(this.trackRenderer.xScale).invert);

    const top = this.trackRenderer.currentProps.marginTop
      + this.trackRenderer.currentProps.topHeight;
    let newYDomain = [
      top,
      top + this.trackRenderer.currentProps.centerHeight,
    ].map(this.trackRenderer.zoomTransform.rescaleY(this.trackRenderer.yScale).invert);

    // reset the zoom transform
    this.trackRenderer.zoomTransform.k = 1;

    this.trackRenderer.zoomTransform.x = 0;
    this.trackRenderer.zoomTransform.y = 0;
    this.trackRenderer.applyZoomTransform();

    if (minPos[0] < Number.MAX_SAFE_INTEGER && maxPos[0] > Number.MIN_SAFE_INTEGER) {
      newXDomain = [minPos[0], maxPos[0]];
    }

    if (minPos[1] < Number.MAX_SAFE_INTEGER && maxPos[1] > Number.MIN_SAFE_INTEGER) {
      newYDomain = [minPos[1], maxPos[1]];
    }

    this.props.onDataDomainChanged(newXDomain, newYDomain);
  }

  resetViewport() {
    // Set the initial domain
    const left = (
      this.trackRenderer.currentProps.marginLeft
      + this.trackRenderer.currentProps.leftWidth
    );
    const newXDomain = [
      left,
      left + this.trackRenderer.currentProps.centerWidth,
    ].map(this.trackRenderer.zoomTransform
      .rescaleX(this.trackRenderer.xScale).invert);

    const top = (
      this.trackRenderer.currentProps.marginTop
      + this.trackRenderer.currentProps.topHeight
    );
    const newYDomain = [
      top,
      top + this.trackRenderer.currentProps.centerHeight,
    ].map(this.trackRenderer.zoomTransform
      .rescaleY(this.trackRenderer.yScale).invert);

    // Reset the zoom transform
    this.trackRenderer.zoomTransform.k = 1;
    this.trackRenderer.zoomTransform.x = 0;
    this.trackRenderer.zoomTransform.y = 0;
    this.trackRenderer.applyZoomTransform();

    this.props.onDataDomainChanged(newXDomain, newYDomain);
  }

  updatablePropsToString(props) {
    return JSON.stringify({
      tracks: props.tracks,
      overlays: props.overlays,
      viewOptions: props.viewOptions,
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
      draggingHappending: props.draggingHappening,
    });
  }

  getXYScales() {
    if (this.trackRenderer) {
      this.xScale = this.trackRenderer.currentXScale;
      this.yScale = this.trackRenderer.currentYScale;
    }
  }

  /**
   * Translate view to data location.
   *
   * @description
   * The view location is in pixels relative to the browser window. The data
   * location is given by the scaling relative to the initial x and y domains.
   * And the genomic location depends on the chrom sizes.
   *
   * @method  rangeViewToDataLoci
   * @author  Fritz Lekschas
   * @date    2018-01-14
   * @param  {Array}  range  Selected view range
   * @param  {Function}  scale  View to data scaling
   * @return  {Array}  2D array of data locations
   */
  rangeViewToDataLoci(range, scale) {
    if (!scale) return [null, null];

    return [
      parseInt(scale.invert(range[0]), 10),
      parseInt(scale.invert(range[1]), 10),
    ];
  }

  rangeSelectionResetHandler() {
    if (this.state.rangeSelectionMaster) {
      this.setState({
        is1dRangeSelection: null,
        rangeSelection: [null, null],
        rangeSelectionMaster: null,
        rangeSelectionEnd: false,
      });
    }
  }

  rangeSelection1dEndHandler(axis) {
    if (!this.xScale || !this.yScale) {
      this.getXYScales();
    }

    const scale = axis === 'x' ? this.xScale : this.yScale;

    return (range) => {
      this.setState((prevState) => {
        const newRangeSelection = prevState.is1dRangeSelection
          ? [null, null] : prevState.rangeSelection.slice();

        const accessor = !this.state.is1dRangeSelection && axis === 'y' ? 1 : 0;

        let dataPos = this.rangeViewToDataLoci(range, scale);

        // Enforce range selection size constraints
        const size = dataPos[1] - dataPos[0];
        if (this.props.rangeSelection1dSize[0] > size) {
          // Blow selection up
          const center = dataPos[0] + (size / 2);
          dataPos = [
            center - (this.props.rangeSelection1dSize[0] / 2),
            center + (this.props.rangeSelection1dSize[0] / 2)
          ];
        } else if (this.props.rangeSelection1dSize[1] < size) {
          // Shrink selection
          const center = dataPos[0] + (size / 2);
          dataPos = [
            center - (this.props.rangeSelection1dSize[1] / 2),
            center + (this.props.rangeSelection1dSize[1] / 2)
          ];
        }

        newRangeSelection[accessor] = dataPos;

        if (this.props.rangeSelectionToInt) {
          newRangeSelection[accessor] = newRangeSelection[accessor]
            .map(x => Math.round(x));
        }

        return {
          rangeSelection: newRangeSelection,
          rangeSelectionEnd: true,
        };
      });
    };
  }

  rangeSelection1dHandler(axis) {
    if (!this.xScale || !this.yScale) this.getXYScales();

    const scale = axis === 'x' ? this.xScale : this.yScale;

    return (range) => {
      this.setState((prevState) => {
        const newRangeSelection = prevState.is1dRangeSelection
          ? [null, null] : prevState.rangeSelection.slice();

        const accessor = !prevState.is1dRangeSelection && axis === 'y' ? 1 : 0;

        newRangeSelection[accessor] = this.rangeViewToDataLoci(range, scale);

        return {
          rangeSelection: newRangeSelection,
          rangeSelectionEnd: false,
        };
      });
    };
  }

  rangeSelection1dStartHandler() {
    if (!this.state.rangeSelectionMaster) {
      this.setState({
        is1dRangeSelection: true,
        rangeSelectionMaster: true,
        rangeSelectionEnd: false,
      });
    }
  }

  rangeSelection2dHandler(range) {
    if (!this.xScale || !this.yScale) this.getXYScales();

    this.setState({
      rangeSelection: [
        this.rangeViewToDataLoci(range[0], this.xScale),
        this.rangeViewToDataLoci(range[1], this.yScale),
      ],
      rangeSelectionEnd: false,
    });
  }

  rangeSelection2dStartHandler() {
    if (!this.state.rangeSelectionMaster) {
      this.setState({
        is1dRangeSelection: false,
        rangeSelectionMaster: true,
        rangeSelectionEnd: false,
      });
    }
  }

  rangeSelection2dEndHandler(range) {
    if (!this.xScale || !this.yScale) this.getXYScales();

    const dataPosX = this.rangeViewToDataLoci(range[0], this.xScale);
    const dataPosY = this.rangeViewToDataLoci(range[1], this.yScale);
    let dataPos = [dataPosX, dataPosY];

    // Enforce range selection size constraints
    const sizeX = dataPosX[1] - dataPosX[0];
    const sizeY = dataPosY[1] - dataPosY[0];
    const size = [sizeX, sizeY];

    dataPos.forEach((pos, i) => {
      if (this.props.rangeSelection1dSize[0] > size[i]) {
        // Blow selection up
        const center = pos[0] + Math.round(size[i] / 2);
        pos[0] = center - (this.props.rangeSelection1dSize[0] / 2);
        pos[1] = center + (this.props.rangeSelection1dSize[0] / 2);
      } else if (this.props.rangeSelection1dSize[1] < size[i]) {
        // Shrink selection
        const center = pos[0] + Math.round(size[i] / 2);
        pos[0] = center - (this.props.rangeSelection1dSize[1] / 2);
        pos[1] = center + (this.props.rangeSelection1dSize[1] / 2);
      }
    });

    if (this.props.rangeSelectionToInt) {
      dataPos = dataPos.map(x => x.map(y => Math.round(y)));
    }

    this.setState({
      rangeSelection: dataPos,
      rangeSelectionEnd: true,
    });
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
            coords={[this.state.contextMenuDataX, this.state.contextMenuDataY]}
            customItems={this.state.contextMenuCustomItems}
            onAddDivisor={this.handleAddDivisor.bind(this)}
            onAddSeries={this.handleAddSeries.bind(this)}
            // Can only add one new track at a time
            // because "whole" tracks are always drawn on top of each other,
            // the notion of Series is unnecessary and so 'host' is null
            onAddTrack={(newTrack) => {
              this.props.onTracksAdded([newTrack], newTrack.position, null);
              this.handleCloseContextMenu();
            }}
            onChangeTrackData={this.handleChangeTrackData.bind(this)}
            onChangeTrackType={this.handleChangeTrackType.bind(this)}
            onCloseTrack={this.handleCloseTrack.bind(this)}
            onConfigureTrack={this.handleConfigureTrack.bind(this)}
            onExportData={this.handleExportTrackData.bind(this)}
            onLockValueScale={this.handleLockValueScale.bind(this)}
            onReplaceTrack={this.handleReplaceTrack.bind(this)}
            onTrackOptionsChanged={this.handleTrackOptionsChanged.bind(this)}
            onUnlockValueScale={this.handleUnlockValueScale.bind(this)}
            orientation="right"
            position={this.state.contextMenuPosition}
            tracks={relevantTracks}
            trackSourceServers={this.props.trackSourceServers}
          />
        </PopupMenu>
      );
    }

    return null;
  }

  /**
   * Draw an overlay that shows the positions of all the different
   * track areas
   */
  getIdealizedTrackPositionsOverlay() {
    const evtJson = this.props.draggingHappening;
    const datatype = evtJson.datatype;

    if (!(datatype in DEFAULT_TRACKS_FOR_DATATYPE)) {
      console.warn('unknown data type:', evtJson.higlassTrack);
      return undefined;
    }

    const defaultTracks = DEFAULT_TRACKS_FOR_DATATYPE[datatype];
    const presentTracks = new Set(['top', 'left', 'right', 'center', 'bottom']
      .filter(x => (x in this.state.tracks && this.state.tracks[x].length)));

    const topAllowed = 'top' in defaultTracks;
    const leftAllowed = 'left' in defaultTracks;
    const rightAllowed = 'right' in defaultTracks;
    const bottomAllowed = 'bottom' in defaultTracks;
    const centerAllowed = 'center' in defaultTracks;

    const hasVerticalComponent = ('center' in defaultTracks
      || (presentTracks.has('left') || presentTracks.has('right') || presentTracks.has('center')));

    const topDisplayed = ('top' in defaultTracks);
    const bottomDisplayed = ('bottom' in defaultTracks && hasVerticalComponent);
    const leftDisplayed = ('left' in defaultTracks && hasVerticalComponent);
    const rightDisplayed = ('right' in defaultTracks && hasVerticalComponent);
    const centerDisplayed = ('center' in defaultTracks || hasVerticalComponent);

    const topLeftDiv = (
      <div
        style={{
          flexGrow: 1
        }}
      />
    );
    const topRightDiv = React.cloneElement(topLeftDiv);

    const topDiv = (
      <div
        style={{
          display: 'flex',
          flexGrow: 1,
        }}
      >
        { (topDisplayed && (centerDisplayed || leftDisplayed)) ? topLeftDiv : null }
        <DragListeningDiv
          draggingHappening={this.props.draggingHappening}
          enabled={topAllowed}
          onTrackDropped={track => this.handleTracksAdded([track], 'top')}
          position="top"
          style={{
            border: '1px solid black',
            flexGrow: 1,
          }}
        />
        { (topDisplayed && (centerDisplayed || leftDisplayed)) ? topRightDiv : null }
      </div>
    );

    const bottomDiv = (
      <div
        style={{
          display: 'flex',
          flexGrow: 1,
        }}
      >
        { (topDisplayed && (centerDisplayed || leftDisplayed)) ? topLeftDiv : null }
        <DragListeningDiv
          draggingHappening={this.props.draggingHappening}
          enabled={bottomAllowed}
          onTrackDropped={track => this.handleTracksAdded([track], 'bottom')}
          position="bottom"
          style={{
            border: '1px solid black',
            flexGrow: 1,
          }}
        />
        { (topDisplayed && (centerDisplayed || leftDisplayed)) ? topRightDiv : null }
      </div>
    );

    const leftDiv = (
      <DragListeningDiv
        draggingHappening={this.props.draggingHappening}
        enabled={leftAllowed}
        onTrackDropped={track => this.handleTracksAdded([track], 'left')}
        position="left"
        style={{
          border: '1px solid black',
          flexGrow: 1,
        }}
      />
    );

    const centerDiv = (
      <DragListeningDiv
        draggingHappening={this.props.draggingHappening}
        enabled={centerAllowed}
        onTrackDropped={track => this.handleTracksAdded([track], 'center')}
        position="center"

        style={{
          border: '1px solid black',
          flexGrow: 1
        }}
      />
    );

    const rightDiv = React.cloneElement(leftDiv,
      {
        enabled: rightAllowed,
        onTrackDropped: track => this.handleTracksAdded([track], 'right'),
        position: 'right',
      });

    return (
      <div
        style={{
          position: 'absolute',
          left: '0px',
          top: '0px',
          width: this.state.width,
          height: this.state.height,
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: this.state.width,
            height: this.state.height,
            background: 'white',
            opacity: 0.4,
          }}
        />

        <div
          style={{
            width: this.state.width,
            height: this.state.height,
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          { topDisplayed ? topDiv : null }
          { hasVerticalComponent
            && (
              <div
                style={{
                  display: 'flex',
                  height: (topDisplayed || bottomDisplayed) ? '40%' : '100%',
                  width: '100%',
                }}
              >
                { leftDisplayed ? leftDiv : null }
                { centerDisplayed ? centerDiv : null }
                { rightDisplayed ? rightDiv : null}
              </div>
            )
          }
          { bottomDisplayed ? bottomDiv : null }
        </div>
      </div>
    );
  }

  render() {
    // A gallery track consumes equal width and height. Note that since the
    // gallery goes around the central view it's dimension takes up twice the
    // space!
    this.galleryDim = this.props.tracks.gallery
      ? this.props.tracks.gallery.map(x => x.height).reduce(sum, 0) : 0;

    // left, top, right, and bottom have fixed heights / widths
    // the center will vary to accomodate their dimensions
    this.topHeightNoGallery = this.props.tracks.top
      .map(x => x.height).reduce(sum, 0);
    this.topHeight = this.topHeightNoGallery + this.galleryDim;

    this.bottomHeightNoGallery = this.props.tracks.bottom
      .map(x => x.height).reduce(sum, 0);
    this.bottomHeight = this.bottomHeightNoGallery + this.galleryDim;

    this.leftWidthNoGallery = this.props.tracks.left
      .map(x => x.width).reduce(sum, 0);
    this.leftWidth = this.leftWidthNoGallery + this.galleryDim;

    this.rightWidthNoGallery = this.props.tracks.right
      .map(x => x.width).reduce(sum, 0);
    this.rightWidth = this.rightWidthNoGallery + this.galleryDim;


    this.centerHeight = (
      this.state.height
      - this.topHeight
      - this.bottomHeight
      - (2 * this.props.verticalMargin)
    );
    this.centerWidth = (
      this.state.width
      - this.leftWidth
      - this.rightWidth
      - (2 * this.props.horizontalMargin)
    );

    const trackOutline = 'none';

    const topTracks = (
      <div
        key="topTracksDiv"
        style={{
          left: this.leftWidth + this.props.horizontalMargin,
          top: this.props.verticalMargin,
          width: this.centerWidth,
          height: this.topHeightNoGallery,
          outline: trackOutline,
          position: 'absolute',
        }}
      >
        <HorizontalTiledPlot
          configTrackMenuId={this.state.configTrackMenuId}
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
          onRangeSelectionEnd={this.rangeSelection1dEndHandler('x').bind(this)}
          onRangeSelectionReset={this.rangeSelectionResetHandler.bind(this)}
          onRangeSelectionStart={this.rangeSelection1dStartHandler.bind(this)}
          rangeSelection={this.state.rangeSelection}
          rangeSelectionEnd={this.state.rangeSelectionEnd}
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
          width: this.leftWidthNoGallery,
          height: this.centerHeight,
          outline: trackOutline,
          position: 'absolute',
        }}
      >
        <VerticalTiledPlot
          configTrackMenuId={this.state.configTrackMenuId}
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
          onRangeSelectionEnd={this.rangeSelection1dEndHandler('y').bind(this)}
          onRangeSelectionReset={this.rangeSelectionResetHandler.bind(this)}
          onRangeSelectionStart={this.rangeSelection1dStartHandler.bind(this)}
          rangeSelection={this.state.rangeSelection}
          rangeSelectionEnd={this.state.rangeSelectionEnd}
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
        width: this.rightWidthNoGallery,
        height: this.centerHeight,
        outline: trackOutline,
        position: 'absolute',
      }}
      >
        <VerticalTiledPlot
          configTrackMenuId={this.state.configTrackMenuId}
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
          onRangeSelectionEnd={this.rangeSelection1dEndHandler('y').bind(this)}
          onRangeSelectionReset={this.rangeSelectionResetHandler.bind(this)}
          onRangeSelectionStart={this.rangeSelection1dStartHandler.bind(this)}
          rangeSelection={this.state.rangeSelection}
          rangeSelectionEnd={this.state.rangeSelectionEnd}
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
        height: this.bottomHeightNoGallery,
        outline: trackOutline,
        position: 'absolute',
      }}
      >
        <HorizontalTiledPlot
          configTrackMenuId={this.state.configTrackMenuId}
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
          onRangeSelectionEnd={this.rangeSelection1dEndHandler('x').bind(this)}
          onRangeSelectionReset={this.rangeSelectionResetHandler.bind(this)}
          onRangeSelectionStart={this.rangeSelection1dStartHandler.bind(this)}
          rangeSelection={this.state.rangeSelection}
          rangeSelectionEnd={this.state.rangeSelectionEnd}
          resizeHandles={new Set(['top'])}
          scale={this.xScale}
          tracks={this.props.tracks.bottom}
          width={this.centerWidth}
        />
      </div>
    );

    const galleryTracks = (
      <div
        key="galleryTracksDiv"
        className="gallery-track-container"
        style={{
          left: this.leftWidthNoGallery + this.props.horizontalMargin,
          top: this.topHeightNoGallery + this.props.verticalMargin,
          width: this.centerWidth + (2 * this.galleryDim),
          height: this.centerHeight + (2 * this.galleryDim),
          outline: trackOutline,
          position: 'absolute',
        }}
      >
        <GalleryTracks
          configTrackMenuId={this.state.configTrackMenuId}
          editable={this.props.editable}
          height={this.centerHeight + (2 * this.galleryDim)}
          onAddSeries={this.handleAddSeries.bind(this)}
          onCloseTrack={this.handleCloseTrack.bind(this)}
          onCloseTrackMenuOpened={this.handleCloseTrackMenuOpened.bind(this)}
          onConfigTrackMenuOpened={this.handleConfigTrackMenuOpened.bind(this)}
          tracks={this.props.tracks.gallery}
          width={this.centerWidth + (2 * this.galleryDim)}
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
          className="center-track-container"
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
            editable={this.props.editable}
            height={this.centerHeight}
            is1dRangeSelection={this.state.is1dRangeSelection}
            isRangeSelectionActive={this.props.mouseTool === MOUSE_TOOL_SELECT}
            onAddSeries={this.handleAddSeries.bind(this)}
            onCloseTrackMenuOpened={this.handleCloseTrackMenuOpened.bind(this)}
            onConfigTrackMenuOpened={this.handleConfigTrackMenuOpened.bind(this)}
            onRangeSelectionReset={this.rangeSelectionResetHandler.bind(this)}
            onRangeSelectionStart={this.rangeSelection2dStartHandler.bind(this)}
            onRangeSelectionX={this.rangeSelection1dHandler('x').bind(this)}
            onRangeSelectionXEnd={this.rangeSelection1dEndHandler('x').bind(this)}
            onRangeSelectionXY={this.rangeSelection2dHandler.bind(this)}
            onRangeSelectionXYEnd={this.rangeSelection2dEndHandler.bind(this)}
            onRangeSelectionY={this.rangeSelection1dHandler('y').bind(this)}
            onRangeSelectionYEnd={this.rangeSelection1dEndHandler('y').bind(this)}
            rangeSelection={this.state.rangeSelection}
            rangeSelectionEnd={this.state.rangeSelectionEnd}
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

    let positionedTracks = this.positionedTracks();
    positionedTracks = positionedTracks.concat(this.overlayTracks(positionedTracks));

    let trackRenderer = null;
    if (this.state.sizeMeasured) {
      trackRenderer = (
        <TrackRenderer
          // Reserved props
          ref={(c) => { this.trackRenderer = c; }}

          // Custom props
          canvasElement={this.canvasElement}
          centerHeight={this.centerHeight}
          centerWidth={this.centerWidth}
          dragging={this.props.dragging}
          galleryDim={this.galleryDim}
          height={this.state.height}
          initialXDomain={this.props.initialXDomain}
          initialYDomain={this.props.initialYDomain}
          isRangeSelection={this.props.mouseTool === MOUSE_TOOL_SELECT}
          leftWidth={this.leftWidth}
          leftWidthNoGallery={this.leftWidthNoGallery}
          marginLeft={this.props.horizontalMargin}
          marginTop={this.props.verticalMargin}
          metaTracks={this.props.metaTracks}
          onMouseMoveZoom={this.props.onMouseMoveZoom}
          onNewTilesLoaded={this.props.onNewTilesLoaded}
          onScalesChanged={this.handleScalesChanged.bind(this)}
          onTilesetInfoReceived={this.handleTilesetInfoReceived.bind(this)}
          onTrackOptionsChanged={this.handleTrackOptionsChanged.bind(this)}
          onValueScaleChanged={this.props.onValueScaleChanged}
          pixiStage={this.props.pixiStage}
          pluginTracks={this.props.pluginTracks}
          positionedTracks={positionedTracks}
          registerDraggingChangedListener={this.props.registerDraggingChangedListener}
          removeDraggingChangedListener={this.props.removeDraggingChangedListener}
          setCentersFunction={this.props.setCentersFunction}
          svgElement={this.props.svgElement}
          topHeight={this.topHeight}
          topHeightNoGallery={this.topHeightNoGallery}
          uid={this.props.uid}
          viewOptions={this.props.viewOptions}
          width={this.state.width}
          xDomainLimits={this.props.xDomainLimits}
          yDomainLimits={this.props.yDomainLimits}
          zoomable={this.props.zoomable}
          zoomLimits={this.props.zoomLimits}
        >
          {topTracks}
          {leftTracks}
          {rightTracks}
          {bottomTracks}
          {galleryTracks}
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
            ref={(c) => { this.configTrackMenu = c; }}
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
            position={this.state.configTrackMenuLocation}
            trackOrientation={
              getTrackPositionByUid(this.props.tracks, this.state.configTrackMenuId)}
            tracks={[getTrackByUid(this.props.tracks, this.state.configTrackMenuId)]}
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
      overlays = positionedTracks
        .filter(pTrack => pTrack.track.position !== 'whole')
        .map((pTrack) => {
          let background = 'transparent';
          let border = 'none';

          if (this.state.mouseOverOverlayUid === pTrack.track.uid) {
            background = 'yellow';
            border = '1px solid black';
          }

          return (
          <div
            key={pTrack.track.uid}
            className="tiled-plot-track-overlay"

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
              zIndex: 1
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
            });
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
    const position = this.state.addTrackPosition
      ? this.state.addTrackPosition : this.props.addTrackPosition;

    if (this.state.addTrackPosition || this.props.addTrackPosition) {
      addTrackModal = (
        <AddTrackModal
          ref={(c) => { this.addTrackModal = c; }}
          host={this.state.addTrackHost}
          onCancel={this.handleNoTrackAdded.bind(this)}
          onTracksChosen={this.handleTracksAdded.bind(this)}
          position={position}
          show={this.state.addTrackPosition !== null || this.props.addTrackPosition !== null}
          trackSourceServers={this.props.trackSourceServers}
        />
      );
    }

    // track renderer needs to enclose all the other divs so that it
    // can catch the zoom events
    return (
      <div
        ref={(c) => { this.divTiledPlot = c; }}
        className="tiled-plot-div"
        onDragEnter={(evt) => {
        }}
        styleName="styles.tiled-plot"
      >
        {trackRenderer}
        {overlays}
        {addTrackModal}
        {this.getAddDivisorDialog()}
        {configTrackMenu}
        {closeTrackMenu}
        {trackOptionsElement}
        {this.getContextMenu()}
        {this.props.draggingHappening && this.getIdealizedTrackPositionsOverlay()}
      </div>
    );
  }

  /* -------------------- Custom Methods -----------------------*/

  addEventListeners() {
    this.eventListeners = [
      /*
      {
        name: 'dragstart',
        callback: (event) => {
          console.log('dragstart', event.dataTransfer.getData('text/json'));
        },
      },
      */
    ];

    this.eventListeners.forEach(
      event => document.addEventListener(event.name, event.callback, false)
    );
  }

  removeEventListeners() {
    this.eventListeners.forEach(
      event => document.removeEventListener(event.name, event.callback)
    );
  }
}

TiledPlot.defaultProps = {
  pluginTracks: {},
  metaTracks: [],
  zoomable: true,
};

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
  onRangeSelection: PropTypes.func.isRequired,
  onScalesChanged: PropTypes.func,
  onTracksAdded: PropTypes.func,
  onTrackOptionsChanged: PropTypes.func,
  onTrackPositionChosen: PropTypes.func,
  onValueScaleChanged: PropTypes.func,
  onUnlockValueScale: PropTypes.func,
  rangeSelection1dSize: PropTypes.array,
  rangeSelectionToInt: PropTypes.bool,
  registerDraggingChangedListener: PropTypes.func,
  removeDraggingChangedListener: PropTypes.func,
  setCentersFunction: PropTypes.func,
  pixiStage: PropTypes.object,
  pluginTracks: PropTypes.object,
  svgElement: PropTypes.object,
  trackSourceServers: PropTypes.array,
  tracks: PropTypes.object,
  metaTracks: PropTypes.array,
  verticalMargin: PropTypes.number,
  viewOptions: PropTypes.object,
  uid: PropTypes.string,
  zoomable: PropTypes.bool,
  zoomToDataExtentOnInit: PropTypes.bool
};

export default withPubSub(TiledPlot);
