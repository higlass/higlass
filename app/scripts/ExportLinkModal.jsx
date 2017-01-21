import '../styles/TrackOptions.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { CompactPicker } from 'react-color';
import SketchInlinePicker from './SketchInlinePicker.jsx';
import slugid from 'slugid';

import {Modal,Button,FormGroup,FormControl,ControlLabel,HelpBlock} from 'react-bootstrap';

export class ExportLinkModal extends React.Component {
    constructor(props) {
        super(props);
        // props should include the definition of the heatmap data series
        
        
        this.state = {
            
        }

    }

    render() {
        let linkLocation = this.props.linkLocation ?
            (<input 
                style={{width: "100%"}}
                value={this.props.linkLocation}
                readOnly={true}
             />) :

            //
            (<div>
                <span className="glyphicon glyphicon-refresh glyphicon-refresh-animate" aria-hidden="true">
                </span>
                <span>&nbsp;&nbsp;We are generating your link...</span>
             </div>
             )

        //
        return(
                <div
                    className="modal-container"
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        height: this.props.height,
                        width: this.props.width
                    }}
                >

                    <Modal 
                    onHide={this.props.handleCancel}
                    container={this}
                    className={'hg-modal'}
                    show={true}
                    >
                        <Modal.Header closeButton>
                        <Modal.Title>{'Share view link'}</Modal.Title> 
                        </Modal.Header>
                        <Modal.Body>
                            {linkLocation}
                        </Modal.Body>
                        <Modal.Footer>
                            <Button onClick={this.props.onDone}>Done</Button>
                        </Modal.Footer>
                   </Modal>
            </div>)
    }
}
