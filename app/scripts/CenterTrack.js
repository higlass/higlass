import PropTypes from 'prop-types';
import React from 'react';
import { brush, brushX, brushY } from 'd3-brush';
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

const STYLES = {
  opacity: .7,
  pointerEvents: 'all',
  position: 'relative'
};

const EXTENDED_STYLE = Object.assign({}, STYLES, {
  marginRight: '5px'
});

export class CenterTrack extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isVisible: false,
      rangeSelecting: false
    };

    this.pubSubs = [];

    this.brushBehaviorX = brushX(true, true)
      .on('brush', this.brushedX.bind(this));

    this.brushBehaviorY = brushY(true, true, true)
      .on('brush', this.brushedY.bind(this));

    this.brushBehaviorXY = brush(true)
      .on('start', this.brushStarted.bind(this))
      .on('brush', this.brushedXY.bind(this));
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
    if (this.rangeSelectionTriggeredXY) {
      this.rangeSelectionTriggeredXY = false;
      return this.state !== nextState;
    } else if (this.props.rangeSelection !== nextProps.rangeSelection) {
      const dim1 = genomeLociToPixels(
        nextProps.rangeSelection[0], this.props.chromInfo
      );

      if (this.props.is1dRangeSelection) {
        if (!this.rangeSelectionTriggeredX) {
          this.moveBrushX(dim1);
        }
        if (!this.rangeSelectionTriggeredY) {
          this.moveBrushY(dim1);
        }
        this.rangeSelectionTriggeredX = false;
        this.rangeSelectionTriggeredY = false;
      } else {
        this.moveBrushXY(
          [
            dim1,
            genomeLociToPixels(
              nextProps.rangeSelection[1], this.props.chromInfo
            )
          ]
        );
      }
      return this.state !== nextState;
    }
    return true;
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.rangeSelecting !== this.state.rangeSelecting) {
      if (this.state.rangeSelecting) {
        this.addBrush2d();
      } else {
        this.removeBrush1d();
        this.removeBrush2d();
      }
    }
  }

  componentWillUnmount() {
    this.pubSubs.forEach(subscription => pubSub.unsubscribe(subscription));
    this.pubSubs = [];
  }

  /* ---------------------------- Custom Methods ---------------------------- */

  addBrush1d() {
    if (!this.brushElX && !this.brushElY) { return; }

    this.brushElX.call(this.brushBehaviorX);
    this.brushElY.call(this.brushBehaviorY);

    this.brushIs1dBound = true;
  }

  addBrush2d() {
    if (!this.brushElXY) { return; }

    this.brushElXY.call(this.brushBehaviorXY);
    this.brushIs2dBound = true;
  }

  brushedX() {
    // Need to reassign variable to check after reset
    const rangeSelectionMoved = this.rangeSelectionMoved;
    this.rangeSelectionMoved = false;

    if (
      !event.sourceEvent ||
      !this.props.onRangeSelectionX ||
      !this.props.is1dRangeSelection ||
      rangeSelectionMoved
    ) return;

    this.rangeSelectionTriggeredX = true;
    this.props.onRangeSelectionX(event.selection);
  }

  brushedY() {
    // Need to reassign variable to check after reset
    const rangeSelectionMoved = this.rangeSelectionMoved;
    this.rangeSelectionMoved = false;

    if (
      !event.sourceEvent ||
      !this.props.onRangeSelectionY ||
      !this.props.is1dRangeSelection ||
      rangeSelectionMoved
    ) return;

    this.rangeSelectionTriggeredY = true;
    this.props.onRangeSelectionY(event.selection);
  }

  brushedXY() {
    // Need to reassign variable to check after reset
    const rangeSelectionMoved = this.rangeSelectionMoved;
    this.rangeSelectionMoved = false;

    if (
      !event.sourceEvent ||
      !this.props.onRangeSelectionXY ||
      rangeSelectionMoved ||
      this.props.is1dRangeSelection
    ) return;

    this.rangeSelectionTriggeredXY = true;
    this.props.onRangeSelectionXY([
      [event.selection[0][0], event.selection[1][0]],
      [event.selection[0][1], event.selection[1][1]]
    ]);
  }

  brushStarted() {
    if (!event.sourceEvent) return;

    this.props.onRangeSelectionStart();
  }

  moveBrushX(rangeSelection) {
    if (!this.brushEl && !event.sourceEvent) { return; }

    if (this.brushIs2dBound) {
      this.removeBrush2d();
      this.addBrush1d();
    }

    const relRangeX = [
      this.props.scaleX(rangeSelection[0]),
      this.props.scaleX(rangeSelection[1])
    ];

    this.rangeSelectionMoved = true;
    this.brushElX.call(this.brushBehaviorX.move, relRangeX);
  }

  moveBrushY(rangeSelection) {
    if (!this.brushEl && !event.sourceEvent) { return; }

    if (this.brushIs2dBound) {
      this.removeBrush2d();
      this.addBrush1d();
    }

    const relRangeY = [
      this.props.scaleY(rangeSelection[0]),
      this.props.scaleY(rangeSelection[1])
    ];

    this.rangeSelectionMoved = true;
    this.brushElY.call(this.brushBehaviorY.move, relRangeY);
  }

  moveBrushXY(rangeSelection) {
    if (!this.brushEl && !event.sourceEvent) { return; }

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
    this.brushElXY.call(this.brushBehaviorXY.move, relRange);
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

  removeBrush1d() {
    if (!this.brushIs1dBound) { return; }

    if (this.brushElX) {
      // Reset brush selection
      this.brushElX.call(this.brushBehaviorX.move, null);

      // Remove brush behavior
      this.brushElX.on('.brush', null);
    }

    if (this.brushElY) {
      // Reset brush selection
      this.brushElY.call(this.brushBehaviorY.move, null);

      // Remove brush behavior
      this.brushElY.on('.brush', null);
    }

    this.brushIs1dBound = false;
  }

  removeBrush2d() {
    if (!this.brushIs2dBound) { return; }

    if (this.brushElXY) {
      // Reset brush selection
      this.brushElXY.call(this.brushBehaviorXY.move, null);

      // Remove brush behavior
      this.brushElXY.on('.brush', null);

      this.brushIs2dBound = false;

      !this.props.is1dRangeSelection && this.props.onRangeSelectionEnd();
    }
  }

  /* ------------------------------ Rendering ------------------------------- */

  render() {
    const isBrushable = this.props.tracks
      .map(track => IS_TRACK_RANGE_SELECTABLE(track))
      .reduce(or, false);

    const rangeSelectorClass = this.state.rangeSelecting ? (
        this.props.is1dRangeSelection ?
          'stylesTrack.track-range-selection-active-secondary' :
          'stylesTrack.track-range-selection-active-primary'
      ) : 'stylesTrack.track-range-selection';

    const rangeSelectorGroup1dClass = !this.props.is1dRangeSelection ?
      'stylesTrack.track-range-selection-group-inactive' :
      '';

    const rangeSelectorGroup2dClass = this.props.is1dRangeSelection ?
      'stylesTrack.track-range-selection-group-inactive' :
      '';

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
            style={{
              height: this.props.height,
              width: this.props.width
            }}
            styleName={rangeSelectorClass}
            xmlns="http://www.w3.org/2000/svg"
          >
            <g
              ref={el => this.brushElX = select(el)}
              styleName={rangeSelectorGroup1dClass}
            />
            <g
              ref={el => this.brushElY = select(el)}
              styleName={rangeSelectorGroup1dClass}
            />
            <g
              ref={el => this.brushElXY = select(el)}
              styleName={rangeSelectorGroup2dClass}
            />
          </svg>
        }
        {this.props.editable &&
          <TrackControl
            imgStyleAdd={EXTENDED_STYLE}
            imgStyleClose={STYLES}
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
  onRangeSelectionX: PropTypes.func,
  onRangeSelectionY: PropTypes.func,
  onRangeSelectionXY: PropTypes.func,
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
