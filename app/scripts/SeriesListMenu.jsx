import React from 'react';
import ReactDOM from 'react-dom';

import {ContextMenuContainer} from './ContextMenuContainer.jsx';

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
                    <div 
                        className={"context-menu-item"}
                    >
                        <span
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            {"Remove Series"}
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
