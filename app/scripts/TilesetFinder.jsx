import {json} from 'd3-request';
import {select} from 'd3-selection';
import {dictValues,dictKeys} from './utils.js';

import React from 'react';
import ReactDOM from 'react-dom';
import slugid from 'slugid';
import {tracksInfo,localTracks} from './config.js'

import {Form, Row,Col, FormGroup, ControlLabel, FormControl} from 'react-bootstrap';

export class TilesetFinder extends React.Component {
    constructor(props) {
        super(props);

        //this.localTracks = tracksInfo.filter

        // local tracks are ones that don't have a filetype associated with them
        this.localTracks = tracksInfo
            .filter(x => x.local && !x.hidden)
            .filter(x => x.orientation == this.props.orientation)
            .filter(x => !x.hidden)

        this.localTracks.forEach(x => x.uuid = slugid.nice())

        let newOptions = this.prepareNewEntries('', this.localTracks, {});
        let availableTilesetKeys = Object.keys(newOptions);
        let selectedUuid = availableTilesetKeys.length ? [availableTilesetKeys[0]] : null;

        this.state = {
            selectedUuid: selectedUuid,
            options: newOptions,
            filter: ''
        }

        this.requestTilesetLists();
    }

    serverUidKey(server, uid) {
        /**
         * Create a key for a server and uid
         */
        return server + '/' + uid;

    }

    prepareNewEntries(sourceServer, newEntries, existingOptions) {
        /**
         * Add meta data to new tileset entries before adding
         * them to the list of available options.
         */
        let newOptions = existingOptions;

        let entries = newEntries.map(ne => {
            let ane = Object.assign({}, ne, {
                server: sourceServer,
                tilesetUid: ne.uuid,
                serverUidKey: this.serverUidKey(sourceServer, ne.uuid),
                datatype: ne.datatype,
                name: ne.name,
                uid: slugid.nice()
            });

            return ane;
        });

        entries.forEach(ne => {
            newOptions[ne.serverUidKey] = ne;
        });

        return newOptions;
    }

    componentDidMount() {
        // we want to query for a list of tracks that are compatible with this
        // track orientation


        this.requestTilesetLists();

        let selectedTilesets = [this.state.options[this.state.selectedUuid]];

        if (selectedTilesets)
            this.props.selectedTilesetChanged(selectedTilesets);
    }

    requestTilesetLists() {
        let datatypes = new Set(tracksInfo
                                .filter(x => x.datatype)
                                .filter(x => x.orientation == this.props.orientation)
                                .map(x => x.datatype))
        let datatypesQuery = [...datatypes].map(x => "dt=" + x).join('&')

        this.props.trackSourceServers.forEach( sourceServer => {
            json(sourceServer + '/tilesets/?limit=10000&' + datatypesQuery,
                 function(error, data) {
                    if (error) {
                        console.error('ERROR:', error);
                    } else {

                        let newOptions = this.prepareNewEntries(sourceServer, data.results, this.state.options);
                        let availableTilesetKeys = Object.keys(newOptions);
                        let selectedUuid = this.state.selectedUuid;

                        // if there isn't a selected tileset, select the first received one
                        if (!selectedUuid) {
                            selectedUuid = availableTilesetKeys.length ? [availableTilesetKeys[0]]: null;
                            let selectedTileset = this.state.options[selectedUuid];
                            this.props.selectedTilesetChanged(selectedTileset);
                        }

                        this.setState({
                            selectedUuid: selectedUuid,
                            options: newOptions
                        });
                    }
                }.bind(this));
        });

    }

    handleOptionDoubleClick(x, y) {
        /**
         * Double clicked on an element. Should be selected
         * and this window will be closed.
         */

        // this should give the dataset the PlotType that's selected in the parent
        //this.props.selectedTilesetChanged(this.state.options[x.target.value]);

        let value = this.state.options[x.target.value];
        this.props.onDoubleClick(value);
    }

    handleSelectedOptions(selectedOptions) {
        let selectedValues = [];
        let selectedTilesets = [];


        // I don't know why selectedOptions.map doesn't work
        for (let i = 0; i < selectedOptions.length; i++) {
            selectedValues.push(selectedOptions[i]);
            selectedTilesets.push(this.state.options[selectedOptions[i]]);
        }

        //

        this.props.selectedTilesetChanged(selectedTilesets);

        this.setState({
            selectedUuid: selectedValues
            //selectedUuid: selectedValues
        });
    }

    handleSelect(x) {
        let selectedOptions = ReactDOM.findDOMNode(this.multiSelect).selectedOptions;
        let selectedOptionsList = [];

        for (let selectedOption of selectedOptions)
            selectedOptionsList.push(selectedOption.value);  

        this.handleSelectedOptions(selectedOptionsList);
    }

    handleSearchChange() {
        let domElement = ReactDOM.findDOMNode(this.searchBox);

        this.setState({filter: domElement.value});
    }

    render() {
        let optionsList = [];
        for (let key in this.state.options) {
            optionsList.push(this.state.options[key]);
        }

        // the list of tilesets / tracks available
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
                            autoFocus={true}
                          />
                          <div style={{height: 10}} />
                          </Col>
                          <Col sm={12}>
                          <FormControl componentClass="select" multiple
                            className={"tileset-list"}
                            value={this.state.selectedUuid ? this.state.selectedUuid : ['x']}
                            onChange={this.handleSelect.bind(this)}
                            ref={c => this.multiSelect = c}
                            size={15}
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
