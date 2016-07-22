import React from 'react';
import PIXI from 'pixi.js';
import d3 from 'd3';
import {DraggableDiv} from './DraggableDiv.js';
import slugid from 'slugid';
import {GenericTiledArea} from './GenericTiledArea.js';
import {WigglePixiTrack} from './WigglePixiTrack.js';

export class MultiTrackContainer extends React.Component {
    constructor(props) {
        super(props);

        this.awsDomain = '//52.23.165.123:9872';
        this.initialTrackHeight = 30;
        this.initialTrackWidth = 300;

        let width = 448;
        let height = 400;

        let tracks = [
                 {source: this.awsDomain + '/tiles_test/wgEncodeCrgMapabilityAlign36mer.bw.genome.sorted.short.gz', uid: slugid.nice()},
                 {source: this.awsDomain + '/tiles_test/wgEncodeCrgMapabilityAlign36mer.bw.genome.sorted.short.gz', uid: slugid.nice()},
        ];

        for (let i = 0; i < tracks.length; i++) {
            tracks[i].left = 0;
            tracks[i].top = i * this.initialTrackHeight;
            tracks[i].width = this.initialTrackWidth;
            tracks[i].height = this.initialTrackHeight;
        };

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

        this.zoomDispatch = d3.dispatch('zoom', 'zoomend');

        this.tiledArea = GenericTiledArea()
            .tileType('div')
            .width(this.state.width)
            .domain(this.xScale.domain())
            .zoomDispatch(this.zoomDispatch)
    }

    handleZoom() {
        this.zoomDispatch.zoom(this.zoom.translate(), this.zoom.scale());
    }

    handleZoomEnd() {
        //console.log('zoomEnded', this.xScale.domain());
        this.zoomDispatch.zoomend(this.zoom.translate(), this.zoom.scale());
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
        this.wigglePixiTrack = WigglePixiTrack()
            .xScale(this.xScale.copy())
            .pixiStage(this.stage)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch);

        this.animate();
        d3.select(this.bigDiv).call(this.zoom);
        let wigglePixiTrack = this.wigglePixiTrack;

        this.tiledArea.tilesChanged(function(d) {
                console.log('d:', d);
                d3.select(this).call(wigglePixiTrack);
                console.log('e');
            });

        this.updateTracks();
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

        // when the track's size is changed we have to update the
        // PIXI elements that are drawn for it
        if ('resizeDispatch' in this.state.tracks[newSize.uid])
            this.state.tracks[newSize.uid].resizeDispatch.resize();
    }

    updateTracks() {
        let trackList = [];
        for (let trackId in this.state.tracks) 
            trackList.push(this.state.tracks[trackId]);

        d3.select(this.bigDiv).selectAll('.track')
            .data(trackList)
            .call(this.tiledArea);
    }

    trackClosed(trackId) {

        let tracks = this.state.tracks;

        // remove all the d3 event handlers for this track
        this.zoomDispatch.on('zoom.' + trackId, null);
        this.zoomDispatch.on('zoomend.' + trackId, null);

        tracks[trackId].resizeDispatch.on('resize.' + trackId, null);
        tracks[trackId].resizeDispatch.on('close.' + trackId, null);
        tracks[trackId].resizeDispatch.close();

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
                                                 width={track.width} 
                                                 height={track.height} 
                                                 top={track.top} 
                                                 left={track.left} 
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
