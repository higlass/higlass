import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import { SortableHandle } from 'react-sortable-hoc';

// Styles
import '../styles/TrackControl.scss';

export class TrackControl extends React.Component {
  render() {
    let Handle = null;

    if (this.props.isMoveable) {
      Handle = SortableHandle(() => (
        <svg
          className="no-zoom"
          height="10px"
          onClick={() => {}}
          style={this.props.imgStyleMove}
          width="10px"
        >
          <use xlinkHref="#move"></use>
        </svg>
      ));
    } else {
      Handle = SortableHandle(() => <div />)
    }

    const className = this.props.isVisible ?
      'track-control-active' : 'track-control';

    return (
      <div styleName={className}>
        <Handle />

        <svg
          className="no-zoom"
          height="10px"
          onClick={() => {
            let imgDom = ReactDOM.findDOMNode(this.imgConfig);
            let bbox = imgDom.getBoundingClientRect();
            this.props.onConfigTrackMenuOpened(this.props.uid, bbox);
          }}
          ref={(c) => { this.imgConfig = c; }}
          style={this.props.imgStyleSettings}
          width="10px"
        >
          <use xlinkHref="#cog"></use>
        </svg>

        <svg
          className="no-zoom"
          height="10px"
          onClick={() => this.props.onAddSeries(this.props.uid)}
          ref={(c) => { this.imgAdd = c; }}
          style={this.props.imgStyleAdd}
          width="10px"
        >
          <use xlinkHref="#plus"></use>
        </svg>

        <svg
          className="no-zoom"
          height="10px"
          onClick={() => {
            let imgDom = ReactDOM.findDOMNode(this.imgClose);
            let bbox = imgDom.getBoundingClientRect();
            this.props.onCloseTrackMenuOpened(this.props.uid, bbox);
          }}
          ref={(c) => { this.imgClose = c; }}
          style={this.props.imgStyleClose}
          width="10px"
        >
          <use xlinkHref="#cross"></use>
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
  isMoveable: PropTypes.bool,
  isVisible: PropTypes.bool,
  onConfigTrackMenuOpened: PropTypes.func,
  onCloseTrackMenuOpened: PropTypes.func,
  onAddSeries: PropTypes.func,
  uid: PropTypes.string
};

export default TrackControl;
