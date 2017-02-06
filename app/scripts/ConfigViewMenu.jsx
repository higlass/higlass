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
        let lockZoomText = "Lock zoom with";

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
                    {'Take zoom from'}
                    </ContextMenuItem>
                    <ContextMenuItem
                        onClick={e => this.props.onSyncCenter(e)}
                    >
                    {'Take center from'}
                    </ContextMenuItem>
                    <ContextMenuItem
                        onClick={e => this.props.onLockZoom(e)}
                    >
                        {lockZoomText}
                    </ContextMenuItem>

                    <ContextMenuItem
                        onClick={e => this.props.onProjectViewport(e)}
                    >
                    {'Show this viewport on'}
                    </ContextMenuItem>

                    <hr />

                    <ContextMenuItem
                        onClick={e => this.props.onExportViewAsJSON()}
                    >
                    {'Export views as JSON'}
                    </ContextMenuItem>

                    <ContextMenuItem
                        onClick={e => this.props.onExportViewAsLink()}
                    >
                    {'Export views as Link'}
                    </ContextMenuItem>

                </div>
                )
    }
}
