import React from 'react';
import ReactDOM from 'react-dom';

import {Modal,Button,FormGroup,FormControl,ControlLabel,HelpBlock} from 'react-bootstrap';

export class HeatmapOptions extends React.Component {
    constructor(props) {
        super(props);
        // props should include the definition of the heatmap data series

    }

    handleSubmit() {

    }

    render() {
        return(<Modal 
                onHide={this.props.handleCancel}
                show={true}
                >
                    <Modal.Header closeButton>
                    <Modal.Title>{'Heatmap Options'}</Modal.Title> 
                    </Modal.Header>
                    <Modal.Body>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={this.props.onCancel}>Cancel</Button>
                        <Button onClick={this.handleSubmit.bind(this)}>Submit</Button>
                    </Modal.Footer>
               </Modal>)

    }
}
