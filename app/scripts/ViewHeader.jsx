import React from 'react';
import ReactDOM from 'react-dom';
import {PopupMenu} from './PopupMenu.jsx';
import {ContextMenuContainer} from './ContextMenuContainer.jsx';
import {ConfigViewMenu} from './ConfigViewMenu.jsx';
import {AddTrackPositionMenu} from './AddTrackPositionMenu.jsx';

import {all as icons} from './icons.js';

export class ViewHeader extends React.Component {
	
    constructor(props) {
        super(props);

        this.configImg = null;
        this.plusImg = null;

        this.state = {
            configMenuUid: null,
            configMenuPosition: null,
            addTrackPositionMenuUid: null,
            addTrackPositionMenuPosition: null
        }
    }

      handleConfigMenuOpened(uid) {
          /**
           * The user clicked on the `cog` of the menu so we need to open
           * it.
           */
        let bbox = this.configImg.getBoundingClientRect();

        this.setState({
            configMenuUid: uid,
            configMenuPosition: bbox
        });
      }

      handleAddTrackPositionMenuOpened(uid) {
          /**
           * The user has clicked on the 'plus' sign at the top of a TiledPlot
           * so we need to open the Track Position Chooser dialog
           */
        let bbox = this.plusImg.getBoundingClientRect();

        this.setState({
            addTrackPositionMenuUid: uid,
            addTrackPositionMenuPosition: bbox
        });
      }

      handleTrackPositionChosen(position) {
          /**
           * The user has chosen a position for the new track. The actual
           * track selection will be handled by TiledPlot
           *
           * We just need to close the menu here.
           */
        this.props.onTrackPositionChosen(position);

        this.setState({
            addTrackPositionMenuUid: null,
            addTrackPositionMenuPosition: null
        });
      }

	render() {
        let configMenu = null;
        let addTrackPositionMenu = null;

        if (this.state.addTrackPositionMenuPosition) {
            addTrackPositionMenu = (
                <PopupMenu
                    onMenuClosed={
                        e => {
                            this.setState({
                                addTrackPositionMenuUid: null,
                                addTrackPositionMenuPosition: null
                            });
                        }
                    }
                >
                    <ContextMenuContainer
                        position={this.state.addTrackPositionMenuPosition}
                        orientation={'left'}
                    >
                        <AddTrackPositionMenu
                            onTrackPositionChosen={this.handleTrackPositionChosen.bind(this)}
                        />
                    </ContextMenuContainer>
                </PopupMenu>
            )

        }

        if (this.state.configMenuUid) {
            configMenu = (
              <PopupMenu
                onMenuClosed={e => this.setState({configMenuUid: null})}
              >
                    <ContextMenuContainer
                        position={this.state.configMenuPosition}
                        orientation={'left'}
                    >
                        <ConfigViewMenu
                            onLockZoom={e => {
                                this.setState({configMenuUid: null});    // hide the menu
                                this.props.onLockZoom(this.state.configMenuUid);
                            }}
                            onLockLocation={e => {
                                this.setState({configMenuUid: null});    // hide the menu
                                this.props.onLockLocation(this.state.configMenuUid);
                            }}
                            onLockZoomAndLocation={e => {
                                this.setState({configMenuUid: null});    // hide the menu
                                this.props.onLockZoomAndLocation(this.state.configMenuUid);
                            }}

                            onTakeAndLockZoomAndLocation={e => {
                                this.setState({configMenuUid: null});    // hide the menu
                                this.props.onTakeAndLockZoomAndLocation(this.state.configMenuUid);
                            }}

                            onUnlockZoom={e => {
                                this.setState({configMenuUid: null});    // hide the menu
                                this.props.onUnlockZoom(this.state.configMenuUid);
                            }}
                            onUnlockLocation={e => {
                                this.setState({configMenuUid: null});    // hide the menu
                                this.props.onUnlockLocation(this.state.configMenuUid);
                            }}
                            onUnlockZoomAndLocation={e => {
                                this.setState({configMenuUid: null});    // hide the menu
                                this.props.onUnlockZoomAndLocation(this.state.configMenuUid);
                            }}


                            onYankZoom={e => 
                                {
                                    this.setState({configMenuUid: null}); //hide the menu
                                    this.props.onYankZoom(this.state.configMenuUid);
                                }}
                            onYankLocation={e => {
                                this.setState({configMenuUid: null}); //hide the menu
                                this.props.onYankLocation(this.state.configMenuUid);
                            }}

                            onYankZoomAndLocation={e => {
                                this.setState({configMenuUid: null}); //hide the menu
                                this.props.onYankZoomAndLocation(this.state.configMenuUid);
                            }}

                            onProjectViewport={e => {
                                this.setState({configMenuUid: null}); //hide the menu
                                this.props.onProjectViewport(this.state.configMenuUid)
                            }}
                            onTogglePositionSearchBox={e => {
                                this.setState({configMenuUid: null}); //hide the menu
                                this.props.onTogglePositionSearchBox(this.state.configMenuUid)
                            }}
                            onExportViewAsJSON={e => {
                                this.setState({configMenuUid: null}); //hide the menu
                                this.props.onExportViewsAsJSON() 
                            }}
                            onExportViewAsLink={e => {
                                this.setState({configMenuUid: null}); //hide the menu
                                this.props.onExportViewsAsLink() 
                            }}
                        />
                    </ContextMenuContainer>
                </PopupMenu>);
        }
        /*
                        <span className="multitrack-header-id">
                        { this.props.viewUid.slice(0,2) }
                        </span>
                        */

		return(
                    <div className="multitrack-header">

                        <svg
                            onClick={this.props.onAddView}
                            className={'multitrack-header-icon multiview-copy-img'}
                            width="10px"
                            height="10px">
                            <use href="#copy"></use>
                        </svg>

                        <svg
                            onClick={ e => this.handleConfigMenuOpened(this.props.viewUid) }
                            ref={c => this.configImg = c}
                            className={'multitrack-header-icon multiview-config-img'}
                            width="10px"
                            height="10px">
                            <use href="#cog"></use>
                        </svg>

                        <svg
                            onClick={ e => this.handleAddTrackPositionMenuOpened(this.props.viewUid) }
                            ref={c => this.plusImg = c}
                            className={'multitrack-header-icon multiview-add-track-img'}
                            width="10px"
                            height="10px">
                            <use href="#plus"></use>
                        </svg>

                        <svg
                            onClick={this.props.onCloseView}
                            className={'multitrack-header-icon multiview-close-img'}
                            width="10px"
                            height="10px">
                            <use href="#cross"></use>
                        </svg>

                        {configMenu}
                        {addTrackPositionMenu}
                    </div>

			)
	}
}
