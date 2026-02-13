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
        // Whether the button to expand or collapse the track is available
        // for use. Only available in horizontal and vertical tracks and not
        // center.
        expandCollapseAvailable={true}
        dragHandleProps={this.props.dragHandleProps}
        imgStyleAdd={STYLES}
        imgStyleClose={STYLES}
        imgStyleMove={STYLES}
        imgStyleSettings={STYLES}
        isAlignLeft={this.props.controlAlignLeft}
        isCollapsed={this.props.isCollapsed}
        isMoveable={this.moveable}
        isVertical={true}
        isVisible={isVisible}
        onAddSeries={this.props.onAddSeries}
        onCollapseTrack={this.props.onCollapseTrack}
        onExpandTrack={this.props.onExpandTrack}
        onCloseTrackMenuOpened={this.props.onCloseTrackMenuOpened}
        onConfigTrackMenuOpened={this.props.onConfigTrackMenuOpened}
        uid={this.props.uid}
      />
    );
  }
}

export default VerticalTrack;
