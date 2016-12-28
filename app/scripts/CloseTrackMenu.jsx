import '../styles/TrackConfigWindow.css';
import React from 'react';
import ReactDOM from 'react-dom';

import {ContextMenuContainer, ContextMenuItem} from './ContextMenuContainer.jsx';
import {SeriesListMenu} from './SeriesListMenu.jsx';

export class CloseTrackMenu extends ContextMenuContainer {
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
        // check if this is a combined track (has contents)
        if (!this.props.track)
            return null;

        let series = this.props.track.contents ? this.props.track.contents : [this.props.track];

        return series.map(x => {
                return (
                    <div 
                        ref={c => this.seriesRefs[x.uid] = c}
                        className={"context-menu-item"}
                        key={x.uid}
                        onMouseEnter={e => this.handleSeriesMouseEnter(e, x.uid)}
                        onMouseLeave={e => this.handleMouseLeave(e)}
                        onClick={e => this.props.onCloseTrack(x.uid)}
                    >
                        <span className='context-menu-span'
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            {"Remove... " +  (x.name && x.name.length) ? x.name : x.uid}
                        </span>
                    </div>
                )

        });
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
                    <ContextMenuItem text={'Close Track'} 
                        onMouseEnter={(e) => this.handleOtherMouseEnter(e) }
                        onClick={e => this.props.onCloseTrack(this.props.track.uid)}
                    />
                </div>
                )
    }
}
