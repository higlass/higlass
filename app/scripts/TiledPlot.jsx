import "../styles/TiledPlot.css";

import slugid from 'slugid';
import React from 'react';
import ReactDOM from 'react-dom';
import {ResizeSensor,ElementQueries} from 'css-element-queries';
import {VerticalTiledPlot, HorizontalTiledPlot} from './PositionalTiledPlot.jsx';
import {TrackRenderer} from './TrackRenderer.jsx';


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

        let simpleTracks = {
            'top': [
                {'uid': slugid.nice(), type:'top-axis'}
            /*
            ,
                {'uid': slugid.nice(), 
                    type:'horizontal-1d-tiles',
                  tilesetUid: '5aa265c9-2005-4ffe-9d1c-fe59a6d0e768',
                  server: 'http://52.45.229.11'}
                  */
            ],
            'left': [
                {'uid': slugid.nice(), type:'left-axis', width: 50}
            /*
                ,
                {'uid': slugid.nice(), 
                    type:'vertical-1d-tiles',
                  tilesetUid: '5aa265c9-2005-4ffe-9d1c-fe59a6d0e768',
                  server: 'http://52.45.229.11'}
                  */
            ],
            'center': [
                {   
                    uid: slugid.nice(),
                    type: 'combined',
                    height: 200,
                    contents: 
                    [
                        { 'server': 'http://52.45.229.11/',
                          'uid': slugid.nice(),
                          'tilesetUid': '4ec6d59e-f7dc-43aa-b12b-ce6b015290a6',
                          'type': 'heatmap'
                        }
                        ,
                        { 'server': 'http://52.45.229.11/',
                          'uid': slugid.nice(),
                          'tilesetUid': '4ec6d59e-f7dc-43aa-b12b-ce6b015290a6',
                          'type': '2d-tiles'
                        }
                    ]
                }
            ]};

        tracks = simpleTracks;

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

            tracks: tracks
        }

        // these dimensions are computed in the render() function and depend
        // on the sizes of the tracks in each section
        this.topHeight = 0;
        this.bottomHeight = 0;

        this.leftWidth = 0;
        this.rightWidth = 0;

        this.centerHeight = 0;
        this.centerWidth = 0;

        this.plusWidth = 54;
        this.plusHeight = 54;
    }

    componentDidMount() {
        this.element = ReactDOM.findDOMNode(this);

        ElementQueries.listen();
        new ResizeSensor(this.element, function() {
            let parentTop = this.element.parentNode.getBoundingClientRect().top;
            let hereTop = this.element.getBoundingClientRect().top;

            //let heightOffset = hereTop - parentTop;
            let heightOffset = 0;
            this.setState({
                sizeMeasured: true,
                height: this.element.clientHeight - heightOffset,
                width: this.element.clientWidth
            });
        }.bind(this));

        this.setState({
            mounted: true
        });

    }

    componentWillUnmount() {
        console.log('component will unmount');
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

    handleAddTrack(position) {
        let newTrack = {
            uid: slugid.nice()
        }

        newTrack.width = this.minVerticalWidth;
        newTrack.height = this.minHorizontalHeight;
        newTrack.value = 'new';

        let tracks = this.state.tracks;
        if (position == 'left' || position == 'top') {
            // if we're adding a track on the left or the top, we want the
            // new track to appear at the begginning of the track list
            tracks[position].unshift(newTrack); 

        } else {
            // otherwise, we want it at the end of the track list
            tracks[position].push(newTrack);
        }

        this.setState({
            tracks: tracks
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
        let tracks = this.state.tracks;

        for (let trackType in tracks) {
            let theseTracks = tracks[trackType];

            let newTracks = theseTracks.filter((d) => { return d.uid != uid; });
            tracks[trackType] = newTracks;
        }

        this.setState({
            tracks: tracks
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
        let top = this.plusHeight, left=this.plusWidth;
        
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

        this.centerHeight = this.state.height - this.topHeight - this.bottomHeight - 2*this.plusHeight;
        this.centerWidth = this.state.width - this.leftWidth - this.rightWidth - 2*this.plusWidth;

        //let trackOutline = "1px solid black";
        let trackOutline = "none";

        let topTracks = (<div style={{left: this.leftWidth + this.plusWidth, top: this.plusHeight, 
                                      width: this.centerWidth, height: this.topHeight,
                                      outline: trackOutline,
                                      position: "absolute",}}>
                            <HorizontalTiledPlot
                                handleCloseTrack={this.handleCloseTrack.bind(this)}
                                handleResizeTrack={this.handleResizeTrack.bind(this)}
                                handleSortEnd={this.handleSortEnd.bind(this)}
                                tracks={this.state.tracks['top']}
                                width={this.centerWidth}
                            />
                         </div>)
        let leftTracks = (<div style={{left: this.plusWidth, top: this.topHeight + this.plusHeight, 
                                      width: this.leftWidth, height: this.centerHeight,
                                      outline: trackOutline,
                                      position: "absolute",}}>
                            <VerticalTiledPlot
                                handleCloseTrack={this.handleCloseTrack.bind(this)}
                                handleResizeTrack={this.handleResizeTrack.bind(this)}
                                handleSortEnd={this.handleSortEnd.bind(this)}
                                tracks={this.state.tracks['left']}
                                height={this.centerHeight}
                            />
                         </div>)
        let rightTracks = (<div style={{right: this.plusWidth, top: this.topHeight + this.plusHeight, 
                                      width: this.rightWidth, height: this.centerHeight,
                                      outline: trackOutline,
                                      position: "absolute",}}>
                            <VerticalTiledPlot
                                handleCloseTrack={this.handleCloseTrack.bind(this)}
                                handleResizeTrack={this.handleResizeTrack.bind(this)}
                                handleSortEnd={this.handleSortEnd.bind(this)}
                                tracks={this.state.tracks['right']}
                                height={this.centerHeight}
                            />
                         </div>)
        let bottomTracks = (<div style={{left: this.leftWidth + this.plusWidth, bottom: this.plusHeight,
                                      width: this.centerWidth, height: this.bottomHeight,
                                      outline: trackOutline,
                                      position: "absolute",}}>
                            <HorizontalTiledPlot
                                handleCloseTrack={this.handleCloseTrack.bind(this)}
                                handleResizeTrack={this.handleResizeTrack.bind(this)}
                                handleSortEnd={this.handleSortEnd.bind(this)}
                                tracks={this.state.tracks['bottom']}
                                width={this.centerWidth}
                            />
                         </div>)

        let trackPositionTexts = this.createTrackPositionTexts();

        let positionedTracks = this.positionedTracks();

        let trackRenderer = null;
        if (this.state.sizeMeasured) {

            trackRenderer = (
                <TrackRenderer
                    initialXDomain={[0,3000000000]}
                    initialYDomain={[0,3000000000]}
                    canvasElement={this.props.canvasElement}
                    svgElement={this.props.svgElement}
                    dragging={this.props.dragging}
                    width={this.state.width}
                    height={this.state.height}
                    centerWidth={this.centerWidth}
                    centerHeight={this.centerHeight}
                    marginTop={this.plusHeight}
                    marginLeft={this.plusWidth}
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
                                 opacity: 0.2
                                }}
                    />
                    {/*trackPositionTexts*/}

                    {topTracks}
                    {leftTracks}
                    {rightTracks}
                    {bottomTracks}

                </TrackRenderer>
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
