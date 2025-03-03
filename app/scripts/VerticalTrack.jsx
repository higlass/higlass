// @ts-nocheck
import React from 'react';

import MoveableTrack from './MoveableTrack';
import TrackControl from './TrackControl';

const STYLES = {
  pointerEvents: 'all',
};

class VerticalTrack extends MoveableTrack {
  getControls(isVisible) {
    return (
      <TrackControl
        imgStyleAdd={STYLES}
        imgStyleClose={STYLES}
        imgStyleMove={STYLES}
        imgStyleSettings={STYLES}
        isAlignLeft={this.props.controlAlignLeft}
        isMoveable={this.moveable}
        isVertical={true}
        isVisible={isVisible}
        onAddSeries={this.props.onAddSeries}
        onCloseTrackMenuOpened={this.props.onCloseTrackMenuOpened}
        onConfigTrackMenuOpened={this.props.onConfigTrackMenuOpened}
        uid={this.props.uid}
      />
    );
  }
}

export default VerticalTrack;
