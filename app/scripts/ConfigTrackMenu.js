import React from 'react';
import { mix } from './mixwith';

import ContextMenuContainer from './ContextMenuContainer';
import ContextMenuItem from './ContextMenuItem';
import SeriesListSubmenuMixin from './SeriesListSubmenuMixin';

import { getSeriesItems } from './SeriesListItems';

import { THEME_DARK } from './configs';

// Styles
import '../styles/ContextMenu.module.scss';

class ConfigTrackMenu extends mix(ContextMenuContainer).with(
  SeriesListSubmenuMixin,
) {
  constructor(props) {
    /**
     * A window that is opened when a user clicks on the track configuration icon.
     */
    super(props);

    this.seriesRefs = {};
    this.seriesListMenu = null;
  }

  componentDidMount() {
    super.componentDidMount();
  }

  render() {
    let styleNames = 'context-menu';
    if (this.props.theme === THEME_DARK) styleNames += ' context-menu-dark';

    return (
      <div
        ref={(c) => {
          this.div = c;
        }}
        data-menu-type="ConfigTrackMenu"
        style={{
          left: this.state.left,
          top: this.state.top,
        }}
        styleName={styleNames}
      >
        {getSeriesItems(
          this.props.tracks,
          this.handleItemMouseEnter.bind(this),
          this.handleMouseLeave.bind(this),
          null,
        )}

        <hr styleName="context-menu-hr" />

        <ContextMenuItem
          contextMenu={this}
          onClick={() => this.props.onLockValueScale(this.props.tracks[0].uid)}
          onMouseEnter={(e) => this.handleOtherMouseEnter(e)}
        >
          {'Lock Value Scale With'}
        </ContextMenuItem>

        <ContextMenuItem
          contextMenu={this}
          onClick={() =>
            this.props.onUnlockValueScale(this.props.tracks[0].uid)
          }
          onMouseEnter={(e) => this.handleOtherMouseEnter(e)}
        >
          {'Unlock Value Scale'}
        </ContextMenuItem>

        <hr styleName="context-menu-hr" />

        <ContextMenuItem
          contextMenu={this}
          onClick={() => this.props.onAddSeries(this.props.tracks[0].uid)}
          onMouseEnter={(e) => this.handleOtherMouseEnter(e)}
        >
          {'Add Series'}
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => this.props.onCloseTrack(this.props.tracks[0].uid)}
        >
          {'Close Track'}
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => {
            this.props.onReplaceTrack(
              this.props.tracks[0].uid,
              this.props.trackOrientation,
            );
          }}
        >
          {'Replace Track'}
        </ContextMenuItem>

        {this.getSubmenu()}
      </div>
    );
  }
}

export default ConfigTrackMenu;
