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
                    <ContextMenuItem
                        onClick={e => this.props.onTogglePositionSearchBox(e)}
                    >
                        {'Toggle position search box'}
                    </ContextMenuItem>
                    <hr />
                    <ContextMenuItem
                        onClick={e => this.props.onYankZoom(e)}
                    >
                    {'Yank Zoom'}
                    </ContextMenuItem>
                    <ContextMenuItem
                        onClick={e => this.props.onSyncCenter(e)}
                    > 
                    {'Yank Center'} 
                    </ContextMenuItem>
                    <ContextMenuItem 
                        onClick={e => this.props.onLockZoom(e)}
                    >
                        {lockZoomText}
                    </ContextMenuItem>

                    <ContextMenuItem
                        onClick={e => this.props.onProjectViewport(e)}
                    >
                    {'Project Viewport'}
                    </ContextMenuItem>

                    <hr />

                    <ContextMenuItem 
                        onClick={e => this.props.onExportViewAsJSON()}
                    >
                    {'Export Views as JSON'}
                    </ContextMenuItem>

                    <ContextMenuItem 
                        onClick={e => this.props.onExportViewAsLink()}
                    >
                    {'Export Views as Link'}
                    </ContextMenuItem>

                </div>
                )
    }
}
