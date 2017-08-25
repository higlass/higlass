import PropTypes from 'prop-types';
import React from 'react';
import { brush } from 'd3-brush';
import { select, event } from 'd3-selection';

import TrackControl from './TrackControl';

// Services
import { pubSub } from './services';

// Utils
import { genomeLociToPixels, or } from './utils';

// Configs
import { IS_TRACK_RANGE_SELECTABLE } from './configs';

// Styles
import styles from '../styles/CenterTrack.scss';  // eslint-disable-line no-unused-vars
import stylesTrack from '../styles/Track.scss';  // eslint-disable-line no-unused-vars

const STYLE = {
  opacity: .7,
  pointerEvents: 'all',
  position: 'relative'
};

const EXTENDED_STYLE = Object.assign({}, STYLE, {
  marginRight: '5px'
})

export class CenterTrack extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isVisible: false,
      rangeSelecting: false
    };

    this.pubSubs = [];

    this.brushBehavior = brush(true)
      .on('start', this.brushStarted.bind(this))
      .on('brush', this.brushed.bind(this));
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
        [
          genomeLociToPixels(nextProps.rangeSelection[0], this.props.chromInfo),
          genomeLociToPixels(nextProps.rangeSelection[1], this.props.chromInfo)
        ]
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
    this.props.onRangeSelection([
      [event.selection[0][0], event.selection[1][0]],
      [event.selection[0][1], event.selection[1][1]]
    ]);
  }

  brushStarted() {
    if (!event.sourceEvent) return;

    this.props.onRangeSelectionStart();
  }

  moveBrush(rangeSelection) {
    if (!this.brushEl) { return; }

    const relRange = [
      [
        this.props.scaleX(rangeSelection[0][0]),
        this.props.scaleY(rangeSelection[1][0])
      ],
      [
        this.props.scaleX(rangeSelection[0][1]),
        this.props.scaleY(rangeSelection[1][1])
      ]
    ];

    this.rangeSelectionMoved = true;
    this.brushEl.call(this.brushBehavior.move, relRange);
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

  mouseEnterHandler() {
    this.setState({
      isVisible: true
    });
  }

  mouseLeaveHandler() {
    this.setState({
      isVisible: false
    });
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
    const isBrushable = this.props.tracks
      .map(track => IS_TRACK_RANGE_SELECTABLE(track))
      .reduce(or, false);

    const rangeSelectorClass = this.state.rangeSelecting ?
      'stylesTrack.track-range-selection-active' :
      'stylesTrack.track-range-selection';

    return (
      <div
        className={this.props.className ? this.props.className : ''}
        onMouseEnter={this.mouseEnterHandler.bind(this)}
        onMouseLeave={this.mouseLeaveHandler.bind(this)}
        style={{
          height: this.props.height,
          width: this.props.width
        }}
        styleName="styles.center-track"
      >
        {this.props.chromInfo && isBrushable &&
          <svg
            ref={el => this.brushEl = select(el)}
            style={{
              height: this.props.height,
              width: this.props.width
            }}
            styleName={rangeSelectorClass}
            xmlns="http://www.w3.org/2000/svg"
          />
        }
        {this.props.editable &&
          <TrackControl
            imgStyleAdd={EXTENDED_STYLE}
            imgStyleClose={STYLE}
            imgStyleMove={EXTENDED_STYLE}
            imgStyleSettings={EXTENDED_STYLE}
            isMoveable={false}
            isVisible={this.state.isVisible}
            onAddSeries={this.props.onAddSeries}
            onCloseTrackMenuOpened={this.props.onCloseTrackMenuOpened}
            onConfigTrackMenuOpened={this.props.onConfigTrackMenuOpened}
            uid={this.props.uid}
          />
        }
      </div>
    );
  }
}

CenterTrack.propTypes = {
  chromInfo: PropTypes.object,
  className: PropTypes.string,
  editable: PropTypes.bool,
  height: PropTypes.number,
  is1dRangeSelection: PropTypes.bool,
  onAddSeries: PropTypes.func,
  onCloseTrackMenuOpened: PropTypes.func,
  onConfigTrackMenuOpened: PropTypes.func,
  onRangeSelection: PropTypes.func,
  onRangeSelectionEnd: PropTypes.func,
  onRangeSelectionStart: PropTypes.func,
  rangeSelection: PropTypes.array,
  scaleX: PropTypes.func,
  scaleY: PropTypes.func,
  tracks: PropTypes.array,
  uid: PropTypes.string,
  width: PropTypes.number
}

export default CenterTrack;
