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

  render() {
    // color red if not enabled, green if a track is not top and red otherwise
    const background = this.props.enabled && this.state.dragOnTop ? 'green' : 'red';

    const styleNames = this.props.enabled ? 'drag-listening-div-active' : '';

    return (
      <div
        className="DragListeningDiv"
        onDragEnter={() => { this.setState({ dragOnTop: true }); }}
        onDragLeave={() => { this.setState({ dragOnTop: false }); }}
        onDragOver={(evt) => { evt.preventDefault(); }}
        onDrop={() => {
          if (!this.props.enabled) return;

          const evtJson = this.props.draggingHappening;

          const newTrack = {
            type: this.props.defaultTrackType,
            uid: slugid.nice(),
            tilesetUid: evtJson.tilesetUid,
            server: evtJson.server,
          };

          this.props.onTrackDropped(newTrack);
          this.props.pubSub.publish('trackDropped', newTrack);
        }}
        style={Object.assign({
          background,
          opacity: 0.6,
        }, this.props.style)}
        styleName={styleNames}
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
  draggingHappening: PropTypes.object,
  onTrackDropped: PropTypes.func,
  position: PropTypes.string.isRequired,
};

export default withPubSub(DragListeningDiv);
