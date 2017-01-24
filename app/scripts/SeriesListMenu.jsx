import React from 'react';
import ReactDOM from 'react-dom';

import {ContextMenuContainer, ContextMenuItem} from './ContextMenuContainer.jsx';
import {NestedContextMenu} from './NestedContextMenu.jsx';

import {optionsInfo} from './config.js';

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

    getSubmenu() {
        console.log('getSubmenu');
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

            
            let track = this.state.submenuShown;

            console.log('track:', track);
            let menuItems = {};
            let options = track.options;

            for (let optionType in track.options) {
                if (optionsInfo.hasOwnProperty(optionType)) {
                   menuItems[optionType] = {children: {}, 'name': optionsInfo[optionType].name}
                   console.log('oi:', optionsInfo[optionType].inlineOptions);

                   for (let inlineOptionValue in optionsInfo[optionType].inlineOptions) {
                       console.log('inlineOptionValue', inlineOptionValue);

                       let inlineOption = optionsInfo[optionType].inlineOptions[inlineOptionValue];
                       console.log('inlineOption:', inlineOption);

                       menuItems[optionType].children[inlineOptionValue] = {
                           name: inlineOption.name,
                           handler: () => { 
                               track.options[optionType] = inlineOptionValue;
                           },
                           value: inlineOptionValue
                       }
                   }
                }
            }

            console.log('menuItems:', menuItems);

            return (<NestedContextMenu
                        position={position}
                        menuItems={menuItems}
                        orientation={this.props.orientation}
                    />)

        } else {
            return (<div />);
        }
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
                        onMouseEnter={e => this.handleItemMouseEnter(e, this.props.track)}
                        onMouseLeave={e => this.handleMouseLeave(e)}
                    >
                        {'Configure Series'}
                        <svg
                            className = "play-icon"
                            width="10px"
                            height="10px">
                            <use href="#play"></use>
                        </svg>
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

                    {this.getSubmenu()}
                </div>
              );
    }
}
