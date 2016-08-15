import "../styles/HiGlassInput.css";
import React from 'react';
import ReactDOM from 'react-dom';
import {Button, Panel, FormGroup, ControlLabel, FormControl, SafeAnchor} from 'react-bootstrap';

export class HiGlassInput extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            inputOpen : false
        }
    }

    handleSubmit(event) {
        event.preventDefault();

        let configText = ReactDOM.findDOMNode(this.refs.textConfigInput).value;

        this.props.onNewConfig(configText);
    }

    render() {
        return (
                <div>
                <Panel bsSize={'small'}
                    collapsible
                    className="higlass-edit-panel"
                    expanded={this.state.inputOpen}
                >
                <form onSubmit={this.handleSubmit.bind(this)}>
                   <FormGroup controlId="formControlsTextarea">
                         <ControlLabel>Track configuration</ControlLabel>
                               <FormControl 
                                 componentClass="textarea" rows={5} 
                                 defaultValue={this.props.currentConfig} 
                                 ref='textConfigInput' 
                                />

                                   </FormGroup>
                        <Button
                            className="pull-right"
                            bsStyle="primary"
                            type="submit"
                    >Submit</Button>
                    </form>
                </Panel>
                <SafeAnchor className='edit-higlass' onClick= { () => this.setState({ inputOpen: !this.state.inputOpen })}>Edit</SafeAnchor>
                </div>


               );
    }
}
