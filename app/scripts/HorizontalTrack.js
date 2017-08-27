import React from 'react';

import MoveableTrack from './MoveableTrack';
import TrackControl from './TrackControl';

const STYLES = {
  opacity: .7,
  pointerEvents: 'all',
  position: 'relative'
};

const EXTENDED_STYLE = Object.assign({}, STYLES, {
  marginRight: '5px'
});

export class HorizontalTrack extends MoveableTrack {
  getControls(isVisible) {
    return (
      <TrackControl
        imgStyleAdd={EXTENDED_STYLE}
        imgStyleClose={STYLES}
        imgStyleMove={EXTENDED_STYLE}
        imgStyleSettings={EXTENDED_STYLE}
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
