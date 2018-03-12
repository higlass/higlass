import { tileProxy } from './services';

import React from 'react';
import {
  Col,
  ControlLabel,
  Form,
  FormControl,
  FormGroup,
} from 'react-bootstrap';
import ReactDOM from 'react-dom';
import slugid from 'slugid';

// Configs
import { TRACKS_INFO } from './configs';

export class TilesetFinder extends React.Component {
  constructor(props) {
    super(props);

    // this.localTracks = TRACKS_INFO.filter

    // local tracks are ones that don't have a filetype associated with them
    this.localTracks = TRACKS_INFO
      .filter(x => x.local && !x.hidden)

    if (props.datatype)
      this.localTracks = this.localTracks.filter(x => x.datatype[0] == props.datatype);
    else
      this.localTracks = this.localTracks.filter(x => x.orientation == this.props.orientation);


    this.localTracks.forEach(x => x.uuid = slugid.nice());

    const newOptions = this.prepareNewEntries('', this.localTracks, {});
    const availableTilesetKeys = Object.keys(newOptions);
    const selectedUuid = availableTilesetKeys.length ? [availableTilesetKeys[0]] : null;
    this.mounted = false;

    this.state = {
      selectedUuid,
      options: newOptions,
      filter: '',
    };

    this.requestTilesetLists();
  }

  serverUidKey(server, uid) {
    /**
         * Create a key for a server and uid
         */
    return `${server}/${uid}`;
  }

  prepareNewEntries(sourceServer, newEntries, existingOptions) {
    /**
         * Add meta data to new tileset entries before adding
         * them to the list of available options.
         */
    const newOptions = existingOptions;

    const entries = newEntries.map((ne) => {
      const ane = Object.assign({}, ne, {
        server: sourceServer,
        tilesetUid: ne.uuid,
        serverUidKey: this.serverUidKey(sourceServer, ne.uuid),
        datatype: ne.datatype,
        name: ne.name,
        uid: slugid.nice(),
      });

      return ane;
    });

    entries.forEach((ne) => {
      newOptions[ne.serverUidKey] = ne;
    });

    return newOptions;
  }

  componentDidMount() {
    // we want to query for a list of tracks that are compatible with this
    // track orientation

    this.mounted = true;

    this.requestTilesetLists();

    if (!this.state.selectedUuid)
      return;

    const selectedTilesets = [this.state.options[this.state.selectedUuid]];
    console.log('selectedTilesets', selectedTilesets);

    if (selectedTilesets) { this.props.selectedTilesetChanged(selectedTilesets); }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  requestTilesetLists() {
    let datatypesQuery = null;

    if (this.props.datatype) {
      datatypesQuery = `dt=${this.props.datatype}`;
    } else {
      const datatypes = new Set(TRACKS_INFO
        .filter(x => x.datatype)
        .filter(x => x.orientation == this.props.orientation)
        .map(x => x.datatype));

      datatypesQuery = [...datatypes].map(x => `dt=${x}`).join('&');
    }

    console.log('dt:', datatypesQuery);

    if (!this.props.trackSourceServers) {
      console.warn("No track source servers specified in the viewconf");
      return;
    }

    this.props.trackSourceServers.forEach((sourceServer) => {
      tileProxy.json(`${sourceServer}/tilesets/?limit=10000&${datatypesQuery}`,
        (error, data) => {
          if (error) {
            console.error('ERROR:', error);
          } else {
            const newOptions = this.prepareNewEntries(sourceServer, data.results, this.state.options);
            console.log('newOptions:', newOptions, 'data:', data);
            const availableTilesetKeys = Object.keys(newOptions);
            let selectedUuid = this.state.selectedUuid;

            // if there isn't a selected tileset, select the first received one
            if (!selectedUuid) {
              selectedUuid = availableTilesetKeys.length ? [availableTilesetKeys[0]] : null;
              const selectedTileset = this.state.options[selectedUuid[0]];
              this.props.selectedTilesetChanged([selectedTileset]);
            }

            if (this.mounted) {
              this.setState({
                selectedUuid,
                options: newOptions,
              });
            }
          }
        });
    });
  }

  handleOptionDoubleClick(x, y) {
    /**
         * Double clicked on an element. Should be selected
         * and this window will be closed.
         */

    // this should give the dataset the PlotType that's selected in the parent
    // this.props.selectedTilesetChanged(this.state.options[x.target.value]);

    // console.log('x.target.value:', x.target.value);

    const value = this.state.options[x.target.value];
    this.props.onDoubleClick(value);
  }

  handleSelectedOptions(selectedOptions) {
    const selectedValues = [];
    const selectedTilesets = [];

    // I don't know why selectedOptions.map doesn't work
    for (let i = 0; i < selectedOptions.length; i++) {
      selectedValues.push(selectedOptions[i]);
      selectedTilesets.push(this.state.options[selectedOptions[i]]);
    }


    //

    this.props.selectedTilesetChanged(selectedTilesets);

    this.setState({
      selectedUuid: selectedValues,
      // selectedUuid: selectedValues
    });
  }

  handleSelect(x) {
    const selectedOptions = ReactDOM.findDOMNode(this.multiSelect).selectedOptions;
    const selectedOptionsList = [];

    for (let i = 0; i < selectedOptions.length; i++) {
      const selectedOption = selectedOptions[i];
      selectedOptionsList.push(selectedOption.value);
    }

    this.handleSelectedOptions(selectedOptionsList);
  }

  handleSearchChange() {
    const domElement = ReactDOM.findDOMNode(this.searchBox);

    this.setState({ filter: domElement.value });
  }

  render() {
    const optionsList = [];
    for (const key in this.state.options) {
      optionsList.push(this.state.options[key]);
    }

    // the list of tilesets / tracks available
    const options = optionsList
      .filter(x => x.name.toLowerCase().includes(this.state.filter))
      .map(x => (<option
        onDoubleClick={this.handleOptionDoubleClick.bind(this)}
        key={x.serverUidKey}
        value={x.serverUidKey}
      >
        {x.name}
      </option>));

    const form = (
      <Form
        horizontal
      >
        <FormGroup >
          <Col sm={3}>
            <ControlLabel>{'Select tileset'}</ControlLabel>
          </Col>
          <Col smOffset={5} sm={4}>
            <FormControl
              placeholder="Search Term"
              ref={(c) => { this.searchBox = c; }}
              onChange={this.handleSearchChange.bind(this)}
              autoFocus={true}
            />
            <div style={{ height: 10 }} />
          </Col>
          <Col sm={12}>
            <FormControl
              componentClass="select"
              multiple
              className={'tileset-list'}
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
    );

    return (
      <div>
        {form}
      </div>
    );
  }
}

export default TilesetFinder;
