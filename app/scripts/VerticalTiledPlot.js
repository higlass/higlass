import PropTypes from 'prop-types';
import React from 'react';

import { brushY } from 'd3-brush';
import { select, event } from 'd3-selection';
import slugid from 'slugid';

import ListWrapper from './ListWrapper';
import VerticalItem from './VerticalItem';
import SortableList from './SortableList';

// Utils
import { genomeLociToPixels, or, sum } from './utils';

// Configs
import { IS_TRACK_RANGE_SELECTABLE } from './configs';

// Styles
import styles from '../styles/VerticalTiledPlot.scss';  // eslint-disable-line no-unused-vars
import stylesPlot from '../styles/TiledPlot.scss';  // eslint-disable-line no-unused-vars
import stylesTrack from '../styles/Track.scss';  // eslint-disable-line no-unused-vars


export class VerticalTiledPlot extends React.Component {
  constructor(props) {
    super(props);

    this.brushBehavior = brushY(true)
      .on('start', this.brushStarted.bind(this))
      .on('brush', this.brushed.bind(this));
  }

  /* -------------------------- Life Cycle Methods -------------------------- */

  shouldComponentUpdate(nextProps, nextState) {
    if (this.rangeSelectionTriggered) {
      this.rangeSelectionTriggered = false;
      return this.state !== nextState;
    } else if (this.props.rangeSelection !== nextProps.rangeSelection) {
      const accessor = this.props.is1dRangeSelection ? 0 : 1;

      this.moveBrush(
        genomeLociToPixels(
          nextProps.rangeSelection[accessor],
          this.props.chromInfo
        )
      );
      return this.state !== nextState;
    }
    return true;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.isRangeSelectionActive !== this.props.isRangeSelectionActive) {
      if (this.props.isRangeSelectionActive) {
        this.addBrush();
      } else {
        this.removeBrush();
      }
    }
  }

  /* ---------------------------- Custom Methods ---------------------------- */

  addBrush() {
    if (!this.brushEl) { return; }

    this.brushEl.call(this.brushBehavior);
  }

  brushed() {
    // Need to reassign variable to check after reset
    const rangeSelectionMoved = this.rangeSelectionMoved;
    this.rangeSelectionMoved = false;

    if (
      !event.sourceEvent ||
      !this.props.onRangeSelection ||
      rangeSelectionMoved
    ) return;

    this.rangeSelectionTriggered = true;
    this.props.onRangeSelection(event.selection);
  }

  brushStarted() {
    if (!event.sourceEvent) return;

    this.props.onRangeSelectionStart();
  }

  moveBrush(rangeSelection) {
    if (!this.brushEl) { return; }

    this.rangeSelectionMoved = true;
    this.brushEl.call(
      this.brushBehavior.move,
      [
        this.props.scale(rangeSelection[0]),
        this.props.scale(rangeSelection[1])
      ]
    );
  }

  removeBrush() {
    if (this.brushEl) {
      // Reset brush selection
      this.brushEl.call(
        this.brushBehavior.move,
        null
      );

      // Remove brush behavior
      this.brushEl.on('.brush', null);

      this.props.onRangeSelectionEnd();
    }
  }

  /* ------------------------------ Rendering ------------------------------- */

  render() {
    const width = this.props.tracks.map(x => x.width).reduce(sum, 0);

    const isBrushable = this.props.tracks
      .map(track => IS_TRACK_RANGE_SELECTABLE(track))
      .reduce(or, false);

    const rangeSelectorClass = this.props.isRangeSelectionActive ?
      'stylesTrack.track-range-selection-active' :
      'stylesTrack.track-range-selection';

    return (
      <div styleName="styles.vertical-tiled-plot">
        {this.props.chromInfo && isBrushable &&
          <svg
            ref={el => this.brushEl = select(el)}
            style={{
              height: this.props.height,
              width: width
            }}
            styleName={rangeSelectorClass}
            xmlns="http://www.w3.org/2000/svg"
          />
        }
        <ListWrapper
          axis="x"
          className={`${stylesPlot.list} ${stylesPlot.stylizedList} ${stylesPlot.horizontalList}`}
          component={SortableList}
          editable={this.props.editable}
          handleConfigTrack={this.props.handleConfigTrack}
          handleResizeTrack={this.props.handleResizeTrack}
          height={this.props.height}
          helperClass={stylesPlot.stylizedHelper}
          itemClass={`${stylesPlot.stylizedItem} ${stylesPlot.horizontalItem}`}
          itemControlAlignLeft={this.props.tracksControlAlignLeft}
          itemReactClass={VerticalItem}
          items={this.props.tracks.map(d => ({
            uid: d.uid || slugid.nice(),
            height: this.props.height,
            width: d.width,
            value: d.value
          }))}
          onAddSeries={this.props.onAddSeries}
          onCloseTrack={this.props.onCloseTrack}
          onCloseTrackMenuOpened={this.props.onCloseTrackMenuOpened}
          onConfigTrackMenuOpened={this.props.onConfigTrackMenuOpened}
          onSortEnd={this.props.handleSortEnd}
          referenceAncestor={this.props.referenceAncestor}
          resizeHandles={this.props.resizeHandles}
          useDragHandle={true}
          width={width}
        />
      </div>
    );
  }
}

VerticalTiledPlot.propTypes = {
  chromInfo: PropTypes.object,
  editable: PropTypes.bool,
  handleConfigTrack: PropTypes.func,
  handleResizeTrack: PropTypes.func,
  handleSortEnd: PropTypes.func,
  is1dRangeSelection: PropTypes.bool,
  isRangeSelectionActive: PropTypes.bool,
  height: PropTypes.number,
  onAddSeries: PropTypes.func,
  onCloseTrack: PropTypes.func,
  onCloseTrackMenuOpened: PropTypes.func,
  onConfigTrackMenuOpened: PropTypes.func,
  onRangeSelection: PropTypes.func,
  onRangeSelectionEnd: PropTypes.func,
  onRangeSelectionStart: PropTypes.func,
  rangeSelection: PropTypes.array,
  referenceAncestor: PropTypes.func,
  resizeHandles: PropTypes.object,
  scale: PropTypes.func,
  tracks: PropTypes.array,
  tracksControlAlignLeft: PropTypes.bool
}

export default VerticalTiledPlot;
