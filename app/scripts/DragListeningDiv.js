import React from 'react';

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
      >
      </div>
    )
  }
}
