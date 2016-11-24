import "../styles/TiledPlot.css";
import slugid from 'slugid';
import React from 'react';
import {zoom} from 'd3-zoom';
import {select,event} from 'd3-selection';
import ReactDOM from 'react-dom';
import {ResizeSensor,ElementQueries} from 'css-element-queries';
import {VerticalTiledPlot, HorizontalTiledPlot} from './PositionalTiledPlot.jsx';


export class TiledPlot extends React.Component {
    constructor(props) {
        super(props);

        this.minHorizontalHeight = 20;
        this.minVerticalWidth = 20;
        this.uid = slugid.nice();

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

                         'center': [{'height': 40, 'width': 40, 'value': 20}]
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


        //tracks = topTracks;

        this.trackRenderers = {}

        for (let key in tracks) {
            for (let i = 0; i < tracks[key].length; i++) {
                tracks[key][i].uid = slugid.nice();
            }
        }

        this.fillInMinWidths(tracks)

        // these values should be changed in componentDidMount
        this.state = {
            height: 10,
            width: 10,

            tracks: tracks
        }


        // catch any zooming behavior within all of the tracks in this plot
        //this.zoomTransform = zoomIdentity();
        this.zoomBehavior = zoom()
            .filter(() => {
                if (event.path[0].classList.contains("no-zoom"))
                    return false;
                if (event.path[0].classList.contains('react-resizable-handle'))
                    return false;
                return true;
            })
            .on('zoom', this.zoomed.bind(this))


        // these dimensions are computed in the render() function and depend
        // on the sizes of the tracks in each section
        this.topHeight = 0;
        this.bottomHeight = 0;

        this.leftWidth = 0;
        this.rightWidth = 0;

        this.centerHeight = 0;
        this.centerWidth = 0;

        this.plusWidth = 10;
        this.plusHeight = 10;
    }

    componentDidMount() {
        this.element = ReactDOM.findDOMNode(this);
        ElementQueries.listen();
        new ResizeSensor(this.element, function() {
            //let heightOffset = this.element.offsetTop - this.element.parentNode.offsetTop
            let heightOffset = 0;

            this.setState({
                height: this.element.clientHeight - heightOffset,
                width: this.element.clientWidth
            });
        }.bind(this));

        select(this.divTiledPlot).call(this.zoomBehavior);
    }

    zoomed() {
        console.log('zoomed... transform', event.transform);
    }

    fillInMinWidths(tracksDict) {
        /**
         * If tracks don't have specified dimensions, add in the known
         * minimums
         * 
         * Operates on the tracks stored for this TiledPlot.
         */
        let horizontalLocations = ['top', 'bottom'];

        for (let j = 0; j < horizontalLocations.length; j++) {
            let tracks = tracksDict[horizontalLocations[j]];

            for (let i = 0; i < tracks.length; i++) {
                if (!('height' in tracks[i])) {
                    tracks[i].height = this.minHorizontalHeight;
                    console.log('adding height');
                }
            }
        }

        let verticalLocations = ['left', 'right'];

        for (let j = 0; j < verticalLocations.length; j++) {
            let tracks = tracksDict[verticalLocations[j]];

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

            return {left: left, top: top, width: this.centerWidth, height: track.height};
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

            return {left: left, top: top, width: this.centerWidth, height: track.height};
        }

        else if (location == 'left') {
            top += this.topHeight;

            for (let i = 0; i < this.state.tracks['left'].length; i++) {
                if (this.state.tracks['left'][i].uid == track.uid)
                    break;
                else
                    left += this.state.tracks['left'][i].width;
            }

            return {left: left, top: top, width: track.width, height: this.centerHeight};
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

            return {left: left, top: top, width: track.width, height: this.centerHeight};
        } else if (location == 'center') {
            left += this.leftWidth;
            top += this.topHeight;

            return {left: left, top: top, width: this.centerWidth, height: this.centerHeight};
        }

    }

    createTrackPositionTexts() {
        /**
         * Create little text fields that show the position and width of
         * each track, just to show that we can calculate that and pass
         * it to the rendering context.
         */
        let tracksAndLocations = this.createTracksAndLocations();

        let trackElements = tracksAndLocations.map(({track, location}) => {
            let trackPosition = this.calculateTrackPosition(track, location);

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

        // the icons for adding tracks
        this.plusWidth = 10;
        this.plusHeight = 10;

        this.centerHeight = this.state.height - this.topHeight - this.bottomHeight - 20;
        this.centerWidth = this.state.width - this.leftWidth - this.rightWidth - 20;

        let imgStyle = { 
            width: 10,
            opacity: 0.4
        };

        let topTracks = (<div style={{left: this.leftWidth + this.plusWidth, top: this.plusHeight, 
                                      width: this.centerWidth, height: this.topHeight,
                                      outline: "1px solid black", 
                                      position: "absolute",}}>
                            <HorizontalTiledPlot
                                handleCloseTrack={this.handleCloseTrack.bind(this)}
                                handleResizeTrack={this.handleResizeTrack.bind(this)}
                                handleSortEnd={this.handleSortEnd.bind(this)}
                                tracks={this.state.tracks['top']}
                                width={this.centerWidth}
                                referenceAncestor={this.divTiledPlot}
                            />
                         </div>)
        let leftTracks = (<div style={{left: this.plusWidth, top: this.topHeight + this.plusHeight, 
                                      width: this.leftWidth, height: this.centerHeight,
                                      outline: "1px solid black", 
                                      position: "absolute",}}>
                            <VerticalTiledPlot
                                handleCloseTrack={this.handleCloseTrack.bind(this)}
                                handleResizeTrack={this.handleResizeTrack.bind(this)}
                                handleSortEnd={this.handleSortEnd.bind(this)}
                                tracks={this.state.tracks['left']}
                                height={this.centerHeight}
                                referenceAncestor={this.divTiledPlot}
                            />
                         </div>)
        let rightTracks = (<div style={{right: this.plusWidth, top: this.topHeight + this.plusHeight, 
                                      width: this.rightWidth, height: this.centerHeight,
                                      outline: "1px solid black", 
                                      position: "absolute",}}>
                            <VerticalTiledPlot
                                handleCloseTrack={this.handleCloseTrack.bind(this)}
                                handleResizeTrack={this.handleResizeTrack.bind(this)}
                                handleSortEnd={this.handleSortEnd.bind(this)}
                                tracks={this.state.tracks['right']}
                                height={this.centerHeight}
                                referenceAncestor={this.divTiledPlot}
                            />
                         </div>)
        let bottomTracks = (<div style={{left: this.leftWidth + this.plusWidth, bottom: this.plusHeight,
                                      width: this.centerWidth, height: this.bottomHeight,
                                      outline: "1px solid black", 
                                      position: "absolute",}}>
                            <HorizontalTiledPlot
                                handleCloseTrack={this.handleCloseTrack.bind(this)}
                                handleResizeTrack={this.handleResizeTrack.bind(this)}
                                handleSortEnd={this.handleSortEnd.bind(this)}
                                tracks={this.state.tracks['bottom']}
                                width={this.centerWidth}
                                referenceAncestor={this.divTiledPlot}
                            />
                         </div>)

        let trackPositionTexts = this.createTrackPositionTexts();

        return(
            <div 
                ref={(c) => this.divTiledPlot = c}
                style={{width: "100%", height: "100%", position: "relative"}}
            >

                <div 
                    style={{position: "absolute",
                             width: this.state.width,
                             height: this.state.height,
                             background: "green",
                             opacity: 0.5
                            }}
                />
                {trackPositionTexts}

                {topTracks}
                {leftTracks}
                {rightTracks}
                {bottomTracks}
                    
                
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
