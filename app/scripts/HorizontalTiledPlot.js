import PropTypes from 'prop-types';
import React from 'react';
import { brushX } from 'd3-brush';
import { select, event } from 'd3-selection';
import slugid from 'slugid';

import ListWrapper from './ListWrapper';
import HorizontalItem from './HorizontalItem';
import SortableList from './SortableList';

// Utils
import { genomeLociToPixels, or, sum } from './utils';

// Configs
import { IS_TRACK_RANGE_SELECTABLE } from './configs';

// Styles
import styles from '../styles/HorizontalTiledPlot.scss';  // eslint-disable-line no-unused-vars
import stylesPlot from '../styles/TiledPlot.scss';  // eslint-disable-line no-unused-vars
import stylesTrack from '../styles/Track.scss';  // eslint-disable-line no-unused-vars


export class HorizontalTiledPlot extends React.Component {
  constructor(props) {
    super(props);

    this.brushBehavior = brushX(true)
      .on('start', this.brushStarted.bind(this))
      .on('brush', this.brushed.bind(this));
  }

  /* -------------------------- Life Cycle Methods -------------------------- */

  shouldComponentUpdate(nextProps, nextState) {
    if (this.rangeSelectionTriggered) {
      this.rangeSelectionTriggered = false;
      return this.state !== nextState;
    } else if (this.props.rangeSelection !== nextProps.rangeSelection) {
      this.moveBrush(
        genomeLociToPixels(nextProps.rangeSelection[0], this.props.chromInfo)
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

    const relRange = [
      this.props.scale(rangeSelection[0]),
      this.props.scale(rangeSelection[1])
    ]

    this.rangeSelectionMoved = true;
    this.brushEl.call(this.brushBehavior.move, relRange);
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
    const height = this.props.tracks.map(x => x.height).reduce(sum, 0);

    const isBrushable = this.props.tracks
      .map(track => IS_TRACK_RANGE_SELECTABLE(track))
      .reduce(or, false);

    const rangeSelectorClass = this.props.isRangeSelectionActive ?
      'stylesTrack.track-range-selection-active' :
      'stylesTrack.track-range-selection';

    return (
      <div styleName="styles.horizontal-tiled-plot">
        {this.props.chromInfo && isBrushable &&
          <svg
            ref={el => this.brushEl = select(el)}
            style={{
              height: height,
              width: this.props.width
            }}
            styleName={rangeSelectorClass}
            xmlns="http://www.w3.org/2000/svg"
          />
        }
        <ListWrapper
          className={`${stylesPlot.list} ${stylesPlot.stylizedList}`}
          component={SortableList}
          editable={this.props.editable}
          handleConfigTrack={this.props.handleConfigTrack}
          handleResizeTrack={this.props.handleResizeTrack}
          height={height}
          helperClass={stylesPlot.stylizedHelper}
          itemClass={stylesPlot.stylizedItem}
          itemReactClass={HorizontalItem}
          items={this.props.tracks.map(d => ({
            uid: d.uid || slugid.nice(),
            width: this.props.width,
            height: d.height,
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
          width={this.props.width}
        />
      </div>
    );
  }
}

HorizontalTiledPlot.propTypes = {
  chromInfo: PropTypes.object,
  editable: PropTypes.bool,
  handleConfigTrack: PropTypes.func,
  handleResizeTrack: PropTypes.func,
  handleSortEnd: PropTypes.func,
  is1dRangeSelection: PropTypes.bool,
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
  width: PropTypes.number
}

export default HorizontalTiledPlot;
