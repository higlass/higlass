import { json } from 'd3-request';
import { queue } from 'd3-queue';
import { select, event } from 'd3-selection';
import React from 'react';
import {tileProxy} from './services';
import slugid from 'slugid';
import {
  FormGroup,
  Glyphicon,
  DropdownButton,
  MenuItem,
} from 'react-bootstrap';
import PropTypes from 'prop-types';

import { ZOOM_TRANSITION_DURATION } from './configs';
import Autocomplete from './Autocomplete';
import { ChromosomeInfo } from './ChromosomeInfo';
import { SearchField } from './search_field';
import PopupMenu from './PopupMenu';

// Utils
import { scalesCenterAndK, dictKeys } from './utils';

// Styles
import styles from '../styles/GenomePositionSearchBox.module.scss'; // eslint-disable-line no-unused-vars

export class GenomePositionSearchBox extends React.Component {
  constructor(props) {
    super(props);

    this.mounted = false;
    this.uid = slugid.nice();
    this.chromInfo = null;
    this.searchField = null;
    this.autocompleteMenu = null;

    this.xScale = null, this.yScale = null;
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
    this.positionText =  'chr4:190,998,876-191,000,255';

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
        }]);
    }

    this.availableChromSizes = {};
    // this.availableChromSizes[this.props.chromInfoId] = new Set([{server: this.props.chromInfoServer, uuid: this.props.chromInfoId} ]);


    // this.fetchChromInfo(this.props.chromInfoId);
  }

  componentDidMount() {
    this.mounted=true;
    // we want to catch keypresses so we can get that enter
    select(this.autocompleteMenu.inputEl)
      .on('keypress', this.autocompleteKeyPress.bind(this));

    //this.findAvailableAutocompleteSources();
    //this.findAvailableChromSizes();
    this.fetchChromInfo(this.props.chromInfoServer,
      this.props.chromInfoId);

    this.setPositionText();
  }

  componentWillUnmount() {
    this.mounted = false;
    this.props.removeViewportChangedListener();
  }

  fetchChromInfo(chromInfoServer, chromInfoId) {
    /**
     * The user has selected an assembly to use for the coordinate search box
     *
     * Parameters
     * ----------
     *  chromInfoId: string
     *      The name of the chromosome info set to use
     *
     * Returns
     * -------
     *  null
     *      Once the appropriate ChromInfo file is fetched, it is stored locally
     */

    console.log('fci', this.mounted, this.availableChromSizes, chromInfoId);
    if (!this.mounted)
      // component is probably about to be unmounted
      return;

    this.setState({
      autocompleteServer: chromInfoServer,
    });

    ChromosomeInfo(`${chromInfoServer}/chrom-sizes/?id=${chromInfoId}`, (newChromInfo) => {
      this.chromInfo = newChromInfo;
      this.searchField = new SearchField(this.chromInfo);

      this.setPositionText();
    });
  }

  scalesChanged(xScale, yScale) {
    this.xScale = xScale, this.yScale = yScale;

    // make sure that this component is loaded first
    this.setPositionText();
  }

  setPositionText() {
    console.log('spt');
    if (!this.mounted) { return; }
    if (!this.searchField) { return; }
    console.log('spt1'); 

    const positionString = this.searchField.scalesToPositionText(this.xScale,
      this.yScale,
      this.props.twoD);

    // ReactDOM.findDOMNode( this.refs.searchFieldText).value = positionString;
    // used for autocomplete
    this.prevParts = positionString.split(/[ -]/);
    //console.log('this.autocompleteMenu', this.autocompleteMenu.inputEl);
    if (this.gpsbForm) {
      this.positionText = positionString;
      this.autocompleteMenu.inputEl.value = positionString;
      //this.setState({ value: positionString });
    }
  }

  autocompleteKeyPress() {
    const ENTER_KEY_CODE = 13;

    if (event.keyCode == ENTER_KEY_CODE) { this.buttonClick(); }
  }

  replaceGenesWithLoadedPositions(genePositions) {
    // iterate over all non-position oriented words and try
    // to replace them with the positions loaded from the suggestions
    // database
    const spaceParts = this.positionText.split(' ');

    for (let i = 0; i < spaceParts.length; i++) {
      const dashParts = spaceParts[i].split('-');

      for (let j = 0; j < dashParts.length; j++) {
        // if we're in this function, this gene name must have been loaded
        const genePosition = genePositions[dashParts[j].toLowerCase()];

        if (!genePosition) {
          continue;
        }

        // elongate the span of the gene so that it doesn't take up the entire
        // view
        const extension = Math.floor((genePosition.txEnd - genePosition.txStart) / 4);

        if (dashParts.length == 1) {
          // no range, just a position
          dashParts[j] = `${genePosition.chr}:${genePosition.txStart - extension
          }-${genePosition.txEnd + extension}`;
        } else if (j == 0) {
          // first part of a range

          dashParts[j] = `${genePosition.chr}:${genePosition.txStart - extension}`;
        } else {
          // last part of a range

          dashParts[j] = `${genePosition.chr}:${genePosition.txEnd + extension}`;
        }

        spaceParts[i] = dashParts.join('-');
      }
    }

    const newValue = spaceParts.join(' ');
    this.prevParts = newValue.split(/[ -]/);

    this.positionText = newValue;
    this.setState({ value: newValue });
  }

  replaceGenesWithPositions(finished) {
    // replace any gene names in the input with their corresponding positions
    const value_parts = this.positionText.split(/[ -]/);
    let q = queue();

    for (let i = 0; i < value_parts.length; i++) {
      if (value_parts[i].length == 0) { continue; }

      const [chr, pos, retPos] = this.searchField.parsePosition(value_parts[i]);

      if (retPos == null || isNaN(retPos)) {
        // not a chromsome position, let's see if it's a gene name
        const url = `${this.props.autocompleteServer}/suggest/?d=${this.props.autocompleteId}&ac=${value_parts[i].toLowerCase()}`;
        q = q.defer(tileProxy.json, url);
      }
    }

    q.awaitAll((error, files) => {
      if (files) {
        const genePositions = {};

        // extract the position of the top match from the list of files
        for (let i = 0; i < files.length; i++) {
          if (!files[i][0]) { continue; }

          for (let j = 0; j < files[i].length; j++) {
            genePositions[files[i][j].geneName.toLowerCase()] =
              files[i][j];
          }
        }

        this.replaceGenesWithLoadedPositions(genePositions);

        finished();
      }
    });
  }

  buttonClick() {
    this.setState({ genes: [] }); // no menu should be open

    this.replaceGenesWithPositions(() => {
      const searchFieldValue = this.positionText; // ReactDOM.findDOMNode( this.refs.searchFieldText ).value;

      if (this.searchField != null) {
        let [range1, range2] = this.searchField.searchPosition(searchFieldValue);

        if ((range1 && (isNaN(range1[0]) || isNaN(range1[1]))) ||
          (range2 && (isNaN(range2[0]) || isNaN(range2[1])))) {
          return;
        }

        if (!range2) { range2 = range1; }

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
    this.setState({ value, loading: true });

    const parts = value.split(/[ -]/);
    this.changedPart = null;

    for (let i = 0; i < parts.length; i++) {
      if (i == this.prevParts.length) {
        // new part added
        this.changedPart = i;
        break;
      }

      if (parts[i] != this.prevParts[i]) {
        this.changedPart = i;
        break;
      }
    }

    this.prevParts = parts;

    console.log('oac', this.props.autocompleteServer, this.props.autocompleteId);
    // no autocomplete repository is provided, so we don't try to autcomplete anything
    if (!(this.props.autocompleteServer && this.props.autocompleteId)) { 
      return; 
    }

    if (this.changedPart != null) {
      // if something has changed in the input text
      this.setState({ loading: true });
      // send out a request for the autcomplete suggestions
      const url = `${this.props.autocompleteServer}/suggest/?d=${this.props.autocompleteId}&ac=${parts[this.changedPart].toLowerCase()}`;
      tileProxy.json(url, (error, data) => {
        if (error) {
          this.setState({ loading: false, genes: [] });
          return;
        }

        // we've received a list of autocomplete suggestions
        this.setState({ loading: false, genes: data });
      });
    }
  }

  geneSelected(value, objct) {
    const parts = this.positionText.split(' ');
    let partCount = this.changedPart;

    // change the part that was selected
    for (let i = 0; i < parts.length; i++) {
      const dash_parts = parts[i].split('-');
      if (partCount > dash_parts.length - 1) {
        partCount -= dash_parts.length;
      } else {
        dash_parts[partCount] = objct.geneName;
        parts[i] = dash_parts.join('-');
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
      <PopupMenu
        children={items}
      >
        <div
          children={items}
          style={{
            left: this.menuPosition.left,
            top: this.menuPosition.top,
          }}
          styleName="styles.genome-position-search-bar-suggestions"
        />

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

  render() {
    const assemblyMenuItems = this.state.availableAssemblies.map(x => (
      <MenuItem
        eventKey={x}
        key={x}
      >
        {x}
      </MenuItem>
    ));

    const className = this.state.isFocused ?
      'styles.genome-position-search-focus' : 'styles.genome-position-search';

    const classNameButton = this.state.isFocused ?
      'styles.genome-position-search-bar-button-focus' :
      'styles.genome-position-search-bar-button';

    const classNameIcon = this.state.isFocused ?
      'styles.genome-position-search-bar-icon-focus' :
      'styles.genome-position-search-bar-icon';

    return (
      <FormGroup
        bsSize="small"
        styleName={className}
        ref={c => this.gpsbForm = c}
      >
        <DropdownButton
          bsSize="small"
          className={styles['genome-position-search-bar-button']}
          id={this.uid}
          onSelect={this.handleAssemblySelect.bind(this)}
          ref={c => this.assemblyPickButton = c}
          title={this.state.selectedAssembly ? this.state.selectedAssembly : '(none)'}
        >
          {assemblyMenuItems}
        </DropdownButton>

        <Autocomplete
          getItemValue={item => item.geneName}
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
          ref={c => this.autocompleteMenu = c}
          renderItem={(item, isHighlighted) => (
            <div
              id={item.refseqid}
              key={item.refseqid}
              style={isHighlighted ? this.styles.highlightedItem : this.styles.item}
            >{item.geneName}</div>
          )}
          renderMenu={this.handleRenderMenu.bind(this)}
          value={this.positionText}
          wrapperStyle={{ width: '100%' }}
        />

        <button
          onClick={this.buttonClick.bind(this)}
          styleName={classNameButton}
        >
          <Glyphicon glyph="search" />
        </button>
      </FormGroup>
    );
  }
}

GenomePositionSearchBox.propTypes = {
  autocompleteId: PropTypes.string,
  autocompleteServer: PropTypes.string,
  chromInfoId: PropTypes.string,
  isFocused: PropTypes.bool,
  onFocus: PropTypes.func,
  onSelectedAssemblyChanged: PropTypes.func,
  registerViewportChangedListener: PropTypes.func,
  removeViewportChangedListener: PropTypes.func,
  setCenters: PropTypes.func,
  trackSourceServers: PropTypes.array,
  twoD: PropTypes.bool,
};

export default GenomePositionSearchBox;
