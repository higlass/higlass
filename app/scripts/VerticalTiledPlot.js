import PropTypes from 'prop-types';
import React from 'react';

import { brushY } from 'd3-brush';
import { select, event } from 'd3-selection';
import slugid from 'slugid';

import ListWrapper from './ListWrapper';
import VerticalItem from './VerticalItem';
import SortableList from './SortableList';

// Services
import { pubSub } from './services';

// Utils
import { genomeLociToPixels, or, sum } from './utils';

// Configs
import { isTrackRangeSelectable } from './config';

// Styles
import styles from '../styles/VerticalTiledPlot.scss';  // eslint-disable-line no-unused-vars
import stylesTrack from '../styles/Track.scss';  // eslint-disable-line no-unused-vars


class VerticalTiledPlot extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      rangeSelecting: false
    };

    this.pubSubs = [];

    this.brushBehavior = brushY().on('brush', this.brushed.bind(this));
  }

  /* -------------------------- Life Cycle Methods -------------------------- */

  componentWillMount() {

    this.pubSubs = [];
    this.pubSubs.push(
      pubSub.subscribe('keydown', this.keyDownHandler.bind(this))
    );
    this.pubSubs.push(
      pubSub.subscribe('keyup', this.keyUpHandler.bind(this))
    );
  }

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

  componentDidUpdate(prevProps, prevState) {
    if (prevState.rangeSelecting !== this.state.rangeSelecting) {
      if (this.state.rangeSelecting) {
        this.addBrush();
      } else {
        this.removeBrush();
      }
    }
  }

  componentWillUnmount() {
    this.pubSubs.forEach(subscription => pubSub.unsubscribe(subscription));
    this.pubSubs = [];
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

  keyDownHandler(event) {
    if (event.key === 'Alt') {
      this.setState({
        rangeSelecting: true
      });
    }
  }

  keyUpHandler(event) {
    if (event.key === 'Alt') {
      this.setState({
        rangeSelecting: false
      });
    }
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
    }
  }

  /* ------------------------------ Rendering ------------------------------- */

  render() {
    const width = this.props.tracks.map(x => x.width).reduce(sum, 0);

    const isBrushable = this.props.tracks
      .map(track => isTrackRangeSelectable(track))
      .reduce(or, false);

    const rangeSelectorClass = this.state.rangeSelecting ?
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
          className="list stylizedList horizontalList"
          component={SortableList}
          editable={this.props.editable}
          handleConfigTrack={this.props.handleConfigTrack}
          handleResizeTrack={this.props.handleResizeTrack}
          height={this.props.height}
          helperClass="stylizedHelper"
          itemClass="stylizedItem horizontalItem"
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
  height: PropTypes.number,
  onAddSeries: PropTypes.func,
  onCloseTrack: PropTypes.func,
  onCloseTrackMenuOpened: PropTypes.func,
  onConfigTrackMenuOpened: PropTypes.func,
  onRangeSelection: PropTypes.func,
  rangeSelection: PropTypes.array,
  referenceAncestor: PropTypes.func,
  resizeHandles: PropTypes.object,
  scale: PropTypes.func,
  tracks: PropTypes.array
}

export default VerticalTiledPlot;
