import React from 'react';
import slugid from 'slugid';

import { 
  DEFAULT_TRACKS_FOR_DATATYPE,
} from './configs';

export default class DragListeningDiv extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dragOnTop: false,
    }
  }
  render() {
    // color red if not enabled, green if a track is not top
    // and red otherwise
    let background = this.props.enabled ? 
      (this.state.dragOnTop ? 'green' : 'blue') : 'red';

    console.log('position:', this.props.position);

    return (
      <div
        className='DragListeningDiv'
        style={Object.assign({
          background,
          opacity: 0.6,
        }, this.props.style)}
        onDragEnter={e => {
          this.setState({ dragOnTop: true })
        }}
        onDragLeave={e => this.setState({ dragOnTop: false })}
        onDragOver={(evt) => evt.preventDefault()}
        onDrop={(evt) => {
          if (!this.props.enabled) 
            return;

          const evtJson = JSON.parse(evt.dataTransfer.getData('text/json'));

          if (!evtJson.higlassTrack.datatype in DEFAULT_TRACKS_FOR_DATATYPE) {
            console.warn('unknown track type:', evtJson.higlassTrack);
          }

          const defaultTrackType = 
            DEFAULT_TRACKS_FOR_DATATYPE[evtJson.higlassTrack.datatype][this.props.position];

          const newTrack = {
            type: defaultTrackType,
            uid: slugid.nice(),
            tilesetUid: evtJson.higlassTrack.tilesetUid,
            server: evtJson.higlassTrack.server,
          }

          console.log('defaultTrackType', defaultTrackType);
          console.log('on drop', evtJson);
          console.log('newTrack:', newTrack);
          this.props.onTrackDropped(newTrack);
        }}
      >
      </div>
    )
  }
}
