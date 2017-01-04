import '../styles/TrackConfigWindow.css';
import React from 'react';
import ReactDOM from 'react-dom';

import {ContextMenuContainer, ContextMenuItem} from './ContextMenuContainer.jsx';

export class ConfigViewMenu extends React.Component {
    constructor(props) {
        /**
         * A window that is opened when a user clicks on the track configuration icon.
         */
        super(props);

        
        
    }

    componentDidMount() {
        //super.componentDidMount();
    }



    render() {
        let lockZoomText = "Lock Zoom";

        if (this.props.zoomLock) {
            lockZoomText = "Unlock Zoom";
        }

        return (
                <div>
                    <ContextMenuItem text={'Yank Zoom'} 
                        onClick={e => this.props.onYankZoom(e)}
                    />
                    <ContextMenuItem text={lockZoomText} 
                        onClick={e => this.props.onLockZoom(e)}
                    />

                    <hr />

                    <ContextMenuItem text={'Yank Tracks'} 
                        onClick={e => this.props.onYankTracks(this.props.track.uid)}
                    />
                    <ContextMenuItem text={'Lock Tracks'} 
                        onClick={e => this.props.onLockTracks(this.props.track.uid)}
                    />
                </div>
                )
    }
}
