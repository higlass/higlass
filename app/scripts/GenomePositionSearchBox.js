import { select, event } from 'd3-selection';
import React from 'react';
import slugid from 'slugid';
import PropTypes from 'prop-types';

import Autocomplete from './Autocomplete';
import ChromosomeInfo from './ChromosomeInfo';
import SearchField from './SearchField';
import PopupMenu from './PopupMenu';

// Services
import { tileProxy } from './services';
import withPubSub from './hocs/with-pub-sub';

// Utils
import { scalesCenterAndK, dictKeys, toVoid } from './utils';

// HOCS
import withTheme from './hocs/with-theme';
import { SearchIcon } from './icons';
// Configs
import { THEME_DARK, ZOOM_TRANSITION_DURATION } from './configs';

// Styles
import styles from '../styles/GenomePositionSearchBox.module.scss'; // eslint-disable-line no-unused-vars

class GenomePositionSearchBox extends React.Component {
  constructor(props) {
    super(props);

    this.mounted = false;
    this.uid = slugid.nice();
    this.chromInfo = null;
    this.searchField = null;
    this.autocompleteMenu = null;

    this.xScale = null;
    this.yScale = null;
    // this.props.zoomDispatch.on('zoom.' + this.uid, this.zoomed.bind(this))

    /*
    this.xOrigScale = scaleLinear().domain(this.props.xDomain)
              .range(this.props.xRange);
    this.yOrigScale = scaleLinear().domain(this.props.yDomain)
              .range(this.props.yRange);

    this.zoomedXScale = this.xOrigScale.copy();
    this.zoomedYScale = this.yOrigScale.copy();
    */

    this.prevParts = [];

    this.props.registerViewportChangedListener(this.scalesChanged.bind(this));

    this.menuPosition = { left: 0, top: 0 };

    // the position text is maintained both here and in
    // in state.value so that it can be quickly updated in
    // response to zoom events
    this.positionText = 'chr4:190,998,876-191,000,255';

    this.state = {
      genes: [],
      isFocused: false,
      autocompleteServer: this.props.autocompleteServer,
      autocompleteId: this.props.autocompleteId,
      availableAssemblies: [],
      selectedAssembly: null,
    };

    this.styles = {
      item: {
        padding: '2px 6px',
        cursor: 'default',
      },

      highlightedItem: {
        color: 'white',
        background: 'hsl(200, 50%, 50%)',
        padding: '2px 6px',
        cursor: 'default',
      },

      menu: {
        border: 'solid 1px #ccc',
      },
    };

    this.availableAutocompletes = {};

    if (this.props.autocompleteId) {
      this.availableAutocompletes[this.props.chromInfoId] = new Set([
        {
          server: this.props.autocompleteServer,
          acId: this.props.autocompleteId,
        },
      ]);
    }

    this.availableChromSizes = {};

    /*
    if (this.props.chromInfoServer && this.props.chromInfoId) {
      // if we've been passed a server and chromInfo ID we trust that it exists
      // and use that
      this.availableChromSizes[this.props.chromInfoId] =
        new Set([{server: this.props.chromInfoServer, uuid: this.props.chromInfoId} ]);
      this.fetchChromInfo(this.props.chromInfoId);
    }
    */
  }

  componentDidMount() {
    this.mounted = true;
    // we want to catch keypresses so we can get that enter
    select(this.autocompleteMenu.inputEl).on(
      'keypress',
      this.autocompleteKeyPress.bind(this),
    );

    this.findAvailableAutocompleteSources();
    this.findAvailableChromSizes();

    if (this.props.chromInfoPath) {
      this.searchPosition = true;

      ChromosomeInfo(this.props.chromInfoPath, (chromInfo) => {
        if (!chromInfo) {
          this.searchPosition = null;
          return;
        }

        this.chromInfo = chromInfo;
        this.searchField = new SearchField(this.chromInfo);

        this.setPositionText();
      });
    }

    this.setPositionText();
  }

  componentWillUnmount() {
    this.mounted = false;
    this.props.removeViewportChangedListener();
  }

  onAutocompleteChange(evt, value) {
    this.positionText = value;
    this.setState({
      value,
      loading: true,
    });

    this.changedPart = null;
    const spaceParts = value.split(/ /);
    let partIndex = 0;
    const newParts = [];
    let changedAtStartOfWord = false;

    for (let j = 0; j < spaceParts.length; j++) {
      const parts = spaceParts[j].split(/-/);

      for (let i = 0; i < parts.length; i++) {
        partIndex += 1;
        newParts.push(parts[i]);

        if (i === 0) changedAtStartOfWord = true;
        else changedAtStartOfWord = false;

        if (i === this.prevParts.length) {
          // new part added
          this.changedPart = partIndex - 1;
          break;
        }

        if (parts[i] !== this.prevParts[i]) {
          this.changedPart = partIndex - 1;
          break;
        }
      }
    }

    this.prevParts = newParts;

    // no autocomplete repository is provided, so we don't try to autcomplete anything
    if (!(this.state.autocompleteServer && this.state.autocompleteId)) {
      return;
    }

    if (this.changedPart !== null) {
      // if something has changed in the input text
      this.setState({
        loading: true,
      });
      // send out a request for the autcomplete suggestions
      let url = `${this.state.autocompleteServer}/suggest/`;
      url += `?d=${this.state.autocompleteId}&ac=${newParts[
        this.changedPart
      ].toLowerCase()}`;
      tileProxy.json(
        url,
        (error, data) => {
          if (error) {
            this.setState({
              loading: false,
              genes: [],
            });
          } else if (this.changedPart > 0 && !changedAtStartOfWord) {
            // send out another request for genes with dashes in them
            // but we need to distinguish things that have a dash in front
            // from things that just have a space in front

            const url1 =
              `${this.state.autocompleteServer}/suggest/` +
              `?d=${this.state.autocompleteId}` +
              `&ac=${newParts[this.changedPart - 1].toLowerCase()}` +
              `-${newParts[this.changedPart].toLowerCase()}`;
            tileProxy.json(
              url1,
              (error1, data1) => {
                if (error1) {
                  this.setState({
                    loading: false,
                    genes: data,
                  });
                } else {
                  this.setState({
                    loading: false,
                    genes: data1.concat(data),
                  });
                }
              },
              this.props.pubSub,
            );
          } else {
            // we've received a list of autocomplete suggestions
            this.setState({ loading: false, genes: data });
          }
        },
        this.props.pubSub,
      );
    }
  }

  setAvailableAssemblies() {
    const chromsizeKeys = new Set(dictKeys(this.availableChromSizes));

    const commonKeys = new Set([...chromsizeKeys]);

    if (this.gpsbForm) {
      // only set the state if this comonent is mounted
      this.setState({
        availableAssemblies: [...commonKeys],
      });
    }
  }

  setSelectedAssembly(assemblyName) {
    // component is probably about to be unmounted
    if (!this.mounted) return;

    if (!this.availableChromSizes[assemblyName]) return;
    // we don't know of any available chromosome sizes so just ignore
    // this function call (usually called from the constructor)

    // use the first available server that we have on record for this chromInfoId
    const serverAndChromInfoToUse = [
      ...this.availableChromSizes[assemblyName],
    ][0];

    this.setState({
      autocompleteServer: serverAndChromInfoToUse.server,
    });

    const { server } = serverAndChromInfoToUse;

    // we need to set a an autocompleteId that matches the chromInfo
    // that was received, but if none has been retrieved yet...
    if (this.availableAutocompletes[assemblyName]) {
      const newAcId = [...this.availableAutocompletes[assemblyName]][0].acId;
      this.props.onSelectedAssemblyChanged(assemblyName, newAcId, server);

      if (this.gpsbForm) {
        this.setState({
          autocompleteId: newAcId,
        });
      }
    } else {
      this.props.onSelectedAssemblyChanged(assemblyName, null, server);

      if (this.gpsbForm) {
        this.setState({
          autocompleteId: null,
        });
      }
    }

    this.fetchChromInfo(
      serverAndChromInfoToUse.uuid,
      serverAndChromInfoToUse.server,
    );
  }

  setPositionText() {
    if (!this.mounted) {
      return;
    }
    if (!this.searchField) {
      return;
    }

    const positionString = this.searchField.scalesToPositionText(
      this.xScale,
      this.yScale,
      this.props.twoD,
    );

    // ReactDOM.findDOMNode( this.refs.searchFieldText).value = positionString;
    // used for autocomplete
    this.prevParts = positionString.split(/[ -]/);

    if (this.gpsbForm) {
      this.positionText = positionString;

      // this.origPositionText is used to reset the text if somebody clicks submit
      // on an empty field
      this.origPositionText = positionString;

      this.autocompleteMenu.inputEl.value = positionString;
      // this.setState({ value: positionString });
    }
  }

  scalesChanged(xScale, yScale) {
    this.xScale = xScale;
    this.yScale = yScale;

    // make sure that this component is loaded first
    this.setPositionText();
  }

  findAvailableChromSizes() {
    if (!this.props.trackSourceServers) {
      // if we don't know where to look for track source servers then
      // just give up
      return;
    }

    this.props.trackSourceServers.forEach((sourceServer) => {
      tileProxy.json(
        `${sourceServer}/available-chrom-sizes/`,
        (error, data) => {
          if (error) {
            console.error(error);
          } else {
            data.results.forEach((x) => {
              if (!(x.coordSystem in this.availableChromSizes)) {
                this.availableChromSizes[x.coordSystem] = new Set();
              }

              this.availableChromSizes[x.coordSystem].add({
                server: sourceServer,
                uuid: x.uuid,
              });
              this.setAvailableAssemblies();
            });

            // we haven't set an assembly yet so set it now
            // props.chromInfoId will be set to the suggested assembly (e.g. "hg19")
            // this will be mapped to an available chromSize (with its own unique uuid)
            if (!this.searchField) {
              // only fetch chromsizes if there isn't a specified chromInfoServer
              this.fetchChromInfo(
                this.props.chromInfoId in this.availableChromSizes
                  ? [...this.availableChromSizes[this.props.chromInfoId]][0]
                      .uuid
                  : this.props.chromInfoId,
                this.props.chromInfoId in this.availableChromSizes
                  ? [...this.availableChromSizes[this.props.chromInfoId]][0]
                      .server
                  : this.props.chromInfoServer,
              );
            }
          }
        },
        this.props.pubSub,
      );
    });
  }

  findAvailableAutocompleteSources() {
    if (!this.props.trackSourceServers) {
      // if there's no available track source servers
      // we can't search for autocomplete sources
      return;
    }

    this.props.trackSourceServers.forEach((sourceServer) => {
      tileProxy.json(
        `${sourceServer}/tilesets/?limit=100&dt=gene-annotation`,
        (error, data) => {
          if (error) {
            console.error(error);
          } else {
            data.results.forEach((x) => {
              if (!(x.coordSystem in this.availableAutocompletes)) {
                this.availableAutocompletes[x.coordSystem] = new Set();
              }

              this.availableAutocompletes[x.coordSystem].add({
                server: sourceServer,
                acId: x.uuid,
              });
              this.setAvailableAssemblies();
            });

            if (!this.state.autocompleteId) {
              // We don't have an autocomplete source yet, so set the one matching the current
              // assembly
              if (this.gpsbForm) {
                // only set the state if this component is mounted
                if (this.availableAutocompletes[this.props.chromInfoId]) {
                  this.setState({
                    autocompleteId: [
                      ...this.availableAutocompletes[this.props.chromInfoId],
                    ][0].acId,
                  });
                }
              }
            }
          }
        },
        this.props.pubSub,
      );
    });
  }

  /**
   * The user has selected an assembly to use for the coordinate search box.
   * Once the appropriate ChromInfo file is fetched, it is stored locally
   *
   * @param {string} chromInfoId The name of the chromosome info set to use
   */
  fetchChromInfo(chromInfoId, server) {
    ChromosomeInfo(
      `${server}/chrom-sizes/?id=${chromInfoId}`,
      (newChromInfo) => {
        if (!newChromInfo) {
          return;
        }

        tileProxy.json(
          `${server}/tileset_info/?d=${chromInfoId}`,
          (error2, tilesetInfo) => {
            if (error2) {
              return;
            }

            if (this.gpsbForm) {
              // only set the state if this component is mounted
              this.setState({
                selectedAssembly: tilesetInfo[chromInfoId].coordSystem,
              });
            }
          },
          this.props.pubSub,
        );

        this.chromInfo = newChromInfo;
        this.searchField = new SearchField(this.chromInfo);

        this.setPositionText();
      },
      this.props.pubSub,
    );
  }

  autocompleteKeyPress() {
    const ENTER_KEY_CODE = 13;

    if (event.keyCode === ENTER_KEY_CODE) {
      this.buttonClick();
    }
  }

  genePositionToSearchBarText(genePosition) {}

  replaceGenesWithLoadedPositions(genePositions) {
    // iterate over all non-position oriented words and try
    // to replace them with the positions loaded from the suggestions
    // database
    const origSearchText = this.positionText;
    const spaceParts = origSearchText.split(' ');
    let foundGeneSymbol = false;

    for (let i = 0; i < spaceParts.length; i++) {
      const dashParts = spaceParts[i].split('-');

      // check if this "word" is a gene symbol which can be replaced

      // iterate over chunks, checking what the maximum replaceable
      // unit is
      let j = 0;
      let k = 0;
      let spacePart = '';

      while (j < dashParts.length) {
        k = dashParts.length;

        while (k > j) {
          const dashChunk = dashParts.slice(j, k).join('-');

          if (genePositions[dashChunk.toLowerCase()]) {
            const genePosition = genePositions[dashChunk.toLowerCase()];
            const extension = Math.floor(
              (genePosition.txEnd - genePosition.txStart) / 4,
            );

            if (j === 0 && k < dashParts.length) {
              // there's more parts so this is the first part
              spacePart = `${genePosition.chr}:${
                genePosition.txStart - extension
              }`;
            } else if (j === 0 && k === dashParts.length) {
              // there's only one part so this is a position
              spacePart = `${genePosition.chr}:${
                genePosition.txStart - extension
              }-${genePosition.txEnd + extension}`;
            } else {
              spacePart += `- ${genePosition.chr}:${
                genePosition.txEnd + extension
              }`;
              // it's the last part of a range
            }
            foundGeneSymbol = true; // we found a gene symbol
            break;
          } else if (k === j + 1) {
            if (spacePart.length) {
              spacePart += '-';
            }

            spacePart += dashChunk;
          }

          k -= 1;
        }

        j = k + 1;
      }

      spaceParts[i] = spacePart;
    }

    const newValue = spaceParts.join(' ');
    this.prevParts = newValue.split(/[ -]/);

    this.positionText = newValue;
    this.setState({
      value: newValue,
    });
    // return the original keyword that a user searched if we found a gene symbol from it
    return foundGeneSymbol ? origSearchText : null;
  }

  replaceGenesWithPositions(finished) {
    // replace any gene names in the input with their corresponding positions
    const valueParts = this.positionText.split(/[ -]/);
    const requests = [];

    for (let i = 0; i < valueParts.length; i++) {
      if (valueParts[i].length === 0) {
        continue;
      }

      const retPos = this.searchField.parsePosition(valueParts[i])[2];

      if (retPos === null || Number.isNaN(+retPos)) {
        // not a chromsome position, let's see if it's a gene name
        const url = `${this.state.autocompleteServer}/suggest/?d=${
          this.state.autocompleteId
        }&ac=${valueParts[i].toLowerCase()}`;
        requests.push(tileProxy.json(url, toVoid, this.props.pubSub));
      }
    }

    Promise.all(requests)
      .then((files) => {
        if (files) {
          const genePositions = {};

          // extract the position of the top match from the list of files
          for (let i = 0; i < files.length; i++) {
            if (!files[i][0]) {
              continue;
            }

            for (let j = 0; j < files[i].length; j++) {
              genePositions[files[i][j].geneName.toLowerCase()] = files[i][j];
            }
          }

          const geneSymbol = this.replaceGenesWithLoadedPositions(
            genePositions,
          );

          finished(geneSymbol);
        }
      })
      .catch((error) => console.error(error));
  }

  buttonClick() {
    this.setState({ genes: [] }); // no menu should be open

    this.replaceGenesWithPositions((geneSymbol) => {
      const searchFieldValue = this.positionText;

      if (this.searchField !== null) {
        const rangePair = this.searchField.searchPosition(searchFieldValue);
        const range1 = rangePair[0];
        let range2 = rangePair[1];

        if (!range1) {
          this.setPositionText(this.origPositionText);
          return;
        }

        if (
          (range1 && (Number.isNaN(+range1[0]) || Number.isNaN(+range1[1]))) ||
          (range2 && (Number.isNaN(+range2[0]) || Number.isNaN(+range2[1])))
        ) {
          return;
        }

        if (!range2) {
          range2 = range1;
        }

        const newXScale = this.xScale.copy().domain(range1);
        const newYScale = this.yScale.copy().domain(range2);

        const [centerX, centerY, k] = scalesCenterAndK(newXScale, newYScale);

        if (geneSymbol) {
          // call the callback function of the `onGeneSearch` api if a user searched for a gene symbol
          this.props.onGeneSearch({
            geneSymbol,
            range: range1,
            centerX,
            centerY,
          });
        }

        this.props.setCenters(centerX, centerY, k, ZOOM_TRANSITION_DURATION);
      }
    });
  }

  searchFieldSubmit() {
    this.buttonClick();
  }

  pathJoin(parts, sep) {
    const separator = sep || '/';
    const replace = new RegExp(`${separator}{1,}`, 'g');
    return parts.join(separator).replace(replace, separator);
  }

  geneSelected(value, objct) {
    const parts = this.positionText.split(' ');
    let partCount = this.changedPart;

    // change the part that was selected
    for (let i = 0; i < parts.length; i++) {
      const dashParts = parts[i].split('-');
      const geneParts = objct.geneName.split('-');

      if (partCount > dashParts.length - 1) {
        partCount -= dashParts.length;
      } else {
        dashParts[partCount] = objct.geneName;

        if (
          geneParts.length === 2 &&
          partCount > 0 &&
          dashParts[partCount - 1].toLowerCase() === geneParts[0].toLowerCase()
        ) {
          // the gene to be added contains a dash and is
          // meant to replace a part of the previous gene
          // e.g. SOX2-O should be replaced with SOX2-OT

          const newDashParts = dashParts.slice(0, partCount - 1);
          newDashParts.push(geneParts.join('-'));

          if (partCount < dashParts.length - 1) {
            newDashParts.push(dashParts.slice(partCount + 1));
          }

          parts[i] = newDashParts.join('-');
        } else {
          parts[i] = dashParts.join('-');
        }

        break;
      }
    }

    /*
    let new_dash_parts = dash_parts.slice(0, dash_parts.length-1);
    new_dash_parts = new_dash_parts.concat(objct.geneName).join('-');

    let new_parts = parts.splice(0, parts.length-1);
    new_parts = new_parts.concat(new_dash_parts).join(' ');
    */

    this.prevParts = parts.join(' ').split(/[ -]/);

    this.positionText = parts.join(' ');
    this.setState({ value: parts.join(' '), genes: [] });
  }

  handleMenuVisibilityChange(isOpen, inputEl) {
    const box = inputEl.getBoundingClientRect();

    this.menuPosition = {
      left: box.left,
      top: box.top + box.height,
    };

    this.setState({
      menuOpened: isOpen,
    });
  }

  handleRenderMenu(items) {
    return (
      <PopupMenu>
        <div
          style={{
            left: this.menuPosition.left,
            top: this.menuPosition.top,
          }}
          styleName="styles.genome-position-search-bar-suggestions"
        >
          {items}
        </div>
      </PopupMenu>
    );
  }

  handleAssemblySelect(evt) {
    this.setSelectedAssembly(evt);

    this.setState({
      selectedAssembly: evt,
    });
  }

  focusHandler(isFocused) {
    this.setState({
      isFocused,
    });
  }

  render() {
    const assemblyMenuItems = this.state.availableAssemblies.map((x) => (
      <option key={x} value={x}>
        {x}
      </option>
    ));

    let className = this.state.isFocused
      ? 'styles.genome-position-search-focus'
      : 'styles.genome-position-search';

    if (this.props.theme === THEME_DARK) {
      className += ' styles.genome-position-search-dark';
    }

    return (
      <div
        ref={(c) => {
          this.gpsbForm = c;
        }}
        styleName={className}
      >
        {!this.props.hideAvailableAssemblies && (
          <select
            ref={(c) => {
              this.assemblyPickButton = c;
            }}
            className={styles['genome-position-search-bar-button']}
            id={this.uid}
            onSelect={this.handleAssemblySelect.bind(this)}
            title={
              this.state.selectedAssembly
                ? this.state.selectedAssembly
                : '(none)'
            }
          >
            {assemblyMenuItems}
          </select>
        )}

        <Autocomplete
          ref={(c) => {
            this.autocompleteMenu = c;
          }}
          getItemValue={(item) => item.geneName}
          inputProps={{
            className: styles['genome-position-search-bar'],
            title:
              'Current location: enter a symbol or location to change the position of the current view',
          }}
          items={this.state.genes}
          menuStyle={{
            position: 'absolute',
            left: this.menuPosition.left,
            top: this.menuPosition.top,
            border: '1px solid black',
          }}
          onChange={this.onAutocompleteChange.bind(this)}
          onFocus={this.focusHandler.bind(this)}
          onMenuVisibilityChange={this.handleMenuVisibilityChange.bind(this)}
          onSelect={(value, objct) => this.geneSelected(value, objct)}
          onSubmit={this.searchFieldSubmit.bind(this)}
          renderItem={(item, isHighlighted) => (
            <div
              key={item.refseqid}
              id={item.refseqid}
              style={
                isHighlighted ? this.styles.highlightedItem : this.styles.item
              }
            >
              {item.geneName}
            </div>
          )}
          renderMenu={this.handleRenderMenu.bind(this)}
          value={this.positionText}
          wrapperStyle={{ width: '100%' }}
        />

        <SearchIcon
          onClick={this.buttonClick.bind(this)}
          theStyle="multitrack-header-icon"
        />
      </div>
    );
  }
}

GenomePositionSearchBox.propTypes = {
  autocompleteId: PropTypes.string,
  autocompleteServer: PropTypes.string,
  chromInfoId: PropTypes.string,
  chromInfoServer: PropTypes.string,
  hideAvailableAssemblies: PropTypes.bool,
  isFocused: PropTypes.bool,
  pubSub: PropTypes.func,
  onFocus: PropTypes.func,
  onGeneSearch: PropTypes.func,
  onSelectedAssemblyChanged: PropTypes.func,
  registerViewportChangedListener: PropTypes.func,
  removeViewportChangedListener: PropTypes.func,
  setCenters: PropTypes.func,
  theme: PropTypes.symbol.isRequired,
  trackSourceServers: PropTypes.array,
  twoD: PropTypes.bool,
};

export default withPubSub(withTheme(GenomePositionSearchBox));
