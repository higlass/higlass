import {json} from 'd3-request';
import {queue} from 'd3-queue';
import {select,event} from 'd3-selection';
import React from 'react';
import slugid from 'slugid';
import Autocomplete from './Autocomplete';
import {
  FormGroup,
  Glyphicon,Button,
  DropdownButton,
  MenuItem
} from 'react-bootstrap';
import {ChromosomeInfo} from './ChromosomeInfo';
import {SearchField} from './search_field';
import {scalesCenterAndK, dictKeys} from './utils';
import PopupMenu from './PopupMenu.jsx';

import '../styles/GenomePositionSearchBox.css';

export class GenomePositionSearchBox extends React.Component {
    constructor(props) {
        super(props);

        this.uid = slugid.nice();
        this.chromInfo = null;
        this.searchField = null;
        this.autocompleteMenu = null;

        this.xScale = null, this.yScale = null;
        //this.props.zoomDispatch.on('zoom.' + this.uid, this.zoomed.bind(this))

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

        this.menuPosition = {left:0, top:0};

        this.state = {
            value: "chr4:190,998,876-191,000,255",
            loading: false,
            menuPosition: [0,0],
            genes: [],
            menuOpened: false,
            autocompleteServer: this.props.autocompleteServer,
            autocompleteId: this.props.autocompleteId,
            availableAssemblies: [],
            selectedAssembly: null
        };

        this.styles = {
                  item: {
                    padding: '2px 6px',
                    cursor: 'default'
                  },

                  highlightedItem: {
                    color: 'white',
                    background: 'hsl(200, 50%, 50%)',
                    padding: '2px 6px',
                    cursor: 'default'
                  },

                  menu: {
                    border: 'solid 1px #ccc'
                  }
                }


        this.availableAutocompletes = {}

        if (this.props.autocompleteId) {
            this.availableAutocompletes[this.props.chromInfoId] = new Set([
                {
                    server: this.props.autocompleteServer,
                    acId: this.props.autocompleteId
                }]);
        }

        this.availableChromSizes = {};
        //this.availableChromSizes[this.props.chromInfoId] = new Set([{server: this.props.chromInfoServer, uuid: this.props.chromInfoId} ]);

        this.findAvailableAutocompleteSources();
        this.findAvailableChromSizes();

        //this.fetchChromInfo(this.props.chromInfoId);
    }

    fetchChromInfo(chromInfoId) {
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

        if (!this.availableChromSizes[chromInfoId])
            // we don't know of any available chromosome sizes so just ignore
            // this function call (usually called from the constructor)
            return;

        // use the first available server that we have on record for this chromInfoId
        let serverAndChromInfoToUse = [...this.availableChromSizes[chromInfoId]][0];

        ChromosomeInfo(serverAndChromInfoToUse.server + "/chrom-sizes/?id=" + serverAndChromInfoToUse.uuid, (newChromInfo) => {
            this.chromInfo = newChromInfo;
            this.searchField = new SearchField(this.chromInfo);

            this.setPositionText();

            this.setState({
                selectedAssembly: chromInfoId
            });

            // we need to set a an autocompleteId that matches the chromInfo
            // that was received, but if none has been retrieved yet...
            if (this.availableAutocompletes[chromInfoId]) {
                let newAcId = [...this.availableAutocompletes[chromInfoId]][0].acId
                this.props.onSelectedAssemblyChanged(chromInfoId, newAcId)

                this.setState({
                        autocompleteId: newAcId
                });
            } else {
                this.props.onSelectedAssemblyChanged(chromInfoId,
                    this.state.autocompleteId)
            }
        });
    }

    findAvailableAutocompleteSources() {
        this.props.trackSourceServers.forEach( sourceServer => {
            json(sourceServer + "/tilesets/?limit=100&dt=gene-annotation", (error, data) => {
                if (error) {
                    console.error(error);
                } else {
                    data.results.map(x => {
                        if (!(x.coordSystem in this.availableAutocompletes)) {
                            this.availableAutocompletes[x.coordSystem] = new Set();
                        }

                        this.availableAutocompletes[x.coordSystem].add({server: sourceServer, acId: x.uuid});
                        this.setAvailableAssemblies();

                    });

                    if (!this.state.autocompleteId) {
                        // We don't have an autocomplete source yet, so set the one matching the current
                        // assembly
                        this.setState({
                            autocompleteId: [...this.availableAutocompletes[this.props.chromInfoId]][0].acId
                        });
                    }
                }
            });
        });
    }

    findAvailableChromSizes() {
        this.props.trackSourceServers.forEach( sourceServer => {
            json(sourceServer + "/available-chrom-sizes/", (error, data) => {
                if (error) {
                    console.error(error);
                } else {
                    data.results.map(x => {
                        if (!(x.uuid in this.availableChromSizes)) {
                            this.availableChromSizes[x.coordSystem] = new Set();
                        }

                        this.availableChromSizes[x.coordSystem].add({server: sourceServer, uuid: x.uuid});
                        this.setAvailableAssemblies();

                    });

                    // we haven't set an assembly yet so set it now
                    // props.chromInfoId will be set to the suggested assembly (e.g. "hg19")
                    // this will be mapped to an available chromSize (with its own unique uuid)
                    if (!this.searchField)
                        this.fetchChromInfo(this.props.chromInfoId);
                }
            });
        });
    }

    setAvailableAssemblies() {
        let autocompleteKeys = new Set(dictKeys(this.availableAutocompletes));
        let chromsizeKeys = new Set(dictKeys(this.availableChromSizes));

        let commonKeys = new Set([...autocompleteKeys].filter(x => chromsizeKeys.has(x)));

        this.setState({
            availableAssemblies: [...commonKeys]
        });
    }

    scalesChanged(xScale, yScale) {
        this.xScale = xScale, this.yScale = yScale;

        this.setPositionText();
    }

    setPositionText() {
        if (!this.searchField)
            return;

        let positionString = this.searchField.scalesToPositionText(this.xScale,
                                                                   this.yScale,
                                                                   this.props.twoD);

        //ReactDOM.findDOMNode( this.refs.searchFieldText).value = positionString;
        // used for autocomplete
        this.prevParts = positionString.split(/[ -]/);
        this.setState({"value": positionString});
    }

    componentDidMount() {
        // we want to catch keypresses so we can get that enter
        let inputSelection = select(this.autocompleteMenu.refs.input)
            .on('keypress', this.autocompleteKeyPress.bind(this));
    }

    autocompleteKeyPress() {
        let ENTER_KEY_CODE = 13;

        if (event.keyCode == ENTER_KEY_CODE)
            this.buttonClick();
    }

    replaceGenesWithLoadedPositions(genePositions) {
        // iterate over all non-position oriented words and try
        // to replace them with the positions loaded from the suggestions
        // database
        let spaceParts = this.state.value.split(' ');

        for (let i = 0; i < spaceParts.length; i++) {
            let dashParts = spaceParts[i].split('-');

            for (let j = 0; j < dashParts.length; j++) {
                // if we're in this function, this gene name must have been loaded
                let genePosition = genePositions[dashParts[j].toLowerCase()];

                if (!genePosition) {
                    continue;
                }

                // elongate the span of the gene so that it doesn't take up the entire
                // view
                let extension = Math.floor((genePosition.txEnd - genePosition.txStart) / 4);

                if (dashParts.length == 1) {
                    // no range, just a position
                    dashParts[j] = genePosition.chr + ":" + (genePosition.txStart - extension) +
                        '-' + (genePosition.txEnd + extension);
                } else {
                    if (j == 0) {
                        // first part of a range

                        dashParts[j] = genePosition.chr + ":" + (genePosition.txStart - extension);
                    } else {
                        // last part of a range

                        dashParts[j] = genePosition.chr + ":" + (genePosition.txEnd + extension);
                    }
                }

                spaceParts[i] = dashParts.join('-');
            }
        }

        let newValue = spaceParts.join(' ');
        this.prevParts = newValue.split(/[ -]/);
        this.setState({value: newValue});
    }

    replaceGenesWithPositions(finished) {
        // replace any gene names in the input with their corresponding positions
        let value_parts = this.state.value.split(/[ -]/);
        let q = queue();

        for (let i = 0; i < value_parts.length; i++) {
            if (value_parts[i].length == 0)
                continue

            let [chr, pos, retPos] = this.searchField.parsePosition(value_parts[i]);

            if (retPos == null || isNaN(retPos)) {
                // not a chromsome position, let's see if it's a gene name
               let url = this.state.autocompleteServer + "/suggest/?d=" + this.state.autocompleteId  + "&ac=" + value_parts[i].toLowerCase();
               q = q.defer(json, url);

            }
        }

        q.awaitAll((error, files) => {
            if (files) {
                let genePositions = {};

                // extract the position of the top match from the list of files
                for (let i = 0; i < files.length; i++) {
                    if (!files[i][0])
                        continue;

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
        this.setState({'genes': []});  //no menu should be open

        this.replaceGenesWithPositions(function() {
            let searchFieldValue = this.state.value; //ReactDOM.findDOMNode( this.refs.searchFieldText ).value;

            if (this.searchField != null) {
                let [range1, range2] = this.searchField.searchPosition(searchFieldValue);

                if ((range1 && (isNaN(range1[0]) || isNaN(range1[1]))) ||
                    (range2 && (isNaN(range2[0]) || isNaN(range2[1])))) {
                    return;
                }

                if (!range2)
                    range2 = range1;

                let newXScale = this.xScale.copy().domain(range1);
                let newYScale = this.yScale.copy().domain(range2);

                let [centerX, centerY, k] = scalesCenterAndK(newXScale, newYScale);

                this.props.setCenters(centerX, centerY, k, true);
            }
        }.bind(this));
    }

    searchFieldSubmit () {
        this.buttonClick();
    }

    pathJoin(parts, sep){
        var separator = sep || '/';
        var replace   = new RegExp(separator+'{1,}', 'g');
        return parts.join(separator).replace(replace, separator);
    }


    onAutocompleteChange(event, value) {
        this.setState({ value, loading: true });

        let parts = value.split(/[ -]/);
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

        // no autocomplete repository is provided, so we don't try to autcomplete anything
        if (!(this.state.autocompleteServer && this.state.autocompleteId))
            return;

        if (this.changedPart != null) {
            // if something has changed in the input text
            this.setState({loading: true});
            // send out a request for the autcomplete suggestions
            let url = this.state.autocompleteServer + "/suggest/?d=" + this.state.autocompleteId +  "&ac=" + parts[this.changedPart].toLowerCase();
            json(url, (error, data) => {
                if (error) {
                    this.setState({loading: false, genes: []});
                    return;
                }

                // we've received a list of autocomplete suggestions
                this.setState({loading: false, genes: data });
            });
        }
    }

    componentWillUnmount() {
        this.props.removeViewportChangedListener();
    }

    geneSelected(value, objct) {

        let parts = this.state.value.split(' ');
        let partCount = this.changedPart;

        // change the part that was selected
        for (let i = 0; i < parts.length; i++) {
            let dash_parts = parts[i].split('-');
            if (partCount > dash_parts.length-1) {
               partCount -= dash_parts.length;
            } else {
                dash_parts[partCount] = objct.geneName;
                parts[i] = dash_parts.join('-')
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
        this.setState({value: parts.join(' '), genes: []});
    }

    handleMenuVisibilityChange(isOpen) {
        let box = this.autocompleteMenu.refs.input.getBoundingClientRect();

        this.menuPosition = {left: box.left, top: box.top + box.height};

        this.setState({
            menuOpened: isOpen
        });
    }

    handleRenderMenu(items, value, style) {

        return( <PopupMenu
                    children={items}
                >
                <div style={{
                            position: 'absolute',
                            'left': this.menuPosition.left,
                            'top': this.menuPosition.top,
                              borderRadius: '3px',
                              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
                              background: 'rgba(255, 255, 255, 0.9)',
                              padding: '2px 0',
                              fontSize: '90%',
                              position: 'fixed',
                              overflow: 'auto',
                              maxHeight: '50%' // TODO: don't cheat, let it flow to the bottom
                }} children={items}/>

                </PopupMenu>)
        //return (<PopupMenu ></PopupMenu>)

    }

    handleAssemblySelect(evt) {
        this.fetchChromInfo(evt);

        this.setState({
            selectedAssembly: evt
        });
    }

    render() {
        let assemblyMenuItems = this.state.availableAssemblies.map(x => {
            return (<MenuItem
                        key={x}
                        eventKey={x}
                    >
                        {x}
                    </MenuItem>)
        });
        return(
            <FormGroup
                bsSize="small"
                className="genome-position-search"
            >

                <DropdownButton
                    bsSize={"small"}
                    className={'assembly-pick-button'}
                    id={this.uid}
                    onSelect={this.handleAssemblySelect.bind(this)}
                    ref={c => this.assemblyPickButton = c}
                    title={this.state.selectedAssembly ? this.state.selectedAssembly : "(none)"}
                >
                    {assemblyMenuItems}
                </DropdownButton>

                <Autocomplete
                    getItemValue={(item) => item.geneName}
                    inputProps={{"className": "search-bar"}}
                    items={this.state.genes}
                    menuStyle={{position:'absolute',
                        'left': this.menuPosition.left,
                        'top': this.menuPosition.top,
                        border: '1px solid black'
                    }}
                    onChange={this.onAutocompleteChange.bind(this)}
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
                    value={this.state.value}
                    wrapperStyle={{width: "100%"}}
                />

                <Button bsSize="small" onClick={this.buttonClick.bind(this)}>
                    <Glyphicon glyph="search"></Glyphicon>
                </Button>
            </FormGroup>
            );
    }

}

export default GenomePositionSearchBox;
