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
import CheckboxTree from 'react-checkbox-tree';
import 'react-checkbox-tree/lib/react-checkbox-tree.css';


import { tileProxy } from './services';

// Configs
import { TRACKS_INFO } from './configs';

class TilesetFinder extends React.Component {
  constructor(props) {
    super(props);

    // this.localTracks = TRACKS_INFO.filter

    // local tracks are ones that don't have a filetype associated with them
    this.localTracks = TRACKS_INFO
      .filter(x => x.local && !x.hidden);

    this.augmentedTracksInfo = TRACKS_INFO;
    if (window.higlassTracksByType) {
      Object.keys(window.higlassTracksByType).forEach((pluginTrackType) => {
        this.augmentedTracksInfo.push(window.higlassTracksByType[pluginTrackType].config);
      });
    }

    if (props.datatype) {
      this.localTracks = this.localTracks.filter(x => x.datatype[0] === props.datatype);
    } else {
      this.localTracks = this.localTracks.filter(x => x.orientation === this.props.orientation);
    }


    this.localTracks.forEach((x) => { x.uuid = slugid.nice(); });

    const newOptions = this.prepareNewEntries('', this.localTracks, {});
    const availableTilesetKeys = Object.keys(newOptions);
    const selectedUuid = availableTilesetKeys.length ? [availableTilesetKeys[0]] : null;
    this.mounted = false;

    this.state = {
      selectedUuid,
      options: newOptions,
      filter: '',
      checked: [],
      expanded: [],
    };

    this.requestTilesetLists();
  }

  componentDidMount() {
    // we want to query for a list of tracks that are compatible with this
    // track orientation

    this.mounted = true;

    this.requestTilesetLists();

    if (!this.state.selectedUuid)
      return;

    const selectedTilesets = [this.state.options[this.state.selectedUuid]];

    if (selectedTilesets) { this.props.selectedTilesetChanged(selectedTilesets); }
  }

  componentWillUnmount() {
    this.mounted = false;
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

  serverUidKey(server, uid) {
    /**
         * Create a key for a server and uid
         */
    return `${server}/${uid}`;
  }


  requestTilesetLists() {
    let datatypesQuery = null;

    if (this.props.datatype) {
      datatypesQuery = `dt=${this.props.datatype}`;
    } else {
      const datatypes = new Set([].concat.apply([], this.augmentedTracksInfo
        .filter(x => x.datatype)
        .filter(x => x.orientation === this.props.orientation)
        .map(x => x.datatype)));


      datatypesQuery = [...datatypes].map(x => `dt=${x}`).join('&');
    }

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

  handleSelect() {
    const { selectedOptions } = this.multiSelect;
    const selectedOptionsList = [];

    for (let i = 0; i < selectedOptions.length; i++) {
      const selectedOption = selectedOptions[i];
      selectedOptionsList.push(selectedOption.value);
    }

    this.handleSelectedOptions(selectedOptionsList);
  }

  handleSearchChange() {
    const domElement = this.searchBox;

    this.setState({ filter: domElement.value });
  }

  render() {
    const optionsList = [];
    for (const key in this.state.options) {
      optionsList.push(this.state.options[key]);
    }

    // the list of tilesets / tracks available
    const sortedOptions = optionsList
      .filter(x => x.name.toLowerCase().includes(this.state.filter));

    sortedOptions.sort((a, b) => (
      a.name.toLowerCase().localeCompare(b.name.toLowerCase(), 'en')
    ));

    const options = sortedOptions.map(x => (
      <option
        onDoubleClick={this.handleOptionDoubleClick.bind(this)}
        value={x.serverUidKey}
        key={x.serverUidKey}
      >
        {`${x.name} | ${x.coordSystem}`}
      </option>));

    const nodes = [{
        value: 'mars',
        label: 'Mars',
        children: [
            { value: 'phobos', label: 'Phobos' },
            { value: 'deimos', label: 'Deimos' },
        ],
    }];

    const form = (
      <Form
        horizontal
        onSubmit={(evt) => { evt.preventDefault(); }}
      >
        <FormGroup>
          <Col sm={3}>
            <ControlLabel>Select tileset</ControlLabel>
          </Col>
          <Col
            sm={4}
            smOffset={5}
          >
            <FormControl
              inputRef={(c) => { this.searchBox = c; }}
              autoFocus={true}
              onChange={this.handleSearchChange.bind(this)}
              placeholder="Search Term"
            />
            <div style={{ height: 10 }} />
          </Col>
          <Col sm={12}>
            <CheckboxTree
                nodes={nodes}
                checked={this.state.checked}
                expanded={this.state.expanded}
                onCheck={checked => this.setState({ checked })}
                onExpand={expanded => this.setState({ expanded })}
            />
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
