// @ts-nocheck
import clsx from 'clsx';
import { queue } from 'd3-queue';
import { select } from 'd3-selection';
import PropTypes from 'prop-types';
import React from 'react';
import slugid from 'slugid';

import Autocomplete from './Autocomplete';
import ChromosomeInfo from './ChromosomeInfo';
import PopupMenu from './PopupMenu';
import SearchField from './SearchField';
import { THEME_DARK, ZOOM_TRANSITION_DURATION } from './configs';

// Services
import { tileProxy } from './services';

import withPubSub from './hocs/with-pub-sub';
// Utils
import { scalesCenterAndK } from './utils';

import { SearchIcon } from './icons';

// Styles
import styles from '../styles/GenomePositionSearchBox.module.scss';

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
    this.prevParts = [];

    this.props.registerViewportChangedListener(this.scalesChanged.bind(this));

    this.menuPosition = { left: 0, top: 0 };

    this.currentChromInfoServer = this.props.chromInfoServer;
    this.currentChromInfoId = this.props.chromInfoId;

    // the position text is maintained both here and in
    // in state.value so that it can be quickly updated in
    // response to zoom events
    this.positionText = 'no chromosome track present';

    this.state = {
      value: this.positionText,
      loading: false,
      menuPosition: [0, 0],
      genes: [],
      isFocused: false,
      menuOpened: false,
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
  }

  componentDidMount() {
    this.mounted = true;
    // we want to catch keypresses so we can get that enter
    select(this.autocompleteMenu.inputEl).on(
      'keypress',
      this.autocompleteKeyPress.bind(this),
    );

    this.fetchChromInfo(this.props.chromInfoServer, this.props.chromInfoId);
    this.setPositionText();
  }

  componentWillUnmount() {
    this.mounted = false;
    this.props.removeViewportChangedListener();
  }

  /**
   * The user has selected an assembly to use for the coordinate search box
   *
   * @param {string} chromInfoServer
   * @param {string} chromInfoId - The name of the chromosome info set to use
   *
   * @returns {void} Once the appropriate ChromInfo file is fetched, it is stored locally
   */
  fetchChromInfo(chromInfoServer, chromInfoId) {
    if (!chromInfoId) {
      this.positionText = 'no chromosome track present';

      this.setState({
        value: this.positionText,
      });

      return;
    }

    if (!this.mounted)
      // component is probably about to be unmounted
      return;

    this.setState({
      autocompleteServer: chromInfoServer,
    });

    ChromosomeInfo(
      `${chromInfoServer}/chrom-sizes/?id=${chromInfoId}`,
      (newChromInfo) => {
        this.chromInfo = newChromInfo;
        this.searchField = new SearchField(this.chromInfo);

        this.setPositionText();
      },
    );
  }

  scalesChanged(xScale, yScale) {
    this.xScale = xScale;
    this.yScale = yScale;

    // make sure that this component is loaded first
    this.setPositionText();
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

    // used for autocomplete
    this.prevParts = positionString.split(/[ -]/);
    if (this.gpsbForm) {
      this.positionText = positionString;
      this.autocompleteMenu.inputEl.value = positionString;
    }
  }

  autocompleteKeyPress(event) {
    const ENTER_KEY_CODE = 13;

    if (event.keyCode === ENTER_KEY_CODE) {
      this.buttonClick();
    }
  }

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
          }
          if (k === j + 1) {
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
    let q = queue();

    for (let i = 0; i < valueParts.length; i++) {
      if (valueParts[i].length === 0) {
        continue;
      }

      const [, , retPos] = this.searchField.parsePosition(valueParts[i]);

      if (retPos == null || Number.isNaN(retPos)) {
        // not a chromsome position, let's see if it's a gene name
        const url = `${this.props.autocompleteServer}/suggest/?d=${
          this.props.autocompleteId
        }&ac=${valueParts[i].toLowerCase()}`;

        const fetchJson = (callback) => {
          tileProxy.json(url, callback, this.props.pubSub);
        };
        q = q.defer(fetchJson);
      }
    }

    q.awaitAll((error, files) => {
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

        this.replaceGenesWithLoadedPositions(genePositions);

        finished();
      }
    });
  }

  buttonClick() {
    this.setState({
      genes: [],
    }); // no menu should be open

    this.replaceGenesWithPositions(() => {
      const searchFieldValue = this.positionText;

      if (this.searchField != null) {
        let [range1, range2] =
          this.searchField.searchPosition(searchFieldValue);

        if (
          (range1 && (Number.isNaN(range1[0]) || Number.isNaN(range1[1]))) ||
          (range2 && (Number.isNaN(range2[0]) || Number.isNaN(range2[1])))
        ) {
          return;
        }

        if (!range2) {
          range2 = range1;
        }

        const newXScale = this.xScale.copy().domain(range1);
        const newYScale = this.yScale.copy().domain(range2);

        const [centerX, centerY, k] = scalesCenterAndK(newXScale, newYScale);

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

  onAutocompleteChange(event, value) {
    this.positionText = value;
    this.setState({
      value,
      loading: true,
    });

    const parts = value.split(/[ -]/);
    this.changedPart = null;

    for (let i = 0; i < parts.length; i++) {
      if (i === this.prevParts.length) {
        // new part added
        this.changedPart = i;
        break;
      }

      if (parts[i] !== this.prevParts[i]) {
        this.changedPart = i;
        break;
      }
    }

    this.prevParts = parts;

    // no autocomplete repository is provided, so we don't try to autcomplete anything
    if (!(this.props.autocompleteServer && this.props.autocompleteId)) {
      return;
    }

    if (this.changedPart != null) {
      // if something has changed in the input text
      this.setState({ loading: true });
      // spend out a request for the autcomplete suggestions
      const url = `${this.props.autocompleteServer}/suggest/?d=${
        this.props.autocompleteId
      }&ac=${parts[this.changedPart].toLowerCase()}`;

      tileProxy.json(
        url,
        (error, data) => {
          if (error) {
            this.setState({
              loading: false,
              genes: [],
            });
            return;
          }

          // we've received a list of autocomplete suggestions
          this.setState({
            loading: false,
            genes: data,
          });
        },
        this.props.pubSub,
      );
    }
  }

  geneSelected(value, objct) {
    const parts = this.positionText.split(' ');
    let partCount = this.changedPart;

    // change the part that was selected
    for (let i = 0; i < parts.length; i++) {
      const dashParts = parts[i].split('-');
      if (partCount > dashParts.length - 1) {
        partCount -= dashParts.length;
      } else {
        dashParts[partCount] = objct.geneName;
        parts[i] = dashParts.join('-');
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
    this.setState({
      value: parts.join(' '),
      genes: [],
    });
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
          className={styles['genome-position-search-bar-suggestions']}
        >
          {items}
        </div>
      </PopupMenu>
    );
  }

  handleAssemblySelect(evt) {
    this.fetchChromInfo(evt);

    this.setState({
      selectedAssembly: evt,
    });
  }

  focusHandler(isFocused) {
    this.setState({
      isFocused,
    });
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (
      nextProps.chromInfoId !== this.currentChromInfoId ||
      nextProps.chromInfoServer !== this.currentChromInfoServer
    ) {
      this.currentChromInfoId = nextProps.chromInfoId;
      this.currentChromInfoServer = nextProps.chromInfoServer;

      this.fetchChromInfo(nextProps.chromInfoServer, nextProps.chromInfoId);
    }
  }

  render() {
    return (
      <div
        ref={(c) => {
          this.gpsbForm = c;
        }}
        className={clsx({
          [styles['genome-position-search-focus']]: this.state.isFocused,
          [styles['genome-position-search']]: !this.state.isFocused,
          [styles['genome-position-search-dark']]:
            this.props.theme === THEME_DARK,
        })}
      >
        <Autocomplete
          ref={(c) => {
            this.autocompleteMenu = c;
          }}
          getItemValue={(item) => item.geneName}
          inputProps={{
            className: styles['genome-position-search-bar'],
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
              key={item.geneName}
              id={item.geneName}
              style={
                isHighlighted ? this.styles.highlightedItem : this.styles.item
              }
            >
              {item.geneName}
            </div>
          )}
          renderMenu={this.handleRenderMenu.bind(this)}
          value={this.positionText}
          wrapperStyle={{
            width: '100%',
          }}
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
  isFocused: PropTypes.bool,
  onFocus: PropTypes.func,
  onSelectedAssemblyChanged: PropTypes.func,
  registerViewportChangedListener: PropTypes.func,
  removeViewportChangedListener: PropTypes.func,
  setCenters: PropTypes.func,
  theme: PropTypes.string,
  trackSourceServers: PropTypes.array,
  twoD: PropTypes.bool,
};

export default withPubSub(GenomePositionSearchBox);
