import "../styles/TiledPlot.css";

import slugid from 'slugid';
import React from 'react';
import ReactDOM from 'react-dom';
import {tracksInfo} from './config.js';
import {ResizeSensor,ElementQueries} from 'css-element-queries';
import {CenterTrack, VerticalTiledPlot, HorizontalTiledPlot} from './PositionalTiledPlot.jsx';
import {TrackRenderer} from './TrackRenderer.jsx';
import {AddTrackModal} from './AddTrackModal.jsx';
import {ConfigTrackMenu} from './ConfigTrackMenu.jsx';
import {CloseTrackMenu} from './CloseTrackMenu.jsx';
import {PopupMenu} from './PopupMenu.jsx';
import {AddTrackPositionMenu} from './AddTrackPositionMenu.jsx';
import {ContextMenuContainer} from './ContextMenuContainer.jsx';
import {HeatmapOptions} from './HeatmapOptions.jsx';

import {getTrackPositionByUid, positionedTracksToAllTracks} from './utils.js';
import {getTrackByUid} from './utils.js';

export class TiledPlot extends React.Component {
    constructor(props) {
        super(props);

        this.closing = false;
        this.yPositionOffset = 0;    // the offset from the Canvas and SVG elements
                                     // that the tracks will be drawn on

        let tracks = this.props.tracks;

        this.xScale = null;
        this.yScale = null;

        this.addUidsToTracks(tracks);

        // Add names to all the tracks
        this.trackRenderers = {}

        this.trackToReplace = null;

        // console.log('this.props.tracks.center[0]:', this.props.tracks.center[0]);

        /*
        let trackOptions = this.props.editable ?
                {'track': this.props.tracks.center[0].contents[0],
                'configComponent': HeatmapOptions}
                : null;
        */

        // these values should be changed in componentDidMount
        this.state = {
            mounted: false,
            sizeMeasured: false,
            height: 10,
            width: 10,

            yPositionOffset: 0,
            xPositionOffset: 0,

            tracks: tracks,
            addTrackVisible: false,
            addTrackPosition: "top",
            mouseOverOverlayUid: null,
            //trackOptions: null
            //trackOptions: trackOptions
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
    }

    addUidsToTracks(tracks) {
        for (let key in tracks) {
            for (let i = 0; i < tracks[key].length; i++) {
                tracks[key][i].uid = tracks[key][i].uid ? tracks[key][i].uid : slugid.nice();
            }
        }

    }

    measureSize() {
        let parentTop = this.element.parentNode.getBoundingClientRect().top;
        let hereTop = this.element.getBoundingClientRect().top;

        //let heightOffset = hereTop - parentTop;
        let heightOffset = 0;
        let height = this.element.clientHeight - heightOffset;
        let width = this.element.clientWidth;

        // console.log('heightOffset:', heightOffset, 'this.element.clientHeight', this.element.clientHeight);

            if (width > 0 && height > 0) {

                this.setState({
                    sizeMeasured: true,
                    width: width,
                    height: height
                });
            }
    }

    componentDidMount() {
        this.element = ReactDOM.findDOMNode(this);

        ElementQueries.listen();
        new ResizeSensor(this.element, this.measureSize.bind(this));

        this.measureSize();

        this.setState({
            mounted: true,
            /*
            addTrackPosition: 'top',
            addTrackVisible: true,

            configTrackMenuId: this.state.tracks['center'][0].uid,
            configTrackMenuLocation: { 'left': window.innerWidth - 40,
                                   'top': 100}
            */

        });

    }

    componentWillUnmount() {
        this.closing = true;
        this.setState({
            mounted: false
        });
    }

    componentWillReceiveProps(newProps) {
        this.addUidsToTracks(newProps.tracks);

        this.setState({
            tracks: newProps.tracks
        });
    }


    componentWillUpdate() {
        /**
         * Need to determine the offset of this element relative to the canvas on which stuff
         * will be drawn
         */
    }

    handleTrackOptionsChanged(trackUid, newOptions) {
        /**
         * The drawing options for a track have changed.
         */
        this.props.onTrackOptionsChanged(trackUid, newOptions);
    }

    handleScalesChanged(x,y) {
        this.xScale = x;
        this.yScale = y;

        this.props.onScalesChanged(x,y);
    }

    handleTilesetInfoReceived(trackUid, tilesetInfo) {
        /**
         * We've received information about a tileset from the server. Register it
         * with the track definition.
         * @param trackUid (string): The identifier for the track
         * @param tilesetInfo (object): Information about the track (hopefully including
         *                              its name.
         */
        let track = getTrackByUid(this.props.tracks, trackUid);

        if (!track.options)
            track.options = {}

        track.options.name = tilesetInfo.name;

        /*
        console.log('track:', track);
        this.setState({
            tracks: this.state.tracks
        });
        */
    }

  handleOverlayMouseEnter(uid) {
    this.setState({
        mouseOverOverlayUid: uid
    })
  }

  handleOverlayMouseLeave(uid) {
    this.setState({
        mouseOverOverlayUid: null
    })
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

        this.setState({
            addTrackVisible: false
        });
    }

    handleAddSeries(trackUid) {
        let trackPosition = getTrackPositionByUid(this.props.tracks, trackUid);
        let track = getTrackByUid(this.props.tracks, trackUid);

        this.setState({
            addTrackPosition: trackPosition,
            addTrackVisible: true,
            addTrackHost: track
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
            addTrackVisible: true,
            addTrackHost: null
        });
    }

    handleResizeTrack(uid, width, height) {
        let tracks = this.state.tracks;

        for (let trackType in tracks) {
            let theseTracks = tracks[trackType];

            let filteredTracks = theseTracks.filter((d) => { return d.uid == uid; });

            if (filteredTracks.length > 0) {
                filteredTracks[0].width = width;
                filteredTracks[0].height = height;
            }

        }

        this.setState({
            tracks: tracks
        });
    }



    handleCloseTrack(uid) {
        this.props.onCloseTrack(uid);

        this.setState({
            closeTrackMenuId: null,
            configTrackMenuId: null
        });
    }

    handleTrackAdded(newTrack, position, host=null) {
        if (this.trackToReplace) {
            this.handleCloseTrack(this.trackToReplace)
            this.trackToReplace = null;
        }

        this.props.onTrackAdded(newTrack, position, host);

        this.setState({
            addTrackVisible: false
        });
    }

    handleCloseTrackMenuOpened(uid, clickPosition) {
        this.setState({
            closeTrackMenuId: uid,
            closeTrackMenuLocation: clickPosition
        });
    }


    handleCloseTrackMenuClosed(evt) {
        this.setState({
            closeTrackMenuId: null
        });
    }

    handleConfigTrackMenuOpened(uid, clickPosition) {
        //let orientation = getTrackPositionByUid(uid);

        this.setState({
            configTrackMenuId: uid,
            configTrackMenuLocation: clickPosition
        });
    }

    handleConfigTrackMenuClosed(evt) {
        this.setState({
            configTrackMenuId: null,
        });
    }

    handleConfigureTrack(track, configComponent) {
        // console.log('configComponent:', configComponent);

        this.setState({
            configTrackMenuId: null,
            trackOptions: {'track': track, 'configComponent': configComponent}
        });
    }

    handleSortEnd(sortedTracks) {
        // some tracks were reordered in the list so we need to reorder them in the original
        // dataset
        let tracks = this.state.tracks;

        let allTracks = {};

        // calculate the positions of the sortedTracks
        let positions = {};
        for (let i = 0; i < sortedTracks.length; i++) {
            positions[sortedTracks[i].uid] = i;
        }

        for (let trackType in tracks) {
            let theseTracks = tracks[trackType];
            if (!theseTracks.length)
                continue;

            if (theseTracks[0].uid in positions) {
                let newTracks = new Array(theseTracks.length)
                // this is the right track position
                for (let i = 0; i < theseTracks.length; i++) {
                    newTracks[positions[theseTracks[i].uid]] = theseTracks[i];
                }

                tracks[trackType] = newTracks;
            }
        }

        this.setState({
            tracks: tracks
        });

    }

    createTracksAndLocations() {
        let tracksAndLocations = [];
        let tracks = this.state.tracks;

       for (let trackType in tracks) {
            for (let i = 0; i < tracks[trackType].length; i++)
                tracksAndLocations.push({'track': tracks[trackType][i], 'location': trackType})
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
        let top = this.props.verticalMargin, left=this.props.horizontalMargin;

        if (location == 'top') {
            left += this.leftWidth;
            top += 0;

            for (let i = 0; i < this.state.tracks['top'].length; i++) {
                if (this.state.tracks['top'][i].uid == track.uid)
                    break;
                else
                    top += this.state.tracks['top'][i].height;
            }

            return {left: left, top: top, width: this.centerWidth,
                    height: track.height, track: track};
        }

        else if (location == 'bottom') {
            left += this.leftWidth;
            top += this.topHeight + this.centerHeight;

            for (let i = 0; i < this.state.tracks['bottom'].length; i++) {
                if (this.state.tracks['bottom'][i].uid == track.uid)
                    break;
                else
                    top += this.state.tracks['bottom'][i].height;
            }

            return {left: left, top: top, width: this.centerWidth,
                height: track.height, track: track};
        }

        else if (location == 'left') {
            top += this.topHeight;

            for (let i = 0; i < this.state.tracks['left'].length; i++) {
                if (this.state.tracks['left'][i].uid == track.uid)
                    break;
                else
                    left += this.state.tracks['left'][i].width;
            }

            return {left: left, top: top, width: track.width,
                height: this.centerHeight, track: track};
        }

        else if (location == 'right') {
            left += this.leftWidth + this.centerWidth;
            top += this.topHeight;

            for (let i = 0; i < this.state.tracks['right'].length; i++) {
                if (this.state.tracks['right'][i].uid == track.uid)
                    break;
                else
                    left += this.state.tracks['right'][i].width;
            }

            return {left: left, top: top, width: track.width,
                height: this.centerHeight, track: track};
        } else if (location == 'center') {
            left += this.leftWidth;
            top += this.topHeight;

            return {left: left, top: top, width: this.centerWidth,
                height: this.centerHeight, track: track};
        }
    }

    positionedTracks() {
        /**
         * Return the current set of tracks along with their positions
         * and dimensions
         */
        let tracksAndLocations = this.createTracksAndLocations()
            .map(({track, location}) => this.calculateTrackPosition(track,location));


        return tracksAndLocations;
    }

    createTrackPositionTexts() {
        /**
         * Create little text fields that show the position and width of
         * each track, just to show that we can calculate that and pass
         * it to the rendering context.
         */
        let positionedTracks = this.positionedTracks();
        let tracksAndLocations = this.createTracksAndLocations();


        let trackElements = positionedTracks.map((trackPosition) => {
            let track = trackPosition.track;

            return (<div
                        key={track.uid}
                        style={{
                            left: trackPosition.left,
                            top: trackPosition.top,
                            width: trackPosition.width,
                            height: trackPosition.height,
                            position: 'absolute'
                        }}
                    >
                    {track.uid.slice(0,2)}
                </div>)
        });

        return (trackElements)
    }

    render() {
        // left, top, right, and bottom have fixed heights / widths
        // the center will vary to accomodate their dimensions
        this.topHeight = this.props.tracks['top']
            .map((x) => { return x.height; })
            .reduce((a,b) => { return a + b; }, 0);
        this.bottomHeight = this.props.tracks['bottom']
            .map((x) => { return x.height; })
            .reduce((a,b) => { return a + b; }, 0);
        this.leftWidth = this.props.tracks['left']
            .map((x) => { return x.width; })
            .reduce((a,b) => { return a + b; }, 0);
        this.rightWidth = this.props.tracks['right']
            .map((x) => { return x.width; })
            .reduce((a,b) => { return a + b; }, 0);

        this.centerHeight = this.state.height - this.topHeight - this.bottomHeight - 2*this.props.verticalMargin;
        this.centerWidth = this.state.width - this.leftWidth - this.rightWidth - 2*this.props.horizontalMargin;

        //let trackOutline = "1px solid black";
        let trackOutline = "none";

        let plusWidth = 18;
        let plusHeight = 18;

        let imgStyle = {
            width: plusWidth,
            height: plusHeight,
            opacity: 0.4,
            display: "block",
            position: "absolute"

        };

        let topTracks = (<div style={{left: this.leftWidth + this.props.horizontalMargin, top: this.props.verticalMargin,
                                      width: this.centerWidth, height: this.topHeight,
                                      outline: trackOutline,
                                      position: "absolute",}}>
                            <HorizontalTiledPlot
                                onAddSeries={this.handleAddSeries.bind(this)}
                                onCloseTrack={this.handleCloseTrack.bind(this)}
                                onCloseTrackMenuOpened={this.handleCloseTrackMenuOpened.bind(this)}
                                onConfigTrackMenuOpened={this.handleConfigTrackMenuOpened.bind(this)}
                                handleConfigTrack={this.handleConfigTrackMenuOpened.bind(this)}
                                handleResizeTrack={this.handleResizeTrack.bind(this)}
                                handleSortEnd={this.handleSortEnd.bind(this)}
                                tracks={this.props.tracks['top']}
                                width={this.centerWidth}
                                editable={this.props.editable}
                                resizeHandles={new Set(['bottom'])}
                            />
                         </div>)
        let leftTracks = (<div style={{left: this.props.horizontalMargin, top: this.topHeight + this.props.verticalMargin,
                                      width: this.leftWidth, height: this.centerHeight,
                                      outline: trackOutline,
                                      position: "absolute",}}>
                            <VerticalTiledPlot
                                onAddSeries={this.handleAddSeries.bind(this)}
                                onCloseTrack={this.handleCloseTrack.bind(this)}
                                onCloseTrackMenuOpened={this.handleCloseTrackMenuOpened.bind(this)}
                                onConfigTrackMenuOpened={this.handleConfigTrackMenuOpened.bind(this)}
                                handleConfigTrack={this.handleConfigTrackMenuOpened.bind(this)}
                                handleResizeTrack={this.handleResizeTrack.bind(this)}
                                handleSortEnd={this.handleSortEnd.bind(this)}
                                tracks={this.props.tracks['left']}
                                height={this.centerHeight}
                                editable={this.props.editable}
                                resizeHandles={new Set(['right'])}
                            />
                         </div>)
        let rightTracks = (<div style={{right: this.props.horizontalMargin, top: this.topHeight + this.props.verticalMargin,
                                      width: this.rightWidth, height: this.centerHeight,
                                      outline: trackOutline,
                                      position: "absolute",}}>
                            <VerticalTiledPlot
                                onAddSeries={this.handleAddSeries.bind(this)}
                                onCloseTrack={this.handleCloseTrack.bind(this)}
                                onCloseTrackMenuOpened={this.handleCloseTrackMenuOpened.bind(this)}
                                onConfigTrackMenuOpened={this.handleConfigTrackMenuOpened.bind(this)}
                                handleConfigTrack={this.handleConfigTrackMenuOpened.bind(this)}
                                handleResizeTrack={this.handleResizeTrack.bind(this)}
                                handleSortEnd={this.handleSortEnd.bind(this)}
                                tracks={this.props.tracks['right']}
                                height={this.centerHeight}
                                editable={this.props.editable}
                                resizeHandles={new Set(['left'])}
                            />
                         </div>)
        let bottomTracks = (<div style={{left: this.leftWidth + this.props.horizontalMargin, bottom: this.props.verticalMargin,
                                      width: this.centerWidth, height: this.bottomHeight,
                                      outline: trackOutline,
                                      position: "absolute",}}>
                            <HorizontalTiledPlot
                                onAddSeries={this.handleAddSeries.bind(this)}
                                onCloseTrack={this.handleCloseTrack.bind(this)}
                                onCloseTrackMenuOpened={this.handleCloseTrackMenuOpened.bind(this)}
                                onConfigTrackMenuOpened={this.handleConfigTrackMenuOpened.bind(this)}
                                handleConfigTrack={this.handleConfigTrackMenuOpened.bind(this)}
                                handleResizeTrack={this.handleResizeTrack.bind(this)}
                                handleSortEnd={this.handleSortEnd.bind(this)}
                                tracks={this.props.tracks['bottom']}
                                width={this.centerWidth}
                                editable={this.props.editable}
                                resizeHandles={new Set(['top'])}
                            />
                         </div>)
        let centerTrack = ( <div
                                    id={'center-track-container'}
                                    style={{left: this.leftWidth + this.props.horizontalMargin, top: this.props.verticalMargin + this.topHeight ,
                                      width: this.centerWidth, height: this.bottomHeight,
                                      outline: trackOutline,
                                        position: "absolute",}} />)

        if (this.props.tracks['center'].length) {
            centerTrack = ( <div
                                    id={'center-track-container'}
                                    style={{left: this.leftWidth + this.props.horizontalMargin, top: this.props.verticalMargin + this.topHeight ,
                                      width: this.centerWidth, height: this.bottomHeight,
                                      outline: trackOutline,
                                        position: "absolute",}}>
                               <CenterTrack
                                onAddSeries={this.handleAddSeries.bind(this)}
                                onConfigTrackMenuOpened={this.handleConfigTrackMenuOpened.bind(this)}
                                onCloseTrackMenuOpened={this.handleCloseTrackMenuOpened.bind(this)}
                                onConfigTrackMenuOpened={this.handleConfigTrackMenuOpened.bind(this)}
                                onAddSeries={this.handleAddSeries.bind(this)}

                                height={this.centerHeight}
                                uid={this.props.tracks['center'][0].uid}
                                width={this.centerWidth}
                                editable={this.props.editable}
                                />
                            </div> )
        }
        let trackPositionTexts = this.createTrackPositionTexts();

        let positionedTracks = this.positionedTracks();

        let trackRenderer = null;
        if (this.state.sizeMeasured) {

            trackRenderer = (
                <TrackRenderer
                    initialXDomain={this.props.initialXDomain}
                    initialYDomain={this.props.initialYDomain}
                    onTilesetInfoReceived={this.handleTilesetInfoReceived.bind(this)}
                    canvasElement={this.props.canvasElement}
                    svgElement={this.props.svgElement}
                    dragging={this.props.dragging}
                    width={this.state.width}
                    height={this.state.height}
                    centerWidth={this.centerWidth}
                    centerHeight={this.centerHeight}
                    marginTop={this.props.verticalMargin}
                    marginLeft={this.props.horizontalMargin}
                    topHeight={this.topHeight}
                    leftWidth={this.leftWidth}
                    positionedTracks={positionedTracks}
                    pixiStage={this.props.pixiStage}
                    onScalesChanged={this.handleScalesChanged.bind(this)}
                    onNewTilesLoaded={this.props.onNewTilesLoaded}
                    setCentersFunction={this.props.setCentersFunction}
                    zoomable={this.props.zoomable}
                    registerDraggingChangedListener={this.props.registerDraggingChangedListener}
                    removeDraggingChangedListener={this.props.removeDraggingChangedListener}
                    uid={this.props.uid}
                >

                    <div
                        style={{position: "absolute",
                                 width: this.state.width,
                                 height: this.state.height,
                                 background: "green",
                                 opacity: 0
                                }}
                    />
                    {/*trackPositionTexts*/}

                    {topTracks}
                    {leftTracks}
                    {rightTracks}
                    {bottomTracks}
                    {centerTrack}

                </TrackRenderer>
            )
        }

        let configTrackMenu = null;
        let closeTrackMenu = null;
        let addTrackPositionMenu = null;
        //
        if (this.state.configTrackMenuId) {
            configTrackMenu = (
                             <PopupMenu
                                onMenuClosed={this.handleConfigTrackMenuClosed.bind(this)}
                             >
                                  <ConfigTrackMenu
                                    track={getTrackByUid(this.props.tracks, this.state.configTrackMenuId)}
                                    position={ this.state.configTrackMenuLocation }
                                    onConfigureTrack={this.handleConfigureTrack.bind(this)}
                                    onCloseTrack={this.handleCloseTrack.bind(this)}
                                    onAddSeries={this.handleAddSeries.bind(this)}
                                    onAddTrack={this.handleAddTrack.bind(this)}
                                    closeMenu={this.handleConfigTrackMenuClosed.bind(this)}
                                    onReplaceTrack={this.handleReplaceTrack.bind(this)}
                                    trackOrientation={getTrackPositionByUid(this.props.tracks, this.state.configTrackMenuId)}
                                    onTrackOptionsChanged={this.handleTrackOptionsChanged.bind(this)}
                                  />
                              </PopupMenu>
                              )
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
                                    track={getTrackByUid(this.props.tracks, this.state.closeTrackMenuId)}
                                    onCloseTrack={ this.handleCloseTrack.bind(this) }
                                  />
                    </ContextMenuContainer>
                </PopupMenu>
                              )
        }

        if (this.props.addTrackPositionMenuPosition) {
            addTrackPositionMenu = (
                <PopupMenu
                    onMenuClosed={this.props.onTrackPositionChosen}
                >
                    <ContextMenuContainer
                        position={this.props.addTrackPositionMenuPosition}
                        orientation={'left'}
                    >
                        <AddTrackPositionMenu
                            onTrackPositionChosen={this.handleTrackPositionChosen.bind(this)}
                        />
                    </ContextMenuContainer>
                </PopupMenu>
            )

        }

        let overlays = null;
        if (this.props.chooseTrackHandler) {
            // We want to choose a track and call a function. To choose the track, we display
            // an overlay on top of each track
            overlays = positionedTracks.map(pTrack => {
                let background='transparent';
                let border="none";

                if (this.state.mouseOverOverlayUid == pTrack.track.uid) {
                    background = 'yellow';
                    border = "1px solid black";
                }

                return ( <div
                               className={'tiled-plot-track-overlay'}
                               key={pTrack.track.uid}

                               // we want to remove the mouseOverOverlayUid so that next time we try
                               // to choose an overlay track, the previously selected one isn't
                               // automatically highlighted
                                onClick={e => {
                                    this.setState({ mouseOverOverlayUid: null });
                                    this.props.chooseTrackHandler(pTrack.track.uid);
                                }}
                                onMouseEnter={e => this.handleOverlayMouseEnter(pTrack.track.uid)}
                                onMouseLeave={e => this.handleOverlayMouseLeave(pTrack.track.uid)}
                               style={{
                                   position: 'absolute',
                                   left: pTrack.left,
                                   top: pTrack.top,
                                   width: pTrack.width,
                                   height: pTrack.height,
                                   background: background,
                                   opacity: 0.4,
                                   border: border
                               }}
                         /> )
            });

        }

        let trackOptionsElement = null;

        if (this.xScale && this.yScale && this.props.editable && this.state.trackOptions) {
            let configComponent = this.state.trackOptions.configComponent;
            let track = this.state.trackOptions.track;

            // console.log('this.xScale:', this.xScale);

            trackOptionsElement = React.createElement(configComponent,
                    {track: track,
                        xScale: this.xScale,
                        yScale: this.yScale,
                        onCancel:  () =>  {
                            // console.log('cancel clicked');
                            this.setState({
                                trackOptions: null
                                }
                        )},
                        onTrackOptionsChanged: (newOptions) => newOptions,
                        onSubmit: (newOptions) => {
                                this.handleTrackOptionsChanged(this.state.trackOptions.track.uid,
                                        newOptions);
                                this.setState({
                                    trackOptions: null });

                            }
                    });
        }

        // track renderer needs to enclose all the other divs so that it
        // can catch the zoom events
        return(
            <div
                ref={(c) => this.divTiledPlot = c}
                style={{flex: 1}}
            >
                {trackRenderer}
                {overlays}
                <AddTrackModal
                    onCancel={this.handleNoTrackAdded.bind(this)}
                    onTrackChosen={this.handleTrackAdded.bind(this)}
                    position={this.state.addTrackPosition}
                    host={this.state.addTrackHost}
                    show={this.state.addTrackVisible}
                    trackSourceServers={this.props.trackSourceServers}
                />

                {configTrackMenu}
                {closeTrackMenu}
                {addTrackPositionMenu}
                {trackOptionsElement}
            </div>
            );
    }
}

TiledPlot.propTypes = {
    tracks: React.PropTypes.object,
    "tracks.top": React.PropTypes.array,
    "tracks.bottom": React.PropTypes.array,
    "tracks.left": React.PropTypes.array,
    "tracks.right": React.PropTypes.array
}
