import PropTypes from 'prop-types';
import React from 'react';

import ContextMenuItem from './ContextMenuItem';
import { TRACKS_INFO } from './configs';

// Styles
import '../styles/ContextMenu.module.scss';

export class CloseTrackMenu extends React.Component {
  /**
   * A window that is opened when a user clicks on the track configuration icon.
   */
  constructor(props) {
    super(props);
    this.seriesRefs = {};
  }

  getSeriesItems() {
    // this code is duplicated in ConfigTrackMenu, needs to be consolidated

    // check if this is a combined track (has contents)
    if (!this.props.track) { return null; }

    const trackTypeToInfo = {};

    TRACKS_INFO.forEach((ti) => {
      trackTypeToInfo[ti.type] = ti;
    });

    const series = this.props.track.contents ? this.props.track.contents : [this.props.track];

    return series.map((x) => {
      let thumbnail = null;

      // if the track is of an unknown type, we won't show any thumbnail
      if (trackTypeToInfo[x.type]) {
        thumbnail = trackTypeToInfo[x.type].thumbnail;
      }

      const imgTag = thumbnail ? (
        <div
          dangerouslySetInnerHTML={{ __html: thumbnail.outerHTML }}
          styleName="context-menu-thumbnail-inline"
        />
      ) : (
        <div styleName="context-menu-thumbnail-inline" >
          <svg width={30} height={20} />
        </div>
      );

      return (
        <div
          key={x.uid}
          ref={(c) => { this.seriesRefs[x.uid] = c; }}
          onClick={() => this.props.onCloseTrack(x.uid)}
          styleName="context-menu-item"
        >
          {imgTag}
          <span styleName="context-menu-span">
            {(x.name && x.name.length) ? x.name : x.uid}
          </span>
        </div>
      );
    });
  }

  render() {
    return (
      <div>
        {this.getSeriesItems()}
        <hr styleName="context-menu-hr" />
        <ContextMenuItem
          onClick={() => this.props.onCloseTrack(this.props.track.uid)}
        >
          {'Close track'}
        </ContextMenuItem>
      </div>
    );
  }
}

CloseTrackMenu.propTypes = {
  onCloseTrack: PropTypes.func.isRequired,
  track: PropTypes.object.isRequired,
};

export default CloseTrackMenu;
