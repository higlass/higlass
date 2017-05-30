import React from 'react';
import ReactDOM from 'react-dom';
import {PropTypes} from 'prop-types';
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

      /*
      shouldComponentUpdate(nextProps, nextState) {

      }
      */

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
                        orientation={'left'}
                        position={this.state.addTrackPositionMenuPosition}
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
                        orientation={'left'}
                        position={this.state.configMenuPosition}
                    >
                        <ConfigViewMenu
                            onExportSVG={e => {
                                this.setState({configMenuUid: null});
                                this.props.onExportSVG();
                            }}
                            onExportViewAsJSON={e => {
                                this.setState({configMenuUid: null}); //hide the menu
                                this.props.onExportViewsAsJSON()
                            }}
                            onExportViewAsLink={e => {
                                this.setState({configMenuUid: null}); //hide the menu
                                this.props.onExportViewsAsLink()
                            }}
                            onLockLocation={e => {
                                this.setState({configMenuUid: null});    // hide the menu
                                this.props.onLockLocation(this.state.configMenuUid);
                            }}
                            onLockZoom={e => {
                                this.setState({configMenuUid: null});    // hide the menu
                                this.props.onLockZoom(this.state.configMenuUid);
                            }}
                            onLockZoomAndLocation={e => {
                                this.setState({configMenuUid: null});    // hide the menu
                                this.props.onLockZoomAndLocation(this.state.configMenuUid);
                            }}

                            onProjectViewport={e => {
                                this.setState({configMenuUid: null}); //hide the menu
                                this.props.onProjectViewport(this.state.configMenuUid)
                            }}

                            onTakeAndLockZoomAndLocation={e => {
                                this.setState({configMenuUid: null});    // hide the menu
                                this.props.onTakeAndLockZoomAndLocation(this.state.configMenuUid);
                            }}
                            onTogglePositionSearchBox={e => {
                                this.setState({configMenuUid: null}); //hide the menu
                                this.props.onTogglePositionSearchBox(this.state.configMenuUid)
                            }}

                            onUnlockLocation={e => {
                                this.setState({configMenuUid: null});    // hide the menu
                                this.props.onUnlockLocation(this.state.configMenuUid);
                            }}
                            onUnlockZoom={e => {
                                this.setState({configMenuUid: null});    // hide the menu
                                this.props.onUnlockZoom(this.state.configMenuUid);
                            }}
                            onUnlockZoomAndLocation={e => {
                                this.setState({configMenuUid: null});    // hide the menu
                                this.props.onUnlockZoomAndLocation(this.state.configMenuUid);
                            }}


                            onYankLocation={e => {
                                this.setState({configMenuUid: null}); //hide the menu
                                this.props.onYankLocation(this.state.configMenuUid);
                            }}
                            onYankZoom={e =>
                                {
                                    this.setState({configMenuUid: null}); //hide the menu
                                    this.props.onYankZoom(this.state.configMenuUid);
                                }}
                            onYankZoomAndLocation={e => {
                                this.setState({configMenuUid: null}); //hide the menu
                                this.props.onYankZoomAndLocation(this.state.configMenuUid);
                            }}
                            onZoomToData={e => {
                                this.setState({configMenuUid: null});    // hide the menu
                                this.props.onZoomToData(this.state.configMenuUid);
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
                            className={'multitrack-header-icon multiview-copy-img'}
                            height="10px"
                            onClick={this.props.onAddView}
                            width="10px"
                        >
                            <use xlinkHref="#copy" />
                        </svg>

                        <svg
                            className={'multitrack-header-icon multiview-config-img'}
                            height="10px"
                            onClick={e => this.handleConfigMenuOpened(this.props.viewUid)}
                            ref={c => this.configImg = c}
                            width="10px"
                        >
                            <use xlinkHref="#cog" />
                        </svg>

                        <svg
                            className={'multitrack-header-icon multiview-add-track-img'}
                            height="10px"
                            onClick={e => this.handleAddTrackPositionMenuOpened(this.props.viewUid)}
                            ref={c => this.plusImg = c}
                            width="10px"
                        >
                            <use xlinkHref="#plus" />
                        </svg>

                        <svg
                            className={'multitrack-header-icon multiview-close-img'}
                            height="10px"
                            onClick={this.props.onCloseView}
                            width="10px"
                        >
                            <use xlinkHref="#cross" />
                        </svg>

                        {configMenu}
                        {addTrackPositionMenu}
                    </div>

			)
	}
}

ViewHeader.propTypes = {
    onAddView: PropTypes.func,
    onCloseView: PropTypes.func,
    onExportSVG: PropTypes.func,
    onExportViewsAsJSON: PropTypes.func,
    onExportViewsAsLink: PropTypes.func,
    onLockLocation: PropTypes.func, 
    onLockZoom: PropTypes.func, 
    onLockZoomAndLocation: PropTypes.func, 
    onProjectViewport: PropTypes.func, 
    onTakeAndLockZoomAndLocation: PropTypes.func, 
    onTogglePositionSearchBox: PropTypes.func, 
    onTrackPositionChosen: PropTypes.func,
    onUnlockLocation: PropTypes.func, 
    onUnlockZoom: PropTypes.func, 
    onUnlockZoomAndLocation: PropTypes.func, 
    onYankLocation: PropTypes.func, 
    onYankZoom: PropTypes.func, 
    onYankZoomAndLocation: PropTypes.func, 
    onZoomToData: PropTypes.func,
    viewUid: PropTypes.string
}
