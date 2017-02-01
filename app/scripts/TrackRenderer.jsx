import React from 'react';
import ReactDOM from 'react-dom';

import {zoom, zoomIdentity} from 'd3-zoom';
import {select,event} from 'd3-selection';
import {scaleLinear} from 'd3-scale';

import d3 from 'd3';

import {UnknownPixiTrack} from './UnknownPixiTrack.js';
import {HeatmapTiledPixiTrack} from './HeatmapTiledPixiTrack.js';
import {Id2DTiledPixiTrack} from './Id2DTiledPixiTrack.js';
import {IdHorizontal1DTiledPixiTrack} from './IdHorizontal1DTiledPixiTrack.js';
import {IdVertical1DTiledPixiTrack} from './IdVertical1DTiledPixiTrack.js';
import {TopAxisTrack} from './TopAxisTrack.js';
import {LeftAxisTrack} from './LeftAxisTrack.js';
import {CombinedTrack} from './CombinedTrack.js';
import {HorizontalLine1DPixiTrack} from './HorizontalLine1DPixiTrack.js';
import {VerticalLine1DPixiTrack} from './VerticalLine1DPixiTrack.js';
import {CNVIntervalTrack} from './CNVIntervalTrack.js';
import {LeftTrackModifier} from './LeftTrackModifier.js';
import {ViewportTracker2D} from './ViewportTracker2D.js';
import {Track} from './Track.js';
import {HorizontalGeneAnnotationsTrack} from './HorizontalGeneAnnotationsTrack.js';
import {ArrowheadDomainsTrack} from './ArrowheadDomainsTrack.js';
import {Chromosome2DLabels} from './Chromosome2DLabels.js';
import {Chromosome2DGrid} from './Chromosome2DGrid.js';
import {HorizontalChromosomeLabels} from './HorizontalChromosomeLabels.js';

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

        // create a zoom behavior that we'll just use to transform selections
        // without having it fire an "onZoom" event
        this.emptyZoomBehavior = zoom()

        // a lot of the updates in TrackRenderer happen in response to
        // componentWillReceiveProps so we need to perform them with the
        // newest set of props. When cWRP is called, this.props still contains
        // the old props, so we need to store them in a new variable
        this.currentProps = props;

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

                /*
        if (!this.props.zoomable)
            this.zoomBehavior.scaleExtent([1,1]);
            */

        // the center measurements, because those corresponds to the widths
        // and heights of the actual tracks
        this.initialWidth = this.currentProps.width;
        this.initialHeight = this.currentProps.height;

        this.initialXDomain = [0,1];
        this.initialYDomain = [0,1];

        this.prevCenterX = this.currentProps.marginLeft + this.currentProps.leftWidth + this.currentProps.centerWidth / 2;
        this.prevCenterY = this.currentProps.marginTop + this.currentProps.topHeight + this.currentProps.centerHeight / 2;

        // The offset of the center from the original. Used to keep the scales centered on resize events
        this.cumCenterXOffset = 0;
        this.cumCenterYOffset = 0;


        // console.log('constructor initialYDomain', this.currentProps.initialYDomain);
        this.setUpInitialScales(this.currentProps.initialXDomain,
                                this.currentProps.initialYDomain);
        this.setUpScales(this.currentProps);


        // maintain a list of trackDefObjects which correspond to the input
        // tracks
        // Each object will contain a trackDef
        // {'top': 100, 'left': 50,... 'track': {'source': 'http:...', 'type': 'heatmap'}}
        // And a trackObject which will be responsible for rendering it
        this.trackDefObjects = {}
    }

    componentDidMount() {
        this.element = ReactDOM.findDOMNode(this);
        this.divTrackAreaSelection = select(this.divTrackArea);
        this.divTrackAreaSelection.call(this.zoomBehavior);

        this.canvasDom = ReactDOM.findDOMNode(this.currentProps.canvasElement);

        // need to be mounted to make sure that all the renderers are
        // created before starting to draw tracks
        if (!this.currentProps.svgElement || !this.currentProps.canvasElement)
            return;

        this.svgElement = this.currentProps.svgElement;
        this.syncTrackObjects(this.currentProps.positionedTracks);

        this.currentProps.setCentersFunction(this.setCenter.bind(this));
        this.currentProps.registerDraggingChangedListener(this.draggingChanged.bind(this));
    }

    draggingChanged(draggingStatus) {
        this.dragging = draggingStatus;

        this.timedUpdatePositionAndDimensions();
    }

    setUpInitialScales(initialXDomain, initialYDomain) {
        if (initialXDomain == this.initialXDomain &&
            initialYDomain == this.initialYDomain)
        /*
        if (initialXDomain[0] == this.initialXDomain[0] &&
            initialXDomain[1] == this.initialXDomain[1] &&
            initialYDomain[1] == this.initialYDomain[1] &&
            initialYDomain[0] == this.initialYDomain[0])
            */
            return;

        // only update the initial domain
        this.initialXDomain = initialXDomain;
        this.initialYDomain = initialYDomain;

        this.drawableToDomainX = scaleLinear()
            .domain([this.currentProps.marginLeft + this.currentProps.leftWidth,
                    this.currentProps.marginLeft + this.currentProps.leftWidth + this.currentProps.centerWidth])
            .range([initialXDomain[0], initialXDomain[1]]);

        let midXDomain = (initialXDomain[0] + initialXDomain[0]) / 2;
        let yDomainWidth = (initialXDomain[1] - initialXDomain[0]) * (this.currentProps.centerHeight / this.currentProps.centerWidth);

        this.drawableToDomainY = scaleLinear()
            .domain([this.currentProps.marginTop + this.currentProps.topHeight + this.currentProps.centerHeight / 2 - this.currentProps.centerWidth / 2,
                    this.currentProps.marginTop + this.currentProps.topHeight + this.currentProps.centerHeight / 2 + this.currentProps.centerWidth / 2])
            .range([initialXDomain[0], initialXDomain[1]]);

    }

    componentWillReceiveProps(nextProps) {
        /**
         * The size of some tracks probably changed, so let's just
         * redraw them.
         */

        // don't initiate this component if it has nothing to draw on
        if (!nextProps.svgElement || !nextProps.canvasElement)
            return;

        this.currentProps = nextProps;
        // console.log('initialYDomain', this.currentProps.initialYDomain);
        this.setUpInitialScales(nextProps.initialXDomain,
                                nextProps.initialYDomain);

        this.setUpScales();
        this.canvasDom = ReactDOM.findDOMNode(nextProps.canvasElement);


        this.svgElement = nextProps.svgElement;

        this.syncTrackObjects(nextProps.positionedTracks);


        for (let track of nextProps.positionedTracks) {
            // tracks all the way down
            let options = track.track.options;
            let trackObject = this.trackDefObjects[track.track.uid].trackObject;
            trackObject.rerender(options);

            if (track.track.hasOwnProperty('contents')) {
                let ctDefs = {};
                for (let ct of track.track.contents) {
                    ctDefs[ct.uid] = ct;
                }

                for (let uid in trackObject.createdTracks) {
                    trackObject.createdTracks[uid].rerender(ctDefs[uid].options);
                }
            }
        }
    }

    componentWillUnmount() {
        /**
         * This view has been removed so we need to get rid of all the tracks it contains
         */
        this.removeTracks(Object.keys(this.trackDefObjects));
        this.currentProps.removeDraggingChangedListener(this.draggingChanged);
    }

    setUpScales() {
        let currentCenterX = this.currentProps.marginLeft + this.currentProps.leftWidth + this.currentProps.centerWidth / 2;
        let currentCenterY = this.currentProps.marginTop + this.currentProps.topHeight + this.currentProps.centerHeight / 2;

        // we need to maintain two scales:
        // 1. the scale that is shown
        // 2. the scale that the zooming behavior acts on
        //
        // These need to be separated because the zoom behavior acts on a larger region
        // than the visible scale shows

        // if the window is resized, we don't want to change the scale, but we do want to move the center point
        // this needs to be tempered by the zoom factor so that we keep the visible center point in the center
        let centerDomainXOffset = (this.drawableToDomainX(currentCenterX) - this.drawableToDomainX(this.prevCenterX)) / this.zoomTransform.k;
        let centerDomainYOffset = (this.drawableToDomainY(currentCenterY) - this.drawableToDomainY(this.prevCenterY)) / this.zoomTransform.k;

        this.cumCenterYOffset += centerDomainYOffset;
        this.cumCenterXOffset += centerDomainXOffset;

        this.prevCenterY = currentCenterY;
        this.prevCenterX = currentCenterX;

        // the domain of the visible (not drawable area)
        let visibleXDomain = [this.drawableToDomainX(0) - this.cumCenterXOffset, this.drawableToDomainX(this.initialWidth) - this.cumCenterXOffset]
        let visibleYDomain = [this.drawableToDomainY(0) - this.cumCenterYOffset, this.drawableToDomainY(this.initialHeight) - this.cumCenterYOffset]

        // [drawableToDomain(0), drawableToDomain(1)]: the domain of the visible area
        // if the screen has been resized, then the domain width should remain the same
        //

        //this.xScale should always span the region that the zoom behavior is being called on
        this.xScale = scaleLinear()
                        .domain(visibleXDomain)
                        .range([0, this.initialWidth]);
        this.yScale = scaleLinear()
                        .domain(visibleYDomain)
                        .range([0, this.initialHeight]);

        for (let uid in this.trackDefObjects) {
            let track = this.trackDefObjects[uid].trackObject;

            //track.refXScale(this.xScale);
            //track.refYScale(this.yScale);

            // e.g. when the track is resized... we want to redraw it
            track.refScalesChanged(this.xScale, this.yScale);
            track.draw();
        }

        this.applyZoomTransform(this.currentProps);
    }

    timedUpdatePositionAndDimensions() {
        if (this.closing)
            return;

        if (this.dragging) {
            this.yPositionOffset = this.element.getBoundingClientRect().top - this.canvasDom.getBoundingClientRect().top;
            this.xPositionOffset = this.element.getBoundingClientRect().left - this.canvasDom.getBoundingClientRect().left;

            this.updateTrackPositions();
            this.applyZoomTransform(this.currentProps);

            requestAnimationFrame(this.timedUpdatePositionAndDimensions.bind(this));
        }
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
        if (!this.currentProps.pixiStage)
            return;  // we need a pixi stage to start rendering
                     // the parent component where it lives probably
                     // hasn't been mounted yet

        for (let i = 0; i < newTrackDefinitions.length; i++) {
            let newTrackDef = newTrackDefinitions[i];
            let newTrackObj = this.createTrackObject(newTrackDef.track)

            //newTrackObj.refXScale(this.xScale);
            //newTrackObj.refYScale(this.yScale);

            newTrackObj.refScalesChanged(this.xScale, this.yScale);

            this.trackDefObjects[newTrackDef.track.uid] = {trackDef: newTrackDef,
                trackObject: newTrackObj};
        }
    }

    updateExistingTrackDefs(newTrackDefs) {
        for (let i = 0; i < newTrackDefs.length; i++) {
            this.trackDefObjects[newTrackDefs[i].track.uid].trackDef = newTrackDefs[i];

            // if it's a CombinedTrack, we have to see if its contents have changed
            // e.g. somebody may have added a new Series
            if (newTrackDefs[i].track.type == 'combined') {
                this.trackDefObjects[newTrackDefs[i].track.uid]
                .trackObject
                .updateContents(newTrackDefs[i].track.contents, this.createTrackObject.bind(this))
                .refScalesChanged(this.xScale, this.yScale);
            }
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
            this.trackDefObjects[trackUids[i]].trackObject.remove();
            delete this.trackDefObjects[trackUids[i]];
        }
    }

    setCenter(centerX, centerY, sourceK, notify=true) {
        /*
         * Set the center of this view to a paticular X and Y coordinate
         *
         * @param notify: Notify listeners that the scales have changed. This
         *      can be turned off to prevent circular updates when scales are
         *      locked.
         */


        let refK = this.xScale.invert(1) - this.xScale.invert(0);

        let k = refK / sourceK;

        let middleViewX = this.currentProps.marginLeft + this.currentProps.leftWidth + this.currentProps.centerWidth / 2;
        let middleViewY = this.currentProps.marginTop + this.currentProps.topHeight + this.currentProps.centerHeight / 2;

        // After applying the zoom transform, the xScale of the target centerX
        // should be equal to the middle of the viewport
        // this.xScale(centerX) * k + translate[0] = middleViewX
        let translateX = middleViewX - this.xScale(centerX) * k;
        let translateY = middleViewY - this.yScale(centerY) * k;

        // the ref scale spans the width of the viewport
        let newTransform = zoomIdentity.translate(translateX, translateY).scale(k);

        this.zoomTransform = newTransform;
        this.emptyZoomBehavior.transform(this.divTrackAreaSelection, newTransform);
        return this.applyZoomTransform(notify);
    }

    zoomed() {
        /**
         * Respond to a zoom event.
         *
         * We need to update our local record of the zoom transform and apply it
         * to all the tracks.
         */

        if (!this.currentProps.zoomable)
            this.zoomTransform = zoomIdentity;
        else
            this.zoomTransform = event.transform;

        this.applyZoomTransform();
    }

    applyZoomTransform(notify=true) {
        let zoomedXScale = this.zoomTransform.rescaleX(this.xScale);
        let zoomedYScale = this.zoomTransform.rescaleY(this.yScale);

        let newXScale = scaleLinear()
            .domain([this.currentProps.marginLeft + this.currentProps.leftWidth,
                    this.currentProps.marginLeft + this.currentProps.leftWidth + this.currentProps.centerWidth].map(zoomedXScale.invert))
            .range([0, this.currentProps.centerWidth]);

        let newYScale = scaleLinear()
            .domain([this.currentProps.marginTop + this.currentProps.topHeight,
                    this.currentProps.marginTop + this.currentProps.topHeight + this.currentProps.centerHeight].map(zoomedYScale.invert))
            .range([0, this.currentProps.centerHeight]);

        for (let uid in this.trackDefObjects) {
            let track = this.trackDefObjects[uid].trackObject;

            track.zoomed(newXScale, newYScale, this.zoomTransform.k,
                        this.zoomTransform.x + this.xPositionOffset,
                        this.zoomTransform.y + this.yPositionOffset,
                        this.currentProps.marginLeft + this.currentProps.leftWidth,
                        this.currentProps.marginTop + this.currentProps.topHeight);
            track.draw();
        }

        if (notify)
            this.currentProps.onScalesChanged(newXScale, newYScale);

        return [newXScale, newYScale];
    }

    createTrackObject(track) {
        let handleTilesetInfoReceived = x => {
            this.currentProps.onTilesetInfoReceived(track.uid, x);
        }

        switch (track.type) {
            case 'left-axis':
                return new LeftAxisTrack(this.svgElement);
            case 'top-axis':
                return new TopAxisTrack(this.svgElement);
            case 'heatmap':
                return new HeatmapTiledPixiTrack(this.currentProps.pixiStage,
                                                 track.server,
                                                 track.tilesetUid,
                                                 handleTilesetInfoReceived,
                                                 track.options,
                                                 this.currentProps.onNewTilesLoaded);
            case 'horizontal-line':
                return new HorizontalLine1DPixiTrack(this.currentProps.pixiStage,
                                                     track.server,
                                                     track.tilesetUid,
                                                     handleTilesetInfoReceived,
                                                     track.options,
                                                     this.currentProps.onNewTilesLoaded);
            case 'vertical-line':
                return new LeftTrackModifier(
                    new HorizontalLine1DPixiTrack(
                        this.currentProps.pixiStage,
                        track.server,
                        track.tilesetUid,
                        handleTilesetInfoReceived,
                        track.options,
                        this.currentProps.onNewTilesLoaded
                    )
                );
            case 'horizontal-1d-tiles':
                return new IdHorizontal1DTiledPixiTrack(
                    this.currentProps.pixiStage,
                    track.server,
                    track.tilesetUid,
                    handleTilesetInfoReceived,
                    track.options,
                    this.currentProps.onNewTilesLoaded);
            case 'vertical-1d-tiles':
                return new IdVertical1DTiledPixiTrack(
                    this.currentProps.pixiStage,
                    track.server,
                    track.tilesetUid,
                    handleTilesetInfoReceived,
                    track.options,
                    this.currentProps.onNewTilesLoaded);
            case '2d-tiles':
                return new Id2DTiledPixiTrack(
                    this.currentProps.pixiStage,
                    track.server,
                    track.tilesetUid,
                    handleTilesetInfoReceived,
                    track.options,
                    this.currentProps.onNewTilesLoaded);
            case 'top-stacked-interval':
                return new CNVIntervalTrack(
                    this.currentProps.pixiStage,
                    track.server,
                    track.tilesetUid,
                    handleTilesetInfoReceived,
                    track.options,
                    this.currentProps.onNewTilesLoaded);
            case 'left-stacked-interval':
                return new LeftTrackModifier(
                    new CNVIntervalTrack(
                        this.currentProps.pixiStage,
                        track.server,
                        track.tilesetUid,
                        handleTilesetInfoReceived,
                        track.options,
                        this.currentProps.onNewTilesLoaded
                    )
                );
            case 'viewport-projection-center':
                // TODO: Fix this so that these functions are defined somewhere else
                if (track.registerViewportChanged && track.removeViewportChanged && track.setDomainsCallback)
                    return new ViewportTracker2D(
                        this.svgElement,
                        track.registerViewportChanged,
                        track.removeViewportChanged,
                        track.setDomainsCallback
                    );
                else
                    return new Track();
            case 'horizontal-gene-annotations':
                return new HorizontalGeneAnnotationsTrack(
                    this.currentProps.pixiStage,
                    track.server,
                    track.tilesetUid,
                    handleTilesetInfoReceived,
                    track.options,
                    this.currentProps.onNewTilesLoaded
                )
            case 'vertical-gene-annotations':
                return new LeftTrackModifier(
                    new HorizontalGeneAnnotationsTrack(
                        this.currentProps.pixiStage,
                        track.server,
                        track.tilesetUid,
                        handleTilesetInfoReceived,
                        track.options,
                        this.currentProps.onNewTilesLoaded
                    )
                )
            case 'arrowhead-domains':
                return new ArrowheadDomainsTrack(
                    this.currentProps.pixiStage,
                    track.server,
                    track.tilesetUid,
                    handleTilesetInfoReceived,
                    track.options,
                    this.currentProps.onNewTilesLoaded
                );
            case 'combined':
                return new CombinedTrack(
                    track.contents,
                    this.createTrackObject.bind(this),
                    handleTilesetInfoReceived,
                    track.options
                );
            case '2d-chromosome-labels':
                return new Chromosome2DLabels(this.currentProps.pixiStage, track.chromInfoPath );
            case '2d-chromosome-grid':
                return new Chromosome2DGrid(this.currentProps.pixiStage, track.chromInfoPath );
            case 'horizontal-chromosome-labels':
                return new HorizontalChromosomeLabels(this.currentProps.pixiStage, track.chromInfoPath);
            case 'vertical-chromosome-labels':
                return new LeftTrackModifier(new HorizontalChromosomeLabels(this.currentProps.pixiStage, track.chromInfoPath));
            default:
                // console.log('WARNING: unknown track type:', track.type);
                return new UnknownPixiTrack(
                    this.currentProps.pixiStage,
                    {name: 'Unknown Track Type'}
                );
        }

    }

    render() {
        return(
            <div
                className={"track-renderer"}
                ref={(c) => this.divTrackArea = c}
                style={{
                    width: this.currentProps.width,
                    height: this.currentProps.height,
                    position: "absolute"}}
            >
                {this.currentProps.children}
            </div>
        );

    }
}

TrackRenderer.propTypes = {
    width: React.PropTypes.number,
    height: React.PropTypes.number,
    centerWidth: React.PropTypes.number,
    centerHeight: React.PropTypes.number,
    marginLeft: React.PropTypes.number,
    marginTop: React.PropTypes.number,
    leftWidth: React.PropTypes.number,
    topHeight: React.PropTypes.number,
    pixiStage: React.PropTypes.object,
    canvasElement: React.PropTypes.object,
    svgElement: React.PropTypes.object,
    children: React.PropTypes.array,
    initialXDomain: React.PropTypes.array,
    initialYDomain: React.PropTypes.array,
    positionedTracks: React.PropTypes.array
}
