import React from 'react';

import MoveableTrack from './MoveableTrack';
import TrackControl from './TrackControl';

const STYLES = {
  display: 'block',
  opacity: .7,
  pointerEvents: 'all',
  position: 'relative'
};

const EXTENDED_STYLE = Object.assign({}, STYLES, {
  marginTop: '5px'
});

export class VerticalTrack extends MoveableTrack {
  getControls(isVisible) {
    return (
      <TrackControl
        imgStyleAdd={EXTENDED_STYLE}
        imgStyleClose={STYLES}
        imgStyleMove={EXTENDED_STYLE}
        imgStyleSettings={EXTENDED_STYLE}
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
