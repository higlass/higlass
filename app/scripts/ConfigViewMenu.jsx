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

        let yankTracks = null;
        /*
        let yankTracks = 
                    (<hr />

                    <ContextMenuItem text={'Yank Tracks'} 
                        onClick={e => e}
                    />
                    <ContextMenuItem text={'Lock Tracks'} 
                        onClick={e => e}
                    />)
        */

        return (
                <div>
                    <ContextMenuItem text={'Toggle position search box'} 
                        onClick={e => this.props.onTogglePositionSearchBox(e)}
                    />
                    <hr />
                    <ContextMenuItem text={'Yank Zoom'} 
                        onClick={e => this.props.onYankZoom(e)}
                    />
                    <ContextMenuItem text={'Yank Center'} 
                        onClick={e => this.props.onSyncCenter(e)}
                    />
                    <ContextMenuItem text={lockZoomText} 
                        onClick={e => this.props.onLockZoom(e)}
                    />

                    <ContextMenuItem text={'Project Viewport'}
                        onClick={e => this.props.onProjectViewport(e)}
                    />

                </div>
                )
    }
}
