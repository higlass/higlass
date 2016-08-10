import React from 'react';
import {FormGroup,FormControl,InputGroup,Glyphicon} from 'react-bootstrap';
import {ChromosomeInfo} from './ChromosomeInfo.js';

export class GenomePositionSearchBox extends React.Component {
    constructor(props) {
        super(props);
        
        this.chromInfo = null;

        ChromosomeInfo(this.props.chromInfoPath, (newChromInfo) => {
            this.chromInfo = newChromInfo;  
        });

    }

    render() {
        return(
        <FormGroup>
            <InputGroup>
            <FormControl type="text" />
            <InputGroup.Addon>
            <Glyphicon glyph="search" />
            </InputGroup.Addon>
            </InputGroup>
            </FormGroup>
            );
    }
}
