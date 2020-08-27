import React from 'react';
import PropTypes from 'prop-types';
import { mix } from './mixwith';

import { expandCombinedTracks } from './utils';
import { getSeriesItems } from './SeriesListItems';

import ContextMenuItem from './ContextMenuItem';
import ContextMenuContainer from './ContextMenuContainer';
import SeriesListSubmenuMixin from './SeriesListSubmenuMixin';

import { THEME_DARK } from './configs';

// Styles
import '../styles/ContextMenu.module.scss';

class ViewContextMenu extends mix(ContextMenuContainer).with(
  SeriesListSubmenuMixin,
) {
  render() {
    const seriesItems = getSeriesItems(
      this.props.tracks,
      this.handleItemMouseEnter.bind(this),
      this.handleMouseLeave.bind(this),
    );

    const customItemsWrapped = this.props.customItems
      ? React.Children.map(this.props.customItems, (child) =>
          React.cloneElement(child, {
            onMouseEnter: (e) => {
              this.handleOtherMouseEnter(e);
            },
          }),
        )
      : null;

    let styleNames = 'context-menu';
    if (this.props.theme === THEME_DARK) styleNames += ' context-menu-dark';

    return (
      <div
        ref={(c) => {
          this.div = c;
        }}
        data-menu-type="ViewContextMenu"
        style={{
          left: this.state.left,
          top: this.state.top,
        }}
        styleName={styleNames}
      >
        {customItemsWrapped}

        {customItemsWrapped && <hr styleName="context-menu-hr" />}

        {seriesItems}

        {seriesItems && <hr styleName="context-menu-hr" />}

        <ContextMenuItem
          onClick={() =>
            this.props.onAddTrack({
              type: 'horizontal-rule',
              y: this.props.coords[1],
              position: 'whole',
            })
          }
          onMouseEnter={(e) => this.handleOtherMouseEnter(e)}
        >
          {'Add Horizontal Rule'}
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() =>
            this.props.onAddTrack({
              type: 'vertical-rule',
              x: this.props.coords[0],
              position: 'whole',
            })
          }
          onMouseEnter={(e) => this.handleOtherMouseEnter(e)}
        >
          {'Add Vertical Rule'}
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() =>
            this.props.onAddTrack({
              type: 'cross-rule',
              x: this.props.coords[0],
              y: this.props.coords[1],
              position: 'whole',
            })
          }
          onMouseEnter={(e) => this.handleOtherMouseEnter(e)}
        >
          {'Add Cross Rule'}
        </ContextMenuItem>

        <hr styleName="context-menu-hr" />

        {this.hasMatrixTrack(this.props.tracks) && (
          <ContextMenuItem
            onClick={this.handleAddHorizontalSection.bind(this)}
            onMouseEnter={(e) => this.handleOtherMouseEnter(e)}
          >
            {'Add Horizontal Cross Section'}
          </ContextMenuItem>
        )}
        {this.hasMatrixTrack(this.props.tracks) && (
          <ContextMenuItem
            onClick={this.handleAddVerticalSection.bind(this)}
            onMouseEnter={(e) => this.handleOtherMouseEnter(e)}
          >
            {'Add Vertical Cross Section'}
          </ContextMenuItem>
        )}

        {/* from the SeriesListSubmenuMixin */}
        {this.getSubmenu()}
      </div>
    );
  }

  hasMatrixTrack(tracks) {
    const trackList = expandCombinedTracks(this.props.tracks);
    return trackList.filter((track) => track.type === 'heatmap').length > 0;
  }

  handleAddHorizontalSection() {
    const trackList = expandCombinedTracks(this.props.tracks);
    const matrixTrack = trackList.filter(
      (track) => track.type === 'heatmap',
    )[0];

    this.props.onAddTrack({
      type: 'horizontal-rule',
      y: this.props.coords[1],
      position: 'whole',
    });
    this.props.onAddTrack({
      data: {
        type: 'horizontal-section',
        server: matrixTrack.server,
        tilesetUid: matrixTrack.tilesetUid,
        slicePos: this.props.coords[1],
      },
      options: {
        valueScaling: 'log',
      },
      type: 'horizontal-bar',
      height: 30,
      position: 'top',
    });
  }

  handleAddVerticalSection() {
    const trackList = expandCombinedTracks(this.props.tracks);
    const matrixTrack = trackList.filter(
      (track) => track.type === 'heatmap',
    )[0];

    this.props.onAddTrack({
      type: 'vertical-rule',
      x: this.props.coords[0],
      position: 'whole',
    });
    this.props.onAddTrack({
      data: {
        type: 'vertical-section',
        server: matrixTrack.server,
        tilesetUid: matrixTrack.tilesetUid,
        slicePos: this.props.coords[0],
      },
      options: {
        valueScaling: 'log',
      },
      type: 'vertical-bar',
      height: 30,
      position: 'left',
    });
  }
}

ViewContextMenu.propTypes = {
  // the data coordinates where this context menu was initiated
  coords: PropTypes.array,
  customItems: PropTypes.array,
};

export default ViewContextMenu;
