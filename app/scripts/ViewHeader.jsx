// @ts-nocheck
import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

import PopupMenu from './PopupMenu';
import ContextMenuContainer from './ContextMenuContainer';
import ConfigViewMenu from './ConfigViewMenu';
import AddTrackPositionMenu from './AddTrackPositionMenu';

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
import classes from '../styles/ViewHeader.module.scss';

class ViewHeader extends React.Component {
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

    this.handleTrackPositionChosenBound =
      this.handleTrackPositionChosen.bind(this);
  }

  componentDidMount() {
    // eslint-disable-next-line react/no-did-mount-set-state
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
              this.setState({ configMenuUid: null }); // hide the menu
              this.props.onClearView();
            }}
            onEditViewConfig={() => {
              this.setState({ configMenuUid: null }); // hide the menu
              this.props.onEditViewConfig(this.state.configMenuUid);
            }}
            onExportPNG={() => {
              this.setState({ configMenuUid: null }); // hide the menu
              this.props.onExportPNG();
            }}
            onExportSVG={() => {
              this.setState({ configMenuUid: null }); // hide the menu
              this.props.onExportSVG();
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
            onOptionsChanged={(newOptions) => {
              this.props.onViewOptionsChanged(newOptions);
              this.setState({ configMenuUid: null }); // hide the menu
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
            orientation="left"
            position={this.state.configMenuPosition}
            theme={this.props.theme}
          />
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

    const className = clsx(
      this.state.isFocused
        ? classes['multitrack-header-focus']
        : classes['multitrack-header'],
      {
        [classes['multitrack-header-dark']]: this.props.theme === THEME_DARK,
      },
    );

    const classNameIcon =
      this.state.width <= VIEW_HEADER_MED_WIDTH_SEARCH_BAR
        ? classes['multitrack-header-icon-squeazed']
        : classes['multitrack-header-icon'];

    return (
      <div
        ref={(c) => {
          this.el = c;
        }}
        className={className}
      >
        <div className={classes['multitrack-header-left']}>
          {this.props.mouseTool === MOUSE_TOOL_SELECT && (
            <svg
              className={clsx(classes['mouse-tool-selection'], classNameIcon)}
              title="Selection tool active"
            >
              <use xlinkHref="#select" />
            </svg>
          )}
          <div
            className={classes['multitrack-header-grabber']}
            title="Drag to move the view"
          >
            <div />
            <div />
            <div />
          </div>
          {this.state.width > VIEW_HEADER_MIN_WIDTH_SEARCH_BAR && (
            <div className={classes['multitrack-header-search']}>
              {this.props.isGenomePositionSearchBoxVisible &&
                GenomePositionSearchBox}
            </div>
          )}
        </div>
        <nav className={classes['multitrack-header-nav-list']}>
          <svg className={classNameIcon} onClick={this.props.onAddView}>
            <title>Add new view (clone this view)</title>
            <use xlinkHref="#copy" />
          </svg>

          <svg
            ref={(c) => {
              this.configImg = c;
            }}
            className={classNameIcon}
            onClick={() => this.handleConfigMenuOpened(this.props.viewUid)}
          >
            <title>Configure this view</title>
            <use xlinkHref="#cog" />
          </svg>

          <svg
            ref={(c) => {
              this.plusImg = c;
            }}
            className={classNameIcon}
            onClick={() =>
              this.handleAddTrackPositionMenuOpened(this.props.viewUid)
            }
          >
            <title>Add Track</title>
            <use xlinkHref="#plus" />
          </svg>

          <svg className={classNameIcon} onClick={this.props.onCloseView}>
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
