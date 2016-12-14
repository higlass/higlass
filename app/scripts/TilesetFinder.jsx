import {json} from 'd3-request';

import React from 'react';
import ReactDOM from 'react-dom';

import {FormGroup, ControlLabel, FormControl} from 'react-bootstrap';

export class TilesetFinder extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
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
                this.setState({options: data});
            }
        }.bind(this));
    }

    handleOptionDoubleClick(x, y) {
        /**
         * Double clicked on an element. Should be selected
         * and this window will be closed.
         */
        this.props.onTrackChosen(x.target.value);
    }

    handleSelect(x) {

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
                return <option 
                        onDoubleClick={this.handleOptionDoubleClick.bind(this)}
                        onSelect={this.handleSelect.bind(this)}
                        key={x.uuid}
                        value={x.uuid}>
                            {x.name}
                        </option>
            });
        }

        console.log('options:', options);

        let form = (
                    <div>
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
                    </div>
                )

        return(
                <div>
                    {form}
                </div>
                )
    }
}
