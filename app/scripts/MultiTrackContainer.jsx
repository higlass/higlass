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
import {ChromosomeGrid} from './ChromosomeGrid.js';
import {TopChromosomeAxis} from './TopChromosomeAxis.js'
import {LeftChromosomeAxis} from './LeftChromosomeAxis.js'
import {GenomePositionSearchBox} from './GenomePositionSearchBox.jsx'
import {TopRatioPoint} from './TopRatioPoint.js';
import {TopCNVInterval} from './TopCNVInterval.js';
import {ResizeSensor,ElementQueries} from 'css-element-queries';

export class MultiTrackContainer extends React.Component {
    constructor(props) {
        super(props);

        this.uid = slugid.nice();
        this.awsDomain = '//52.23.165.123:9872';
        this.initialTrackHeight = 30;
        this.initialTrackWidth = 300;

        this.initLayouts();
        this.setupTrackDescriptions();

        let tracks = this.props.viewConfig.tracks;
        let currentTop = 0;
        this.twoD = false;               // are there any 2D tracks? this affects how the genomic
                                         // coordinates are displayed in the search box
        this.heightSpecified = true;     // do any of the tracks request a particular height?
        for (let i = 0; i < tracks.length; i++) {
            let trackHeight = this.initialTrackHeight;
            let trackWidth = this.initialTrackWidth;
            let trackId = slugid.nice();

            if (this.trackDescriptions[tracks[i].type].position == 'left' ||
                this.trackDescriptions[tracks[i].type].position == 'center')
                this.twoD = true

            if (this.trackDescriptions[tracks[i].type].position == 'center' && 
                this.trackDescriptions[tracks[i].type].overlay == false)
                if (!('height' in tracks[i]))
                    this.heightSpecified = false;

            if ('height' in tracks[i]) {
                trackHeight = tracks[i].height;
            }
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

        this.animate = this.animate.bind(this);

        this.xScale = d3.scale.linear().domain(this.props.viewConfig.domain);
        this.yScale = d3.scale.linear().domain(this.props.viewConfig.domain);

        this.xOrigScale = this.xScale.copy();
        this.yOrigScale = this.yScale.copy();

        this.zoomedXScale = this.xScale.copy();
        this.zoomedYScale = this.yScale.copy();

        this.state =  {
            width: this.props.viewConfig.width,     // should be changeable on resize
            height: this.props.viewConfig.height,     // should change in response to the addition of new tracks
                            // or user resize
            tracks: trackDict,
            tracksList: tracks,
            xRange: this.xOrigScale.range(),
            yRange: this.yOrigScale.range(),
            xDomain: this.xOrigScale.domain(),
            yDomain: this.yOrigScale.domain()
        };

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



        if (this.heightSpecified) this.setHeight();
        this.arrangeTracks();

        /*
        this.setState({
            xRange: this.xOrigScale.range(),
            yRange: this.yOrigScale.range(),
            xDomain: this.xOrigScale.domain(),
            yDomain: this.yOrigScale.domain()
        });
        */
    }

    updateView() {
        //d3.selectAll('
    }

    updateDimensions() {
        let cs = window.getComputedStyle(this.element, null);

        this.prevWidth = this.width;
        this.prevHeight = this.height;

        //console.log('updating dimensions:', this.width);

        //let offsetWidth = Math.floor(this.element.parentNode.offsetWidth / 2);


        this.width = Math.floor(this.element.getBoundingClientRect().width)
                     - parseInt(cs.getPropertyValue('padding-left'), 10)
                     - parseInt(cs.getPropertyValue('padding-right'), 10);

        if (!this.heightSpecified)
            this.height = this.width
        else
            this.setHeight();

        this.setState({'height': this.height });

        this.xOrigScale.range([0, this.width]);
        this.yOrigScale.range([0, this.height]);

        // the scale domains shouldn't change when zooming
        
        if (typeof this.prevWidth != 'undefined') {
            let currentDomainWidth = this.xOrigScale.domain()[1] - this.xOrigScale.domain()[0]; 
            let nextDomainWidth = currentDomainWidth * (this.width / this.prevWidth);

            let scale = this.zoom.scale();
            let translate = this.zoom.translate();

            // the implied zoom domain before zooming
            this.xOrigScale.range([0, this.prevWidth]);
            let prevZoomedDomain = (this.xOrigScale.range()
                                      .map(function(x) { return (x - translate[0]) / scale })
                                      .map(this.xOrigScale.invert))

            // the new scale
            let newXScale = this.xOrigScale.copy();
            newXScale.range([0, this.width]);

            // calculate a new translation that would keep the implied (after zooming)
            // zoom domain equal to that before zooming
            let newTranslate = -newXScale(prevZoomedDomain[0]) * scale;

            this.zoom.translate([newTranslate, translate[1]]);
            this.xOrigScale.range([0, this.width]);

        }

        if (typeof this.prevHeight != 'undefined') {
            let currentDomainHeight = this.yOrigScale.domain()[1] - this.yOrigScale.domain()[0]; 
            let nextDomainHeight = currentDomainHeight * (this.height / this.prevHeight);

            this.yOrigScale.domain([this.yOrigScale.domain()[0], 
                               this.yOrigScale.domain()[0] + nextDomainHeight]);

        }


        this.renderer.resize(this.width, this.height);

        if (typeof this.topChromosomeAxis != 'undefined') {
            this.topChromosomeAxis.xScale(this.xOrigScale.copy());
            this.leftChromosomeAxis.yScale(this.yOrigScale.copy());
            this.chromosomeGrid.xScale(this.xOrigScale.copy());
            this.chromosomeGrid.yScale(this.yOrigScale.copy());
            this.leftGeneLabels.yScale(this.yOrigScale.copy());
            this.topGeneLabels.xScale(this.xOrigScale.copy());
            this.horizontalTiledArea.xScale(this.xOrigScale.copy());
            this.horizontalDiagonalTiledArea.xScale(this.xOrigScale.copy());
            this.verticalTiledArea.yScale(this.yOrigScale.copy());
            this.wigglePixiTrack.xScale(this.xOrigScale.copy());
            this.wigglePixiLine.xScale(this.xOrigScale.copy());
            this.topRatioPoint.xScale(this.xOrigScale.copy());
            this.topCNVInterval.xScale(this.xOrigScale.copy());
            this.wigglePixiPoint.xScale(this.xOrigScale.copy());
            this.wigglePixiHeatmap.xScale(this.xOrigScale.copy());
            this.leftWigglePixiTrack.yScale(this.yOrigScale.copy());
            this.heatmapRectangleTrack.xScale(this.xOrigScale.copy())
                                      .yScale(this.yOrigScale.copy());
            this.twoDTiledArea.xScale(this.xOrigScale.copy())
                              .yScale(this.yOrigScale.copy());
            this.diagonalHeatmapTrack.xScale(this.xOrigScale.copy())
                                     .yScale(this.yOrigScale.copy());
        }

        this.setState({
            xRange: this.xOrigScale.range(),
            yRange: this.yOrigScale.range(),
            xDomain: this.xOrigScale.domain(),
            yDomain: this.yOrigScale.domain()
        });

        for (let uid in this.state.tracks) {
            if (this.trackDescriptions[this.state.tracks[uid].type].position == 'top' ||
                this.trackDescriptions[this.state.tracks[uid].type].position == 'center')
                    this.state.tracks[uid].width = this.width;

            if (this.trackDescriptions[this.state.tracks[uid].type].position == 'left' ||
                this.trackDescriptions[this.state.tracks[uid].type].position == 'center') 
                    this.state.tracks[uid].height = this.height;

            if ('resizeDispatch' in this.state.tracks[uid]) {
                this.state.tracks[uid].resizeDispatch.resize();
            }
        }
        // change out all the scales and then call everything again
        this.handleZoom();
        
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

            if (track.overlay)
                continue;       //overlay tracks don't have their dimensions counted

            if (this.trackDescriptions[track.type].position == 'top')
                this.topMargin += track.height;
            if (this.trackDescriptions[track.type].position == 'left')
                this.leftMargin += track.width;
            if (this.trackDescriptions[track.type].position == 'right')
                this.rightMargin += track.width;
            if (this.trackDescriptions[track.type].position == 'bottom')
                this.bottomMargin += track.height;
        }

        let currentRightLeft = this.width - this.rightMargin;
        let currentBottomTop = this.height - this.bottomMargin;

        for (let i = 0; i < this.state.tracksList.length; i++) {
            let trackId = this.state.tracksList[i].uid;
            let track = this.state.tracks[trackId];
            track.leftMargin = this.leftMargin;
            track.topMargin = this.topMargin;

            if (track.overlay) {
                if (i == 0) {
                    console.log("The first track can't be an overlay track");
                    continue;
                } else {
                    track.left = this.state.tracksList[i-1].left;
                    track.right = this.state.tracksList[i-1].right;
                    track.width = this.state.tracksList[i-1].width;
                    track.height = this.state.tracksList[i-1].height;
                    
                    // store the track above this one as it's parent so that we can
                    // get visible vaues from it for proper scaling
                    track.parentTrack = this.state.tracksList[i-1];
                }
            }

            if (this.trackDescriptions[track.type].position == 'top') {
                track.left = this.leftMargin;
                track.top = currentTop;
                track.width = this.width - this.leftMargin - this.rightMargin;
                currentTop += track.height;
            }

            if (this.trackDescriptions[track.type].position == 'left') {
                track.top = this.topMargin;
                track.left = currentLeft;
                track.height = this.height - this.topMargin - this.bottomMargin;
                currentLeft += track.width;
            }

            if (this.trackDescriptions[track.type].position == 'right') {
                track.top = this.topMargin;
                track.left = currentRightLeft;
                track.height = this.height - this.topMargin - this.bottomMargin;
                currentRightLeft += track.width;
            }

            if (this.trackDescriptions[track.type].position == 'bottom') {
                track.left = this.leftMargin;
                track.top = currentBottomTop;
                track.width = this.width - this.leftMargin - this.rightMargin;
                currentBottomTop += track.height;
            }

            if (this.trackDescriptions[track.type].position == 'center') {
                track.left = this.leftMargin;
                track.top = this.topMargin;
                track.width = this.width  - this.leftMargin - this.rightMargin;
                track.height = this.height - this.topMargin - this.bottomMargin;
            }
        }

    }

    handleZoom() {
        let translate = this.zoom.translate();
        let scale = this.zoom.scale();

        this.zoomedXScale.range(this.xOrigScale.range());
        this.zoomedXScale.domain(this.xOrigScale.range()
                                  .map(function(x) { return (x - translate[0]) / scale })
                                  .map(this.xOrigScale.invert))

        this.zoomedYScale.range(this.yOrigScale.range());
        this.zoomedYScale.domain(this.yOrigScale.range()
                                  .map(function(y) { return (y - translate[1]) / scale })
                                  .map(this.yOrigScale.invert))

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
                if (this.trackDescriptions[this.props.viewConfig.tracks[i].type].position == 'top' ||
                    this.trackDescriptions[this.props.viewConfig.tracks[i].type].position == 'center') {
                        this.height += this.props.viewConfig.tracks[i].height;
                }
            }

        }

    }

    initLayouts() {
        this.topChromosomeAxis = TopChromosomeAxis();
        this.leftChromosomeAxis = LeftChromosomeAxis();
        this.chromosomeGrid = ChromosomeGrid();
        this.horizontalDiagonalTiledArea = GenericTiledArea()
        this.horizontalTiledArea = GenericTiledArea()
        this.verticalTiledArea = GenericTiledArea()
        this.twoDTiledArea = GenericTiledArea()
        this.wigglePixiTrack = WigglePixiTrack()
        this.wigglePixiLine = WigglePixiLine()
        this.wigglePixiPoint = WigglePixiPoint()
        this.topRatioPoint = TopRatioPoint()
        this.topCNVInterval = TopCNVInterval()
        this.wigglePixiHeatmap = WigglePixiHeatmap()
        this.leftWigglePixiTrack = LeftWigglePixiTrack()
        this.heatmapRectangleTrack = HeatmapRectangleTrack()
        this.diagonalHeatmapTrack = TopDiagonalHeatmapRectangleTrack()
        this.topGeneLabels = TopGeneLabelsTrack()
        this.leftGeneLabels = LeftGeneLabelsTrack()

        this.oneDHorizontalTrackList = [];
        this.oneDHorizontalDiagonalTrackList = [];
        this.oneDVerticalTrackList = [];
        this.twoDTrackList = [];
        this.horizontalAxisList = [];
        this.verticalAxisList = [];
    }

    componentDidMount() {
        this.element = ReactDOM.findDOMNode(this);
        ElementQueries.listen();
        this.resizeSensor = new ResizeSensor(this.element, function() {
            this.updateDimensions();
        }.bind(this));

        //window.addEventListener('resize', this.updateDimensions.bind(this));

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

        this.topChromosomeAxis
            .xScale(this.xOrigScale.copy())
            .width(this.width)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch)

        this.leftChromosomeAxis
            .yScale(this.yOrigScale.copy())
            .width(this.width)
            .height(this.height)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch)

        this.chromosomeGrid
            .xScale(this.xOrigScale.copy())
            .yScale(this.yOrigScale.copy())
            .width(this.width)
            .height(this.height)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch)

        this.horizontalDiagonalTiledArea
            .tileType('div')
            .oneDimensional(false)
            .diagonal(true)
            .width(this.width)
            .height(this.width)
            .domain(this.xScale.domain())
            .zoomDispatch(this.zoomDispatch)

        this.horizontalTiledArea
            .tileType('div')
            .width(this.width)
            .height(this.height)
            .xScale(this.xOrigScale.copy())
            .domain(this.xScale.domain())
            .zoomDispatch(this.zoomDispatch)
            .horizontal(true);

        this.verticalTiledArea
            .tileType('div')
            .width(this.height)   // since this is a vertical tiled area, the width is actually the height
                                        // of the viewable area
            .domain(this.yScale.domain())
            .yScale(this.yOrigScale.copy())
            .zoomDispatch(this.zoomDispatch)
            .horizontal(false)

        this.twoDTiledArea
            .tileType('div')
            .oneDimensional(false)
            .width(this.width)
            .height(this.height)
            .xScale(this.xOrigScale.copy())
            .yScale(this.yOrigScale.copy())
            .domain(this.xScale.domain())
            .zoomDispatch(this.zoomDispatch)
            .mirrorTiles(true)

        this.wigglePixiTrack
            .xScale(this.xOrigScale.copy())
            .width(this.width)
            .height(this.height)
            .pixiStage(this.stage)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch);

        this.wigglePixiLine
            .xScale(this.xOrigScale.copy())
            .width(this.width)
            .height(this.height)
            .pixiStage(this.stage)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch);

        this.wigglePixiPoint
            .xScale(this.xOrigScale.copy())
            .width(this.width)
            .height(this.height)
            .pixiStage(this.stage)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch);

        this.topRatioPoint
            .xScale(this.xOrigScale.copy())
            .width(this.width)
            .height(this.height)
            .pixiStage(this.stage)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch);

        this.topCNVInterval
            .xScale(this.xOrigScale.copy())
            .width(this.width)
            .height(this.height)
            .pixiStage(this.stage)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch);

        this.wigglePixiHeatmap
            .xScale(this.xOrigScale.copy())
            .width(this.width)
            .height(this.height)
            .pixiStage(this.stage)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch);

        this.leftWigglePixiTrack
            .yScale(this.yOrigScale.copy())
            .width(this.width)
            .height(this.height)
            .pixiStage(this.stage)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch);

        this.heatmapRectangleTrack
            .xScale(this.xOrigScale.copy())
            .yScale(this.yOrigScale.copy())
            .width(this.width)
            .height(this.height)
            .pixiStage(this.stage)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch); 

        this.diagonalHeatmapTrack
            .xScale(this.xScale.copy())
            .yScale(this.yScale.copy())
            .width(this.width)
            .height(this.height)
            .pixiStage(this.stage)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch); 

        this.topGeneLabels
            .xScale(this.xOrigScale.copy())
            .width(this.width)
            .pixiStage(this.stage)
            .resizeDispatch(this.resizeDispatch)
            .zoomDispatch(this.zoomDispatch);

        this.leftGeneLabels
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
                d3.select(element).call(this.diagonalHeatmapTrack);
        }.bind(this));

        this.horizontalTiledArea.tilesChanged(function(d, element) {
                d.translate = this.zoom.translate();
                d.scale = this.zoom.scale();
                d3.select(element).call(this.trackDescriptions[d.type].layout)
            }.bind(this));

        this.verticalTiledArea.tilesChanged(function(d, element) {
                d.translate = this.zoom.translate();
                d.scale = this.zoom.scale();
                d3.select(element).call(this.trackDescriptions[d.type].layout)
            }.bind(this));


        this.twoDTiledArea.tilesChanged(function(d, element) {
            d.translate = this.zoom.translate();
            d.scale = this.zoom.scale();
            d3.select(element).call(this.trackDescriptions[d.type].layout)
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

        // do a quick zoom to set the genome position in the searchBox
        this.zoomDispatch.zoom(this.zoom.translate(), this.zoom.scale()); 
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
        // called from componentDidMount
        this.oneDHorizontalTrackList = [];
        this.oneDHorizontalDiagonalTrackList = [];
        this.oneDVerticalTrackList = [];
        this.twoDTrackList = [];
        this.horizontalAxisList = [];
        this.verticalAxisList = [];
        
        let tracksPerDimensions = {};


        for (let trackId in this.state.tracks) {
            let trackDimensions = this.trackDescriptions[this.state.tracks[trackId].type].dimension;

            if (!(trackDimensions in tracksPerDimensions))
                tracksPerDimensions[trackDimensions] = [];

            tracksPerDimensions[trackDimensions].push(this.state.tracks[trackId]);
            console.log('track-dimensions', trackDimensions);

            /*
            for (let i = 0; i < this.state.tracks[trackId].overlays.length; i++) {
                console.log('adding overlay:', trackDimensions);
                // add overlays, they should have the same dimensions
                tracksPerDimensions[trackDimensions].push(this.state.tracks[trackId].overlays[i]);
            }
            */
        }

        for (let trackDimensions in tracksPerDimensions) {
            let handler = this.trackDimensionsHandlers[trackDimensions];

            if (handler == null)
                continue

            if (typeof handler == 'undefined') {
                console.log('WARNING: undefined handler for track dimensions:', trackDimensions);
                continue;
            }
                
                
            d3.select(this.bigDiv).selectAll('.' + trackDimensions)
              .data(tracksPerDimensions[trackDimensions])
              .call(this.trackDimensionsHandlers[trackDimensions])
        }

    }

    trackRotated(trackId) {

    }

    setupTrackDescriptions() {
        this.trackDescriptions = { 
            'top-bar': 
                {
                 'position': 'top',
                 'layout': this.wigglePixiTrack,
                 'dimension': 'one-d-horizontal'
                },
            'left-bar': 
                {
                    'position': 'left',
                    'layout': this.leftWigglePixiTrack,
                    'dimension': 'one-d-vertical'
                }, 
            'top-line': 
                {
                    'position': 'top',
                    'layout': this.wigglePixiLine,
                    'dimension': 'one-d-horizontal'
                },
            'top-point': 
                {
                    'position': 'top',
                    'layout': this.wigglePixiPoint,
                    'dimension': 'one-d-horizontal'
                },
            'top-ratio-point': 
                {
                    'position': 'top',
                    'layout': this.topRatioPoint,
                    'dimension': 'one-d-horizontal'
                },
            'top-cnv-interval': 
                {
                    'position': 'top',
                    'layout': this.topCNVInterval,
                    'dimension': 'one-d-horizontal'
                },
            'top-heatmap': 
                {
                    'position': 'top',
                    'layout': this.wigglePixiHeatmap,
                    'dimension': 'one-d-horizontal'
                },
            'top-diagonal-heatmap': 
                {
                    'position': 'top',
                    'layout': this.diagonalHeatmapTrack,
                    'dimension': 'one-d-horizontal-diagonal'
                },
            'top-gene-labels': 
                {
                    'position': 'top',
                    'layout': this.topGeneLabels,
                    'dimension': 'one-d-horizontal'
                },
            'left-gene-labels': 
                {
                    'position': 'left',
                    'layout': this.leftGeneLabels,
                    'dimension': 'one-d-vertical'
                },
            'top-chromosome-axis': 
                {
                    'position': 'top',
                    'layout': this.topChromosomeAxis,
                    'dimension': 'horizontal-axis'
                },
            'left-chromosome-axis': 
                {
                    'position': 'left',
                    'layout': this.leftChromosomeAxis,
                    'dimension': 'vertical-axis'
                },
            'left-empty': 
                {
                    'position': 'left',
                    'layout': null,
                    'dimension': 'empty'
                },
            'top-empty': 
                {
                    'position': 'top',
                    'layout': null,
                    'dimension': 'empty'
                    
                },
            'right-bar': 
                {
                    'position': 'right',
                    'layout': null,
                    'dimension': 'one-d-vertical'
                }, 
            'heatmap': 
                {
                    'position': 'center',
                    'layout': this.heatmapRectangleTrack,
                    'dimension': 'two-d'
                },
            'chromosome-grid':
                {
                    'position': 'center',
                    'layout': this.chromsomeGrid,
                    'dimension': 'chromosome-grid'
                }
            };

        this.trackDimensionsHandlers = {
            'horizontal-axis': this.topChromosomeAxis,
            'vertical-axis': this.leftChromosomeAxis,
            'chromosome-grid': this.chromosomeGrid,
            'one-d-horizontal-diagonal': this.horizontalDiagonalTiledArea,
            'one-d-horizontal': this.horizontalTiledArea,
            'one-d-vertical': this.verticalTiledArea,
            'two-d': this.twoDTiledArea,
            'empty': null
        };

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
        return this.trackDescriptions[track.type].dimension;
    }

    trackOpacity(track) {
        if (track.type == 'top-chromosome-axis' || track.type == 'left-chromosome-axis')
            return 1.;
        else if (track.type == 'chromosome-grid') return 0.5
        else return 0.1;
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

            translate = [xZoomParams.translate, yZoomParams.translate];
            scale = xZoomParams.scale;
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
                        top: 2,
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

        /*
                <div style={addTrackDivStyle}>
                    <AddTrackDiv />
                </div>
                */

        return(
            <div style={viewStyle}>
            <div style={{"width": this.width, "height": 16, "position": "relative", "border": "solid 1px", "marginBottom": 4, "opacity": 0.6}} className="multitrack-header">
                <img src="images/cross.svg" width="10px" style={imgStyle}/>
            </div>

            <div>
                { (() => {
                    if (this.props.viewConfig.searchBox) {
                return <GenomePositionSearchBox 
                    zoomToGenomePositionHandler={this.zoomToGenomePosition.bind(this)}
                    chromInfoPath={this.props.viewConfig.chromInfoPath}
                    zoomDispatch={this.zoomDispatch}
                    xRange={this.state.xRange}
                    yRange={this.state.yRange}
                    xDomain={this.state.xDomain}
                    yDomain={this.state.yDomain}
                    twoD={this.twoD}
                    autocompleteSource={this.props.viewConfig.searchBox.autocompleteSource}
                    />
                    }})() }
            </div>
            <div style={divStyle} ref={(c) => this.bigDiv = c} >
                <canvas ref={(c) => this.canvas = c} style={canvasStyle}/>
                { trackList.map(function(track, i) 
                        {
                            //console.log('track.top:', track.top, 'track.width:', track.width, 'track.height:', track.height);
                            return (
                                <div 
                                                 className={'track ' + this.trackDimension(track)}
                                                 style={{left: track.left, 
                                                         top: track.top, 
                                                         width: track.width ? track.width : this.initialTrackWidth,
                                                         height: track.height ? track.height : this.initialTrackHeight,
                                                         position: 'absolute'}}
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
