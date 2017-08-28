import React from 'react';
import {PropTypes} from 'prop-types';
import {PopupMenu} from './PopupMenu.jsx';
import ContextMenuContainer from './ContextMenuContainer';
import {ConfigViewMenu} from './ConfigViewMenu.jsx';
import {AddTrackPositionMenu} from './AddTrackPositionMenu.jsx';

// Styles
import '../styles/multi-track-header.scss';  // eslint-disable-line no-unused-vars
// import stylesContainer from '../styles/MultiViewContainer.css';  // eslint-disable-line no-unused-vars

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

  /**
   * The user clicked on the `cog` of the menu so we need to open
   * it.
   */
  handleConfigMenuOpened(uid) {
    this.setState({
      configMenuUid: uid,
      configMenuPosition: this.configImg.getBoundingClientRect()
    });
  }

  /**
   * The user has clicked on the 'plus' sign at the top of a TiledPlot
   * so we need to open the Track Position Chooser dialog
   */
  handleAddTrackPositionMenuOpened(uid) {
    this.setState({
      addTrackPositionMenuUid: uid,
      addTrackPositionMenuPosition: this.plusImg.getBoundingClientRect()
    });
  }

  /**
   * The user has chosen a position for the new track. The actual
   * track selection will be handled by TiledPlot
   *
   * We just need to close the menu here.
   */
  handleTrackPositionChosen(position) {
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
            () => {
              this.setState({
                addTrackPositionMenuUid: null,
                addTrackPositionMenuPosition: null
              });
            }
          }
        >
          <ContextMenuContainer
            orientation="left"
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
          onMenuClosed={() => this.setState({configMenuUid: null})}
        >
          <ContextMenuContainer
            orientation="left"
            position={this.state.configMenuPosition}
          >
            <ConfigViewMenu
              onExportSVG={() => {
                this.setState({configMenuUid: null});
                this.props.onExportSVG();
              }}
              onExportViewAsJSON={() => {
                this.setState({configMenuUid: null});  // hide the menu
                this.props.onExportViewsAsJSON()
              }}
              onExportViewAsLink={() => {
                this.setState({configMenuUid: null});  // hide the menu
                this.props.onExportViewsAsLink()
              }}
              onLockLocation={() => {
                this.setState({configMenuUid: null});  // hide the menu
                this.props.onLockLocation(this.state.configMenuUid);
              }}
              onLockZoom={() => {
                this.setState({configMenuUid: null});  // hide the menu
                this.props.onLockZoom(this.state.configMenuUid);
              }}
              onLockZoomAndLocation={() => {
                this.setState({configMenuUid: null});  // hide the menu
                this.props.onLockZoomAndLocation(this.state.configMenuUid);
              }}
              onProjectViewport={() => {
                this.setState({configMenuUid: null});  // hide the menu
                this.props.onProjectViewport(this.state.configMenuUid)
              }}
              onTakeAndLockZoomAndLocation={() => {
                this.setState({configMenuUid: null}); // hide the menu
                this.props.onTakeAndLockZoomAndLocation(this.state.configMenuUid);
              }}
              onTogglePositionSearchBox={() => {
                this.setState({configMenuUid: null});  // hide the menu
                this.props.onTogglePositionSearchBox(this.state.configMenuUid)
              }}
              onUnlockLocation={() => {
                this.setState({configMenuUid: null});  // hide the menu
                this.props.onUnlockLocation(this.state.configMenuUid);
              }}
              onUnlockZoom={() => {
                this.setState({configMenuUid: null});  // hide the menu
                this.props.onUnlockZoom(this.state.configMenuUid);
              }}
              onUnlockZoomAndLocation={() => {
                this.setState({configMenuUid: null});  // hide the menu
                this.props.onUnlockZoomAndLocation(this.state.configMenuUid);
              }}
              onYankLocation={() => {
                this.setState({configMenuUid: null});  // hide the menu
                this.props.onYankLocation(this.state.configMenuUid);
              }}
              onYankZoom={() => {
                this.setState({configMenuUid: null});  // hide the menu
                this.props.onYankZoom(this.state.configMenuUid);
              }}
              onYankZoomAndLocation={() => {
                this.setState({configMenuUid: null});  // hide the menu
                this.props.onYankZoomAndLocation(this.state.configMenuUid);
              }}
              onZoomToData={() => {
                this.setState({configMenuUid: null});  // hide the menu
                this.props.onZoomToData(this.state.configMenuUid);
              }}
            />
          </ContextMenuContainer>
        </PopupMenu>
      );
    }

    return(
      <div styleName="multitrack-header">
        <div styleName="multitrack-header-left">
          <div styleName="multitrack-header-grabber">
            <div /><div /><div />
          </div>
          <div styleName="multitrack-header-search"></div>
        </div>
        <nav styleName="multitrack-header-nav-list">
          <svg
            onClick={this.props.onAddView}
            styleName="multitrack-header-icon"
          >
            <use xlinkHref="#copy" />
          </svg>

          <svg
            onClick={() => this.handleConfigMenuOpened(this.props.viewUid)}
            ref={c => this.configImg = c}
            styleName="multitrack-header-icon"
          >
            <use xlinkHref="#cog" />
          </svg>

          <svg
            onClick={() => this.handleAddTrackPositionMenuOpened(this.props.viewUid)}
            ref={c => this.plusImg = c}
            styleName="multitrack-header-icon"
          >
            <use xlinkHref="#plus" />
          </svg>

          <svg
            onClick={this.props.onCloseView}
            styleName="multitrack-header-icon"
          >
            <use xlinkHref="#cross" />
          </svg>
        </nav>

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

export default ViewHeader;
