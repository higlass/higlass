import React from 'react';
import ReactDOM from 'react-dom';

import {zoom, zoomIdentity} from 'd3-zoom';
import {select,event} from 'd3-selection';
import {scaleLinear} from 'd3-scale';

import d3 from 'd3';

import {UnknownPixiTrack} from './UnknownPixiTrack.js';
import {HeatmapTiledPixiTrack} from './HeatmapTiledPixiTrack.js';
import {TopLineTiledPixiTrack} from './TopLineTiledPixiTrack.js';
import {TopAxisTrack} from './TopAxisTrack.js';
import {LeftAxisTrack} from './LeftAxisTrack.js';

export class TrackRenderer extends React.Component {
    /**
     * Maintain a list of tracks, and re-render them whenever either
     * their size changes or the zoom level changes
     *
     * Zooming changes the domain of the scales.
     *
     * Resizing changes the range. Both trigger a rerender.
     */
    constructor(props) {
        super(props);

        this.dragging = false; //is this element being dragged?
        this.element = null;
        this.closing = false;

        this.yPositionOffset = 0;
        this.xPositionOffset = 0;

        this.zoomTransform = zoomIdentity;

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

        // the center measurements, because those corresponds to the widths
        // and heights of the actual tracks
        this.initialWidth = this.props.width;
        this.initialHeight = this.props.height;

        this.initialCenterX = this.props.marginLeft + this.props.leftWidth + this.props.centerWidth / 2;
        this.initialCenterY = this.props.marginTop + this.props.topHeight + this.props.centerHeight / 2;

        this.drawableToDomainX = scaleLinear()
            .domain([this.props.marginLeft + this.props.leftWidth,
                    this.props.marginLeft + this.props.leftWidth + this.props.centerHeight])
            .range([this.props.initialXDomain[0], this.props.initialXDomain[1]]);

        this.drawableToDomainY = scaleLinear()
            .domain([this.props.marginTop + this.props.topHeight,
                    this.props.marginTop + this.props.topHeight + this.props.centerHeight])
            .range([this.props.initialYDomain[0], this.props.initialYDomain[1]]);

        this.setUpScales();


        // maintain a list of trackDefObjects which correspond to the input
        // tracks
        // Each object will contain a trackDef 
        // {'top': 100, 'left': 50,... 'track': {'source': 'http:...', 'type': 'heatmap'}}
        // And a trackObject which will be responsible for rendering it
        this.trackDefObjects = {}
    }

    setUpScales() {
        let currentCenterX = this.props.marginLeft + this.props.leftWidth + this.props.centerWidth / 2;
        let currentCenterY = this.props.marginTop + this.props.topHeight + this.props.centerHeight / 2;
        // resizing moves the middle of center area
        //


        // we need to maintain two scales:
        // 1. the scale that is shown
        // 2. the scale that the zooming behavior acts on
        //
        // These need to be separated because the zoom behavior acts on a larger region
        // than the visible scale shows


        // if the window is resized, we don't want to change the scale, but we do want to move the center point
        // this needs to be tempered by the zoom factor so that we keep the visible center point in the center
        let centerDomainXOffset = (this.drawableToDomainX(currentCenterX) - this.drawableToDomainX(this.initialCenterX)) / this.zoomTransform.k;
        let centerDomainYOffset = (this.drawableToDomainX(currentCenterY) - this.drawableToDomainY(this.initialCenterY)) / this.zoomTransform.k;


        // the domain of the visible (not drawable area)
        let visibleXDomain = [this.drawableToDomainX(0) - centerDomainXOffset, this.drawableToDomainX(this.initialWidth) - centerDomainXOffset]
        let visibleYDomain = [this.drawableToDomainY(0) - centerDomainYOffset, this.drawableToDomainY(this.initialHeight) - centerDomainYOffset]

        // [drawableToDomain(0), drawableToDomain(1)]: the domain of the visible area
        // if the screen has been resized, then the domain width should remain the same


        this.xScale = scaleLinear()
                        .domain(visibleXDomain)
                        .range([0, this.initialWidth]);
        this.yScale = scaleLinear()
                        .domain(visibleYDomain)
                        .range([0, this.initialHeight]);

    }

    componentDidMount() {
        this.element = ReactDOM.findDOMNode(this);
        select(this.divTrackArea).call(this.zoomBehavior);

        // need to be mounted to make sure that all the renderers are
        // created before starting to draw tracks
        if (!this.props.svgElement || !this.props.canvasElement)
            return;

        this.svgElement = this.props.svgElement;
        this.syncTrackObjects(this.props.positionedTracks);

    }

    timedUpdatePositionAndDimensions(props) {
        if (this.closing)
            return;

        if (this.dragging) {
            //console.log('updating position...', this.state.mounted);
            this.yPositionOffset = this.element.getBoundingClientRect().top - this.canvasDom.getBoundingClientRect().top;
            this.xPositionOffset = this.element.getBoundingClientRect().left - this.canvasDom.getBoundingClientRect().left;

            this.updateTrackPositions();
            requestAnimationFrame(this.timedUpdatePositionAndDimensions.bind(this));
        }
    }

    componentWillReceiveProps(nextProps) {
        /**
         * The size of some tracks probably changed, so let's just
         * redraw them.
         */

        // don't initiate this component if it has nothing to draw on
        if (!nextProps.svgElement || !nextProps.canvasElement)
            return;

        this.setUpScales();
        this.canvasDom = ReactDOM.findDOMNode(nextProps.canvasElement);

        this.dragging = nextProps.dragging;
        this.timedUpdatePositionAndDimensions(nextProps);

        this.svgElement = nextProps.svgElement;

        this.syncTrackObjects(nextProps.positionedTracks);
    }

    componentWillUnmount() {
        /**
         * This view has been removed so we need to get rid of all the tracks it contains
         */
        this.removeTracks(Object.keys(this.trackDefObjects));
    }

    syncTrackObjects(trackDefinitions) {
        /** 
         * Make sure we have a track object for every passed track definition.
         *
         * If we get a track definition for which we have no Track object, we 
         * create a new one.
         *
         * If we have a track object for which we have no definition, we remove
         * the object.
         *
         * All the others we ignore.
         * 
         * Track definitions should be of the following form:
         *
         * { height:  100, width: 50, top: 30, left: 40, track: {...}}
         *
         * @param trackDefinitions: The definition of the track
         * @return: Nothing
         */
        let receivedTracksDict = {};
        for (let i = 0; i < trackDefinitions.length; i++)
            receivedTracksDict[trackDefinitions[i].track.uid] = trackDefinitions[i];

        let knownTracks = new Set(Object.keys(this.trackDefObjects));
        let receivedTracks = new Set(Object.keys(receivedTracksDict));
        
        // track definitions we don't have objects for
        let enterTrackDefs = new Set([...receivedTracks]
                                .filter(x => !knownTracks.has(x)));

        // track objects for which there is no definition 
        // (i.e. they no longer need to exist)
        let exitTracks = new Set([...knownTracks]
                                .filter(x => !receivedTracks.has(x)));


        // we already have these tracks, but need to change their dimensions
        let updateTrackDefs = new Set([...receivedTracks]
                                   .filter(x => knownTracks.has(x)));

        
        /*
        console.log('enterTrackDefs:', enterTrackDefs);
        console.log('exitTracks:', exitTracks);
        console.log('updateTrackDefs:', updateTrackDefs);
        */

        // add new tracks and update them (setting dimensions and positions)
        this.addNewTracks([...enterTrackDefs].map(x => receivedTracksDict[x]));
        this.updateExistingTrackDefs([...enterTrackDefs].map(x => receivedTracksDict[x]));

        this.updateExistingTrackDefs([...updateTrackDefs].map(x => receivedTracksDict[x]));
        this.removeTracks([...exitTracks]);
    }

    addNewTracks(newTrackDefinitions) {
        /**
         * We need to create new track objects for the given track
         * definitions.
         */
        if (!this.props.pixiStage)
            return;  // we need a pixi stage to start rendering
                     // the parent component where it lives probably
                     // hasn't been mounted yet

        //console.log('newTrackDefinitions', newTrackDefinitions);

        for (let i = 0; i < newTrackDefinitions.length; i++) {
            let newTrackDef = newTrackDefinitions[i];

            this.trackDefObjects[newTrackDef.track.uid] = {trackDef: newTrackDef, trackObject: this.createTrackObject(newTrackDef.track)};
        }
    }

    updateExistingTrackDefs(newTrackDefs) {
        for (let i = 0; i < newTrackDefs.length; i++) {
            this.trackDefObjects[newTrackDefs[i].track.uid].trackDef = newTrackDefs[i];
        }

        this.updateTrackPositions();
        this.applyZoomTransform();
    }

    updateTrackPositions() {
        for (let uid in this.trackDefObjects) {
            let trackDef = this.trackDefObjects[uid].trackDef;
            let trackObject = this.trackDefObjects[uid].trackObject;

            trackObject.setPosition([this.xPositionOffset + trackDef.left, this.yPositionOffset + trackDef.top]);
            trackObject.setDimensions([trackDef.width, trackDef.height]);

            let widthDifference = trackDef.width - this.initialWidth;
            let heightDifference = trackDef.height - this.initialHeight;

            trackObject.draw();
        }
    }


    removeTracks(trackUids) {
        for (let i = 0; i < trackUids.length; i++) {
            console.log('removing...', trackUids[i]);
            this.trackDefObjects[trackUids[i]].trackObject.remove();
            delete this.trackDefObjects[trackUids[i]];
        }
    }


    zoomed() {
        /**
         * Respond to a zoom event.
         *
         * We need to update our local record of the zoom transform and apply it
         * to all the tracks.
         */
        this.zoomTransform = event.transform;

        this.applyZoomTransform();
    }

    applyZoomTransform() {
        let zoomedXScale = this.zoomTransform.rescaleX(this.xScale); 
        let zoomedYScale = this.zoomTransform.rescaleY(this.yScale); 

        let newXScale = scaleLinear()
            .domain([this.props.marginLeft + this.props.leftWidth,
                    this.props.marginLeft + this.props.leftWidth + this.props.centerWidth].map(zoomedXScale.invert))
            .range([0, this.props.centerWidth]);

        let newYScale = scaleLinear()
            .domain([this.props.marginTop + this.props.topHeight,
                    this.props.marginTop + this.props.topHeight + this.props.centerHeight].map(zoomedYScale.invert))
            .range([0, this.props.centerHeight]);


        for (let uid in this.trackDefObjects) {
            let track = this.trackDefObjects[uid].trackObject;

            track.zoomed(newXScale, newYScale);

            track.draw();
        }
    }

    createTrackObject(track) {
        switch (track.type) {
            case 'left-axis':
                return new LeftAxisTrack(this.svgElement);
            case 'top-axis':
                return new TopAxisTrack(this.svgElement);
            case 'top-line':
                return new TopLineTiledPixiTrack(this.props.pixiStage, track.server, track.tilesetUid);
            case 'heatmap':
                return new HeatmapTiledPixiTrack(this.props.pixiStage, track.server, track.tilesetUid);
            default:
                return new UnknownPixiTrack(this.props.pixiStage);
        }

    }

    render() {
        return(
            <div 
                ref={(c) => this.divTrackArea = c}
                className={"track-renderer"}
                style={{
                    width: this.props.width, 
                    height: this.props.height,
                    position: "absolute"}}
            >
                {this.props.children}
            </div>
        );
        
    }
}
