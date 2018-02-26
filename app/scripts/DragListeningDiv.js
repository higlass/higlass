import React from 'react';
import slugid from 'slugid';

import { pubSub } from './services';

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
    console.log('dldr');

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
          }

          this.props.onTrackDropped(newTrack);
          pubSub.publish('trackDropped', newTrack);
        }}
      >
      </div>
    )
  }
}
