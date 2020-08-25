import PropTypes from 'prop-types';
import React from 'react';

import ContextMenuItem from './ContextMenuItem';
import { getSeriesItems } from './SeriesListItems';

// Styles
import '../styles/ContextMenu.module.scss';

const CloseTrackMenu = (props) => (
  <div>
    {getSeriesItems(props.tracks, null, null, props.onCloseTrack)}
    <hr styleName="context-menu-hr" />
    <ContextMenuItem onClick={() => props.onCloseTrack(props.tracks[0].uid)}>
      {'Close all series'}
    </ContextMenuItem>
  </div>
);

CloseTrackMenu.propTypes = {
  onCloseTrack: PropTypes.func.isRequired,
  tracks: PropTypes.array.isRequired,
};

export default CloseTrackMenu;
