import PropTypes from 'prop-types';
import React from 'react';
import { SortableHandle } from 'react-sortable-hoc';

// Styles
import '../styles/TrackControl.module.scss';

class TrackControl extends React.Component {
  render() {
    let className = this.props.isVisible ?
      'track-control-active' : 'track-control';

    className += this.props.isAlignLeft ?
      ' track-control-left' : '';

    className += this.props.isVertical ?
      ' track-control-vertical' : '';

    className += this.props.paddingRight ?
      ' track-control-padding-right' : '';

    let buttonClassName = 'track-control-button';

    buttonClassName += this.props.isVertical ?
      ' track-control-button-vertical' : '';

    const Handle = SortableHandle(() => (
      <svg
        className="no-zoom"
        style={this.props.imgStyleMove}
        styleName={buttonClassName}
      >
        <use xlinkHref="#move" />
      </svg>
    ));

    return (
      <div styleName={className}>

        {this.props.isMoveable && <Handle />}

        <svg
          ref={(c) => { this.imgConfig = c; }}
          className="no-zoom"
          onClick={() => {
            this.props.onConfigTrackMenuOpened(
              this.props.uid,
              this.imgConfig.getBoundingClientRect()
            );
          }}
          style={this.props.imgStyleSettings}
          styleName={buttonClassName}
        >
          <use xlinkHref="#cog" />
        </svg>

        <svg
          ref={(c) => { this.imgAdd = c; }}
          className="no-zoom"
          onClick={() => this.props.onAddSeries(this.props.uid)}
          style={this.props.imgStyleAdd}
          styleName={buttonClassName}
        >
          <use xlinkHref="#plus" />
        </svg>

        <svg
          ref={(c) => { this.imgClose = c; }}
          className="no-zoom"
          onClick={() => {
            this.props.onCloseTrackMenuOpened(
              this.props.uid,
              this.imgClose.getBoundingClientRect()
            );
          }}
          style={this.props.imgStyleClose}
          styleName={buttonClassName}
        >
          <use xlinkHref="#cross" />
        </svg>
      </div>
    );
  }
}

TrackControl.propTypes = {
  imgStyleAdd: PropTypes.object,
  imgStyleClose: PropTypes.object,
  imgStyleMove: PropTypes.object,
  imgStyleSettings: PropTypes.object,
  isAlignLeft: PropTypes.bool,
  isMoveable: PropTypes.bool,
  isVertical: PropTypes.bool,
  isVisible: PropTypes.bool,
  onConfigTrackMenuOpened: PropTypes.func,
  onCloseTrackMenuOpened: PropTypes.func,
  onAddSeries: PropTypes.func,
  paddingRight: PropTypes.bool,
  uid: PropTypes.string,
};

export default TrackControl;
