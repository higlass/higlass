import React from 'react';
import { PropTypes } from 'prop-types';
import { PopupMenu } from './PopupMenu';
import ContextMenuContainer from './ContextMenuContainer';
import { ConfigViewMenu } from './ConfigViewMenu';
import { AddTrackPositionMenu } from './AddTrackPositionMenu';

// Configs
import {
  MOUSE_TOOL_SELECT,
  VIEW_HEADER_MED_WIDTH_SEARCH_BAR,
  VIEW_HEADER_MIN_WIDTH_SEARCH_BAR,
} from './configs';

// Services
import {
  getDarkTheme,
} from './services';

// Styles
import '../styles/ViewHeader.module.scss';

export class ViewHeader extends React.Component {
  constructor(props) {
    super(props);

    this.configImg = null;
    this.plusImg = null;

    this.state = {
      addTrackPositionMenuUid: null,
      addTrackPositionMenuPosition: null,
      configMenuUid: null,
      configMenuPosition: null,
      isFocused: false,
      width: -1,
    };
  }

  componentDidMount() {
    this.setState({ width: this.el.clientWidth });
  }

  checkWidth() {
    const width = this.el.clientWidth;

    if (width !== this.state.width) this.setState({ width });
  }

  /**
   * The user clicked on the `cog` of the menu so we need to open
   * it.
   */
  handleConfigMenuOpened(uid) {
    this.setState({
      configMenuUid: uid,
      configMenuPosition: this.configImg.getBoundingClientRect(),
    });
  }

  /**
   * The user has clicked on the 'plus' sign at the top of a TiledPlot
   * so we need to open the Track Position Chooser dialog
   */
  handleAddTrackPositionMenuOpened(uid) {
    this.setState({
      addTrackPositionMenuUid: uid,
      addTrackPositionMenuPosition: this.plusImg.getBoundingClientRect(),
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
      addTrackPositionMenuPosition: null,
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
                addTrackPositionMenuPosition: null,
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
      );
    }

    if (this.state.configMenuUid) {
      configMenu = (
        <PopupMenu
          onMenuClosed={() => this.setState({ configMenuUid: null })}
        >
          <ContextMenuContainer
            orientation="left"
            position={this.state.configMenuPosition}
          >
            <ConfigViewMenu
              onExportSVG={() => {
                this.setState({ configMenuUid: null });
                this.props.onExportSVG();
              }}
              onClearView = {() => {
                this.setState({ configMenuUid: null }); // hide the menu
                this.props.onClearView();
              }}
              onExportViewAsJSON={() => {
                this.setState({ configMenuUid: null }); // hide the menu
                this.props.onExportViewsAsJSON();
              }}
              onExportViewAsLink={() => {
                this.setState({ configMenuUid: null }); // hide the menu
                this.props.onExportViewsAsLink();
              }}
              onLockLocation={() => {
                this.setState({ configMenuUid: null }); // hide the menu
                this.props.onLockLocation(this.state.configMenuUid);
              }}
              onLockZoom={() => {
                this.setState({ configMenuUid: null }); // hide the menu
                this.props.onLockZoom(this.state.configMenuUid);
              }}
              onLockZoomAndLocation={() => {
                this.setState({ configMenuUid: null }); // hide the menu
                this.props.onLockZoomAndLocation(this.state.configMenuUid);
              }}
              onProjectViewport={() => {
                this.setState({ configMenuUid: null }); // hide the menu
                this.props.onProjectViewport(this.state.configMenuUid);
              }}
              onTakeAndLockZoomAndLocation={() => {
                this.setState({ configMenuUid: null }); // hide the menu
                this.props.onTakeAndLockZoomAndLocation(this.state.configMenuUid);
              }}
              onTogglePositionSearchBox={() => {
                this.setState({ configMenuUid: null }); // hide the menu
                this.props.onTogglePositionSearchBox(this.state.configMenuUid);
              }}
              onUnlockLocation={() => {
                this.setState({ configMenuUid: null }); // hide the menu
                this.props.onUnlockLocation(this.state.configMenuUid);
              }}
              onUnlockZoom={() => {
                this.setState({ configMenuUid: null }); // hide the menu
                this.props.onUnlockZoom(this.state.configMenuUid);
              }}
              onUnlockZoomAndLocation={() => {
                this.setState({ configMenuUid: null }); // hide the menu
                this.props.onUnlockZoomAndLocation(this.state.configMenuUid);
              }}
              onYankLocation={() => {
                this.setState({ configMenuUid: null }); // hide the menu
                this.props.onYankLocation(this.state.configMenuUid);
              }}
              onYankZoom={() => {
                this.setState({ configMenuUid: null }); // hide the menu
                this.props.onYankZoom(this.state.configMenuUid);
              }}
              onYankZoomAndLocation={() => {
                this.setState({ configMenuUid: null }); // hide the menu
                this.props.onYankZoomAndLocation(this.state.configMenuUid);
              }}
              onZoomToData={() => {
                this.setState({ configMenuUid: null }); // hide the menu
                this.props.onZoomToData(this.state.configMenuUid);
              }}
            />
          </ContextMenuContainer>
        </PopupMenu>
      );
    }

    const GenomePositionSearchBox = this.props.getGenomePositionSearchBox(
      this.state.isFocused,
      (focus) => {
        this.setState({
          isFocused: focus,
        });
      },
    );

    let className = this.state.isFocused ?
      'multitrack-header-focus' : 'multitrack-header';

    const classNameIcon = this.state.width <= VIEW_HEADER_MED_WIDTH_SEARCH_BAR ?
      'multitrack-header-icon-squeazed' : 'multitrack-header-icon';

    if (getDarkTheme()) {
      className += ' multitrack-header-dark';
    }

    return (
      <div
        ref={(c) => { this.el = c; }}
        styleName={className}
      >
        <div styleName="multitrack-header-left">
          {this.props.mouseTool === MOUSE_TOOL_SELECT && (
            <svg
              styleName={`mouse-tool-selection ${classNameIcon}`}
              title="Selection tool active"
            >
              <use xlinkHref="#select" />
            </svg>
          )}
          <div styleName="multitrack-header-grabber">

            <div /><div /><div />
          </div>
          {this.state.width > VIEW_HEADER_MIN_WIDTH_SEARCH_BAR &&
            <div styleName="multitrack-header-search">
              {
                this.props.isGenomePositionSearchBoxVisible &&
                GenomePositionSearchBox
              }
            </div>
          }
        </div>
        <nav styleName="multitrack-header-nav-list">
          <svg
            onClick={this.props.onAddView}
            styleName={classNameIcon}
          >
            <use xlinkHref="#copy" />
          </svg>

          <svg
            ref={(c) => { this.configImg = c; }}
            onClick={() => this.handleConfigMenuOpened(this.props.viewUid)}
            styleName={classNameIcon}
          >
            <use xlinkHref="#cog" />
          </svg>

          <svg
            ref={(c) => { this.plusImg = c; }}
            onClick={() => this.handleAddTrackPositionMenuOpened(this.props.viewUid)}
            styleName={classNameIcon}
          >
            <use xlinkHref="#plus" />
          </svg>

          <svg
            onClick={this.props.onCloseView}
            styleName={classNameIcon}
          >
            <use xlinkHref="#cross" />
          </svg>
        </nav>

        {configMenu}
        {addTrackPositionMenu}
      </div>
    );
  }
}

ViewHeader.defaultProps = {
  isGenomePositionSearchBoxVisible: false,
};

ViewHeader.propTypes = {
  getGenomePositionSearchBox: PropTypes.func.isRequired,
  isGenomePositionSearchBoxVisible: PropTypes.bool,
  mouseTool: PropTypes.string.isRequired,
  onAddView: PropTypes.func.isRequired,
  onClearView: PropTypes.func.isRequired,
  onCloseView: PropTypes.func.isRequired,
  onExportSVG: PropTypes.func.isRequired,
  onExportViewsAsJSON: PropTypes.func.isRequired,
  onExportViewsAsLink: PropTypes.func.isRequired,
  onLockLocation: PropTypes.func.isRequired,
  onLockZoom: PropTypes.func.isRequired,
  onLockZoomAndLocation: PropTypes.func.isRequired,
  onProjectViewport: PropTypes.func.isRequired,
  onTakeAndLockZoomAndLocation: PropTypes.func.isRequired,
  onTogglePositionSearchBox: PropTypes.func.isRequired,
  onTrackPositionChosen: PropTypes.func.isRequired,
  onUnlockLocation: PropTypes.func.isRequired,
  onUnlockZoom: PropTypes.func.isRequired,
  onUnlockZoomAndLocation: PropTypes.func.isRequired,
  onYankLocation: PropTypes.func.isRequired,
  onYankZoom: PropTypes.func.isRequired,
  onYankZoomAndLocation: PropTypes.func.isRequired,
  onZoomToData: PropTypes.func.isRequired,
  viewUid: PropTypes.string.isRequired,
};

export default ViewHeader;
