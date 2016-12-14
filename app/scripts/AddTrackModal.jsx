import {json} from 'd3-request';
import React from 'react';
import ReactDOM from 'react-dom';
import {Modal,Button,FormGroup,FormControl,ControlLabel,HelpBlock} from 'react-bootstrap';

export class AddTrackModal extends React.Component {
    constructor(props) {
        super(props);

        console.log('props', props);
        this.state = {
            options: {},
            filter: ''
        }
    }

    handleSearchChange() {
        let domElement = ReactDOM.findDOMNode(this.searchBox);

        this.setState({filter: domElement.value});
        //console.log('search changed', domElement.value);
    }

    componentDidMount() {
        let filetype = '';

        if (this.props.position == 'top' ||
            this.props.position == 'left' ||
            this.props.position == 'right' ||
            this.props.position == 'bottom')
            filetype = 'hitile'
        else
            filetype = 'cooler'


        json('http://52.45.229.11/tilesets/?t=' + filetype, function(error, data) {
            if (error) {
                console.log('ERROR:', error);
            } else {
                console.log('data:', data);
                this.setState({options: data});
            }
        }.bind(this));
    }

    handleOptionDoubleClick(x, y) {
        /**
         * Double clicked on an element. Should be selected
         * and this window will be closed.
         */
        this.props.onTrackChosen(x.target.value, this.props.position);
    }

    handleSelect(x) {
        console.log('select:', x);
    }

    render() {

        let options = null;

        if ('results' in this.state.options) {
            options = this.state.options.results
                .filter(x => x.name.toLowerCase().includes(this.state.filter))
                .map(x=> {
                console.log('x.uid:', x.uuid);
                return <option 
                        onDoubleClick={this.handleOptionDoubleClick.bind(this)}
                        onSelect={this.handleSelect.bind(this)}
                        key={x.uuid}
                        value={x.uuid}>
                            {x.name}
                        </option>
            });
        }

        let form = (
                    <form>
                        <FormGroup controlId={'formControlsTest'}>
                          <ControlLabel>{"Search Term"}</ControlLabel>
                          <FormControl 
                            placeholder="Search Term"
                            ref={(c) => { this.searchBox = c; }}
                            onChange={this.handleSearchChange.bind(this)}
                          />
                        </FormGroup>
                        <FormGroup controlId="formControlsSelectMultiple">
                          <ControlLabel>Matching tilesets</ControlLabel>
                          <FormControl componentClass="select" multiple>
                            {options}
                          </FormControl>
                        </FormGroup>
                    </form>
                )

        return(<Modal 
                onHide={this.props.handleNoTrackAdded}
                show={this.props.show}
                >
                    <Modal.Header closeButton>
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
