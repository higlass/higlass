import React from 'react';

import {
  ContextMenuContainer,
  ContextMenuItem
} from './ContextMenuContainer.jsx';
import NestedContextMenu from './NestedContextMenu.jsx';

// Configs
import {
  OPTIONS_INFO,
  TRACKS_INFO_BY_TYPE
} from './configs';

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

            if (!TRACKS_INFO_BY_TYPE[track.type].availableOptions)
                return null;

            for (let optionType of TRACKS_INFO_BY_TYPE[track.type].availableOptions) {
                if (OPTIONS_INFO.hasOwnProperty(optionType)) {
                   menuItems[optionType] = {'name': OPTIONS_INFO[optionType].name}

                   // can we dynamically generate some options?
                   // should be used if the options depend on tileset info or other current state
                   if (OPTIONS_INFO[optionType].generateOptions) {
                       let generatedOptions = OPTIONS_INFO[optionType].generateOptions(track);

                       if (!menuItems[optionType].children)
                           menuItems[optionType].children = {};

                       for (let generatedOption of generatedOptions) {
                           let optionSelectorSettings = {
                                name: generatedOption.name,
                                value: generatedOption.value,
                                handler: () => {
                                   track.options[optionType] = generatedOption.value;
                                   this.props.onTrackOptionsChanged(track.uid, track.options);
                                   this.props.closeMenu();
                               }
                           }

                           menuItems[optionType].children[generatedOption.value] = optionSelectorSettings;
                       }
                   }

                   if (OPTIONS_INFO[optionType].inlineOptions) {
                       // we can simply select this option from the menu
                       for (let inlineOptionKey in OPTIONS_INFO[optionType].inlineOptions) {

                           let inlineOption = OPTIONS_INFO[optionType].inlineOptions[inlineOptionKey];

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
                   } else if (OPTIONS_INFO[optionType].componentPickers &&
                              OPTIONS_INFO[optionType].componentPickers[track.type]) {
                       // there's an option picker registered
                        menuItems[optionType].handler = () => {
                            this.props.onConfigureTrack(track, OPTIONS_INFO[optionType].componentPickers[track.type]);
                            this.props.closeMenu();
                        }
                   }
                }
            }

            return (<NestedContextMenu
                        closeMenu={this.props.closeMenu}
                        menuItems={menuItems}
                        orientation={this.state.orientation}
                        parentBbox={bbox}
                        position={position}
                    />)

        } else {
            return (<div />);
        }
    }


    render() {
        let exportDataMenuItem = null;

        if (TRACKS_INFO_BY_TYPE[this.props.hostTrack.type]) {
            exportDataMenuItem = (<ContextMenuItem
                className={"context-menu-item"}
                onClick={x => this.props.onExportData(this.props.hostTrack.uid, this.props.track.uid)}
                onMouseEnter={(e) => this.handleOtherMouseEnter(e)}
            >
                <span
                    style={{ whiteSpace: 'nowrap' }}
                >
                    {"Export Data"}
                </span>
            </ContextMenuItem>)
        }

        return(
                <div className={'context-menu'}
                        onMouseLeave={this.props.handleMouseLeave}
                        ref={c => this.div = c}
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
                            className={"play-icon"}
                            height={"10px"}
                            width={"10px"}
                        >
                            <use
                                xlinkHref={"#play"}
                            />
                        </svg>
                    </ContextMenuItem>
                    { exportDataMenuItem }
                    <ContextMenuItem
                        className={"context-menu-item"}
                        onClick={this.props.onCloseTrack}
                        onMouseEnter={(e) => this.handleOtherMouseEnter(e)}
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
                        onMouseEnter={(e) => this.handleOtherMouseEnter(e)}
                    >
                        <span
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            {"Replace Series"}
                        </span>
                    </ContextMenuItem>

                    {this.getSubmenu()}
                </div>
              );
    }
}
