import React from 'react';

import ContextMenuContainer from './ContextMenuContainer';
import ContextMenuItem from './ContextMenuItem';
import {SeriesListMenu} from './SeriesListMenu';

// Configs
import {TRACKS_INFO} from './configs';

// Styles
import '../styles/ContextMenu.scss';

export class ConfigTrackMenu extends ContextMenuContainer {
  constructor(props) {
    /**
     * A window that is opened when a user clicks on the track configuration icon.
     */
    super(props);

    this.seriesRefs = {};
  }

  componentDidMount() {
    super.componentDidMount();
  }

  getSeriesItems() {
    // this code is duplicated in CloseTrackMenu, needs to be consolidated
    if (!this.props.track) return null;

    const trackTypeToInfo = {};

    TRACKS_INFO.forEach(ti => {
      trackTypeToInfo[ti.type] = ti;
    });

    // check if this is a combined track (has contents)
    let series = this.props.track.contents ? this.props.track.contents : [this.props.track];

    return series.map(x => {
      const thumbnail = trackTypeToInfo[x.type].thumbnail;
      const imgTag = trackTypeToInfo[x.type].thumbnail ? (
        <div
          dangerouslySetInnerHTML={{__html: thumbnail.outerHTML}}
          style={{
            display: 'inline-block',
            marginRight: 10,
            verticalAlign: 'middle'
          }}
        />
      ): (
        <div
          style={{
            display: 'inline-block',
            marginRight: 10,
            verticalAlign: 'middle'
          }}
        >
          <svg
            height={20}
            width={30}
          />
        </div>
      );

        return (
          <ContextMenuItem
            key={x.uid}
            onMouseEnter={e => this.handleItemMouseEnter(e, x)}
            onMouseLeave={e => this.handleMouseLeave(e)}
            ref={c => this.seriesRefs[x.uid] = c}
            styleName="context-menu-item"
          >
            {imgTag}
            <span
              styleName="context-menu-span"
            >
              {(x.name && x.name.length) ? x.name : x.uid}
              <svg
                className="play-icon"
                height="10px"
                width="10px"
              >
                <use xlinkHref="#play" />
              </svg>
            </span>
          </ContextMenuItem>
        )

    });
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
          left: this.state.left,
          top: bbox.top
        };
      } else {
        position = {
          left: this.state.left + bbox.width + 7,
          top: bbox.top
        }
      }

      let selectedTrack = this.props.track.contents ?
        this.props.track.contents.filter(t => t.uid == this.state.submenuShown.uid)[0] :
        this.props.track;

      return (
        <SeriesListMenu
          closeMenu={this.props.closeMenu}
          hostTrack={this.props.track}
          onAddSeries={this.props.onAddSeries}
          onCloseTrack={() => this.props.onCloseTrack(this.state.submenuShown.uid)}
          onConfigureTrack={this.props.onConfigureTrack}
          onExportData={this.props.onExportData}
          onLockScales={this.props.onLockScales}
          onTrackOptionsChanged={this.props.onTrackOptionsChanged}
          orientation={this.state.orientation}
          parentBbox={bbox}
          position={position}
          series={this.state.submenuShown}
          track={selectedTrack}
          trackOrientation={this.props.trackOrientation}
        />
      );
    } else {
      return (<div />);
    }
  }

  render() {
    return(
      <div
        ref={c => this.div = c}
        style={{
          left: this.state.left,
          top: this.state.top
        }}
        styleName="context-menu"
      >
        {this.getSeriesItems()}

        <hr />

        <ContextMenuItem
          contextMenu={this}
          onClick={() => this.props.onLockValueScale(this.props.track.uid)}
          onMouseEnter={(e) => this.handleOtherMouseEnter(e)}
        >
          {'Lock Value Scale With'}
        </ContextMenuItem>

        <ContextMenuItem
          contextMenu={this}
          onClick={() => this.props.onUnlockValueScale(this.props.track.uid)}
          onMouseEnter={(e) => this.handleOtherMouseEnter(e)}
        >
          {'Unlock Value Scale'}
        </ContextMenuItem>

        <hr />

        <ContextMenuItem
          contextMenu={this}
          onClick={() => this.props.onAddSeries(this.props.track.uid)}
          onMouseEnter={(e) => this.handleOtherMouseEnter(e)}
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
