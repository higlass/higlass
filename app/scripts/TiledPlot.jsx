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

        let tracks = {
                          'top': [{'height': 20, 'value': '1'},
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

        tracks = topTracks;

        for (let key in tracks) {
            for (let i = 0; i < tracks[key].length; i++) {
                tracks[key][i].uid = slugid.nice();
            }
        }

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
        //console.log("resizing...", uid, width, height);
        let tracks = this.state.tracks;

        for (let trackType in tracks) {
            let theseTracks = tracks[trackType];

            let filteredTracks = theseTracks.filter((d) => { return d.uid == uid; });

            console.log('width:', width, 'height:', height);
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

    }

    render() {
        // left, top, right, and bottom have fixed heights / widths
        // the center will vary to accomodate their dimensions
        let topHeight = this.state.tracks['top']
            .map((x) => { return x.height; })
            .reduce((a,b) => { return a + b; }, 0);
        let bottomHeight = this.state.tracks['bottom']
            .map((x) => { return x.height; })
            .reduce((a,b) => { return a + b; }, 0);
        let leftWidth = this.state.tracks['left']
            .map((x) => { return x.width; })
            .reduce((a,b) => { return a + b; }, 0);
        let rightWidth = this.state.tracks['right']
            .map((x) => { return x.width; })
            .reduce((a,b) => { return a + b; }, 0);

        // the icons for adding tracks
        let plusWidth = 10;
        let plusHeight = 10;

        let centerHeight = this.state.height - topHeight - bottomHeight - 20;
        let centerWidth = this.state.width - leftWidth - rightWidth - 20;

        let imgStyle = { 
            width: 10,
            opacity: 0.4
        };

        console.log('leftWidth:', leftWidth, 'centerWidth:', centerWidth, 'rightWidth', rightWidth, 'total:', leftWidth + centerWidth + rightWidth);
        console.log('topHeight:', topHeight, 'centerHeight:', centerHeight, 'bottomHeight', bottomHeight, 'total:', topHeight + centerHeight + bottomHeight);
        let topTracks = (<div style={{left: leftWidth + plusWidth, top: plusHeight, 
                                      width: centerWidth, height: topHeight,
                                      outline: "1px solid black", 
                                      position: "absolute",}}>
                            <HorizontalTiledPlot
                                handleCloseTrack={this.handleCloseTrack.bind(this)}
                                handleResizeTrack={this.handleResizeTrack.bind(this)}
                                handleSortEnd={this.handleSortEnd.bind(this)}
                                tracks={this.state.tracks['top']}
                                width={centerWidth}
                            />
                         </div>)
        let leftTracks = (<div style={{left: plusWidth, top: topHeight + plusHeight, 
                                      width: leftWidth, height: centerHeight,
                                      outline: "1px solid black", 
                                      position: "absolute",}}>
                            <VerticalTiledPlot
                                handleCloseTrack={this.handleCloseTrack.bind(this)}
                                handleResizeTrack={this.handleResizeTrack.bind(this)}
                                handleSortEnd={this.handleSortEnd.bind(this)}
                                tracks={this.state.tracks['left']}
                                height={centerHeight}
                            />
                         </div>)
        let rightTracks = (<div style={{right: plusWidth, top: topHeight + plusHeight, 
                                      width: rightWidth, height: centerHeight,
                                      outline: "1px solid black", 
                                      position: "absolute",}}>
                            <VerticalTiledPlot
                                handleCloseTrack={this.handleCloseTrack.bind(this)}
                                handleResizeTrack={this.handleResizeTrack.bind(this)}
                                handleSortEnd={this.handleSortEnd.bind(this)}
                                tracks={this.state.tracks['right']}
                                height={centerHeight}
                            />
                         </div>)
        let bottomTracks = (<div style={{left: leftWidth + plusWidth, bottom: plusHeight,
                                      width: centerWidth, height: bottomHeight,
                                      outline: "1px solid black", 
                                      position: "absolute",}}>
                            <HorizontalTiledPlot
                                handleCloseTrack={this.handleCloseTrack.bind(this)}
                                handleResizeTrack={this.handleResizeTrack.bind(this)}
                                handleSortEnd={this.handleSortEnd.bind(this)}
                                tracks={this.state.tracks['bottom']}
                                width={centerWidth}
                            />
                         </div>)


        return(
            <div 
                ref={(c) => this.divTiledPlot = c}
                style={{width: "100%", height: "100%", position: "relative"}}
            >
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
