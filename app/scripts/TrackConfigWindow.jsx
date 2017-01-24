import '../styles/TrackConfigWindow.css';
import React from 'react';
import ReactDOM from 'react-dom';

import {ContextMenuContainer, ContextMenuItem} from './ContextMenuContainer.jsx';
import {SeriesListMenu} from './SeriesListMenu.jsx';

export class TrackConfigWindow extends ContextMenuContainer {
    constructor(props) {
        /**
         * A window that is opened when a user clicks on the track configuration icon.
         */
        super(props);
    }

    componentDidMount() {
        super.componentDidMount();
    }

    getSeriesItems() {
        // check if this is a combined track (has contents)
        let series = this.props.track.contents ? this.props.track.contents : [this.props.track];
        //
        ////

        return series.map(x => {
                return (
                    <ContextMenuItem
                        key={x.uid}
                        onMouseEnter={e => this.handleItemMouseEnter(e, x.uid)}
                        onMouseLeave={e => this.handleMouseLeave(e)}
                    >
                        <span className='context-menu-span'
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            {x.uid}
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
                    'top': this.state.top
                }
            }

            return (<SeriesListMenu
                        position={position}
                        orientation={this.state.orientation}
                    />);
        } else {
            return (<div />);
        }
    }

    render() {
        //
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
                    <ContextMenuItem text={'Settings'} />

                    {this.getSubmenu()}
                </div>
                )
    }
}
