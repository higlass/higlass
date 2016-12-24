import {json} from 'd3-request';
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
            .filter(x => !x.filetype)
            .filter(x => x.orientation == this.props.orientation)

        this.localTracks.forEach(x => x.uuid = slugid.nice())

        let newOptions = this.prepareNewEntries('', this.localTracks, {});
        let availableTilesetKeys = Object.keys(newOptions);

        this.state = {
            selectedUuid: [availableTilesetKeys[0]],
            options: newOptions,
            filter: ''
        }

        this.servers = ['localhost:8000']
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
            return {
                server: sourceServer,
                tilesetUid: ne.uuid,
                serverUidKey: this.serverUidKey(sourceServer, ne.uuid),
                datatype: ne.datatype,
                name: ne.name,
                uid: slugid.nice()
            }
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
        this.props.selectedTilesetChanged(this.state.options[this.state.selectedUuid]);
    }

    requestTilesetLists() {
        let datatypes = new Set(tracksInfo
                                .filter(x => x.datatype)
                                .filter(x => x.orientation == this.props.orientation)
                                .map(x => x.datatype))
        let datatypesQuery = [...datatypes].map(x => "dt=" + x).join('&')
        console.log(datatypesQuery);

        this.servers.forEach( sourceServer => {
            json('//' + sourceServer + '/tilesets/?' + datatypesQuery, 
                 function(error, data) {
                    if (error) {
                        console.log('ERROR:', error);
                    } else {
                        console.log('data:', data);

                        let newOptions = this.prepareNewEntries(sourceServer, data.results, this.state.options);
                        this.setState({
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
        this.props.onDoubleClick(this.state.options[x.target.value]);
    }

    handleSelect(x) {
        this.props.selectedTilesetChanged(this.state.options[x.target.value]);

        this.setState({
            selectedUuid: [x.target.value]
        });
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
