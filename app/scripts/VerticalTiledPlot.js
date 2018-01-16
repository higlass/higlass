import PropTypes from 'prop-types';
import React from 'react';

import { brushY } from 'd3-brush';
import { select, event } from 'd3-selection';
import slugid from 'slugid';

import ListWrapper from './ListWrapper';
import VerticalItem from './VerticalItem';
import SortableList from './SortableList';

// Utils
import { or, resetD3BrushStyle, sum } from './utils';

// Configs
import { IS_TRACK_RANGE_SELECTABLE } from './configs';

// Styles
import styles from '../styles/VerticalTiledPlot.module.scss'; // eslint-disable-line no-unused-vars
import stylesPlot from '../styles/TiledPlot.module.scss'; // eslint-disable-line no-unused-vars
import stylesTrack from '../styles/Track.module.scss'; // eslint-disable-line no-unused-vars


export class VerticalTiledPlot extends React.Component {
  constructor(props) {
    super(props);

    this.brushBehavior = brushY(true)
      .on('start', this.brushStarted.bind(this))
      .on('brush', this.brushed.bind(this))
      .on('end', this.brushedEnded.bind(this));
  }

  /* -------------------------- Life Cycle Methods -------------------------- */

  componentDidMount() {
    if (this.props.isRangeSelectionActive) {
      this.addBrush();
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.rangeSelectionTriggered) {
      this.rangeSelectionTriggered = false;
      return this.state !== nextState;
    } else if (this.props.rangeSelection !== nextProps.rangeSelection) {
      const accessor = this.props.is1dRangeSelection ? 0 : 1;

      this.moveBrush(
        nextProps.rangeSelection[accessor]
          ? nextProps.rangeSelection[accessor]
          : null
      );
      return this.state !== nextState;
    }
    return true;
  }

  componentDidUpdate() {
    if (this.props.isRangeSelectionActive) {
      this.addBrush();
    } else {
      this.removeBrush();
    }
  }

  /* ---------------------------- Custom Methods ---------------------------- */

  addBrush() {
    if (!this.brushEl || this.brushElAddedBefore === this.brushEl) { return; }

    if (this.brushElAddedBefore) {
      // Remove event listener on old element to avoid memory leaks
      this.brushElAddedBefore.on('.brush', null);
    }

    this.brushEl.call(this.brushBehavior);
    this.brushElAddedBefore = this.brushEl;

    resetD3BrushStyle(
      this.brushEl, stylesTrack['track-range-selection-group-brush-selection']
    );
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
    if (!event.sourceEvent || !event.selection) return;

    this.props.onRangeSelectionStart();
  }

  brushedEnded() {
    if (!event.selection && this.props.is1dRangeSelection) {
      this.rangeSelectionTriggered = true;
      this.props.onRangeSelectionEnd();
    }
  }

  moveBrush(rangeSelection) {
    if (!this.brushEl) { return; }

    const relRange = rangeSelection ? [
      this.props.scale(rangeSelection[0]),
      this.props.scale(rangeSelection[1]),
    ] : null;

    this.rangeSelectionMoved = true;
    this.brushEl.call(this.brushBehavior.move, relRange);
  }

  removeBrush() {
    if (this.brushElAddedBefore) {
      // Reset brush selection
      this.brushElAddedBefore.call(
        this.brushBehavior.move,
        null,
      );

      // Remove brush behavior
      this.brushElAddedBefore.on('.brush', null);
      this.brushElAddedBefore = undefined;

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
        {isBrushable &&
          <svg
            ref={(el) => { this.brushEl = select(el); }}
            style={{
              height: this.props.height,
              width,
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
            configMenuVisible: d.uid === this.props.configTrackMenuId,
            uid: d.uid || slugid.nice(),
            height: this.props.height,
            width: d.width,
            value: d.value,
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
  configTrackMenuId: PropTypes.string,
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
  tracksControlAlignLeft: PropTypes.bool,
};

export default VerticalTiledPlot;
