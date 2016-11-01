import d3 from 'd3';
import {queue} from 'd3-queue';
import React from 'react';
import ReactDOM from 'react-dom';
import slugid from 'slugid';
import Autocomplete from 'react-autocomplete';
import {FormGroup,FormControl,InputGroup,Glyphicon,Button} from 'react-bootstrap';
import {ChromosomeInfo} from './ChromosomeInfo.js';
import {SearchField} from './search_field.js';

export class GenomePositionSearchBox extends React.Component {
    constructor(props) {
        super(props);
        
        this.uid = slugid.nice();
        this.chromInfo = null;
        this.chromInfoBisector = d3.bisector((d) => { return d.pos }).left;
        this.searchField = null; 
        this.props.zoomDispatch.on('zoom.' + this.uid, this.zoomed.bind(this))

        this.xOrigScale = d3.scale.linear().domain(this.props.xDomain)
                          .range(this.props.xRange);
        this.yOrigScale = d3.scale.linear().domain(this.props.yDomain)
                          .range(this.props.yRange);

        this.zoomedXScale = this.xOrigScale.copy();
        this.zoomedYScale = this.yOrigScale.copy();

        ChromosomeInfo(this.props.chromInfoPath, (newChromInfo) => {
            this.chromInfo = newChromInfo;  
            this.searchField = new SearchField(this.chromInfo);

            this.setPositionText();
        });

        this.state = {
            value: "chr4:190,998,876-191,000,255",
            loading: false,
            genes: []
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

        let x1 = this.absoluteToChr(this.zoomedXScale.domain()[0]);
        let x2 = this.absoluteToChr(this.zoomedXScale.domain()[1]);

        let y1 = this.absoluteToChr(this.zoomedYScale.domain()[0]);
        let y2 = this.absoluteToChr(this.zoomedYScale.domain()[1]);

        let positionString = null;
        let format = d3.format(",d")

        if (x1[0] != x2[0])
            positionString = x1[0] + ':' + format(Math.floor(x1[1])) + '-' + x2[0] + ':' + format(Math.ceil(x2[1]));
        else
            positionString = x1[0] + ':' + format(Math.floor(x1[1])) + '-' + format(Math.ceil(x2[1]));

        if (this.props.twoD) {
            if (y1[0] != y2[0])
                positionString += " and " +  y1[0] + ':' + format(Math.floor(y1[1])) + '-' + y2[0] + ':' + format(Math.ceil(y2[1]));
            else
                positionString += " and " +  y1[0] + ':' + format(Math.floor(y1[1])) + '-' + format(Math.ceil(y2[1]));
        }

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

                if (dashParts.length == 1) {
                    // no range, just a position
                    console.log('genePosition:', genePosition);
                    dashParts[j] = genePosition.chr + ":" + genePosition.txStart + '-' + genePosition.txEnd;
                } else {
                    if (j == 0) {
                        // first part of a range

                        dashParts[j] = genePosition.chr + ":" + genePosition.txStart;
                    } else {
                        // last part of a range

                        dashParts[j] = genePosition.chr + ":" + genePosition.txEnd;
                    }
                } 

                spaceParts[i] = dashParts.join('-');
            }
        }

        let newValue = spaceParts.join(' ');
        this.setState({value: newValue});
    }

    replaceGenesWithPositions(finished) {
        // replace any gene names in the input with their corresponding positions
        let value_parts = this.state.value.split(/[ -]/);
        let q = queue();

        for (let i = 0; i < value_parts.length; i++) {
            let [chr, pos, retPos] = this.searchField.parsePosition(value_parts[i]);

            console.log('value_parts:', value_parts[i], 'chr:', chr, 'pos:', pos, 'retPos:', retPos);

            if (retPos == null) {
                // not a chromsome position, let's see if it's a gene name
               let url = this.props.autocompleteSource + "/ac_" + value_parts[i].toLowerCase(); 
               q = q.defer(d3.json, url);
                  
            }
        }

        q.awaitAll((error, files) => {
            let genePositions = {};

            // extract the position of the top match from the list of files
            for (let i = 0; i < files.length; i++) {
                genePositions[files[i]._source.suggestions[0].geneName.toLowerCase()] =
                    files[i]._source.suggestions[0];
            }

            this.replaceGenesWithLoadedPositions(genePositions);

            finished();
        });
        //console.log('value_parts:', value_parts);
    }

    buttonClick() {
        this.replaceGenesWithPositions(function() {
            let searchFieldValue = this.state.value; //ReactDOM.findDOMNode( this.refs.searchFieldText ).value;
            console.log('searchFieldValue:', searchFieldValue);

            if (this.searchField != null) {
                let [range1, range2] = this.searchField.searchPosition(searchFieldValue);

                this.props.zoomToGenomePositionHandler(range1, range2);
            }
        }.bind(this));
    }

    searchFieldKeyPress(target) {
        // if the user hits enter, act as if they clicked the button
        if (target.charCode == 13) {
            this.buttonClick();
        }
    }

    pathJoin(parts, sep){
        var separator = sep || '/';
        var replace   = new RegExp(separator+'{1,}', 'g');
        return parts.join(separator).replace(replace, separator);
    }


    onAutocompleteChange(event, value) {
        console.log('autocomplete change value:', value);
        this.setState({ value, loading: true });

        let parts = value.split(' ');
        console.log('parts', parts);

        console.log('this.props.autocompleteSource', this.props.autocompleteSource);
        // no autocomplete repository is provided, so we don't try to autcomplete anything
        if (!this.props.autocompleteSource)
            return;

        this.setState({loading: true});
        // send out a request for the autcomplete suggestions
        let url = this.props.autocompleteSource + "/ac_" + parts[parts.length-1];
        d3.json(url, (error, data) => {
            if (error) {
                this.setState({loading: false, genes: []});
                return;
            }

            // we've received a list of autocomplete suggestions
            this.setState({loading: false, genes: data._source.suggestions }); 
        });
    }

    geneSelected(value, objct) {
        console.log('value:', value, 'object', objct);

        let parts = this.state.value.split(' ')
        let valid_parts = parts.slice(0, parts.length-1);

        this.setState({value: valid_parts.concat(objct.geneName).join(" ")});
        console.log('valid_parts');
    }

    render() {
        return(
                <FormGroup bsSize='small'>
                <InputGroup>
                    <div style={{"zIndex": 999, "position": "relative"}}>
                    <Autocomplete
                        value={this.state.value}
                        items={this.state.genes}
                        onChange = {this.onAutocompleteChange.bind(this)}
                         onSelect={(value, objct) => this.geneSelected(value, objct) }
                        getItemValue={(item) => item.geneName}
                        inputProps={{"className": "form-control"}}
                        wrapperStyle={{width: "100%"}}
                        renderItem={(item, isHighlighted) => (
                            <div
                              style={isHighlighted ? this.styles.highlightedItem : this.styles.item}
                              key={item.refseqid}
                              id={item.refseqid}
                            >{item.geneName}</div>
                          )}
                    />
                    </div>

                <InputGroup.Button>
                    <Button bsSize="small" onClick={this.buttonClick.bind(this)}>
                    <Glyphicon glyph="search"></Glyphicon>
                    </Button>
                </InputGroup.Button>
                </InputGroup>
                </FormGroup>
            );
    }
}
                /*
                */
