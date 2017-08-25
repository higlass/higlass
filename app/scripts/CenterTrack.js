import PropTypes from 'prop-types';
import React from 'react';

import TrackControl from './TrackControl';

// Styles
import '../styles/CenterTrack.scss';

const STYLE = {
  opacity: .7,
  pointerEvents: 'all',
  position: 'relative'
};

const EXTENDED_STYLE = Object.assign({}, STYLE, {
  marginRight: '5px'
})

export default class CenterTrack extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isVisible: false
    };
  }

  /* -------------------------- Life Cycle Methods -------------------------- */

  /* ---------------------------- Custom Methods ---------------------------- */

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

  /* ------------------------------ Rendering ------------------------------- */

  render() {
    let classNames = 'center-track';

    classNames += this.props.className ? ` ${this.props.className}`: '';

    return (
      <div
        className={classNames}
        onMouseEnter={this.mouseEnterHandler.bind(this)}
        onMouseLeave={this.mouseLeaveHandler.bind(this)}
        style={{
          height: this.props.height,
          width: this.props.width
        }}
        styleName={classNames}
      >
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
    )
  }
}

CenterTrack.propTypes = {
  chromInfo: PropTypes.object,
  className: PropTypes.string,
  editable: PropTypes.bool,
  height: PropTypes.number,
  onAddSeries: PropTypes.func,
  onCloseTrackMenuOpened: PropTypes.func,
  onConfigTrackMenuOpened: PropTypes.func,
  onRangeSelection: PropTypes.func,
  rangeSelection: PropTypes.array,
  uid: PropTypes.string,
  width: PropTypes.number
}
