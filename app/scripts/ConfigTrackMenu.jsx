import React from 'react';
import ReactDOM from 'react-dom';

import {ContextMenuContainer, ContextMenuItem} from './ContextMenuContainer.jsx';
import {SeriesListMenu} from './SeriesListMenu.jsx';
import {tracksInfo} from './config.js';

export class ConfigTrackMenu extends ContextMenuContainer {
    constructor(props) {
        /**
         * A window that is opened when a user clicks on the track configuration icon.
         */
        super(props);


        this.seriesRefs = {};

    }

    componentDidMount() {
        super.componentDidMount();
    }


    getSeriesItems() {
        // this code is duplicated in CloseTrackMenu, needs to be consolidated
        //
        if (!this.props.track)
            return null;

        let trackTypeToInfo = {};

        tracksInfo.forEach(ti => {
            trackTypeToInfo[ti.type] = ti;
        });

        // check if this is a combined track (has contents)
        let series = this.props.track.contents ? this.props.track.contents : [this.props.track];

        return series.map(x => {
            let thumbnailLocation = "images/thumbnails/" + trackTypeToInfo[x.type].thumbnail;
            let blankLocation = "images/thumbnails/blank.png";
            let imgTag = trackTypeToInfo[x.type].thumbnail ?
                    <img src={thumbnailLocation} width={15} className='context-menu-thumbnail'/> :
                    <img src={blankLocation} width={15} className='context-menu-thumbnail'/>

                return (
                    <ContextMenuItem
                        ref={c => this.seriesRefs[x.uid] = c}
                        className={"context-menu-item"}
                        key={x.uid}
                        onMouseEnter={e => this.handleItemMouseEnter(e, x)}
                        onMouseLeave={e => this.handleMouseLeave(e)}
                    >
                        {imgTag}
                        <span className='context-menu-span'
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            {(x.name && x.name.length) ? x.name : x.uid}

                            <svg
                                className = "play-icon"
                                width="10px"
                                height="10px">
                                <use href="#play"></use>
                            </svg>

                        </span>
                    </ContextMenuItem>
                )

        });
    }

    getSubmenu() {
        if (this.state.submenuShown) {
            // the bounding box of the element which initiated the subMenu
            // necessary so that we can position the submenu next to the initiating
            // element
            let bbox = this.state.submenuSourceBbox;
            let position = null;

            if (this.state.orientation == 'left') {
               position = {
                    'left': this.state.left,
                    'top': bbox.top
                };
            } else {
                position = {
                    'left': this.state.left + bbox.width + 7,
                    'top': bbox.top
                }
            }

            console.log('uid', this.state.submenuShown.uid, 'track:', this.props.track);
            let selectedTrack = this.props.track.contents ? 
                this.props.track.contents.filter(t => t.uid == this.state.submenuShown.uid)[0]
                : this.props.track;

            return (<SeriesListMenu
                        hostTrack={this.props.track}
                        onAddSeries={this.props.onAddSeries}
                        track={selectedTrack}
                        onCloseTrack={() => this.props.onCloseTrack(this.state.submenuShown.uid)}
                        onConfigureTrack={() => this.props.onConfigureTrack(this.state.submenuShown.uid)}
                        orientation={this.state.orientation}
                        position={position}
                        series={this.state.submenuShown}
                        trackOrientation={this.props.orientation}
                    />);
        } else {
            return (<div />);
        }
    }

    render() {
        return(
                <div className={'context-menu'}
                        ref={c => this.div = c}
                        style={{
                                position: 'fixed',
                                left: this.state.left,
                                 top: this.state.top,
                                border: "1px solid black"
                              }}
                >
                    {this.getSeriesItems()}
                    <hr />
                    <ContextMenuItem
                        onMouseEnter={(e) => this.handleOtherMouseEnter(e) }
                        onClick={ () => this.props.onAddSeries(this.props.track.uid) }
                        contextMenu={this}
                        >
                        {'Add Series'}
                    </ContextMenuItem>
                    <ContextMenuItem
                        onClick={ () => this.props.onCloseTrack(this.props.track.uid) }
                        text={'Close Track'}
                    >
                        {'Close Track'}
                    </ContextMenuItem>
                    <ContextMenuItem 
                        onClick={ () => {
                            this.props.onCloseTrack(this.props.track.uid);
                            this.props.onAddTrack(this.props.orientation);
                        }}
                    >
                    {'Replace Track'}
                    </ContextMenuItem>

                    {this.getSubmenu()}
                </div>
                )
    }
}
