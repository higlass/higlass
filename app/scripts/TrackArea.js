import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import { SortableHandle } from 'react-sortable-hoc';

export class TrackArea extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      controlsVisible: false
    }
  }

  shouldComponentUpdate() {
    return ! this.resizing;
  }

  handleMouseEnter() {
    this.setState({
      controlsVisible: true
    });
  }

  handleMouseLeave() {
    this.setState({
      controlsVisible: false
    });
  }

  handleMouseMove() {
    this.setState({
      controlsVisible: true
    });

  }

  getControls() {
    let Handle = null;

    if (this.moveable) {
      Handle = SortableHandle(() => (
        <svg
          className="no-zoom"
          height="10px"
          onClick={() => {}}
          style={this.getMoveImgStyle()}
          width="10px"
        >
          <use xlinkHref="#move"></use>
        </svg>
      ));
    } else {
      Handle = SortableHandle(() => <div />)
    }

    let controls = (
      <div
        style={{
          position: 'absolute',
          backgroundColor: 'rgba(255,255,255,0.7)',
          right: '3px',
          top: '3px',
          pointerEvents: 'none',
          paddingLeft: '5px',
          paddingRight: '5px',
          borderRadius: '5px',
          border: '1px solid #dddddd'
        }}
      >
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
          style={this.getSettingsImgStyle()}
          width="10px"
        >
          <use xlinkHref="#cog"></use>
        </svg>

        <svg
          className="no-zoom"
          height="10px"
          onClick={() => this.props.onAddSeries(this.props.uid)}
          ref={(c) => { this.imgAdd = c; }}
          style={this.getAddImgStyle()}
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
          style={this.getCloseImgStyle()}
          width="10px"
        >
          <use xlinkHref="#cross"></use>
        </svg>
      </div>
    );

    return controls;
  }
}

TrackArea.propTypes = {
  onConfigTrackMenuOpened: PropTypes.func,
  onCloseTrackMenuOpened: PropTypes.func,
  onAddSeries: PropTypes.func,
  uid: PropTypes.string
};

export default TrackArea;
