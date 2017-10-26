import PropTypes from 'prop-types';
import React from 'react';
import { brush, brushX, brushY } from 'd3-brush';
import { select, event } from 'd3-selection';

import TrackControl from './TrackControl';

// Utils
import { genomeLociToPixels, or } from './utils';

// Configs
import { IS_TRACK_RANGE_SELECTABLE } from './configs';

// Styles
import styles from '../styles/CenterTrack.module.scss'; // eslint-disable-line no-unused-vars
import stylesTrack from '../styles/Track.module.scss'; // eslint-disable-line no-unused-vars

const STYLES = {
  pointerEvents: 'all',
};

export class CenterTrack extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isVisible: false,
    };

    this.brushBehaviorX = brushX(true, true)
      .on('brush', this.brushedX.bind(this));

    this.brushBehaviorY = brushY(true, true, true)
      .on('brush', this.brushedY.bind(this));

    this.brushBehaviorXY = brush(true)
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
      return this.state !== nextState;
    } else if (this.props.rangeSelection !== nextProps.rangeSelection) {
      const dim1 = nextProps.rangeSelection[0] ? genomeLociToPixels(
        nextProps.rangeSelection[0], this.props.chromInfo,
      ) : null;

      if (this.props.chromInfo) {
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
                nextProps.rangeSelection[1], this.props.chromInfo,
              ),
            ],
          );
        }
      }

      const isUnset = this.props.is1dRangeSelection && !nextProps.is1dRangeSelection && dim1 === null;

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
      !this.brushElY || (
        this.brushElXOld === this.brushElX &&
        this.brushElYOld === this.brushElY
      )
    ) { return; }

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

    this.brushElXOld = this.brushElX;
    this.brushElYOld = this.brushElY;

    this.brushIs1dBound = true;
  }

  addBrush2d() {
    if (!this.brushElXY || this.brushElXYOld === this.brushElXY) { return; }

    if (this.brushElXYOld) {
      // Remove event listener on old element to avoid memory leaks
      this.brushElXYOld.on('.brush', null);
    }

    this.brushElXY.call(this.brushBehaviorXY);
    this.brushElXYOld = this.brushElXY;
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
      [event.selection[0][1], event.selection[1][1]],
    ]);
  }

  brushedXYEnded() {
    if (!event.selection && !this.props.is1dRangeSelection) {
      this.rangeSelectionTriggeredXY = true;
      this.props.onRangeSelectionEnd();
    }
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

    const relRangeX = rangeSelection ? [
      this.props.scaleX(rangeSelection[0]),
      this.props.scaleX(rangeSelection[1]),
    ] : null;

    this.rangeSelectionMoved = true;
    this.brushElX.call(this.brushBehaviorX.move, relRangeX);
  }

  moveBrushY(rangeSelection) {
    if (!this.brushEl && !event.sourceEvent) { return; }

    if (this.brushIs2dBound) {
      this.removeBrush2d();
      this.addBrush1d();
    }

    const relRangeY = rangeSelection ? [
      this.props.scaleY(rangeSelection[0]),
      this.props.scaleY(rangeSelection[1]),
    ] : null;

    this.rangeSelectionMoved = true;
    this.brushElY.call(this.brushBehaviorY.move, relRangeY);
  }

  moveBrushXY(rangeSelection) {
    if (!this.brushEl && !event.sourceEvent) { return; }

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
    this.brushElXY.call(this.brushBehaviorXY.move, relRange);
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
      this.brushElXYOld = undefined;

      this.brushIs2dBound = false;

      !this.props.is1dRangeSelection && this.props.onRangeSelectionEnd();
    }
  }

  /* ------------------------------ Rendering ------------------------------- */

  render() {
    const isBrushable = this.props.tracks
      .map(track => IS_TRACK_RANGE_SELECTABLE(track))
      .reduce(or, false);

    // Althought the tracks property is an array and could contain more than one
    // track, in practice there is only one combined track.
    const menuClash = this.props.tracks[0].contents
      .some((track) => {
        if (track.type === 'heatmap') {
          return track.options.colorbarPosition === 'topRight';
        }
        return false;
      });

    const rangeSelectorClass = this.props.isRangeSelectionActive ? (
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
          width: this.props.width,
        }}
        styleName="styles.center-track"
      >
        {isBrushable &&
          <svg
            style={{
              height: this.props.height,
              width: this.props.width,
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
  isRangeSelectionActive: PropTypes.bool,
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
  width: PropTypes.number,
};

export default CenterTrack;
