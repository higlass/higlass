// @ts-nocheck
import React from 'react';
import { Mixin } from './mixwith';

import SeriesListMenu from './SeriesListMenu';
import { getAllTracksAndSubtracks } from './SeriesListItems';

const SeriesListSubmenuMixin = Mixin(
  (superclass) =>
    class extends superclass {
      getSubmenu() {
        if (this.state.submenuShown) {
          // the bounding box of the element which initiated the subMenu
          // necessary so that we can position the submenu next to the initiating
          // element
          const bbox = this.state.submenuSourceBbox;
          let position = null;

          if (this.state.orientation === 'left') {
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
          const selectedTrack = series.filter(
            (t) => t.uid === this.state.submenuShown.uid,
          )[0];

          // for now we can't replace 'whole' tracks because they're
          // just the horizontal and vertical rule tracks
          const canBeReplaced =
            selectedTrack && !(selectedTrack.position === 'whole');

          return (
            <SeriesListMenu
              key={`series-list-menu-${selectedTrack.uid}`}
              ref={(c) => {
                this.seriesListMenu = c;
              }}
              closeMenu={this.props.closeMenu}
              hostTrack={this.props.tracks[0]}
              onAddDivisor={this.props.onAddDivisor}
              onAddSeries={canBeReplaced ? this.props.onAddSeries : null}
              onChangeTrackData={this.props.onChangeTrackData}
              onChangeTrackType={this.props.onChangeTrackType}
              onCloseTrack={() =>
                this.props.onCloseTrack(this.state.submenuShown.uid)
              }
              onConfigureTrack={this.props.onConfigureTrack}
              onDivideSeries={this.props.onDivideSeries}
              onExportData={this.props.onExportData}
              onLockScales={this.props.onLockScales}
              onTrackOptionsChanged={this.props.onTrackOptionsChanged}
              orientation={this.state.orientation}
              parentBbox={bbox}
              position={position}
              series={this.state.submenuShown}
              theme={this.props.theme}
              track={selectedTrack}
              trackOrientation={this.props.trackOrientation}
              trackSourceServers={this.props.trackSourceServers}
            />
          );
        }
        return <div />;
      }
    },
);

export default SeriesListSubmenuMixin;
