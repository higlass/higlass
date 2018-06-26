import PropTypes from 'prop-types';
import React from 'react';
import slugid from 'slugid';

import { pubSub } from './services';

import {
  DEFAULT_TRACKS_FOR_DATATYPE,
} from './configs';

// Styles
import '../styles/DragListeningDiv.module.scss';

export default class DragListeningDiv extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dragOnTop: false,
    };
  }

  render() {
    // color red if not enabled, green if a track is not top
    // and red otherwise
    const background = this.props.enabled ?
      (this.state.dragOnTop ? 'green' : 'blue') : 'red';

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

          if (!evtJson.datatype in DEFAULT_TRACKS_FOR_DATATYPE) {
            console.warn('unknown track type:', evtJson);
          }

          const defaultTrackType =
            DEFAULT_TRACKS_FOR_DATATYPE[evtJson.datatype][this.props.position];

          const newTrack = {
            type: defaultTrackType,
            uid: slugid.nice(),
            tilesetUid: evtJson.tilesetUid,
            server: evtJson.server,
          };

          this.props.onTrackDropped(newTrack);
          pubSub.publish('trackDropped', newTrack);
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
  style: PropTypes.obj,
  draggingHappening: PropTypes.obj,
  onTrackDropped: PropTypes.func,
  position: PropTypes.string.isRequired,
};
