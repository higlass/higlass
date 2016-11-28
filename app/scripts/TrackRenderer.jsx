import React from 'react';
import ReactDOM from 'react-dom';

import {zoom, zoomIdentity} from 'd3-zoom';
import {select,event} from 'd3-selection';
import {scaleLinear} from 'd3-scale';

import d3 from 'd3';

import {UnknownPixiTrack} from './UnknownPixiTrack.js';
import {HeatmapPixiTrack} from './HeatmapPixiTrack.js';
import {TopAxisTrack} from './TopAxisTrack.js';

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
        this.initialWidth = this.props.centerWidth;
        this.initialHeight = this.props.centerHeight;

        this.xScale = scaleLinear()
                        .domain(this.props.initialXDomain)
                        .range([0, this.initialWidth]);
        this.yScale = scaleLinear()
                        .domain(this.props.initialYDomain)
                        .range([0, this.initialHeight]);

        // maintain a list of trackDefObjects which correspond to the input
        // tracks
        // Each object will contain a trackDef 
        // {'top': 100, 'left': 50,... 'track': {'source': 'http:...', 'type': 'heatmap'}}
        // And a trackObject which will be responsible for rendering it
        this.trackDefObjects = {}
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
        console.log('nextProps.svgElement', nextProps.svgElement);
        if (!nextProps.svgElement || !nextProps.canvasElement)
            return;

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
        let zoomedXScale = event.transform.rescaleX(this.xScale); 
        let zoomedYScale = event.transform.rescaleY(this.yScale); 

        // when the window is resized, we want to maintain the center point
        // of each track, but make them less wide
        let xCenter = (zoomedXScale.domain()[1] + zoomedXScale.domain()[0])/ 2;
        let yCenter = (zoomedYScale.domain()[1] + zoomedYScale.domain()[0])/ 2;

        let widthRatio = this.props.centerWidth / this.initialWidth;
        let heightRatio = this.props.centerHeight / this.initialHeight;

        let widthDomain = zoomedXScale.domain()[1] - zoomedXScale.domain()[0];
        let heightDomain = zoomedYScale.domain()[1] - zoomedYScale.domain()[0];

        let newWidthDomain = widthRatio * widthDomain;
        let newHeightDomain = heightRatio * heightDomain;

        zoomedXScale.domain([xCenter - newWidthDomain / 2, xCenter + newWidthDomain / 2]);
        zoomedYScale.domain([yCenter - newHeightDomain / 2, yCenter - newHeightDomain / 2]);

        zoomedXScale.range([0, this.props.centerWidth]);
        zoomedYScale.range([0, this.props.centerHeight]);

        console.log('newWidthDomain:', newWidthDomain);

        for (let uid in this.trackDefObjects) {
            let track = this.trackDefObjects[uid].trackObject;

            track.xScale(zoomedXScale);
            track.yScale(zoomedYScale);

            track.draw();
        }
    }

    createTrackObject(track) {
        switch (track.type) {
            case 'top-axis':
                return new TopAxisTrack(this.svgElement);
            case 'heatmap':
                return new HeatmapPixiTrack(this.props.pixiStage)
            default:
                return new UnknownPixiTrack(this.props.pixiStage)
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
