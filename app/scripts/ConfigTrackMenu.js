import {mix} from 'mixwith';
import React from 'react';

import ContextMenuContainer from './ContextMenuContainer';
import ContextMenuItem from './ContextMenuItem';
import { SeriesListMenu } from './SeriesListMenu';
import { getSeriesItems } from './SeriesListItems';

// Styles
import '../styles/ContextMenu.module.scss';

export class ConfigTrackMenu extends ContextMenuContainer {
  constructor(props) {
    /**
     * A window that is opened when a user clicks on the track configuration icon.
     */
    super(props);

    this.seriesRefs = {};
    this.seriesListMenu = null;

    console.log('this:', this);
  }

  componentDidMount() {
    super.componentDidMount();
  }

  getSubmenu() {
    if (this.state.submenuShown) {
      // the bounding box of the element which initiated the subMenu
      // necessary so that we can position the submenu next to the initiating
      // element
      const bbox = this.state.submenuSourceBbox;
      let position = null;

      if (this.state.orientation == 'left') {
        position = {
          left: this.state.left,
          top: bbox.top,
        };
      } else {
        position = {
          left: this.state.left + bbox.width + 7,
          top: bbox.top,
        };
      }

      const selectedTrack = this.props.track.contents ?
        this.props.track.contents.filter(t => t.uid == this.state.submenuShown.uid)[0] :
        this.props.track;
      console.log('selectedTrack:', selectedTrack);

      return (
        <SeriesListMenu
          closeMenu={this.props.closeMenu}
          hostTrack={this.props.track}
          onAddSeries={this.props.onAddSeries}
          onChangeTrackType={this.props.onChangeTrackType}
          onCloseTrack={() => this.props.onCloseTrack(this.state.submenuShown.uid)}
          onConfigureTrack={this.props.onConfigureTrack}
          onExportData={this.props.onExportData}
          onLockScales={this.props.onLockScales}
          onTrackOptionsChanged={this.props.onTrackOptionsChanged}
          onDivideSeries={this.props.onDivideSeries}
          orientation={this.state.orientation}
          ref={c => this.seriesListMenu = c}
          parentBbox={bbox}
          position={position}
          series={this.state.submenuShown}
          track={selectedTrack}
          trackOrientation={this.props.trackOrientation}
        />
      );
    }
    return (<div />);
  }

  render() {
    return (
      <div
        ref={c => this.div = c}
        style={{
          left: this.state.left,
          top: this.state.top,
        }}
        styleName="context-menu"
      >
        {getSeriesItems(
          [this.props.track],
          this.handleItemMouseEnter.bind(this),
          this.handleMouseLeave.bind(this),
          null
        )}

        <hr styleName="context-menu-hr" />

        <ContextMenuItem
          contextMenu={this}
          onClick={() => this.props.onLockValueScale(this.props.track.uid)}
          onMouseEnter={e => this.handleOtherMouseEnter(e)}
        >
          {'Lock Value Scale With'}
        </ContextMenuItem>

        <ContextMenuItem
          contextMenu={this}
          onClick={() => this.props.onUnlockValueScale(this.props.track.uid)}
          onMouseEnter={e => this.handleOtherMouseEnter(e)}
        >
          {'Unlock Value Scale'}
        </ContextMenuItem>

        <hr styleName="context-menu-hr" />

        <ContextMenuItem
          contextMenu={this}
          onClick={() => this.props.onAddSeries(this.props.track.uid)}
          onMouseEnter={e => this.handleOtherMouseEnter(e)}
        >
          {'Add Series'}
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => this.props.onCloseTrack(this.props.track.uid)}
        >
          {'Close Track'}
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => {
            this.props.onReplaceTrack(this.props.track.uid,
              this.props.trackOrientation);
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
