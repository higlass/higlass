import React from 'react';

import { Modal, Button } from 'react-bootstrap';

import '../styles/TrackOptions.css';

class ExportLinkModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const linkLocation = this.props.linkLocation
      ? (
        <input
          readOnly={true}
          style={{ width: 500 }}
          value={this.props.linkLocation}
        />
      )

      : (<div>
        <span
          aria-hidden="true"
          className="glyphicon glyphicon-refresh glyphicon-refresh-animate"
        />
        <span>&nbsp;&nbsp;We are generating your link...</span>
         </div>
      );

    return (
      <div
        className="modal-container"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: this.props.height,
          width: this.props.width,
        }}
      >

        <Modal
          className="hg-modal"
          container={this}
          onHide={this.props.onDone}
          show={true}
        >
          <Modal.Header closeButton>
            <Modal.Title>Share view link</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {linkLocation}
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.props.onDone}>Done</Button>
          </Modal.Footer>
        </Modal>
      </div>);
  }
}


export default ExportLinkModal;
