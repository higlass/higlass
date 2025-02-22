import PropTypes from 'prop-types';
import React from 'react';
import slugid from 'slugid';

import withPubSub from './hocs/with-pub-sub';

// Styles
import '../styles/DragListeningDiv.module.scss';

class DragListeningDiv extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dragOnTop: false,
    };
  }

  handleDrop() {
    if (!this.props.enabled) return;

    const evtJson = this.props.draggingHappening;

    const newTrack = {
      type: this.props.defaultTrackType,
      uid: slugid.nice(),
    };

    if (evtJson.tilesetUid && evtJson.server) {
      newTrack.tilesetUid = evtJson.tilesetUid;
      newTrack.server = evtJson.server;
    }

    if (evtJson.data) {
      newTrack.data = evtJson.data;
    }

    this.props.onTrackDropped(newTrack);
    this.props.pubSub.publish('trackDropped', newTrack);
  }

  render() {
    // color red if not enabled, green if a track is not top and blue otherwise
    let styleNames = '';

    if (this.props.enabled && this.state.dragOnTop) {
      styleNames = 'drag-listening-div-active';
    } else if (this.props.enabled) {
      styleNames = 'drag-listening-div-inactive';
    }

    return (
      <div
        className="DragListeningDiv"
        onClick={this.handleDrop.bind(this)}
        onDragEnter={() => {
          this.setState({ dragOnTop: true });
        }}
        onDragLeave={() => {
          this.setState({ dragOnTop: false });
        }}
        onDragOver={evt => {
          evt.preventDefault();
        }}
        onDrop={this.handleDrop.bind(this)}
        onMouseEnter={() => {
          this.setState({
            dragOnTop: true,
          });
        }}
        onMouseLeave={() => {
          this.setState({
            dragOnTop: false,
          });
        }}
        style={this.props.style}
        styleName={`${styleNames} drag-listening-div`}
      />
    );
  }
}

DragListeningDiv.defaultProps = {
  enabled: false,
  style: {},
  draggingHappening: {},
  onTrackDropped: () => {},
};

DragListeningDiv.propTypes = {
  enabled: PropTypes.bool,
  style: PropTypes.object,
  defaultTrackType: PropTypes.object,
  draggingHappening: PropTypes.object,
  onTrackDropped: PropTypes.func,
  position: PropTypes.string.isRequired,
};

export default withPubSub(DragListeningDiv);
