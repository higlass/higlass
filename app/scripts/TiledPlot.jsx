import "../styles/TiledPlot.css";
import slugid from 'slugid';
import React from 'react';
import ReactDOM from 'react-dom';
import {ResizeSensor,ElementQueries} from 'css-element-queries';
import {VerticalTiledPlot, HorizontalTiledPlot} from './PositionalTiledPlot.jsx';


export class TiledPlot extends React.Component {
    constructor(props) {
        super(props);

        this.minHorizontalHeight = 20;
        this.minVerticalWidth = 20;

        let tracks = {
                          'top': [{'height': 20, 'value': ''},
                                 {'height': 20, 'value': ''},
                                 {'height': 30, 'value': ''}],
                         'left': [{'width': 20, 'value': ''},
                                  {'width': 20, 'value': ''},
                                  {'width': 30, 'value': ''}], 
                         'right': [{'width': 20, 'value': ''},
                                  {'width': 20, 'value': ''},
                                  {'width': 30, 'value': ''}], 
                          'bottom': [{'height': 20, 'value': ''},
                                 {'height': 20, 'value': ''},
                                 {'height': 30, 'value': ''}],

                         'center': [{'height': 40, 'width': 40, 'value': 20}]
                        }

        let topTracks = {
                          'top': [{'height': 20, 'value': 1},
                                 {'height': 20, 'value': 2},
                                 {'height': 30, 'value': 3}],
                          'left': [], 'right': [], 'bottom': [], 'center': []}

        //tracks = topTracks;

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
    }

    componentDidMount() {
        this.element = ReactDOM.findDOMNode(this);
        ElementQueries.listen();
        new ResizeSensor(this.element, function() {
            let heightOffset = this.element.offsetTop - this.element.parentNode.offsetTop

            this.setState({
                height: this.element.clientHeight - heightOffset,
                width: this.element.clientWidth
            });
        }.bind(this));
    }

    handleAddTrack(position) {
        let newTrack = {
            uid: slugid.nice()
        }

        if (position == 'left' || position == 'right' || position == 'center') {
            newTrack.width = this.minVerticalWidth;
            newTrack.height = this.minVerticalWidth;
        }
        

        if (position == 'top' || position == 'bottom' || position == 'center') {
            newTrack.height = this.minHorizontalHeight;
            newTrack.width = this.minVerticalWidth;
        }

        newTrack.value = 'new';
        let tracks = this.state.tracks;
        tracks[position].push(newTrack);

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

        let centerHeight = this.state.height - topHeight - bottomHeight - 40;
        let centerWidth = this.state.width - leftWidth - rightWidth - 30;

        let imgStyle = { 
            width: 10,
            opacity: 0.4
        };

        return(
            <div style={{width: "100%", height: "100%"}}>
                <table>
                    <tbody>          
                        <tr>
                            <td />
                            <td />
                            <td style={{'textAlign': 'center'}}>
                                <img 
                                    onClick={() => { this.handleAddTrack('top')}}
                                    src="images/plus.svg" 
                                    style={imgStyle}
                                />
                            
                            </td>
                            <td />
                            <td />
                        </tr>
                        <tr>
                            <td />
                            <td />
                                <td>
                                    <HorizontalTiledPlot
                                        tracks={this.state.tracks['top']}
                                        width={centerWidth}
                                        handleCloseTrack={this.handleCloseTrack.bind(this)}
                                        handleSortEnd={this.handleSortEnd.bind(this)}
                                    />
                                </td>
                            <td />
                            <td />
                        </tr>
                        <tr>
                            <td>
                                <img 
                                    onClick={() => { this.handleAddTrack('left')}}
                                    src="images/plus.svg" 
                                    style={imgStyle}
                                />
                            </td>
                            <td>
                                <VerticalTiledPlot
                                    height={centerHeight}
                                    tracks={this.state.tracks['left']}
                                    handleCloseTrack={this.handleCloseTrack.bind(this)}
                                    handleSortEnd={this.handleSortEnd.bind(this)}
                                />

                            </td>
                            <td style={{"textAlign": "center"}}>
                                <img 
                                    onClick={() => { this.handleAddTrack('center')}}
                                    src="images/plus.svg" 
                                    style={imgStyle}
                                />
                        
                            </td>
                            <td>
                                <VerticalTiledPlot
                                    height={centerHeight}
                                    tracks={this.state.tracks['right']}
                                    handleCloseTrack={this.handleCloseTrack.bind(this)}
                                    handleSortEnd={this.handleSortEnd.bind(this)}
                                />
                            </td>
                            <td>
                                <img 
                                    onClick={() => { this.handleAddTrack('right')}}
                                    src="images/plus.svg" 
                                    style={imgStyle}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td />
                            <td />
                            <td>
                                <HorizontalTiledPlot
                                    handleCloseTrack={this.handleCloseTrack.bind(this)}
                                    handleSortEnd={this.handleSortEnd.bind(this)}
                                    tracks={this.state.tracks['bottom']}
                                    width={centerWidth}
                                />
                            </td>
                            <td />
                            <td />
                        </tr>
                        <tr>
                            <td />
                            <td />
                            <td style={{'textAlign': 'center'}}>
                                <img 
                                    onClick={() => { this.handleAddTrack('bottom')}}
                                    src="images/plus.svg" 
                                    style={imgStyle}
                                />
                            </td>
                            <td />
                            <td />
                        </tr>
                    </tbody>
                </table>
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
