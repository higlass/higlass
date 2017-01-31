import React from 'react';

import ReactDOM from 'react-dom';

import {ContextMenuContainer, ContextMenuItem} from './ContextMenuContainer.jsx';
import {NestedContextMenu} from './NestedContextMenu.jsx';

import {optionsInfo,tracksInfoByType} from './config.js';

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

            let menuItems = {};
            let options = track.options;

            if (!tracksInfoByType[track.type].availableOptions)
                return null;

            for (let optionType of tracksInfoByType[track.type].availableOptions) {
                if (optionsInfo.hasOwnProperty(optionType)) {
                   menuItems[optionType] = {'name': optionsInfo[optionType].name}

                   if (optionsInfo[optionType].inlineOptions) {
                       // we can simply select this option from the menu
                       for (let inlineOptionKey in optionsInfo[optionType].inlineOptions) {

                           let inlineOption = optionsInfo[optionType].inlineOptions[inlineOptionKey];

                           // check if there's already available options (e.g.
                           // "Top right") for this option type (e.g. "Label
                           // position")
                           if (!menuItems[optionType].children)
                               menuItems[optionType].children = {};

                           let optionSelectorSettings = {
                                name: inlineOption.name,
                                value: inlineOption.value
                                // missing handler to be filled in below
                            };


                           // is there a custom component available for picking this
                           // option type value (e.g. 'custom' color scale)
                           if (inlineOption.componentPickers &&
                               inlineOption.componentPickers[track.type]) {

                               optionSelectorSettings.handler = () => {
                                    // console.log('pick color value', track.type);
                                    this.props.onConfigureTrack(track, inlineOption.componentPickers[track.type]);
                                    this.props.closeMenu();
                               };
                            } else {
                                // the menu option defines a potential value for this option
                                // type (e.g. "top right")
                                optionSelectorSettings.handler = () => {
                                       track.options[optionType] = inlineOption.value;
                                       this.props.onTrackOptionsChanged(track.uid, track.options);
                                       this.props.closeMenu();
                                   }
                            }

                           menuItems[optionType].children[inlineOptionKey] = optionSelectorSettings;
                        }
                   } else if (optionsInfo[optionType].componentPickers &&
                              optionsInfo[optionType].componentPickers[track.type]) {
                       // there's an option picker registered
                       // console.log('setting handler');
                        menuItems[optionType].handler = () => {
                            // console.log('pick color value', track.type);
                            this.props.onConfigureTrack(track, optionsInfo[optionType].componentPickers[track.type]);
                            this.props.closeMenu();
                        }
                   }
                }
            }

            return (<NestedContextMenu
                        position={position}
                        menuItems={menuItems}
                        orientation={this.state.orientation}
                        parentBbox={bbox}
                        closeMenu={this.props.closeMenu}
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
                    <ContextMenuItem
                        className={"context-menu-item"}
                        onClick={this.props.onCloseTrack}
                        onMouseEnter={(e) => this.handleOtherMouseEnter(e) }
                    >
                        <span
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            {"Close Series"}
                        </span>
                    </ContextMenuItem>
                    <ContextMenuItem
                        className={"context-menu-item"}
                        onClick={() => {
                                this.props.onCloseTrack(this.props.series.uid)
                                this.props.onAddSeries(this.props.hostTrack.uid)
                       }}
                        onMouseEnter={(e) => this.handleOtherMouseEnter(e) }
                     >
                        <span
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            {"Replace Series"}
                        </span>
                    </ContextMenuItem>
                    <ContextMenuItem
                        className={"context-menu-item"}
                        onMouseEnter={(e) => this.handleOtherMouseEnter(e) }
                    >
                        <span
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            {"Move up"}
                        </span>
                    </ContextMenuItem>

                    {this.getSubmenu()}
                </div>
              );
    }
}
