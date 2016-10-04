import d3 from 'd3';
import React from 'react';
import ReactDOM from 'react-dom';
import slugid from 'slugid';
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

        ReactDOM.findDOMNode( this.refs.searchFieldText).value = positionString;
    }

    buttonClick() {
        let searchFieldValue = ReactDOM.findDOMNode( this.refs.searchFieldText ).value;

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
                defaultValue="chr4:190,998,876-191,000,255" 
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
