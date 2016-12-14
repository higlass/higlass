import React from 'react';
import ReactDOM from 'react-dom';
import {Modal,Button} from 'react-bootstrap';

export class AddTrackModal extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return(<Modal 
                onHide={this.props.handleNoTrackAdded}
                show={this.props.show}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Add Track</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>

                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={this.props.onCancel}>Cancel</Button>
                        <Button onClick={this.props.onTrackChosen}>Submit</Button>
                    </Modal.Footer>
               </Modal>)
    }
}

AddTrackModal.propTypes = {
    show: React.PropTypes.bool,
    onTrackChosen: React.PropTypes.func
}
