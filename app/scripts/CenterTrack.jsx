// @ts-nocheck
import PropTypes from 'prop-types';
import React from 'react';
import { brush, brushX, brushY } from 'd3-brush';
import { select } from 'd3-selection';
import clsx from 'clsx';

import TrackControl from './TrackControl';

// Utils
import { or, resetD3BrushStyle, IS_TRACK_RANGE_SELECTABLE } from './utils';

// Styles
import styles from '../styles/CenterTrack.module.scss'; // eslint-disable-line no-unused-vars
import stylesTrack from '../styles/Track.module.scss'; // eslint-disable-line no-unused-vars

const STYLES = {
  pointerEvents: 'all',
};

function sourceEvent(event) {
  return event && event.sourceEvent;
}

class CenterTrack extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isVisible: false,
    };

    this.brushBehaviorX = brushX()
      .on('brush', this.brushedX.bind(this))
      .on('end', this.brushedXEnded.bind(this));

    this.brushBehaviorY = brushY()
      .on('brush', this.brushedY.bind(this))
      .on('end', this.brushedYEnded.bind(this));

    this.brushBehaviorXY = brush()
      .on('start', this.brushStarted.bind(this))
      .on('brush', this.brushedXY.bind(this))
      .on('end', this.brushedXYEnded.bind(this));
  }

  /* -------------------------- Life Cycle Methods -------------------------- */

  componentDidMount() {
    if (this.props.isRangeSelectionActive) {
      this.addBrush2d();
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.rangeSelectionTriggeredXY) {
      this.rangeSelectionTriggeredXY = false;
      if (this.rangeSelectionTriggeredXYEnd) {
        const dim1 = nextProps.rangeSelection[0] || null;
        this.moveBrushXY([dim1, nextProps.rangeSelection[1]], true);
        this.rangeSelectionTriggeredXYEnd = false;
      }
      return this.state !== nextState;
    }
    if (this.props.rangeSelection !== nextProps.rangeSelection) {
      const dim1 = nextProps.rangeSelection[0] || null;

      if (this.props.is1dRangeSelection) {
        if (!this.rangeSelectionTriggeredX) {
          this.moveBrushX(dim1, nextProps.rangeSelectionEnd);
        }
        if (this.rangeSelectionTriggeredXEnd) {
          this.moveBrushX(dim1, nextProps.rangeSelectionEnd, true);
        }
        if (!this.rangeSelectionTriggeredY) {
          this.moveBrushY(dim1, nextProps.rangeSelectionEnd);
        }
        if (this.rangeSelectionTriggeredYEnd) {
          this.moveBrushY(dim1, nextProps.rangeSelectionEnd, true);
        }
        this.rangeSelectionTriggeredX = false;
        this.rangeSelectionTriggeredXEnd = false;
        this.rangeSelectionTriggeredY = false;
        this.rangeSelectionTriggeredYEnd = false;
      } else {
        this.moveBrushXY(
          [dim1, nextProps.rangeSelection[1]],
          nextProps.rangeSelectionEnd,
        );
      }

      const isUnset =
        this.props.is1dRangeSelection &&
        !nextProps.is1dRangeSelection &&
        dim1 === null;

      return this.state !== nextState || isUnset;
    }
    return true;
  }

  componentDidUpdate() {
    if (this.props.isRangeSelectionActive) {
      this.addBrush2d();
    } else {
      this.removeBrush1d();
      this.removeBrush2d();
    }
  }

  /* ---------------------------- Custom Methods ---------------------------- */

  addBrush1d() {
    if (
      !this.brushElX ||
      !this.brushElY ||
      (this.brushElXOld === this.brushElX && this.brushElYOld === this.brushElY)
    ) {
      return;
    }

    if (this.brushElXOld) {
      // Remove event listener on old element to avoid memory leaks
      this.brushElXOld.on('.brush', null);
    }

    if (this.brushElYOld) {
      // Remove event listener on old element to avoid memory leaks
      this.brushElYOld.on('.brush', null);
    }

    this.brushElX.call(this.brushBehaviorX);
    this.brushElY.call(this.brushBehaviorY);

    resetD3BrushStyle(
      this.brushElX,
      stylesTrack['track-range-selection-group-brush-selection'],
    );
    resetD3BrushStyle(
      this.brushElY,
      stylesTrack['track-range-selection-group-brush-selection'],
    );

    this.brushElXOld = this.brushElX;
    this.brushElYOld = this.brushElY;

    this.brushIs1dBound = true;
  }

  addBrush2d() {
    if (!this.brushElXY || this.brushElXYOld === this.brushElXY) {
      return;
    }

    if (this.brushElXYOld) {
      // Remove event listener on old element to avoid memory leaks
      this.brushElXYOld.on('.brush', null);
    }

    this.brushElXY.call(this.brushBehaviorXY);
    this.brushElXYOld = this.brushElXY;
    this.brushIs2dBound = true;

    resetD3BrushStyle(
      this.brushElXY,
      stylesTrack['track-range-selection-group-brush-selection'],
    );
  }

  brushedX(event) {
    // Need to reassign variable to check after reset
    const rangeSelectionMoved = this.rangeSelectionMoved;
    this.rangeSelectionMoved = false;

    if (
      !sourceEvent(event) ||
      !this.props.onRangeSelectionX ||
      !this.props.is1dRangeSelection ||
      rangeSelectionMoved
    )
      return;

    this.rangeSelectionTriggeredX = true;
    this.props.onRangeSelectionX(event.selection);
  }

  brushedXEnded(event) {
    const rangeSelectionMovedEnd = this.rangeSelectionMovedEnd;
    this.rangeSelectionMovedEnd = false;

    if (
      !sourceEvent(event) ||
      !this.props.onRangeSelectionX ||
      !this.props.is1dRangeSelection ||
      rangeSelectionMovedEnd
    )
      return;

    this.rangeSelectionTriggeredX = true;
    this.rangeSelectionTriggeredXEnd = true;
    this.props.onRangeSelectionXEnd(event.selection);
  }

  brushedY(event) {
    // Need to reassign variable to check after reset
    const rangeSelectionMoved = this.rangeSelectionMoved;
    this.rangeSelectionMoved = false;

    if (
      !sourceEvent(event) ||
      !this.props.onRangeSelectionY ||
      !this.props.is1dRangeSelection ||
      rangeSelectionMoved
    )
      return;

    this.rangeSelectionTriggeredY = true;
    this.props.onRangeSelectionY(event.selection);
  }

  brushedYEnded(event) {
    const rangeSelectionMovedEnd = this.rangeSelectionMovedEnd;
    this.rangeSelectionMovedEnd = false;

    if (
      !sourceEvent(event) ||
      !this.props.onRangeSelectionY ||
      !this.props.is1dRangeSelection ||
      rangeSelectionMovedEnd
    )
      return;

    this.rangeSelectionTriggeredY = true;
    this.rangeSelectionTriggeredYEnd = true;
    this.props.onRangeSelectionYEnd(event.selection);
  }

  brushedXY(event) {
    // Need to reassign variable to check after reset
    const rangeSelectionMoved = this.rangeSelectionMoved;
    this.rangeSelectionMoved = false;

    if (
      !sourceEvent(event) ||
      !this.props.onRangeSelectionXY ||
      rangeSelectionMoved ||
      this.props.is1dRangeSelection
    )
      return;

    this.rangeSelectionTriggeredXY = true;
    this.props.onRangeSelectionXY([
      [event.selection[0][0], event.selection[1][0]],
      [event.selection[0][1], event.selection[1][1]],
    ]);
  }

  brushedXYEnded(event) {
    if (this.props.is1dRangeSelection) return;

    const rangeSelectionMovedEnd = this.rangeSelectionMovedEnd;
    this.rangeSelectionMovedEnd = false;

    // Brush end event with a selection
    if (
      event.selection &&
      event.sourceEvent &&
      this.props.onRangeSelectionXY &&
      !rangeSelectionMovedEnd
    ) {
      this.rangeSelectionTriggeredXY = true;
      this.rangeSelectionTriggeredXYEnd = true;
      this.props.onRangeSelectionXYEnd([
        [event.selection[0][0], event.selection[1][0]],
        [event.selection[0][1], event.selection[1][1]],
      ]);
    }

    if (!event.selection) {
      this.rangeSelectionTriggeredXY = true;
      this.props.onRangeSelectionReset();
    }
  }

  brushStarted(event) {
    if (!sourceEvent(event)) return;

    this.props.onRangeSelectionStart();
  }

  moveBrushX(rangeSelection, animate = false) {
    if (!this.brushEl) {
      return;
    }

    if (this.brushIs2dBound) {
      this.removeBrush2d();
      this.addBrush1d();
    }

    const relRangeX = rangeSelection
      ? [
          this.props.scaleX(rangeSelection[0]),
          this.props.scaleX(rangeSelection[1]),
        ]
      : null;

    this.rangeSelectionMoved = true;
    this.rangeSelectionMovedEnd = true;

    if (animate) {
      this.brushElX.transition().call(this.brushBehaviorX.move, relRangeX);
    } else {
      this.brushElX.call(this.brushBehaviorX.move, relRangeX);
    }
  }

  moveBrushY(rangeSelection, animate = false) {
    if (!this.brushEl) {
      return;
    }

    if (this.brushIs2dBound) {
      this.removeBrush2d();
      this.addBrush1d();
    }

    const relRangeY = rangeSelection
      ? [
          this.props.scaleY(rangeSelection[0]),
          this.props.scaleY(rangeSelection[1]),
        ]
      : null;

    this.rangeSelectionMoved = true;
    this.rangeSelectionMovedEnd = true;

    if (animate) {
      this.brushElY.transition().call(this.brushBehaviorY.move, relRangeY);
    } else {
      this.brushElY.call(this.brushBehaviorY.move, relRangeY);
    }
  }

  moveBrushXY(rangeSelection, animate = false) {
    if (!this.brushEl) {
      return;
    }

    const relRange = [
      [
        this.props.scaleX(rangeSelection[0][0]),
        this.props.scaleY(rangeSelection[1][0]),
      ],
      [
        this.props.scaleX(rangeSelection[0][1]),
        this.props.scaleY(rangeSelection[1][1]),
      ],
    ];

    this.rangeSelectionMoved = true;
    this.rangeSelectionMovedEnd = true;

    if (animate) {
      this.brushElXY.transition().call(this.brushBehaviorXY.move, relRange);
    } else {
      this.brushElXY.call(this.brushBehaviorXY.move, relRange);
    }
  }

  mouseEnterHandler() {
    if (this.props.isRangeSelectionActive) return;

    this.setState({
      isVisible: true,
    });
  }

  mouseLeaveHandler() {
    this.setState({
      isVisible: false,
    });
  }

  removeBrush1d() {
    if (!this.brushIs1dBound) {
      return;
    }

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
    if (!this.brushIs2dBound) {
      return;
    }

    if (this.brushElXY) {
      // Reset brush selection
      this.brushElXY.call(this.brushBehaviorXY.move, null);

      // Remove brush behavior
      this.brushElXY.on('.brush', null);
      this.brushElXYOld = undefined;

      this.brushIs2dBound = false;

      if (!this.props.is1dRangeSelection) this.props.onRangeSelectionReset();
    }
  }

  /* ------------------------------ Rendering ------------------------------- */

  render() {
    const isBrushable = this.props.tracks
      .map((track) => IS_TRACK_RANGE_SELECTABLE(track))
      .reduce(or, false);

    // Althought the tracks property is an array and could contain more than one
    // track, in practice there is only one combined track.
    const menuClash = this.props.tracks.some((track) => {
      if (track.contents) {
        // if this is a combined track, iterate over children
        return track.contents.some((subTrack) => {
          if (subTrack.type === 'heatmap') {
            return subTrack.options.colorbarPosition === 'topRight';
          }
          return false;
        });
      }
      // if this isn't a combined track, just check if this a heatmap
      // with a topright colorbar
      if (track.type === 'heatmap') {
        return track.options.colorbarPosition === 'topRight';
      }
      return false;
    });

    let rangeSelectorName = 'track-range-selection';
    if (this.props.isRangeSelectionActive) {
      rangeSelectorName += this.props.is1dRangeSelection
        ? '-active-secondary'
        : '-active-primary';
    }

    const rangeSelectorGroup1dClass = clsx(
      !this.props.is1dRangeSelection &&
        stylesTrack['track-range-selection-group-inactive'],
    );

    const rangeSelectorGroup2dClass = clsx(
      this.props.is1dRangeSelection &&
        stylesTrack['track-range-selection-group-inactive'],
    );

    return (
      <div
        className={clsx(this.props.className, styles['center-track'])}
        onMouseEnter={this.mouseEnterHandler.bind(this)}
        onMouseLeave={this.mouseLeaveHandler.bind(this)}
        style={{
          height: this.props.height,
          width: this.props.width,
        }}
      >
        {isBrushable && (
          <svg
            className={stylesTrack[rangeSelectorName]}
            style={{
              height: this.props.height,
              width: this.props.width,
            }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <g
              ref={(el) => {
                this.brushElX = select(el);
              }}
              className={rangeSelectorGroup1dClass}
            />
            <g
              ref={(el) => {
                this.brushElY = select(el);
              }}
              className={rangeSelectorGroup1dClass}
            />
            <g
              ref={(el) => {
                this.brushElXY = select(el);
              }}
              className={rangeSelectorGroup2dClass}
            />
          </svg>
        )}
        {this.props.editable && (
          // show track controls if config menu is visible or
          // mouse is within the bounds of the track
          <TrackControl
            imgStyleAdd={STYLES}
            imgStyleClose={STYLES}
            imgStyleMove={STYLES}
            imgStyleSettings={STYLES}
            isMoveable={false}
            isVisible={
              this.state.isVisible ||
              this.props.uid === this.props.configTrackMenuId
            }
            onAddSeries={this.props.onAddSeries}
            onCloseTrackMenuOpened={this.props.onCloseTrackMenuOpened}
            onConfigTrackMenuOpened={this.props.onConfigTrackMenuOpened}
            paddingRight={menuClash}
            uid={this.props.uid}
          />
        )}
      </div>
    );
  }
}

CenterTrack.defaultProps = {
  className: 'center-track',
  configTrackMenuId: null,
  is1dRangeSelection: false,
  rangeSelectionEnd: PropTypes.bool,
  isRangeSelectionActive: false,
  scaleX: (x) => x,
  scaleY: (x) => x,
};

CenterTrack.propTypes = {
  className: PropTypes.string,
  configTrackMenuId: PropTypes.string,
  editable: PropTypes.bool,
  height: PropTypes.number.isRequired,
  is1dRangeSelection: PropTypes.bool,
  isRangeSelectionActive: PropTypes.bool,
  onAddSeries: PropTypes.func.isRequired,
  onCloseTrackMenuOpened: PropTypes.func.isRequired,
  onConfigTrackMenuOpened: PropTypes.func.isRequired,
  onRangeSelectionX: PropTypes.func.isRequired,
  onRangeSelectionXEnd: PropTypes.func.isRequired,
  onRangeSelectionY: PropTypes.func.isRequired,
  onRangeSelectionYEnd: PropTypes.func.isRequired,
  onRangeSelectionXY: PropTypes.func.isRequired,
  onRangeSelectionXYEnd: PropTypes.func.isRequired,
  onRangeSelectionReset: PropTypes.func.isRequired,
  onRangeSelectionStart: PropTypes.func.isRequired,
  rangeSelection: PropTypes.array.isRequired,
  rangeSelectionEnd: PropTypes.bool,
  scaleX: PropTypes.func,
  scaleY: PropTypes.func,
  tracks: PropTypes.array.isRequired,
  uid: PropTypes.string.isRequired,
  width: PropTypes.number.isRequired,
};

export default CenterTrack;
