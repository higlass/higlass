import React from 'react';
import PIXI from 'pixi.js';
import d3 from 'd3';
import {DraggableDiv} from './DraggableDiv.js';
import slugid from 'slugid';
import {GenericTiledArea} from './GenericTiledArea.js';

export class MultiTrackContainer extends React.Component {
    constructor(props) {
        super(props);

        this.awsDomain = '//52.23.165.123:9872';
        this.trackHeight = 30;

        let width = 448;
        let height = 80;

        let tracks = [
                 {source: this.awsDomain + '/tiles_test/wgEncodeCrgMapabilityAlign36mer.bw.genome.sorted.short.gz', uid: slugid.nice()},
                 {source: this.awsDomain + '/tiles_test/wgEncodeCrgMapabilityAlign36mer.bw.genome.sorted.short.gz', uid: slugid.nice()},
        ];

        let trackDict = {};
        tracks.forEach(function(track, i) {
            trackDict[track.uid] = track;

        });

        this.state =  {
            width: width,     // should be changeable on resize
            height: height,     // should change in response to the addition of new tracks
                            // or user resize
            tracks: trackDict
        };

        this.animate = this.animate.bind(this);
        this.xScale = d3.scale.linear().domain(this.props.domain).range([0, this.state.width]);
        this.zoom = d3.behavior.zoom()
                      .on('zoom', this.handleZoom.bind(this))
                      .on('zoomend', this.handleZoomEnd.bind(this))
                      .x(this.xScale);

        this.zoomDispatch = d3.dispatch('zoom', 'zoomend')

        this.tiledArea = GenericTiledArea()
            .tileType('div')
            .width(this.state.width)
            .domain(this.xScale.domain())
            .zoomDispatch(this.zoomDispatch)
            .tilesChanged(function(d) {
                console.log('d:', d);
                d3.select(this).call(wigglePixiTrack);
            });

    }

    handleZoom() {
        console.log('zoomed', this.xScale.domain());
    }

    handleZoomEnd() {
        //console.log('zoomEnded', this.xScale.domain());
        for (let trackId in this.state.tracks) {
            this.state.tracks[trackId].tiledArea.zoomChanged(this.zoom.translate(), this.zoom.scale());
        };
    }

    handleResize(newDimensions) {
        this.setState (
                {
                    width: newDimensions.width,
                    height: newDimensions.height
                });
    }

    componentDidMount() {
        this.renderer = PIXI.autoDetectRenderer(this.state.width, 
                                                this.state.height, 
                                                { view: this.canvas,
                                                  antialiased: true, 
                                                  transparent: true } )
        this.stage = new PIXI.Container();
        this.stage.interactive = true;

        this.animate();
        d3.select(this.bigDiv).call(this.zoom);
    }

    animate() {
        this.renderer.render(this.stage);
        this.frame = requestAnimationFrame(this.animate);
    }

    trackSizeChanged(newSize) {
        this.state.tracks[newSize.uid].width = newSize.width;
        this.state.tracks[newSize.uid].height = newSize.height;
        this.state.tracks[newSize.uid].left = newSize.left;
        this.state.tracks[newSize.uid].top = newSize.top;

        console.log(this.state.tracks);
    }

    updateTracks() {
        let trackList = [];
        for (let trackId in this.state.tracks) 
            trackList.push(this.state.tracks[trackId]);

        d3.select(this.bigDiv).selectAll('.track')
            .call(this.tiledArea);
    }

    trackClosed(trackId) {
        let tracks = this.state.tracks;
        delete tracks[trackId];
        this.setState({
            tracks: tracks
        });
    }

    render() {
        let divStyle = { height: this.state.height, 
                         width: this.state.width,
                         position: 'relative' }
        let imgStyle = { right: 10,
                         bottom: 10,
                         position: 'absolute' }
        let canvasStyle = { top: 0,
                            left: 0,
                            width: this.width,
                            height: this.height };

        let trackList = []
        for (let uid in this.state.tracks)
            trackList.push(this.state.tracks[uid]);

        return(
            <div style={divStyle} ref={(c) => this.bigDiv = c} >
                <canvas ref={(c) => this.canvas = c} style={canvasStyle}/>
                <img src="images/plus.svg" width="20px" style={imgStyle}/>
                { trackList.map(function(track, i) 
                        {
                            return (<DraggableDiv 
                                                 width={100} 
                                                 height={40} 
                                                 top={i * this.trackHeight} 
                                                 left={0} 
                                                 sizeChanged={this.trackSizeChanged.bind(this)} 
                                                 trackClosed={this.trackClosed.bind(this)}
                                                 key={track.uid}
                                                 uid={track.uid}
                                                 className='track'
                                    >Hi</DraggableDiv>);

                        }.bind(this)) 
                }
            </div>
        );
    }
}
