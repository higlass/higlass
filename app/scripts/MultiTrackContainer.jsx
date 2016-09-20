import React from 'react';
import ReactDOM from 'react-dom';
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
import {LeftGeneLabelsTrack} from './LeftGeneLabelsTrack.js'
import {TopChromosomeAxis} from './TopChromosomeAxis.js'
import {LeftChromosomeAxis} from './LeftChromosomeAxis.js'
import {GenomePositionSearchBox} from './GenomePositionSearchBox.jsx'

export class MultiTrackContainer extends React.Component {
    constructor(props) {
        super(props);

        this.uid = slugid.nice();
        this.awsDomain = '//52.23.165.123:9872';
        this.initialTrackHeight = 30;
        this.initialTrackWidth = 300;

        this.tracksToPositions = { 'top-bar': 'top', 
                                    'left-bar': 'left', 
                                    'top-line': 'top',
                                    'top-point': 'top',
                                    'top-heatmap': 'top',
                                    'top-diagonal-heatmap': 'top',
                                   'top-gene-labels': 'top',
                                   'left-gene-labels': 'left',
                                   'top-chromosome-axis': 'top',
                                   'left-chromosome-axis': 'left',
                                   'left-empty': 'left',
                                   'top-empty': 'top',
                                   'right-bar': 'right', 'heatmap': 'center' };

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
            if ('colorRange' in tracks[i]) 
                tracks[i].colorScale = this.initColorScale(tracks[i].colorRange)

            tracks[i].left = 0;
            tracks[i].top = currentTop
            tracks[i].width = trackWidth;
            tracks[i].height = trackHeight;
            tracks[i].uid = trackId;

            currentTop += trackHeight;
        };

        let trackDict = {};
        tracks.forEach(function(track, i) {
            trackDict[track.uid] = track;

        });

        this.state =  {
            width: this.props.viewConfig.width,     // should be changeable on resize
            height: this.props.viewConfig.height,     // should change in response to the addition of new tracks
                            // or user resize
            tracks: trackDict,
            tracksList: tracks
        };

        this.animate = this.animate.bind(this);

        this.xScale = d3.scale.linear().domain(this.props.viewConfig.domain);
        this.yScale = d3.scale.linear().domain(this.props.viewConfig.domain);

        this.xOrigScale = this.xScale.copy();
        this.yOrigScale = this.yScale.copy();

        this.zoom = d3.behavior.zoom()
                      .on('zoom', this.handleZoom.bind(this))
                      .on('zoomend', this.handleZoomEnd.bind(this));

        if (typeof this.props.viewConfig.zoomDispatch == 'undefined')
            this.zoomDispatch = d3.dispatch('zoom', 'zoomend');
        else
            this.zoomDispatch = this.props.viewConfig.zoomDispatch

        this.zoomDispatch.on('zoom.' + this.uid, function(translate, scale) {
            // update our current zoom behavior whenever there's a zoom event
            // from somewhere
            this.zoom.translate(translate);
            this.zoom.scale(scale);
        }.bind(this));



        this.setHeight();
        this.arrangeTracks();
    }



    updateView() {
        //d3.selectAll('
    }

    updateDimensions() {
        let cs = window.getComputedStyle(this.element, null);

        this.prevWidth = this.width;
        this.width = this.element.offsetWidth 
                     - parseInt(cs.getPropertyValue('padding-left'), 10)
                     - parseInt(cs.getPropertyValue('padding-right'), 10);
        console.log('update width:', this.width, 'offsetWidth:', this.element.offsetWidth);
        
        if (typeof this.prevWidth != 'undefined') {
            let currentDomainWidth = this.xOrigScale.domain()[1] - this.xOrigScale.domain()[0]; 
            let nextDomainWidth = currentDomainWidth * (this.width / this.prevWidth);

            this.xOrigScale.domain([this.xOrigScale.domain()[0], 
                               this.xOrigScale.domain()[0] + nextDomainWidth]);

        }

        if (typeof this.topChromosomeAxis != 'undefined') {
            this.topChromosomeAxis.xScale(this.xOrigScale.copy());
            this.leftChromosomeAxis.yScale(this.yOrigScale.copy());
        }

        this.xOrigScale.range([0, this.width]);
        this.yOrigScale.range([0, this.height]);
        this.renderer.resize(this.width, this.height);

        for (let uid in this.state.tracks) {
            if (this.tracksToPositions[this.state.tracks[uid].type] == 'top' ||
                this.tracksToPositions[this.state.tracks[uid].type] == 'center')
                    this.state.tracks[uid].width = this.width;

            if ('resizeDispatch' in this.state.tracks[uid]) {
                this.state.tracks[uid].resizeDispatch.resize();
            }
        }
        // change out all the scales and then call everything again
        
    }

    arrangeTracks() {
        // arrange the tracks so that the left are neatly on the left, the top are neatly on top
        // and the center is positioned right in the center
        this.leftMargin = 0;
        this.topMargin = 0;
        this.bottomMargin = 0;
        this.rightMargin = 0;

        let currentTop = 0;
        let currentLeft = 0;

        for (let i = 0; i < this.state.tracksList.length; i++) {
            let trackId = this.state.tracksList[i].uid;
            let track = this.state.tracks[trackId];

            if (this.tracksToPositions[track.type] == 'top')
                this.topMargin += track.height;
            if (this.tracksToPositions[track.type] == 'left')
                this.leftMargin += track.width;
            if (this.tracksToPositions[track.type] == 'right')
                this.rightMargin += track.width;
            if (this.tracksToPositions[track.type] == 'bottom')
                this.bottomMargin += track.height;
        }

        let currentRightLeft = this.width - this.rightMargin;
        let currentBottomTop = this.height - this.bottomMargin;

        for (let i = 0; i < this.state.tracksList.length; i++) {
            let trackId = this.state.tracksList[i].uid;
            let track = this.state.tracks[trackId];
            track.leftMargin = this.leftMargin;
            track.topMargin = this.topMargin;

            if (this.tracksToPositions[track.type] == 'top') {
                track.left = this.leftMargin;
                track.top = currentTop;
                track.width = this.width - this.leftMargin - this.rightMargin;
                currentTop += track.height;
            }

            if (this.tracksToPositions[track.type] == 'left') {
                track.top = this.topMargin;
                track.left = currentLeft;
                track.height = this.height - this.topMargin - this.bottomMargin;
                currentLeft += track.width;
            }

            if (this.tracksToPositions[track.type] == 'right') {
                track.top = this.topMargin;
                track.left = currentRightLeft;
                track.height = this.height - this.topMargin - this.bottomMargin;
                currentRightLeft += track.width;
            }

            if (this.tracksToPositions[track.type] == 'bottom') {
                track.left = this.leftMargin;
                track.top = currentBottomTop;
                track.width = this.width - this.leftMargin - this.rightMargin;
                currentBottomTop += track.height;
            }

            if (this.tracksToPositions[track.type] == 'center') {
                track.left = this.leftMargin;
                track.top = this.topMargin;
                track.width = this.width  - this.leftMargin - this.rightMargin;
                track.height = this.height - this.topMargin - this.bottomMargin;
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

    setHeight() {
        this.height = this.state.height;

        if (typeof this.height == 'undefined') {
            this.height = 0;

            for (let i = 0; i < this.props.viewConfig.tracks.length; i++)  {
                this.height += this.props.viewConfig.tracks[i].height;
            }
        }

    }

    componentDidMount() {
        this.element = ReactDOM.findDOMNode(this);
        window.addEventListener('resize', this.updateDimensions.bind(this));

        console.log('this.width:', this.width, 'this.height:', this.height);
        this.renderer = PIXI.autoDetectRenderer(this.width,
                                                this.height,
                                                { view: this.canvas,
                                                  antialias: true, 
                                                  transparent: true } )

        PIXI.RESOLUTION=2;
        this.updateDimensions();

        this.xScale.range([this.leftMargin, this.width]);
        this.yScale.range([this.topMargin, this.height]);

        this.arrangeTracks();

        this.stage = new PIXI.Container();
        this.stage.interactive = true;

        this.xScaleDependencies = [];
        this.yScaleDependencies = [];

        this.topChromosomeAxis = TopChromosomeAxis()
            .xScale(this.xOrigScale.copy())
            .width(this.width)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch)

        this.leftChromosomeAxis = LeftChromosomeAxis()
            .yScale(this.yOrigScale.copy())
            .width(this.width)
            .height(this.height)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch)


        this.horizontalDiagonalTiledArea = GenericTiledArea()
            .tileType('div')
            .oneDimensional(false)
            .diagonal(true)
            .width(this.width)
            .height(this.width)
            .domain(this.xScale.domain())
            .zoomDispatch(this.zoomDispatch)

        this.horizontalTiledArea = GenericTiledArea()
            .tileType('div')
            .width(this.width)
            .height(this.height)
            .xScale(this.xOrigScale.copy())
            .domain(this.xScale.domain())
            .zoomDispatch(this.zoomDispatch)
            .horizontal(true);

        this.verticalTiledArea = GenericTiledArea()
            .tileType('div')
            .width(this.height)   // since this is a vertical tiled area, the width is actually the height
                                        // of the viewable area
            .domain(this.yScale.domain())
            .yScale(this.yOrigScale.copy())
            .zoomDispatch(this.zoomDispatch)
            .horizontal(false)

        this.twoDTiledArea = GenericTiledArea()
            .tileType('div')
            .oneDimensional(false)
            .width(this.width)
            .height(this.height)
            .xScale(this.xOrigScale.copy())
            .yScale(this.yOrigScale.copy())
            .domain(this.xScale.domain())
            .zoomDispatch(this.zoomDispatch)
            .mirrorTiles(true)
        let wigglePixiTrack = WigglePixiTrack()
            .xScale(this.xOrigScale.copy())
            .width(this.width)
            .height(this.height)
            .pixiStage(this.stage)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch);

        let wigglePixiLine = WigglePixiLine()
            .xScale(this.xOrigScale.copy())
            .width(this.width)
            .height(this.height)
            .pixiStage(this.stage)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch);

        let wigglePixiPoint = WigglePixiPoint()
            .xScale(this.xOrigScale.copy())
            .width(this.width)
            .height(this.height)
            .pixiStage(this.stage)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch);

        let wigglePixiHeatmap = WigglePixiHeatmap()
            .xScale(this.xOrigScale.copy())
            .width(this.width)
            .height(this.height)
            .pixiStage(this.stage)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch);

        let leftWigglePixiTrack = LeftWigglePixiTrack()
            .yScale(this.yOrigScale.copy())
            .width(this.width)
            .height(this.height)
            .pixiStage(this.stage)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch);

        let heatmapRectangleTrack = HeatmapRectangleTrack()
            .xScale(this.xOrigScale.copy())
            .yScale(this.yOrigScale.copy())
            .width(this.width)
            .height(this.height)
            .pixiStage(this.stage)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch); 

        let diagonalHeatmapTrack = TopDiagonalHeatmapRectangleTrack()
            .xScale(this.xScale.copy())
            .yScale(this.yScale.copy())
            .width(this.width)
            .height(this.height)
            .pixiStage(this.stage)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch); 

        let topGeneLabels = TopGeneLabelsTrack()
            .xScale(this.xOrigScale.copy())
            .width(this.width)
            .pixiStage(this.stage)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch);

        let leftGeneLabels = LeftGeneLabelsTrack()
            .yScale(this.yOrigScale.copy())
            .width(this.width)
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
                if (d.type == 'left-gene-labels')
                    d3.select(element).call(leftGeneLabels);
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

    initColorScale(colorScaleRange, colorScaleDomain = null) {
        let colorValues = colorScaleRange.map((x) => {
            return d3.rgb(x);
        });

        // go from a d3 linear scale to 0 - 256 array of rgba value
        let d3Scale = d3.scale.linear()
            .range(colorValues);
        let domain = [1,256];

        if (colorScaleDomain) {
            d3Scale.domain(colorScaleRange);
        } else {
            let start = 1, end = 256;
            let width = end - start;
            let numPivots = colorScaleRange.length - 2;
            domain = [start];

            for (let i = 0; i < numPivots; i++) {
                domain.push(start + (i+1) * width / (numPivots + 1))
            }

            domain.push(end);
        }
        d3Scale.domain(domain);

        let scaleArray = [];
        let colorArray = [255, 255, 255, 0];
        for (let i = 0; i < 256; i++) {
            let colorRgb = d3.rgb(d3Scale(i));
            let colorArray = [colorRgb.r, colorRgb.g, colorRgb.b, 255];
            scaleArray.push(colorArray);
        }
        scaleArray[255] = [255,255,255,0];

        return scaleArray;
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
            else if (this.state.tracks[trackId].type == 'left-gene-labels')
                oneDVerticalTrackList.push(this.state.tracks[trackId]);
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
        else if (track.type == 'left-gene-labels')
            return 'one-d-vertical';
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
        }

        this.zoom.translate(translate);
        this.zoom.scale(scale);
        this.zoomDispatch.zoom(this.zoom.translate(), this.zoom.scale());
    }

    render() {
        let searchDivStyle = {};
        let divStyle = { position: 'relative',
                         className: 'big-div' }

        let viewStyle = this.props.viewConfig.viewStyle;

        let imgStyle = { right: 10,
                         bottom: 10,
                         position: 'absolute' }
        let canvasStyle = { top: 0,
                            left: 0,
                            width: '100%',
                            height: this.height }
        let addTrackDivStyle = { position: 'relative'
        };

        let svgStyle = { height: 20,
                         width: '100%'
        }

        let trackList = this.state.tracksList;

        //<img src="images/plus.svg" width="20px" style={imgStyle}/>
        /*
                <div style={addTrackDivStyle}>
                    <AddTrackDiv />
                </div>
                */
        return(
            <div style={viewStyle}>
            <div>
                { (() => {
                    if (this.props.viewConfig.searchBox) {
                return <GenomePositionSearchBox 
                    zoomToGenomePositionHandler={this.zoomToGenomePosition.bind(this)}
                    chromInfoPath={this.props.viewConfig.chromInfoPath}
                    />
                    }})() }
            </div>
            <div style={divStyle} ref={(c) => this.bigDiv = c} >
                <canvas ref={(c) => this.canvas = c} style={canvasStyle}/>
                { trackList.map(function(track, i) 
                        {
                            return (
                                <div 
                                                 className={'track ' + this.trackDimension(track)}
                                                 style={{left: track.left, top: track.top, position: 'absolute'}}
                                                 key={track.uid}
                                                 />
                                
                                                 /*
                                <DraggableDiv 
                                                 width={track.width} 
                                                 height={track.height} 
                                                 top={track.top} 
                                                 left={track.left} 
                                                 sizeChanged={this.trackSizeChanged.bind(this)} 
                                                 trackClosed={this.trackClosed.bind(this)}
                                                 trackRotated={this.trackRotated.bind(this)}
                                                 uid={track.uid}
                                                 opacity={this.trackOpacity(track)}
                                    >
                                    
                                    </DraggableDiv>
                                    */
                                    );

                        }.bind(this)) 
                }
            </div>
                </div>
        );
    }
}
