import React from 'react';
import ReactDOM from 'react-dom';

import {ContextMenuContainer, ContextMenuItem} from './ContextMenuContainer.jsx';

export class ConfigureSeriesMenu extends ContextMenuContainer {
    constructor(props) {
        /**
         * A window that is opened when a user clicks on the track configuration icon.
         */
        super(props);
    }

    render() {
        return(
                <div className={'context-menu'}
                        ref={c => this.div = c}
                        onMouseLeave={this.props.handleMouseLeave}
                        style={{ 
                                position: 'fixed',
                                left: this.state.left,
                                 top: this.state.top,
                                border: "1px solid black"
                              }}
                >

                </div>
              )
    }
}

export class SeriesListMenu extends ContextMenuContainer {
    constructor(props) {
        /**
         * A window that is opened when a user clicks on the track configuration icon.
         */
        super(props);
    }

    render() {

        return(
                <div className={'context-menu'}
                        ref={c => this.div = c}
                        onMouseLeave={this.props.handleMouseLeave}
                        style={{ 
                                position: 'fixed',
                                left: this.state.left,
                                 top: this.state.top,
                                border: "1px solid black"
                              }}
                >
                    <ContextMenuItem
                        onClick={this.props.onConfigureTrack}
                    >
                        {'Configure Series'}
                    </ContextMenuItem>
                    <div 
                        className={"context-menu-item"}
                        onClick={this.props.onCloseTrack}
                    >
                        <span
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            {"Close Series"}
                        </span>
                    </div>
                    <div 
                        className={"context-menu-item"}
                        onClick={() => {
                                this.props.onCloseTrack(this.props.series.uid)
                                this.props.onAddSeries(this.props.hostTrack.uid)
                        }}
                     >
                        <span
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            {"Replace Series"}
                        </span>
                    </div>
                    <div 
                        className={"context-menu-item"}
                    >
                        <span
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            {"Move up"}
                        </span>
                    </div>
                </div>
              );
    }
}
