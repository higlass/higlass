import React from 'react';
import PropTypes from 'prop-types';

import PopupMenu from './PopupMenu';
import ContextMenuContainer from './ContextMenuContainer';
import ConfigViewMenu from './ConfigViewMenu';
import AddTrackPositionMenu from './AddTrackPositionMenu';

import HiGlassComponentContext from './HiGlassComponentContext';

// HOCS
import withTheme from './hocs/with-theme';

// Configs
import {
  MOUSE_TOOL_SELECT,
  THEME_DARK,
  VIEW_HEADER_MED_WIDTH_SEARCH_BAR,
  VIEW_HEADER_MIN_WIDTH_SEARCH_BAR,
} from './configs';

// Styles
import '../styles/ViewHeader.module.scss';

class ViewHeader extends React.Component {
  static contextType = HiGlassComponentContext;

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

    this.handleTrackPositionChosenBound = this.handleTrackPositionChosen.bind(
      this,
    );
  }

  componentDidMount() {
    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState({ width: this.el.clientWidth });
  }

  checkWidth() {
    const width = this.el.clientWidth;

    if (width !== this.state.width)
      this.setState({
        width,
      });
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
          onMenuClosed={() => {
            this.setState({
              addTrackPositionMenuUid: null,
              addTrackPositionMenuPosition: null,
            });
          }}
        >
          <ContextMenuContainer
            orientation="left"
            position={this.state.addTrackPositionMenuPosition}
            theme={this.props.theme}
          >
            <AddTrackPositionMenu
              onTrackPositionChosen={this.handleTrackPositionChosenBound}
            />
          </ContextMenuContainer>
        </PopupMenu>
      );
    }

    if (this.state.configMenuUid) {
      configMenu = (
        <PopupMenu onMenuClosed={() => this.setState({ configMenuUid: null })}>
          <ConfigViewMenu
            onClearView={() => {
              this.setState({
                configMenuUid: null,
              }); // hide the menu
              this.props.onClearView();
            }}
            onEditViewConfig={() => {
              this.setState({
                configMenuUid: null,
              }); // hide the menu
              this.props.onEditViewConfig(this.state.configMenuUid);
            }}
            onExportPNG={() => {
              this.setState({
                configMenuUid: null,
              }); // hide the menu
              this.props.onExportPNG();
            }}
            onExportSVG={() => {
              this.setState({
                configMenuUid: null,
              }); // hide the menu
              this.props.onExportSVG();
            }}
            onExportViewAsJSON={() => {
              this.setState({
                configMenuUid: null,
              }); // hide the menu
              this.props.onExportViewsAsJSON();
            }}
            onExportViewAsLink={() => {
              this.setState({
                configMenuUid: null,
              }); // hide the menu
              this.props.onExportViewsAsLink();
            }}
            onLockLocation={() => {
              this.props.onLockLocation(this.state.configMenuUid);
              this.setState({
                configMenuUid: null,
              }); // hide the menu
            }}
            onLockZoom={() => {
              this.props.onLockZoom(this.state.configMenuUid);
              this.setState({
                configMenuUid: null,
              }); // hide the menu
            }}
            onLockZoomAndLocation={() => {
              this.props.onLockZoomAndLocation(this.state.configMenuUid);
              this.setState({
                configMenuUid: null,
              }); // hide the menu
            }}
            onOptionsChanged={newOptions => {
              this.props.onViewOptionsChanged(newOptions);
              this.setState({
                configMenuUid: null,
              }); // hide the menu
            }}
            onProjectViewport={() => {
              this.props.onProjectViewport(this.state.configMenuUid);
              this.setState({
                configMenuUid: null,
              }); // hide the menu
            }}
            onTakeAndLockZoomAndLocation={() => {
              this.props.onTakeAndLockZoomAndLocation(this.state.configMenuUid);
              this.setState({
                configMenuUid: null,
              }); // hide the menu
            }}
            onTogglePositionSearchBox={() => {
              this.props.onTogglePositionSearchBox(this.state.configMenuUid);
              this.setState({
                configMenuUid: null,
              }); // hide the menu
            }}
            onUnlockLocation={() => {
              this.props.onUnlockLocation(this.state.configMenuUid);
              this.setState({
                configMenuUid: null,
              }); // hide the menu
            }}
            onUnlockZoom={() => {
              this.props.onUnlockZoom(this.state.configMenuUid);
              this.setState({
                configMenuUid: null,
              }); // hide the menu
            }}
            onUnlockZoomAndLocation={() => {
              this.props.onUnlockZoomAndLocation(this.state.configMenuUid);
              this.setState({
                configMenuUid: null,
              }); // hide the menu
            }}
            onYankLocation={() => {
              this.props.onYankLocation(this.state.configMenuUid);
              this.setState({
                configMenuUid: null,
              }); // hide the menu
            }}
            onYankZoom={() => {
              this.props.onYankZoom(this.state.configMenuUid);
              this.setState({
                configMenuUid: null,
              }); // hide the menu
            }}
            onYankZoomAndLocation={() => {
              this.props.onYankZoomAndLocation(this.state.configMenuUid);
              this.setState({
                configMenuUid: null,
              }); // hide the menu
            }}
            onZoomToData={() => {
              this.props.onZoomToData(this.state.configMenuUid);
              this.setState({
                configMenuUid: null,
              }); // hide the menu
            }}
            orientation="left"
            position={this.state.configMenuPosition}
            theme={this.props.theme}
          />
        </PopupMenu>
      );
    }

    const GenomePositionSearchBox = this.props.getGenomePositionSearchBox(
      this.state.isFocused,
      focus => {
        this.setState({
          isFocused: focus,
        });
      },
    );

    let className = this.state.isFocused
      ? 'multitrack-header-focus'
      : 'multitrack-header';

    const classNameIcon =
      this.state.width <= VIEW_HEADER_MED_WIDTH_SEARCH_BAR
        ? 'multitrack-header-icon-squeazed'
        : 'multitrack-header-icon';

    if (this.props.theme === THEME_DARK) {
      className += ' multitrack-header-dark';
    }

    return (
      <div
        ref={c => {
          this.el = c;
        }}
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
          <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem' }}>
            <b>{this.context.viewUidToName(this.props.viewUid)}</b>
          </span>
          <div
            styleName="multitrack-header-grabber"
            title="Drag to move the view"
          >
            <div />
            <div />
            <div />
          </div>
          {this.state.width > VIEW_HEADER_MIN_WIDTH_SEARCH_BAR && (
            <div styleName="multitrack-header-search">
              {GenomePositionSearchBox}
            </div>
          )}
        </div>
        <nav styleName="multitrack-header-nav-list">
          <svg onClick={this.props.onAddView} styleName={classNameIcon}>
            <title>Add new view (clone this view)</title>
            <use xlinkHref="#copy" />
          </svg>

          <svg
            ref={c => {
              this.configImg = c;
            }}
            onClick={() => this.handleConfigMenuOpened(this.props.viewUid)}
            styleName={classNameIcon}
          >
            <title>Configure this view</title>
            <use xlinkHref="#cog" />
          </svg>

          <svg
            ref={c => {
              this.plusImg = c;
            }}
            onClick={() =>
              this.handleAddTrackPositionMenuOpened(this.props.viewUid)
            }
            styleName={classNameIcon}
          >
            <title>Add Track</title>
            <use xlinkHref="#plus" />
          </svg>

          <svg onClick={this.props.onCloseView} styleName={classNameIcon}>
            <title>Close View</title>
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
  onEditViewConfig: PropTypes.func.isRequired,
  onExportSVG: PropTypes.func.isRequired,
  onExportPNG: PropTypes.func.isRequired,
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
  onViewOptionsChanged: PropTypes.func.isRequired,
  onYankLocation: PropTypes.func.isRequired,
  onYankZoom: PropTypes.func.isRequired,
  onYankZoomAndLocation: PropTypes.func.isRequired,
  onZoomToData: PropTypes.func.isRequired,
  theme: PropTypes.symbol.isRequired,
  viewUid: PropTypes.string.isRequired,
};

export default withTheme(ViewHeader);
