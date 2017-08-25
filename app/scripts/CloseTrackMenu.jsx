import React from 'react';
import ReactDOM from 'react-dom';

import {ContextMenuContainer, ContextMenuItem} from './ContextMenuContainer.jsx';
import {SeriesListMenu} from './SeriesListMenu.jsx';
import {tracksInfo} from './config';

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
            let thumbnail = trackTypeToInfo[x.type].thumbnail;
            let blankLocation = "images/thumbnails/blank.png";
                let imgTag = trackTypeToInfo[x.type].thumbnail ?
                        <div style={{display: 'inline-block', marginRight: 10, verticalAlign: "middle"}} dangerouslySetInnerHTML={{__html: thumbnail.outerHTML}} /> :
                        <div style={{display: 'inline-block', marginRight: 10, verticalAlign: "middle"}} >
                            <svg width={30} height={20} />
                        </div>

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

export default CloseTrackMenu;
