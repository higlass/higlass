import {json} from 'd3-request';

import React from 'react';
import ReactDOM from 'react-dom';

import {Form, Row,Col, FormGroup, ControlLabel, FormControl} from 'react-bootstrap';

export class TilesetFinder extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            selectedUuid: [''],
            options: {},
            filter: ''
        }
    }

    componentDidMount() {
        json('http://52.45.229.11/tilesets/?t=' + this.props.trackTypeFilter, function(error, data) {
            if (error) {
                console.log('ERROR:', error);
            } else {
                console.log('data:', data);
                let selectedUuid = this.state.selectedUuid;



                if ('results' in data && data.results.length) {
                    let returnedUuidSet = new Set(data.results.map(x => x.uuid));

                    if (!returnedUuidSet.has(selectedUuid)) {
                        // if there's no dataset selected, select the first one
                        selectedUuid = [data.results[0].uuid];
                    }
                }
                this.setState({
                    options: data,
                    selectedUuid: selectedUuid
                });
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
        console.log('setting selectedUuid:', x.target.value);

        this.setState({
            selectedUuid: x.target.value
        });
    }

    handleSearchChange() {
        let domElement = ReactDOM.findDOMNode(this.searchBox);

        this.setState({filter: domElement.value});
        //console.log('search changed', domElement.value);
    }

    render() {
        let options = null;

        if ('results' in this.state.options) {
            options = this.state.options.results
                .filter(x => x.name.toLowerCase().includes(this.state.filter))
                .map(x=> {
                    if (x.uuid == this.state.selectedUuid) 
                        return <option 
                                onDoubleClick={this.handleOptionDoubleClick.bind(this)}
                                key={x.uuid}
                                value={x.uuid}>
                                    {x.name}
                                </option>
            });
        }

        let form = (
                <Form horizontal
                >
                    <FormGroup
                    
                    >
                          <Col sm={3}>
                          <ControlLabel>{"Select tileset"}</ControlLabel>
                          </Col>
                          <Col smOffset={5} sm={4}>
                          <FormControl 
                            placeholder="Search Term"
                            ref={(c) => { this.searchBox = c; }}
                            onChange={this.handleSearchChange.bind(this)}
                          />
                          <div style={{height: 10}} />
                          </Col>
                          <Col sm={12}>
                          <FormControl componentClass="select" multiple
                          value={this.state.selectedUuid}
                            onChange={this.handleSelect.bind(this)}
                          >
                            {options}
                          </FormControl>
                            </Col>
                          </FormGroup>
                        </Form>
                )

        return(
                <div>
                    {form}
                </div>
                )
    }
}
