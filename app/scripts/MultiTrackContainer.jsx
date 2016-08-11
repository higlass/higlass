import React from 'react';
import PIXI from 'pixi.js';
import d3 from 'd3';
import {DraggableDiv} from './DraggableDiv.js';
import slugid from 'slugid';
import {GenericTiledArea} from './GenericTiledArea.js';
import {WigglePixiTrack} from './WigglePixiTrack.js';
import {WigglePixiLine} from './WigglePixiLine.js';
import {WigglePixiPoint} from './WigglePixiPoint.js';
import {WigglePixiHeatmap} from './WigglePixiHeatmap.js';
import {LeftWigglePixiTrack} from './LeftWigglePixiTrack.js';
import {HeatmapRectangleTrack} from './HeatmapRectangleTrack.js'
import {TopDiagonalHeatmapRectangleTrack} from './TopDiagonalHeatmapTrack.js'
import {AddTrackDiv} from './AddTrackDiv.js'
import {TopGeneLabelsTrack} from './TopGeneLabelsTrack.js'
import {TopChromosomeAxis} from './TopChromosomeAxis.js'
import {LeftChromosomeAxis} from './LeftChromosomeAxis.js'
import {GenomePositionSearchBox} from './GenomePositionSearchBox.jsx'

export class MultiTrackContainer extends React.Component {
    constructor(props) {
        console.log("mt");
        super(props);

        this.awsDomain = '//52.23.165.123:9872';
        this.initialTrackHeight = 30;
        this.initialTrackWidth = 300;

        let tracks = this.props.viewConfig.tracks;
        let currentTop = 0;
        for (let i = 0; i < tracks.length; i++) {
            let trackHeight = this.initialTrackHeight;
            let trackWidth = this.initialTrackWidth;
            let trackId = slugid.nice();

            if ('height' in tracks[i])
                trackHeight = tracks[i].height;
            if ('width' in tracks[i])
                trackWidth = tracks[i].width;
            if ('uid' in tracks[i])
                trackId = tracks[i].uid;

            tracks[i].left = 0;
            tracks[i].top = currentTop
            tracks[i].width = trackWidth;
            tracks[i].height = trackHeight;
            tracks[i].uid = trackId;

            currentTop += trackHeight;
        };
        console.log('tracks:', tracks);

        let trackDict = {};
        tracks.forEach(function(track, i) {
            trackDict[track.uid] = track;

        });

        this.state =  {
            width: this.props.viewConfig.width,     // should be changeable on resize
            height: this.props.viewConfig.height,     // should change in response to the addition of new tracks
                            // or user resize
            tracks: trackDict
        };

        this.animate = this.animate.bind(this);

        this.xScale = d3.scale.linear().domain(this.props.viewConfig.domain).range([0, this.state.width]);
        this.yScale = d3.scale.linear().domain(this.props.viewConfig.domain).range([0, this.state.height]);

        this.xOrigScale = this.xScale.copy();
        this.yOrigScale = this.yScale.copy();

        this.zoom = d3.behavior.zoom()
                      .on('zoom', this.handleZoom.bind(this))
                      .on('zoomend', this.handleZoomEnd.bind(this))
                      .x(this.xScale);

        this.zoomDispatch = d3.dispatch('zoom', 'zoomend');

        this.topChromosomeAxis = TopChromosomeAxis()
            .xScale(this.xScale.copy())
            .width(this.state.width)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch)

        this.leftChromosomeAxis = LeftChromosomeAxis()
            .yScale(this.yScale.copy())
            .width(this.state.width)
            .height(this.state.height)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch)


        this.horizontalDiagonalTiledArea = GenericTiledArea()
            .tileType('div')
            .oneDimensional(false)
            .diagonal(true)
            .width(this.state.width)
            .height(this.state.width)
            .domain(this.xScale.domain())
            .zoomDispatch(this.zoomDispatch)

        this.horizontalTiledArea = GenericTiledArea()
            .tileType('div')
            .width(this.state.width)
            .height(this.state.height)
            .domain(this.xScale.domain())
            .zoomDispatch(this.zoomDispatch)
            .horizontal(true);

        this.verticalTiledArea = GenericTiledArea()
            .tileType('div')
            .width(this.state.height)   // since this is a vertical tiled area, the width is actually the height
                                        // of the viewable area
            .domain(this.yScale.domain())
            .zoomDispatch(this.zoomDispatch)
            .horizontal(false)

        this.twoDTiledArea = GenericTiledArea()
            .tileType('div')
            .oneDimensional(false)
            .width(this.state.width)
            .height(this.state.height)
            .domain(this.xScale.domain())
            .zoomDispatch(this.zoomDispatch)
            .mirrorTiles(true)

        this.tracksToPositions = { 'top-bar': 'top', 'left-bar': 'left', 
                                    'top-line': 'top',
                                    'top-point': 'top',
                                    'top-heatmap': 'top',
                                    'top-diagonal-heatmap': 'top',
                                   'top-gene-labels': 'top',
                                   'top-chromosome-axis': 'top',
                                   'left-chromosome-axis': 'left',
                                   'left-empty': 'left',
                                   'top-empty': 'top',
                                   'right-bar': 'right', 'heatmap': 'center' };

        this.arrangeTracks();
    }

    arrangeTracks() {
        // arrange the tracks so that the left are neatly on the left, the top are neatly on top
        // and the center is positioned right in the center
        let leftMargin = 0;
        let topMargin = 0;
        let bottomMargin = 0;
        let rightMargin = 0;

        let currentTop = 0;
        let currentLeft = 0;

        for (let trackId in this.state.tracks) {
            let track = this.state.tracks[trackId];

            if (this.tracksToPositions[track.type] == 'top')
                topMargin += track.height;
            if (this.tracksToPositions[track.type] == 'left')
                leftMargin += track.width;
            if (this.tracksToPositions[track.type] == 'right')
                rightMargin += track.width;
            if (this.tracksToPositions[track.type] == 'bottom')
                bottomMargin += track.width;
        }

        let currentRightLeft = this.width - rightMargin;
        let currentBottomTop = this.height - bottomMargin;

        for (let trackId in this.state.tracks) {
            let track = this.state.tracks[trackId];

            if (this.tracksToPositions[track.type] == 'top') {
                track.left = leftMargin;
                track.top = currentTop;
                track.width = this.state.width - leftMargin - rightMargin;
                currentTop += track.height;
            }

            if (this.tracksToPositions[track.type] == 'left') {
                track.top = topMargin;
                track.left = currentLeft;
                track.height = this.state.height - topMargin - bottomMargin;
                currentLeft += track.width;
            }

            if (this.tracksToPositions[track.type] == 'right') {
                track.top = topMargin;
                track.left = currentRightLeft;
                track.height = this.state.height - topMargin - bottomMargin;
                currentRightLeft += track.width;
            }

            if (this.tracksToPositions[track.type] == 'bottom') {
                track.left = leftMargin;
                track.top = currentBottomTop;
                track.width = this.state.width - leftMargin - rightMargin;
                currentBottomTop += track.height;
            }

            if (this.tracksToPositions[track.type] == 'center') {
                track.left = leftMargin;
                track.top = topMargin;
                track.width = this.state.width - leftMargin - rightMargin;
                track.height = this.state.height - topMargin - bottomMargin;
            }
        }

    }

    handleZoom() {
        this.zoomDispatch.zoom(this.zoom.translate(), this.zoom.scale());
    }

    handleZoomEnd() {
        this.zoomDispatch.zoomend(this.zoom.translate(), this.zoom.scale());
    }

    handleResize(newDimensions) {
        this.setState (
                {
                    width: newDimensions.width,
                    height: newDimensions.height
                });
    }

    handleTrackAdded(newTrack) {
        // a new track was added

    }

    componentDidMount() {
        this.renderer = PIXI.autoDetectRenderer(this.state.width, 
                                                this.state.height, 
                                                { view: this.canvas,
                                                  antialias: true, 
                                                  transparent: true } )
        this.stage = new PIXI.Container();
        this.stage.interactive = true;
        let wigglePixiTrack = WigglePixiTrack()
            .xScale(this.xScale.copy())
            .width(this.state.width)
            .height(this.state.height)
            .pixiStage(this.stage)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch);

        let wigglePixiLine = WigglePixiLine()
            .xScale(this.xScale.copy())
            .width(this.state.width)
            .height(this.state.height)
            .pixiStage(this.stage)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch);

        let wigglePixiPoint = WigglePixiPoint()
            .xScale(this.xScale.copy())
            .width(this.state.width)
            .height(this.state.height)
            .pixiStage(this.stage)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch);

        let wigglePixiHeatmap = WigglePixiHeatmap()
            .xScale(this.xScale.copy())
            .width(this.state.width)
            .height(this.state.height)
            .pixiStage(this.stage)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch);

        let leftWigglePixiTrack = LeftWigglePixiTrack()
            .yScale(this.yScale.copy())
            .width(this.state.width)
            .height(this.state.height)
            .pixiStage(this.stage)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch);

        let heatmapRectangleTrack = HeatmapRectangleTrack()
            .xScale(this.xScale.copy())
            .yScale(this.yScale.copy())
            .width(this.state.width)
            .height(this.state.height)
            .pixiStage(this.stage)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch); 

        let diagonalHeatmapTrack = TopDiagonalHeatmapRectangleTrack()
            .xScale(this.xScale.copy())
            .yScale(this.yScale.copy())
            .width(this.state.width)
            .height(this.state.height)
            .pixiStage(this.stage)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch); 

        let topGeneLabels = TopGeneLabelsTrack()
            .xScale(this.xScale.copy())
            .width(this.state.width)
            .pixiStage(this.stage)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch);


        this.animate();
        d3.select(this.bigDiv).call(this.zoom);

        this.horizontalDiagonalTiledArea.tilesChanged(function(d, element) {
            d.translate = this.zoom.translate();
            d.scale = this.zoom.scale();

            if (d.type == 'top-diagonal-heatmap')
                d3.select(element).call(diagonalHeatmapTrack);
        }.bind(this));

        this.horizontalTiledArea.tilesChanged(function(d, element) {
                d.translate = this.zoom.translate();
                d.scale = this.zoom.scale();

                if (d.type == 'top-bar')
                    d3.select(element).call(wigglePixiTrack);
                if (d.type == 'top-line')
                    d3.select(element).call(wigglePixiLine);
                if (d.type == 'top-point')
                    d3.select(element).call(wigglePixiPoint);
                if (d.type == 'top-heatmap')
                    d3.select(element).call(wigglePixiHeatmap);
                if (d.type == 'top-gene-labels')
                    d3.select(element).call(topGeneLabels);
                if (d.type == 'top-chromosome-axis')
                    d3.select(element).call(topChromosomeAxis);
            }.bind(this));

        this.verticalTiledArea.tilesChanged(function(d, element) {
                d.translate = this.zoom.translate();
                d.scale = this.zoom.scale();

                if (d.type == 'left-bar')
                    d3.select(element).call(leftWigglePixiTrack);
                if (d.type == 'left-chromosome-axis')
                    d3.select(element).call(leftChromosomeAxis);
            }.bind(this));



        this.twoDTiledArea.tilesChanged(function(d, element) {
            d.translate = this.zoom.translate();
            d.scale = this.zoom.scale();

            if (d.type == 'heatmap')
                d3.select(element).call(heatmapRectangleTrack);
        }.bind(this));

        this.updateTracks();
        /*
        d3.select(this.bigDiv)
            .transition()
            .delay(3000)
            .duration(12000)
            .ease('linear')
            .call(this.zoom.translate([-6091225.646378613, -6091157.500879494]).scale(14603.2311647761).event);
            */
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
        let oneDHorizontalTrackList = [];
        let oneDHorizontalDiagonalTrackList = [];
        let oneDVerticalTrackList = [];
        let twoDTrackList = [];
        let horizontalAxisList = [];
        let verticalAxisList = [];

        for (let trackId in this.state.tracks) {
            if (this.state.tracks[trackId].type == 'heatmap')
                twoDTrackList.push(this.state.tracks[trackId]);
            else if (this.state.tracks[trackId].type == 'left-bar')
                oneDVerticalTrackList.push(this.state.tracks[trackId]);
            else if (this.state.tracks[trackId].type == 'top-gene-labels')
                oneDHorizontalTrackList.push(this.state.tracks[trackId]);
            else if (this.state.tracks[trackId].type == 'top-chromosome-axis')
                horizontalAxisList.push(this.state.tracks[trackId]);
            else if (this.state.tracks[trackId].type == 'left-chromosome-axis')
                verticalAxisList.push(this.state.tracks[trackId]);
            else if (this.state.tracks[trackId].type == 'top-bar')
                oneDHorizontalTrackList.push(this.state.tracks[trackId]);
            else if (this.state.tracks[trackId].type == 'top-line')
                oneDHorizontalTrackList.push(this.state.tracks[trackId]);
            else if (this.state.tracks[trackId].type == 'top-point')
                oneDHorizontalTrackList.push(this.state.tracks[trackId]);
            else if (this.state.tracks[trackId].type == 'top-heatmap')
                oneDHorizontalTrackList.push(this.state.tracks[trackId]);
            else if (this.state.tracks[trackId].type == 'top-diagonal-heatmap')
                oneDHorizontalDiagonalTrackList.push(this.state.tracks[trackId]);
        }

        d3.select(this.bigDiv).selectAll('.horizontal-axis')
            .data(horizontalAxisList)
            .call(this.topChromosomeAxis);

        d3.select(this.bigDiv).selectAll('.vertical-axis')
            .data(verticalAxisList)
            .call(this.leftChromosomeAxis);

        d3.select(this.bigDiv).selectAll('.one-d-horizontal-diagonal')
            .data(oneDHorizontalDiagonalTrackList)
            .call(this.horizontalDiagonalTiledArea);

        d3.select(this.bigDiv).selectAll('.one-d-horizontal')
            .data(oneDHorizontalTrackList)
            .call(this.horizontalTiledArea);

        d3.select(this.bigDiv).selectAll('.one-d-vertical')
            .data(oneDVerticalTrackList)
            .call(this.verticalTiledArea);

        d3.select(this.bigDiv).selectAll('.two-d')
            .data(twoDTrackList)
            .call(this.twoDTiledArea);
    }

    trackRotated(trackId) {

    }

    trackClosed(trackId) {

        let tracks = this.state.tracks;

        // remove all the d3 event handlers for this track
        this.zoomDispatch.on('zoom.' + trackId, null);
        this.zoomDispatch.on('zoomend.' + trackId, null);

        this.stage.removeChild(tracks[trackId].pAbove);

        tracks[trackId].resizeDispatch.on('resize.' + trackId, null);
        tracks[trackId].resizeDispatch.on('close.' + trackId, null);
        tracks[trackId].resizeDispatch.close();

        delete tracks[trackId];
        this.setState({
            tracks: tracks
        });
    }

    trackDimension(track) {
        // used in render() to identify what types of tracks are being displayed
        if (track.type == 'heatmap')
            return 'two-d';
        else if (track.type == 'left-bar')
            return 'one-d-vertical';
        else if (track.type == 'top-bar')
            return 'one-d-horizontal';
        else if (track.type == 'top-line')
            return 'one-d-horizontal';
        else if (track.type == 'top-point')
            return 'one-d-horizontal';
        else if (track.type == 'top-heatmap')
            return 'one-d-horizontal';
        else if (track.type == 'top-diagonal-heatmap')
            return 'one-d-horizontal-diagonal';
        else if (track.type == 'top-gene-labels')
            return 'one-d-horizontal';
        else if (track.type == 'top-chromosome-axis')
            return 'horizontal-axis';
        else if (track.type == 'left-chromosome-axis')
            return 'vertical-axis';
    }

    trackOpacity(track) {
        if (track.type == 'top-chromosome-axis' || track.type == 'left-chromosome-axis')
            return 1.;
        else
            return 0.1;
    }

    zoomTo(scale, range) {
        let value = range[0];
        let zoomScale = (scale.domain()[1] - scale.domain()[0]) / (range[1] - range[0])

        return {'scale': zoomScale, 'translate': scale.range()[0] - scale(value * zoomScale)}
    }

    zoomToGenomePosition(range1, range2) {
        let translate = [0,0], scale=1;
        if (range1 != null && range2 != null) {

            xZoomParams = this.zoomTo(this.xOrigScale, range1);
            yZoomParams = this.zoomTo(this.yOrigScale, range2);

            let translate = [xZoomParams.translate, yZoomParams.translate];
            let scale = xZoomParams.scale;

        } else if (range1 != null) {
            // adjust the x-axis
            console.log('range1:', range1);

            var xZoomParams = this.zoomTo(this.xOrigScale, 
                                          range1);
            var yZoomParams = this.zoomTo(this.yOrigScale,
                                          range1);
            // here we have to find out which range is wider and adjust
            // the other one to match

            // assuming that xOrigScale and yOrigScale are the same, then
            // xZoomParams.scale should work here
            // otherwise we could want to choose the larger zoom value of
            translate = [xZoomParams.translate,yZoomParams.translate]
            scale = xZoomParams.scale;

        } else if (range2 != null) {
            //adjust the y-axis
            console.log('range2:', range2);
        }

        console.log('translate:', translate, 'scale:', scale);
        this.zoom.translate(translate);
        this.zoom.scale(scale);
        this.zoomDispatch.zoom(this.zoom.translate(), this.zoom.scale());
    }

    render() {
        let searchDivStyle = { width: this.state.width };
        let divStyle = { height: this.state.height, 
                         width: this.state.width,
                         position: 'relative' }
        let viewStyle = this.props.viewConfig.viewStyle;

        let imgStyle = { right: 10,
                         bottom: 10,
                         position: 'absolute' }
        let canvasStyle = { top: 0,
                            left: 0,
                            width: this.state.width,
                            height: this.height };
        let addTrackDivStyle = { position: 'relative'
        };

        let svgStyle = { height: 20,
                         width: this.state.width,
        }

        let trackList = []
        for (let uid in this.state.tracks)
            trackList.push(this.state.tracks[uid]);

        //<img src="images/plus.svg" width="20px" style={imgStyle}/>
        /*
                <div style={addTrackDivStyle}>
                    <AddTrackDiv />
                </div>
                */
        return(
                <div style={viewStyle}>
            <div style={searchDivStyle}>
                <GenomePositionSearchBox 
                    zoomToGenomePositionHandler={this.zoomToGenomePosition.bind(this)}
                    chromInfoPath={this.props.viewConfig.chromInfoPath}
                    />
            </div>
            <div style={divStyle} ref={(c) => this.bigDiv = c} >
                <canvas ref={(c) => this.canvas = c} style={canvasStyle}/>
                { trackList.map(function(track, i) 
                        {
                            return (<DraggableDiv 
                                                 width={track.width} 
                                                 height={track.height} 
                                                 top={track.top} 
                                                 left={track.left} 
                                                 sizeChanged={this.trackSizeChanged.bind(this)} 
                                                 trackClosed={this.trackClosed.bind(this)}
                                                 trackRotated={this.trackRotated.bind(this)}
                                                 key={track.uid}
                                                 uid={track.uid}
                                                 opacity={this.trackOpacity(track)}
                                                 className={'track ' + this.trackDimension(track)}
                                    >
                                    
                                    </DraggableDiv>);

                        }.bind(this)) 
                }
            </div>
                </div>
        );
    }
}
