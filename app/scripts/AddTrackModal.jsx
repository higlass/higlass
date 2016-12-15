import '../styles/AddTrackModal.css';
import React from 'react';
import ReactDOM from 'react-dom';
import {Modal,Button,FormGroup,FormControl,ControlLabel,HelpBlock} from 'react-bootstrap';
import {Form, Panel,Checkbox, Collapse} from 'react-bootstrap';
import CollapsePanel from './CollapsePanel.jsx';
import {TilesetFinder} from './TilesetFinder.jsx';

export class AddTrackModal extends React.Component {
    constructor(props) {
        super(props);

        console.log('props', props);
        this.state = {
            options: {},
            advancedVisible: false
        }
    }


    componentDidMount() {

    }

    normalizeCheckboxChanged(e) {
        let domElement = ReactDOM.findDOMNode(this.normalizeCheckbox);

        this.setState({
            normalizeChecked: e.target.checked
        });
    }

    toggleAdvancedVisible() {
        this.setState({
            advancedVisible: !this.state.advancedVisible
        });
    }

    render() {
        let filetype = '';

        if (this.props.position == 'top' ||
            this.props.position == 'left' ||
            this.props.position == 'right' ||
            this.props.position == 'bottom')
            filetype = 'hitile'
        else
            filetype = 'cooler'



        let form = (
                <div>
                            <TilesetFinder
                                trackTypeFilter={filetype}
                                onTrackChosen={value => this.props.onTrackChosen(value, this.props.position)}
                            />
                            <CollapsePanel
                                collapsed={this.state.advancedVisible} 
                                toggleCollapse={this.toggleAdvancedVisible.bind(this)}
                            >
                                <Checkbox
                                    ref={c => this.normalizeCheckbox = c } 
                                    onChange={ this.normalizeCheckboxChanged.bind(this) }
                                >
                                Normalize By
                                </Checkbox>

                                <Collapse in={this.state.normalizeChecked}>
                                    <Panel>
                                        <TilesetFinder
                                            trackTypeFilter={filetype}
                                            onTrackChosen={value => this.props.onTrackChosen(value, this.props.position)}
                                        />
                                    </Panel>
                                </Collapse>

                            </CollapsePanel>
                    </div>
                )

        return(<Modal 
                onHide={this.props.handleNoTrackAdded}
                show={this.props.show}
                >
                    <Modal.Header closeButton>
                    <Modal.Title>Add Track</Modal.Title> 
                    </Modal.Header>
                    <Modal.Body>
                        { form }
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
