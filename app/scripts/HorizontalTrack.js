import React from 'react';

import MoveableTrack from './MoveableTrack';
import TrackControl from './TrackControl';

const STYLES = {
  pointerEvents: 'all',
};

class HorizontalTrack extends MoveableTrack {
  getControls(isVisible) {
    return (
      <TrackControl
        configMenuVisible={this.props.item.configMenuVisible}
        imgStyleAdd={STYLES}
        imgStyleClose={STYLES}
        imgStyleMove={STYLES}
        imgStyleSettings={STYLES}
        isMoveable={this.moveable}
        isVisible={isVisible}
        onAddSeries={this.props.onAddSeries}
        onCloseTrackMenuOpened={this.props.onCloseTrackMenuOpened}
        onConfigTrackMenuOpened={this.props.onConfigTrackMenuOpened}
        uid={this.props.uid}
      />
    );
  }
}

export default HorizontalTrack;
