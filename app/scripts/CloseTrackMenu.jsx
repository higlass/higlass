// @ts-nocheck
import PropTypes from 'prop-types';
import React from 'react';

import ContextMenuItem from './ContextMenuItem';
import { getSeriesItems } from './SeriesListItems';

// Styles
import classes from '../styles/ContextMenu.module.scss';

function CloseTrackMenu(props) {
  return (
    <div>
      {getSeriesItems(props.tracks, null, null, props.onCloseTrack)}
      <hr className={classes['context-menu-hr']} />
      <ContextMenuItem onClick={() => props.onCloseTrack(props.tracks[0].uid)}>
        Close all series
      </ContextMenuItem>
    </div>
  );
}

CloseTrackMenu.propTypes = {
  onCloseTrack: PropTypes.func.isRequired,
  tracks: PropTypes.array.isRequired,
};

export default CloseTrackMenu;
