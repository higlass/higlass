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

    handleSeriesMouseEnter(evt, series) {
        let domNode = evt.currentTarget;
        let boundingRect = domNode.getBoundingClientRect();
        //console.log('seriesMouseEnter:', domNode);
        //console.log('boundingRect:', boundingRect);

        this.setState({
            submenuShown: series,
            submenuSourceBbox: boundingRect
        });
    }

    handleMouseLeave(evt) {
        return;
    }

    handleOtherMouseEnter(evt) {
        this.setState({
            submenuShown: null
        });
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
                    <div 
                        ref={c => this.seriesRefs[x.uid] = c}
                        className={"context-menu-item"}
                        key={x.uid}
                        onMouseEnter={e => this.handleSeriesMouseEnter(e, x)}
                        onMouseLeave={e => this.handleMouseLeave(e)}
                    >
                        {imgTag}
                        <span className='context-menu-span'
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            {(x.name && x.name.length) ? x.name : x.uid}
                            <img src="images/play.svg"
                                 className = "play-icon"
                            />

                        </span>
                    </div>
                )

        });
    }

    getSubmenu() {
        if (this.state.submenuShown) {
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

            //console.log('position:', position);

            return (<SeriesListMenu
                        series={this.state.submenuShown}
                        position={position}
                        orientation={this.state.orientation}
                        onConfigureTrack={ () => this.props.onConfigureTrack(this.state.submenuShown.uid) }
                        onCloseTrack={ () => this.props.onCloseTrack(this.state.submenuShown.uid) }
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
                        text={'Add Data'} 
                        onMouseEnter={(e) => this.handleOtherMouseEnter(e) }
                        />
                    <ContextMenuItem text={'Close Track'} />
                    <ContextMenuItem text={'Replace Track'} />
                    <ContextMenuItem text={'Settings'} />

                    {this.getSubmenu()}
                </div>
                )
    }
}
