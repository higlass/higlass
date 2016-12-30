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


export class TiledPlot extends React.Component {
    constructor(props) {
        super(props);

        this.closing = false;
        this.minHorizontalHeight = 20;
        this.minVerticalWidth = 20;
        this.uid = slugid.nice();
        this.yPositionOffset = 0;    // the offset from the Canvas and SVG elements
                                     // that the tracks will be drawn on


        let tracks = {
                          'top': [{'value': '1'},
                                 {'height': 20, 'value': '2'},
                                 {'height': 30, 'value': '3'}],
                         'left': [{'width': 20, 'value': '4'},
                                  {'width': 20, 'value': '5'},
                                  {'width': 30, 'value': '6'}], 
                         'right': [{'width': 20, 'value': '7'},
                                  {'width': 20, 'value': '8'},
                                  {'width': 30, 'value': '9'}], 
                          'bottom': [{'height': 20, 'value': '10'},
                                 {'height': 20, 'value': '11'},
                                 {'height': 30, 'value': '12'}],

                         'center': [{'height': 60, 'width': 40, 'value': 20}]
                        }

        let topTracks = {
                            /*
                          'top': [{'height': 40, 'value': 1}],
                          'top': [{'height': 20, 'value': 1},
                                 {'height': 20, 'value': 2},
                                 {'height': 30, 'value': 3}],
                                 */
                           'top': [],
                          'left': [
                          {"width": 80, 'value': 1}
                          ], 
                              'right': [
                              {'width': 80, 'value': 1} 
                              ], 
                          /*'bottom': [{'height': 40, 'value': 1}], */
                              'bottom': [],
                          'center': []}


        tracks = this.props.tracks;

        // Add names to all the tracks
        let looseTracks = this.positionedTracksToAllTracks(this.props.tracks);
        looseTracks = this.addNamesToTracks(looseTracks);

        this.trackRenderers = {}

        for (let key in tracks) {
            for (let i = 0; i < tracks[key].length; i++) {
                tracks[key][i].uid = slugid.nice();
            }
        }

        this.fillInMinWidths(tracks)

        // these values should be changed in componentDidMount
        this.state = {
            mounted: false,
            sizeMeasured: false,
            height: 10,
            width: 10,

            yPositionOffset: 0,
            xPositionOffset: 0,

            tracks: tracks,
            addTrackVisible: true,
            addTrackPosition: "top"
        }

        // these dimensions are computed in the render() function and depend
        // on the sizes of the tracks in each section
        this.topHeight = 0;
        this.bottomHeight = 0;

        this.leftWidth = 0;
        this.rightWidth = 0;

        this.centerHeight = 0;
        this.centerWidth = 0;
    }

    componentDidMount() {
        this.element = ReactDOM.findDOMNode(this);

        ElementQueries.listen();
        new ResizeSensor(this.element, function() {
            let parentTop = this.element.parentNode.getBoundingClientRect().top;
            let hereTop = this.element.getBoundingClientRect().top;

            //let heightOffset = hereTop - parentTop;
            let heightOffset = 0;
            let height = this.element.clientHeight - heightOffset;
            let width = this.element.clientWidth;

                if (width > 0 && height > 0) {

                    this.setState({
                        sizeMeasured: true,
                        width: width,
                        height: height
                    });
                }
        }.bind(this));

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

    }


    componentWillUpdate() {
        /**
         * Need to determine the offset of this element relative to the canvas on which stuff
         * will be drawn
         */
    }

    addNamesToTracks(allTracks) {
        /**
         * Add track names to the ones that have known names in config.js
         */
        let typeToName = {}
        tracksInfo.forEach(x => {
            if (x.name)
                typeToName[x.type] = x.name;
        });

        allTracks.forEach(t => {
            if (t.type in typeToName)
                t.name = typeToName[t.type];
        });

        return allTracks;
    }

    positionedTracksToAllTracks(positionedTracks) {
        /** 
         * Convert the position indexed list of tracks:
         *
         * { 'top': [{line}, {bar}],
         *   'center': [{combined, contents: {heatmap, 2d-tiles}]
         *   ...
         *  }
         *
         *  To a flat list of tracks:
         *  { line, position: 'top'
         *   bar, position: 'top'
         *   ...
         *   }
         */
        let tracks = positionedTracks;
        let allTracks = [];

        for (let trackType in tracks) {
            let theseTracks = tracks[trackType]
            
            theseTracks.forEach(x => {
                if (x.type == 'combined') {
                    // we don't really deal with nested combined tracks here,
                    // but those shouldn't really be used anyway
                    x.contents.forEach(y => {
                        allTracks.push(Object.assign(y, {position: trackType}));
                    });
                } 
                
                allTracks.push(Object.assign(x, {position: trackType}));
            });
        }

        return allTracks;
    }


    fillInMinWidths(tracksDict) {
        /**
         * If tracks don't have specified dimensions, add in the known
         * minimums
         * 
         * Operates on the tracks stored for this TiledPlot.
         */
        let horizontalLocations = ['top', 'bottom'];

        // first make sure all track types are specified
        // this will make the code later on simpler
        if (!('center' in tracksDict))
            tracksDict['center'] = [];
        if (!('left' in tracksDict))
            tracksDict['left'] = [];
        if (!('right' in tracksDict))
            tracksDict['right'] = [];
        if (!('top' in tracksDict))
            tracksDict['top'] = [];
        if (!('bottom' in tracksDict))
            tracksDict['bottom'] = [];

        for (let j = 0; j < horizontalLocations.length; j++) {
            let tracks = tracksDict[horizontalLocations[j]];

            //e.g. no 'top' tracks
            if (!tracks)
                continue;

            for (let i = 0; i < tracks.length; i++) {
                if (!('height' in tracks[i])) {
                    tracks[i].height = this.minHorizontalHeight;
                }
            }
        }

        let verticalLocations = ['left', 'right'];

        for (let j = 0; j < verticalLocations.length; j++) {
            let tracks = tracksDict[verticalLocations[j]];

            //e.g. no 'left' tracks
            if (!tracks)
                continue;

            for (let i = 0; i < tracks.length; i++) {
                if (!('width' in tracks[i]))
                    tracks[i].width = this.minVerticalWidth;
            }
        }

        return tracksDict;
    }


    handleTilesetInfoReceived(trackUid, tilesetInfo) {
        /**
         * We've received information about a tileset from the server. Register it
         * with the track definition.
         * @param trackUid (string): The identifier for the track
         * @param tilesetInfo (object): Information about the track (hopefully including
         *                              its name.
         */
        let track = this.getTrackByUid(trackUid);
        track.name = tilesetInfo.name;

        console.log('setting name:', tilesetInfo.name);

        this.setState({
            tracks: this.state.tracks
        });
    }

    handleSeriesAdded(newTrack, position, hostTrack) {
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
        let tracks = this.state.tracks;

        if (hostTrack.type == 'combined') {
            hostTrack.contents.push(newTrack);
        } else {
            let newHost = { type: 'combined',
                            uid: slugid.nice(),
                            height: hostTrack.height,
                            width: hostTrack.width,
                            contents: [hostTrack, newTrack] }

            let positionTracks = tracks[position];

            for (let i = 0; i < positionTracks.length; i++) {
                if (positionTracks[i].uid == hostTrack.uid)
                    positionTracks[i] = newHost;
            }
        }

        this.setState({
            tracks: tracks,
            addTrackVisible: false
        });
    }

    handleTrackPositionChosen(position) {
        this.handleAddTrack(position);

        // have our parent close the menu
        // parent needs to do it because the button is located in the parent's scope
        this.props.onTrackPositionChosen(position);
    }

    handleTrackAdded(newTrack, position, host=null) {
        /**
         * A track was added from the AddTrackModal dialog.
         *
         * @param trackInfo: A JSON object that can be used as a track
         *                   definition
         * @param position: The position the track is being added to
         * @param host: If this track is being added to another track
         */
        if (host) {
            // we're adding a series rather than a whole new track
            this.handleSeriesAdded(newTrack, position, host);
            return;
        }

        newTrack.width = this.minVerticalWidth;
        newTrack.height = this.minHorizontalHeight;

        let tracks = this.state.tracks;
        if (position == 'left' || position == 'top') {
            // if we're adding a track on the left or the top, we want the
            // new track to appear at the begginning of the track list
            tracks[position].unshift(newTrack); 

        } else if (position == 'center') {
            // we're going to have to either overlay the existing track with a new one
            // or add another one on top
            if (tracks['center'].length == 0) {
                // no existing tracks
                let newCombined = {
                    uid: slugid.nice(),
                    type: 'combined',
                    contents: [
                        newTrack ]
                }
                tracks['center'] = [newCombined];
            } else {
                // center track exists
                if (tracks['center'][0].type == 'combined') {
                    // if it's a combined track, we just need to add this track to the
                    // contents
                    tracks['center'][0].contents.push(newTrack);
                } else {
                    // if it's not, we have to create a new combined track
                    let newCombined = {
                        uid: slugid.nice(),
                        type: 'combined',
                        contents: [ 
                            tracks['center'][0],
                            newTrack ]
                    }

                    tracks['center'] = [newCombined];
                }
            }
        } else {
            // otherwise, we want it at the end of the track list
            tracks[position].push(newTrack);
        }

        this.setState({
            tracks: tracks,
            addTrackVisible: false
        });

    }

    handleNoTrackAdded() {
        /*
         * User hit cancel on the AddTrack dialog so we need to
         * just close it and do nothin
         */
        this.setState({
            addTrackVisible: false
        });
    }

    handleAddSeries(trackUid) {
        console.log('add series:', trackUid);
        let trackPosition = this.getTrackPositionByUid(trackUid);
        let track = this.getTrackByUid(trackUid);
        console.log('position:', trackPosition);

        this.setState({
            addTrackPosition: trackPosition,
            addTrackVisible: true,
            addTrackHost: track
        });
    }

    handleAddTrack(position) {
        console.log('handle AddTrack', position);

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

    getTrackPositionByUid(uid) {
        /**
         * Get a track's orientation by it's UID.
         */
        let tracks = this.positionedTracksToAllTracks(this.state.tracks);
        let thisTrack = tracks.filter(x => x.uid == uid);

        return thisTrack[0].position;
    }

    getTrackByUid(uid) {
        /**
         * Return the track object for the track corresponding to this uid
         *
         * Null or undefined if none.
         */
        let tracks = this.state.tracks;

        for (let trackType in tracks) {
            let theseTracks = tracks[trackType];

            let filteredTracks = theseTracks.filter((d) => { return d.uid == uid; });

            if (filteredTracks.length)
                return filteredTracks[0];

            // check to see if this track is part of a combined track
            let combinedTracks = theseTracks.filter((d) => { return d.type == 'combined'; });

            if (combinedTracks.length) {
                for (let i = 0; i < combinedTracks.length; i++) {
                    let ct = combinedTracks[i];
                    let filteredTracks = ct.contents.filter(d => d.uid == uid);

                    if (filteredTracks.length)
                        return filteredTracks[0];
                }
            }
        }

        return null;
    }


    handleCloseTrack(uid) {
        console.log('closing track...', uid);
        if (uid == this.state.closeTrackMenuId) {
            // we're closing an entire track as opposed to just a series within a track
            this.setState({
                closeTrackMenuId: null
            });
        }

        let tracks = this.state.tracks;

        for (let trackType in tracks) {
            let theseTracks = tracks[trackType];
            let newTracks = theseTracks.filter((d) => { return d.uid != uid; });

            if (newTracks.length == theseTracks.length) {
                // no whole tracks need to removed, see if any of the combined tracks
                // contain series which need to go
                let combinedTracks = newTracks.filter(x => x.type == 'combined')

                combinedTracks.forEach(ct => {
                    ct.contents = ct.contents.filter(x => x.uid != uid);
                });
            } else {
                tracks[trackType] = newTracks;
            }
        }

        this.setState({
            tracks: tracks
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
        let orientation = this.getTrackPositionByUid(uid);

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
        this.topHeight = this.state.tracks['top']
            .map((x) => { return x.height; })
            .reduce((a,b) => { return a + b; }, 0);
        this.bottomHeight = this.state.tracks['bottom']
            .map((x) => { return x.height; })
            .reduce((a,b) => { return a + b; }, 0);
        this.leftWidth = this.state.tracks['left']
            .map((x) => { return x.width; })
            .reduce((a,b) => { return a + b; }, 0);
        this.rightWidth = this.state.tracks['right']
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
                                handleConfigTrack={this.handleConfigTrackMenuOpened.bind(this)}
                                handleResizeTrack={this.handleResizeTrack.bind(this)}
                                handleSortEnd={this.handleSortEnd.bind(this)}
                                tracks={this.state.tracks['top']}
                                width={this.centerWidth}
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
                                handleConfigTrack={this.handleConfigTrackMenuOpened.bind(this)}
                                handleResizeTrack={this.handleResizeTrack.bind(this)}
                                handleSortEnd={this.handleSortEnd.bind(this)}
                                tracks={this.state.tracks['left']}
                                height={this.centerHeight}
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
                                handleConfigTrack={this.handleConfigTrackMenuOpened.bind(this)}
                                handleResizeTrack={this.handleResizeTrack.bind(this)}
                                handleSortEnd={this.handleSortEnd.bind(this)}
                                tracks={this.state.tracks['right']}
                                height={this.centerHeight}
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
                                handleConfigTrack={this.handleConfigTrackMenuOpened.bind(this)}
                                handleResizeTrack={this.handleResizeTrack.bind(this)}
                                handleSortEnd={this.handleSortEnd.bind(this)}
                                tracks={this.state.tracks['bottom']}
                                width={this.centerWidth}
                            />
                         </div>)
        let centerTrack = ( <div style={{left: this.leftWidth + this.props.horizontalMargin, top: this.props.verticalMargin + this.topHeight ,
                                      width: this.centerWidth, height: this.bottomHeight,
                                      outline: trackOutline,
                                        position: "absolute",}} />)

        if (this.state.tracks['center'].length) {
            centerTrack = ( <div style={{left: this.leftWidth + this.props.horizontalMargin, top: this.props.verticalMargin + this.topHeight ,
                                      width: this.centerWidth, height: this.bottomHeight,
                                      outline: trackOutline,
                                        position: "absolute",}}>
                               <CenterTrack
                                onAddSeries={this.handleAddSeries.bind(this)}
                                onConfigTrackMenuOpened={this.handleConfigTrackMenuOpened.bind(this)}
                                onCloseTrackMenuOpened={this.handleCloseTrackMenuOpened.bind(this)}
                                onAddSeries={this.handleAddSeries.bind(this)}

                                height={this.centerHeight}
                                uid={this.state.tracks['center'][0].uid}
                                width={this.centerWidth}
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

        if (this.state.configTrackMenuId) {
            configTrackMenu = (
                             <PopupMenu
                                onMenuClosed={this.handleConfigTrackMenuClosed.bind(this)}
                             >
                                  <ConfigTrackMenu
                                    track={this.getTrackByUid(this.state.configTrackMenuId)}
                                    position={ this.state.configTrackMenuLocation }
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
                                    track={this.getTrackByUid(this.state.closeTrackMenuId)}
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

        // track renderer needs to enclose all the other divs so that it 
        // can catch the zoom events
        return(
            <div 
                ref={(c) => this.divTiledPlot = c}
                style={{flex: 1}}
            >
                {trackRenderer}     
                <AddTrackModal 
                    onCancel={this.handleNoTrackAdded.bind(this)}
                    onTrackChosen={this.handleTrackAdded.bind(this)}
                    position={this.state.addTrackPosition}
                    host={this.state.addTrackHost}
                    show={this.state.addTrackVisible}
                />

                {configTrackMenu}
                {closeTrackMenu}
                {addTrackPositionMenu}
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
