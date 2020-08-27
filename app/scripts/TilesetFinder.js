import React from 'react';
import PropTypes from 'prop-types';
import slugid from 'slugid';
import CheckboxTree from 'react-checkbox-tree';

import { tileProxy } from './services';
import '../styles/TilesetFinder.css';

import withPubSub from './hocs/with-pub-sub';

// Configs
import { TRACKS_INFO } from './configs';

class TilesetFinder extends React.Component {
  constructor(props) {
    super(props);

    // this.localTracks = TRACKS_INFO.filter

    // local tracks are ones that don't have a filetype associated with them
    this.localTracks = TRACKS_INFO.filter((x) => x.local && !x.hidden).map(
      (x) => {
        const y = Object.assign({}, x);
        y.datatype = x.datatype[0];
        return y;
      },
    );

    this.augmentedTracksInfo = TRACKS_INFO;
    if (window.higlassTracksByType) {
      Object.keys(window.higlassTracksByType).forEach((pluginTrackType) => {
        this.augmentedTracksInfo.push(
          window.higlassTracksByType[pluginTrackType].config,
        );
      });
    }

    if (props.datatype) {
      this.localTracks = this.localTracks.filter(
        (x) => x.datatype[0] === props.datatype,
      );
    } else {
      this.localTracks = this.localTracks.filter(
        (x) => x.orientation === this.props.orientation,
      );
    }

    this.localTracks.forEach((x) => {
      x.uuid = slugid.nice();
    });

    const newOptions = this.prepareNewEntries('', this.localTracks, {});
    const availableTilesetKeys = Object.keys(newOptions);
    const selectedUuid = availableTilesetKeys.length
      ? [availableTilesetKeys[0]]
      : null;
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
    this.searchBox.focus();
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
      const datatypes = new Set(
        [].concat(
          ...this.augmentedTracksInfo
            .filter((x) => x.datatype)
            .filter((x) => {
              return (
                x.orientation === this.props.orientation ||
                (this.props.orientation === '1d-vertical' &&
                  x.orientation === '1d-horizontal')
              );
            })
            .map((x) => x.datatype),
        ),
      );

      datatypesQuery = [...datatypes].map((x) => `dt=${x}`).join('&');
    }

    if (!this.props.trackSourceServers) {
      console.warn('No track source servers specified in the viewconf');
      return;
    }

    this.props.trackSourceServers.forEach((sourceServer) => {
      tileProxy.json(
        `${sourceServer}/tilesets/?limit=10000&${datatypesQuery}`,
        (error, data) => {
          if (error) {
            console.error('ERROR:', error);
          } else {
            const newOptions = this.prepareNewEntries(
              sourceServer,
              data.results,
              this.state.options,
            );
            const availableTilesetKeys = Object.keys(newOptions);
            let { selectedUuid } = this.state;

            // if there isn't a selected tileset, select the first received one
            if (!selectedUuid) {
              selectedUuid = availableTilesetKeys.length
                ? [availableTilesetKeys[0]]
                : null;
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
        },
        this.props.pubSub,
      );
    });
  }

  /**
   * Double clicked on an element. Should be selected
   * and this window will be closed.
   */
  handleOptionDoubleClick(x /* , y */) {
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

    this.props.selectedTilesetChanged(selectedTilesets);

    this.setState({ selectedUuid: selectedValues });
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

  /*
   * Create the nested checkbox tree by partitioning the
   * list of available datasets according to their group
   *
   * @param {object} datasetsDict A dictionary of id -> tileset
   *  def mappings
   * @param {string} filter A string to filter the results by
   * @returns {array} A list of items that define the nested checkbox
   *  structure
   *  {
   *    'name': 'blah',
   *    'value': 'blah',
   *    'children': [],
   *  }
   */
  partitionByGroup(datasetsDict, filter) {
    const itemsByGroup = {
      '': {
        name: '',
        value: '',
        children: [],
      },
    };

    for (const uuid of Object.keys(datasetsDict)) {
      const item = datasetsDict[uuid];

      if (!item.name.toLowerCase().includes(filter)) {
        continue;
      }

      if ('project_name' in item) {
        const group = item.project_name;

        if (!(group in itemsByGroup)) {
          itemsByGroup[group] = {
            value: group,
            label: group,
            children: [],
          };
        }

        itemsByGroup[group].children.push({
          label: item.name,
          value: uuid,
        });
      } else {
        itemsByGroup[''].children.push({
          label: item.name,
          value: uuid,
        });
      }
    }

    const allItems = itemsByGroup[''].children;
    // coollapse the group lists into one list of objects
    for (const group of Object.keys(itemsByGroup)) {
      if (group !== '') {
        itemsByGroup[group].children.sort((a, b) =>
          a.label.toLowerCase().localeCompare(b.label.toLowerCase(), 'en'),
        );

        allItems.push(itemsByGroup[group]);
      }
    }

    allItems.sort((a, b) =>
      a.label.toLowerCase().localeCompare(b.label.toLowerCase(), 'en'),
    );

    return allItems;
  }

  handleChecked(checked) {
    this.handleSelectedOptions(checked);

    this.setState({ checked });
  }

  handleExpanded(expanded) {
    this.setState({ expanded });
  }

  render() {
    const optionsList = [];
    for (const key in this.state.options) {
      optionsList.push(this.state.options[key]);
    }

    const nestedItems = this.partitionByGroup(
      this.state.options,
      this.state.filter,
    );
    const svgStyle = {
      width: 15,
      height: 15,
      top: 2,
      right: 2,
      position: 'relative',
    };

    const halfSvgStyle = JSON.parse(JSON.stringify(svgStyle));
    halfSvgStyle.opacity = 0.5;

    const form = (
      <form
        onSubmit={(evt) => {
          evt.preventDefault();
        }}
      >
        <div className="tileset-finder-search-bar">
          <span className="tileset-finder-label">Select tileset:</span>
          <input
            ref={(c) => {
              this.searchBox = c;
            }}
            className="tileset-finder-search-box"
            onChange={this.handleSearchChange.bind(this)}
            placeholder="Search Term"
            type="text"
          />
        </div>
        <div
          className="tileset-finder-checkbox-tree"
          styleName="tileset-finder-checkbox-tree"
        >
          <CheckboxTree
            checked={this.state.checked}
            expanded={this.state.expanded}
            icons={{
              uncheck: (
                <svg style={svgStyle}>
                  <use xlinkHref="#square_o" />
                </svg>
              ),
              check: (
                <svg style={svgStyle}>
                  <use xlinkHref="#check_square_o" />
                </svg>
              ),
              halfCheck: (
                <svg style={halfSvgStyle}>
                  <use xlinkHref="#check_square_o" />
                </svg>
              ),
              leaf: (
                <svg style={svgStyle}>
                  <use xlinkHref="#file_o" />
                </svg>
              ),
              expandClose: (
                <svg style={svgStyle}>
                  <use xlinkHref="#chevron_right" />
                </svg>
              ),
              expandOpen: (
                <svg style={svgStyle}>
                  <use xlinkHref="#chevron_down" />
                </svg>
              ),
              parentClose: (
                <svg style={svgStyle}>
                  <use xlinkHref="#folder_o" />
                </svg>
              ),
              parentOpen: (
                <svg style={svgStyle}>
                  <use xlinkHref="#folder_open_o" />
                </svg>
              ),
            }}
            nodes={nestedItems}
            onCheck={this.handleChecked.bind(this)}
            onExpand={this.handleExpanded.bind(this)}
          />
        </div>
      </form>
    );

    return <div>{form}</div>;
  }
}

TilesetFinder.propTypes = {
  datatype: PropTypes.string,
  orientation: PropTypes.string,
  onDoubleClick: PropTypes.func,
  pubSub: PropTypes.object.isRequired,
  selectedTilesetChanged: PropTypes.func,
  trackSourceServers: PropTypes.array,
};

export default withPubSub(TilesetFinder);
