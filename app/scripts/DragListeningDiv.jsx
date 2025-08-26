// @ts-nocheck
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';
import slugid from 'slugid';

import withPubSub from './hocs/with-pub-sub';

// Styles
import classes from '../styles/DragListeningDiv.module.scss';

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
    let background = 'red';

    if (this.props.enabled && this.state.dragOnTop) {
      background = 'green';
    } else if (this.props.enabled) {
      background = 'blue';
    }

    return (
      <div
        className={clsx('DragListeningDiv', {
          [classes['drag-listening-div-active']]: this.props.enabled,
        })}
        onClick={this.handleDrop.bind(this)}
        onDragEnter={() => {
          this.setState({ dragOnTop: true });
        }}
        onDragLeave={() => {
          this.setState({ dragOnTop: false });
        }}
        onDragOver={(evt) => {
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
        style={{
          background,
          opacity: 0.6,
          ...this.props.style,
        }}
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
  pubSub: PropTypes.object.isRequired,
};

export default withPubSub(DragListeningDiv);
