import { mix } from 'mixwith';
import PropTypes from 'prop-types';
import React from 'react';

import ContextMenuItem from './ContextMenuItem';
import { TRACKS_INFO } from './configs';
import { getSeriesItems } from './SeriesListItems';

// Styles
import '../styles/ContextMenu.module.scss';

export class CloseTrackMenu extends React.Component {
  /**
   * A window that is opened when a user clicks on the track configuration icon.
   */
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        {getSeriesItems([this.props.track], null, null, this.props.onCloseTrack)}
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
