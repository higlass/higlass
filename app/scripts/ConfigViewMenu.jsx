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
        return (
                <div>
                    <ContextMenuItem text={'Take Zoom'} 
                        onClick={e => this.props.onCloseTrack(this.props.track.uid)}
                    />
                    <ContextMenuItem text={'Lock Zoom'} 
                        onClick={e => this.props.onCloseTrack(this.props.track.uid)}
                    />

                    <hr />

                    <ContextMenuItem text={'Take Tracks'} 
                        onClick={e => this.props.onCloseTrack(this.props.track.uid)}
                    />
                    <ContextMenuItem text={'Lock Tracks'} 
                        onClick={e => this.props.onCloseTrack(this.props.track.uid)}
                    />
                </div>
                )
    }
}
