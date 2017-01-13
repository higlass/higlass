import {bisector} from 'd3-array';
import {format} from 'd3-format';
import {json} from 'd3-request';
import {queue} from 'd3-queue';
import {scaleLinear} from 'd3-scale';
import React from 'react';
import ReactDOM from 'react-dom';
import slugid from 'slugid';
import Autocomplete from './Autocomplete.js';
import {FormGroup,FormControl,InputGroup,Glyphicon,Button} from 'react-bootstrap';
import {ChromosomeInfo} from './ChromosomeInfo.js';
import {SearchField} from './search_field.js';
import {scalesCenterAndK} from './utils.js';
import {PopupMenu} from './PopupMenu.jsx';

export class GenomePositionSearchBox extends React.Component {
    constructor(props) {
        super(props);
        
        this.uid = slugid.nice();
        this.chromInfo = null;
        this.chromInfoBisector = bisector((d) => { return d.pos }).left;
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

        ChromosomeInfo(this.props.chromInfoPath, (newChromInfo) => {
            this.chromInfo = newChromInfo;  
            this.searchField = new SearchField(this.chromInfo);

            this.setPositionText();
        });

        this.props.registerViewportChangedListener(this.scalesChanged.bind(this));

        this.menuPosition = {left:0, top:0};

        this.state = {
            value: "chr4:190,998,876-191,000,255",
            loading: false,
            menuPosition: [0,0],
            genes: [],
            menuOpened: false
        };

        this.styles = {
                  item: {
                    padding: '2px 6px',
                    cursor: 'default',
                    "zIndex": 1000
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
    }

    absoluteToChr(absPosition) {
        let insertPoint = this.chromInfoBisector(this.chromInfo.cumPositions, absPosition);


        if (insertPoint > 0)
            insertPoint -= 1;

        return [this.chromInfo.cumPositions[insertPoint].chr,
                absPosition - this.chromInfo.cumPositions[insertPoint].pos];
    }

    scalesChanged(xScale, yScale) {
        this.xScale = xScale, this.yScale = yScale;

        this.setPositionText();
    }

    zoomed(translate, scale) {
        this.xOrigScale.domain(this.props.xDomain);
        this.yOrigScale.domain(this.props.yDomain);

        this.xOrigScale.range(this.props.xRange);
        this.yOrigScale.range(this.props.yRange);

        this.zoomedXScale.range(this.xOrigScale.range());
        this.zoomedXScale.domain(this.xOrigScale.range()
                                  .map(function(x) { return (x - translate[0]) / scale })
                                  .map(this.xOrigScale.invert))

        this.zoomedYScale.range(this.yOrigScale.range());
        this.zoomedYScale.domain(this.yOrigScale.range()
                                  .map(function(y) { return (y - translate[1]) / scale })
                                  .map(this.yOrigScale.invert))
        this.setPositionText();
    }

    setPositionText() {
        if (this.chromInfo == null)
            return;                 // chromosome info hasn't been loaded yet

        if (!this.xScale || !this.yScale)
            return;

        let x1 = this.absoluteToChr(this.xScale.domain()[0]);
        let x2 = this.absoluteToChr(this.xScale.domain()[1]);

        let y1 = this.absoluteToChr(this.yScale.domain()[0]);
        let y2 = this.absoluteToChr(this.yScale.domain()[1]);

        let positionString = null;
        let stringFormat = format(",d")

        if (x1[0] != x2[0])
            positionString = x1[0] + ':' + stringFormat(Math.floor(x1[1])) + '-' + x2[0] + ':' + stringFormat(Math.ceil(x2[1]));
        else
            positionString = x1[0] + ':' + stringFormat(Math.floor(x1[1])) + '-' + stringFormat(Math.ceil(x2[1]));

        if (this.props.twoD) {
            if (y1[0] != y2[0])
                positionString += " and " +  y1[0] + ':' + stringFormat(Math.floor(y1[1])) + '-' + y2[0] + ':' + stringFormat(Math.ceil(y2[1]));
            else
                positionString += " and " +  y1[0] + ':' + stringFormat(Math.floor(y1[1])) + '-' + stringFormat(Math.ceil(y2[1]));
        }

        this.prevParts = positionString.split(/[ -]/);

        //ReactDOM.findDOMNode( this.refs.searchFieldText).value = positionString;
        this.setState({"value": positionString});
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
                    //console.log("Error: gene position undefined...", dashParts[j].toLowerCase()); 
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
               let url = this.props.autocompleteSource + "ac=" + value_parts[i].toLowerCase(); 
               q = q.defer(json, url);
                  
            }
        }

        q.awaitAll((error, files) => {
            if (files) {
                let genePositions = {};

                // extract the position of the top match from the list of files
                for (let i = 0; i < files.length; i++) {
                    genePositions[files[i][0].geneName.toLowerCase()] =
                        files[i][0];
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
                //console.log('centerX:', centerX, 'centerY:', centerY, 'k:', k);
                this.props.setCenters(centerX, centerY, k);
            }
        }.bind(this));
    }

    searchFieldKeyPress(target) {
        // if the user hits enter, act as if they clicked the button
        /*
        if (target.charCode == 13) {
            this.buttonClick();
        }
        */
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
        if (!this.props.autocompleteSource)
            return;

        if (this.changedPart != null) {
            // if something has changed in the input text
            this.setState({loading: true});
            // send out a request for the autcomplete suggestions
            let url = this.props.autocompleteSource + "ac=" + parts[this.changedPart].toLowerCase();
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

        //console.log('box:', box);
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

    render() {
        return(
                <FormGroup bsSize='small'>
                <InputGroup>
                    <div 
                        style={{"zIndex": 999, "position": "relative"}}>
                    <Autocomplete
                        ref={c => this.autocompleteMenu = c}
                        value={this.state.value}
                        items={this.state.genes}
                        onChange = {this.onAutocompleteChange.bind(this)}
                        onSelect={(value, objct) => this.geneSelected(value, objct) }
                        onKeyDown={ this.searchFieldKeyPress.bind(this) }
                        getItemValue={(item) => item.geneName}
                        inputProps={{"className": "form-control"}}
                        wrapperStyle={{width: "100%"}}
                        onMenuVisibilityChange={this.handleMenuVisibilityChange.bind(this)}
                        menuStyle={{position:'absolute',
                            'left': this.menuPosition.left,
                            'top': this.menuPosition.top,
                            border: '1px solid black'
                        }}
                        renderItem={(item, isHighlighted) => (
                            <div
                              style={isHighlighted ? this.styles.highlightedItem : this.styles.item}
                              key={item.refseqid}
                              id={item.refseqid}
                            >{item.geneName}</div>
                          )}
                        renderMenu={this.handleRenderMenu.bind(this)}
                    />
                    </div>

                <InputGroup.Button>

                    <div style={{"zIndex": 1000, "position": "relative"}}>
                        <Button bsSize="small" onClick={this.buttonClick.bind(this)}>
                        <Glyphicon glyph="search"></Glyphicon>
                        </Button>
                    </div>
                </InputGroup.Button>
                </InputGroup>
                </FormGroup>
            );
    }

}
                /*
                */
