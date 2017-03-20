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

        let yankTracks = null;

        return (
                <div>
                    <ContextMenuItem
                        onClick={e => this.props.onTogglePositionSearchBox(e)}
                    >
                        {'Toggle position search box'}
                    </ContextMenuItem>
                    <hr />

                    <ContextMenuItem
                        onClick={e => this.props.onZoomToData(e)}
                    >
                    {'Zoom to data extent'}
                    </ContextMenuItem>

                    <hr />
                    <ContextMenuItem
                        onClick={e => this.props.onYankZoom(e)}
                    >
                    {'Take zoom from'}
                    </ContextMenuItem>
                    <ContextMenuItem
                        onClick={e => this.props.onYankLocation(e)}
                    >
                    {'Take location from'}
                    </ContextMenuItem>

                    <ContextMenuItem
                        onClick={e => this.props.onYankZoomAndLocation(e)}
                    >
                    {'Take zoom and location from'}
                    </ContextMenuItem>

                    <hr />

                    <ContextMenuItem
                        onClick={this.props.onLockZoom}
                    >
                        {"Lock zoom with"}
                    </ContextMenuItem>

                    <ContextMenuItem
                        onClick={this.props.onLockLocation}
                    >
                        {"Lock location with"}
                    </ContextMenuItem>

                    <ContextMenuItem
                        onClick={this.props.onLockZoomAndLocation}
                    >
                        {"Lock zoom and location with"}
                    </ContextMenuItem>
                    <hr />

                    <ContextMenuItem
                        onClick={this.props.onTakeAndLockZoomAndLocation}
                    >
                        {"Take and lock zoom and location with"}
                    </ContextMenuItem>

                    <hr />

                    <ContextMenuItem
                        onClick={e => this.props.onUnlockZoom(e)}
                    >
                        {"Unlock zoom"}
                    </ContextMenuItem>

                    <ContextMenuItem
                        onClick={e => this.props.onUnlockLocation(e)}
                    >
                        {"Unlock location"}
                    </ContextMenuItem>

                    <ContextMenuItem
                        onClick={e => this.props.onUnlockZoomAndLocation(e)}
                    >
                        {"Unlock zoom and location"}
                    </ContextMenuItem>

                    <hr />

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

ConfigViewMenu.propTypes = {
    onLockLocation: React.PropTypes.func,
    onLockZoom: React.PropTypes.func,
    onYankZoom: React.PropTypes.func,
    onYankLocation: React.PropTypes.func,
    onYankZoomAndLocation: React.PropTypes.func,
    onTogglePositionSearchBox: React.PropTypes.func,
}
