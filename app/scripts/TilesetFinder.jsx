import {json} from 'd3-request';
import {dictValues,dictKeys} from './utils.js';

import React from 'react';
import ReactDOM from 'react-dom';
import slugid from 'slugid';

import {Form, Row,Col, FormGroup, ControlLabel, FormControl} from 'react-bootstrap';

export class TilesetFinder extends React.Component {
    constructor(props) {
        super(props);


        this.otherTracks = [
        {
            'category': '1d-axis',
            'uuid': slugid.nice(),
            'name': 'Axis'
        }
        ];


        this.state = {
            selectedUuid: [''],
            options: {},
            filter: ''
        }

        this.server = "52.45.229.11"
    }

    serverUidKey(server, uid) {
        /**
         * Create a key for a server and uid
         */
        return server + '/' + uid;

    }

    addResultsToTrackList(sourceServer, newEntries) {
        /**
         * New results have been received from a server so we 
         * need to update the list of available tracks
         *
         * @param sourceServer (string): The server where we got the list of available tilesets
         * @param newEntries (string): The list of tileset entries retrieved
         */

        if (!newEntries.length)
            return;  // no entries to be added means we can go home early

        let options = this.state.options;

        // add each entry to the list of current options
        // because they're indexed by server/uid combo, existing entries can be overridden
        for (let i = 0; i < newEntries.length; i++) {

            // the category describes what type of data this is... this is in turn describes
            // what types of visualization can be used for it
            if (!('category' in newEntries[i])) {
                if (newEntries[i].file_type == 'hitile')
                    newEntries[i].category = '1d-dense';
                else if (newEntries[i].file_type == 'cooler')
                    newEntries[i].category = '2d-dense';
            }
            newEntries[i].serverUidKey = this.serverUidKey(sourceServer, newEntries[i].uuid);
            options[this.serverUidKey(sourceServer, newEntries[i].uuid)] = newEntries[i];
        }

        console.log('newOptions:', options);
        console.log('newEntries:', newEntries);

        if (!newEntries.length) {
            console.log('no new entries');
            console.log('selectedUuid:', this.state.selectedUuid);
        }

        // if we already had one selected, keep it selected
        // otherwise, select the first one
        let optionsUuidSet = new Set(dictKeys(options))
        let selectedUuid = this.state.selectedUuid;

        if (!optionsUuidSet.has(selectedUuid[0])) {
            // if there's no dataset selected, select the first one
            selectedUuid = [newEntries[0].serverUidKey];
        }

        console.log('options:', options);

        this.props.selectedTilesetChanged(options[selectedUuid]);
        this.setState({
            options: options,
            selectedUuid: selectedUuid
        });

    }

    componentDidMount() {
        json('http://' + this.server + '/tilesets/?t=' + this.props.trackTypeFilter, function(error, data) {
            if (error) {
                console.log('ERROR:', error);
            } else {
                console.log('data:', data);

                this.addResultsToTrackList(this.server, data.results);

            }
        }.bind(this));

        this.addResultsToTrackList('', this.otherTracks);
    }

    trackSelected(itemUid) {
        /**
         * A track has been selected and we need to notify the upstream handler.
         */
        let selectedOption = this.state.options[itemUid];

        console.log('selectedOptions:', selectedOption);

        //this.props.onTrackChosen(x.target.value, this.props.position);
    }

    handleOptionDoubleClick(x, y) {
        /**
         * Double clicked on an element. Should be selected
         * and this window will be closed.
         */
    }

    handleSelect(x) {
        console.log('setting selectedUuid:', x.target.value);

        this.props.selectedTilesetChanged(x.target.value);
        let selectedSeries = this.state.options[x.target.value];

        let newTrack = {'uid': slugid.nice(), 
                    category: selectedSeries.category,
                    tilesetUid: selectedSeries.uuid,
                    server: this.server
        }

        this.setState({
            selectedUuid: [x.target.value]
        });
    }

    handleSearchChange() {
        let domElement = ReactDOM.findDOMNode(this.searchBox);

        this.setState({filter: domElement.value});
        //console.log('search changed', domElement.value);
    }

    render() {
        let optionsList = [];
        for (let key in this.state.options) {
            optionsList.push(this.state.options[key]);
        }

        let options = optionsList
            .filter(x => x.name.toLowerCase().includes(this.state.filter))
            .map(x=> {
                    return <option 
                            onDoubleClick={this.handleOptionDoubleClick.bind(this)}
                            key={x.serverUidKey}
                            value={x.serverUidKey}>
                                {x.name}
                            </option>
        });

        //console.log('options:', options, 'selectedUuid:', this.state.selectedUuid);

        let form = (
                <Form 
                    horizontal
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
