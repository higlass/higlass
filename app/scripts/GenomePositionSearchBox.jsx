import React from 'react';
import ReactDOM from 'react-dom';
import {FormGroup,FormControl,InputGroup,Glyphicon,Button} from 'react-bootstrap';
import {ChromosomeInfo} from './ChromosomeInfo.js';
import {SearchField} from './search_field.js';

export class GenomePositionSearchBox extends React.Component {
    constructor(props) {
        super(props);
        
        this.chromInfo = null;
        this.searchField = null; 

        ChromosomeInfo(this.props.chromInfoPath, (newChromInfo) => {
            this.chromInfo = newChromInfo;  
            this.searchField = new SearchField(this.chromInfo);
        });

    }

    buttonClick() {
        let searchFieldValue = ReactDOM.findDOMNode( this.refs.searchFieldText ).value;
        console.log('value:', searchFieldValue);

        if (this.searchField != null) {
            let [range1, range2] = this.searchField.searchPosition(searchFieldValue);

            this.props.zoomToGenomePositionHandler(range1, range2);
        }
    }

    searchFieldKeyPress(target) {
        // if the user hits enter, act as if they clicked the button
        if (target.charCode == 13) {
            this.buttonClick();
        }
    }

    render() {
        return(
                <FormGroup bsSize='small'>
                <InputGroup>
                <FormControl type="text" onKeyPress={this.searchFieldKeyPress.bind(this)} ref="searchFieldText"
                //defaultValue="chr2:100000000 to chr2:200000000" 
                defaultValue="chrX:12900000 to chrX:12970000" 
                />
                <InputGroup.Button>
                    <Button bsSize='small' onClick={this.buttonClick.bind(this)}>
                    <Glyphicon glyph='search'></Glyphicon>
                    </Button>
                </InputGroup.Button>
                </InputGroup>
                </FormGroup>
            );
    }
}
