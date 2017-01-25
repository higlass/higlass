import '../styles/TrackConfigWindow.css';
import React from 'react';
import ReactDOM from 'react-dom';

import {ContextMenuContainer, ContextMenuItem} from './ContextMenuContainer.jsx';
import {SeriesListMenu} from './SeriesListMenu.jsx';
import {tracksInfo} from './config.js';

export class CloseTrackMenu extends React.Component {
    constructor(props) {
        /**
         * A window that is opened when a user clicks on the track configuration icon.
         */
        super(props);

        

        this.seriesRefs = {};
        
    }

    componentDidMount() {
        //super.componentDidMount();
    }


    getSeriesItems() {
        // this code is duplicated in ConfigTrackMenu, needs to be consolidated
        //
        // check if this is a combined track (has contents)
        if (!this.props.track)
            return null;


        let trackTypeToInfo = {};

        tracksInfo.forEach(ti => {
            trackTypeToInfo[ti.type] = ti;
        });

        let series = this.props.track.contents ? this.props.track.contents : [this.props.track];

        return series.map(x => {
            let thumbnailLocation = "images/thumbnails/" + trackTypeToInfo[x.type].thumbnail;
            let blankLocation = "images/thumbnails/blank.png";
            let imgTag = trackTypeToInfo[x.type].thumbnail ? 
                    <img src={thumbnailLocation} width={15} className='context-menu-thumbnail'/> :
                    <img src={blankLocation} width={15} className='context-menu-thumbnail'/> 

                return (
                    <div 
                        ref={c => this.seriesRefs[x.uid] = c}
                        className={"context-menu-item"}
                        key={x.uid}
                        onClick={e => this.props.onCloseTrack(x.uid)}
                    >
                    {imgTag}
                        <span className='context-menu-span'
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            {(x.name && x.name.length) ? x.name : x.uid}
                        </span>
                    </div>
                )

        });
    }

    render() {
        return (
                <div>
                    {this.getSeriesItems()}
                    <hr />
                    <ContextMenuItem
                        onClick={e => this.props.onCloseTrack(this.props.track.uid)}
                    >
                    {'Close track'}
                    </ContextMenuItem>
                </div>
                )
    }
}
