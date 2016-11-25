import React from 'react';

import {zoom} from 'd3-zoom';
import {select,event} from 'd3-selection';

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

        this.syncTrackObjects(props.positionedTracks);
    }

    componentDidMount() {
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

        
        console.log('enterTrackDefs:', enterTrackDefs);
        console.log('exitTracks:', exitTracks);
        console.log('updateTrackDefs:', updateTrackDefs);

        this.addNewTracks([...enterTrackDefs].map(x => receivedTracksDict[x]));
        this.updateExistingTracks([...updateTrackDefs].map(x => receivedTracksDict[x]));
        this.removeTracks([...exitTracks].map(x => this.trackObjects[x]));
    }

    addNewTracks(newTrackDefinitions) {
        
    }

    updateExistingTracks(existingTrackDefinitions) {

    }

    removeTracks(existingTracks) {

    }

    zoomed() {
        console.log('zoomed... transform', event.transform);
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
