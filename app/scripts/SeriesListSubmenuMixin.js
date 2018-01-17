import {Mixin} from 'mixwith';

import React from 'react';

import { SeriesListMenu } from './SeriesListMenu';
import { getAllTracksAndSubtracks } from './SeriesListItems';

export const SeriesListSubmenuMixin = Mixin((superclass) => class extends superclass {
  getSubmenu() {
    if (this.state.submenuShown) {
      // the bounding box of the element which initiated the subMenu
      // necessary so that we can position the submenu next to the initiating
      // element
      const bbox = this.state.submenuSourceBbox;
      let position = null;

      if (this.state.orientation == 'left') {
        position = {
          left: this.state.left,
          top: bbox.top,
        };
      } else {
        position = {
          left: this.state.left + bbox.width + 7,
          top: bbox.top,
        };
      }

      const series = getAllTracksAndSubtracks(this.props.tracks);
      const selectedTrack = series.filter(t => t.uid == this.state.submenuShown.uid)[0];

      // for now we can't replace 'whole' tracks because they're
      // just the horizontal and vertical rule tracks
      const canBeReplaced = !(selectedTrack.position == 'whole');

      return (
        <SeriesListMenu
          key={`series-list-menu-${selectedTrack.uid}`}
          closeMenu={this.props.closeMenu}
          hostTrack={this.props.tracks[0]}
          onAddSeries={canBeReplaced ? this.props.onAddSeries : null}
          onChangeTrackType={this.props.onChangeTrackType}
          onCloseTrack={() => this.props.onCloseTrack(this.state.submenuShown.uid)}
          onConfigureTrack={this.props.onConfigureTrack}
          onExportData={this.props.onExportData}
          onLockScales={this.props.onLockScales}
          onTrackOptionsChanged={this.props.onTrackOptionsChanged}
          onDivideSeries={this.props.onDivideSeries}
          orientation={this.state.orientation}
          ref={c => this.seriesListMenu = c}
          parentBbox={bbox}
          position={position}
          series={this.state.submenuShown}
          track={selectedTrack}
          trackOrientation={this.props.trackOrientation}
        />
      );
    }
    return (<div />);
  }
});
