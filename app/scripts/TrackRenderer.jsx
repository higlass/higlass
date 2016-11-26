import React from 'react';

import {zoom} from 'd3-zoom';
import {select,event} from 'd3-selection';

import {UnknownPixiTrack} from './UnknownPixiTrack.js';
import {HeatmapPixiTrack} from './HeatmapPixiTrack.js';

export class TrackRenderer extends React.Component {
    /**
     * Maintain a list of tracks, and re-render them whenever either
     * their size changes or the zoom level changes
     */
    constructor(props) {
        super(props);

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

        // maintain a list of trackObjects which correspond to the input
        // tracks
        this.trackObjects = {}

    }

    componentDidMount() {
        // need to be mounted to make sure that all the renderers are
        // created before starting to draw tracks
        this.syncTrackObjects(this.props.positionedTracks);

        select(this.divTrackArea).call(this.zoomBehavior);
    }

    componentWillReceiveProps(nextProps) {
        /**
         * The size of some tracks probably changed, so let's just
         * redraw them.
         */

        this.syncTrackObjects(nextProps.positionedTracks);
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

        let knownTracks = new Set(Object.keys(this.trackObjects));
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
        this.updateExistingTracks([...enterTrackDefs].map(x => receivedTracksDict[x]));

        this.updateExistingTracks([...updateTrackDefs].map(x => receivedTracksDict[x]));
        this.removeTracks([...exitTracks].map(x => this.trackObjects[x]));
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

            this.trackObjects[newTrackDef.track.uid] = this.createTrackObject(newTrackDef.track);
        }
    }

    updateExistingTracks(existingTrackDefinitions) {
        for (let i = 0; i < existingTrackDefinitions.length; i++) {
            let trackDef = existingTrackDefinitions[i];

            let trackObject = this.trackObjects[trackDef.track.uid];

            trackObject.setPosition([trackDef.left, trackDef.top]);
            trackObject.setDimensions([trackDef.width, trackDef.height]);
        }
    }

    removeTracks(existingTracks) {

    }

    zoomed() {
        console.log('zoomed... transform', event.transform);
    }

    createTrackObject(track) {
        switch (track.type) {
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
                style={{width: this.props.width, 
                        height: this.props.height,
                        position: "absolute"}}
            >
                {this.props.children}
            </div>
        );
        
    }
}
