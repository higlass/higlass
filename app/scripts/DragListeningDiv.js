import React from 'react';
import slugid from 'slugid';

export default class DragListeningDiv extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dragOnTop: false,
    }
  }
  render() {
    return (
      <div
        className='DragListeningDiv'
        style={Object.assign({
          background: this.state.dragOnTop ? 'green' : 'blue',
          opacity: 0.6,
        }, this.props.style)}
        onDragEnter={e => {
          console.log('dld dragEnter');
          this.setState({ dragOnTop: true })
        }}
        onDragLeave={e => this.setState({ dragOnTop: false })}
        onDragOver={(evt) => evt.preventDefault()}
        onDrop={(evt) => {
          const evtJson = JSON.parse(evt.dataTransfer.getData('text/json'));

          console.log('on drop', evtJson);
          console.log('this.props.onTrackDropped', this.props.onTrackDropped);
          evtJson.higlassTrack.uid = slugid.nice();
          this.props.onTrackDropped(evtJson.higlassTrack);
        }}
      >
      </div>
    )
  }
}
