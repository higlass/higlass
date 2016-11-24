import React from 'react';
import ReactDOM from 'react-dom';
import slugid from 'slugid';

import {TiledPlot} from './TiledPlot.jsx';

export class SearchableTiledPlot extends React.Component {
    constructor(props) {
        super(props);

        this.width = 50;
        this.height = 50;

        this.uid = slugid.nice();
    }

    render() {
        return (<TiledPlot 
                    svgElement={this.props.svgElement}
                    canvasElement={this.props.canvasElement}
                />)
    }
}

SearchableTiledPlot.propTypes = {
    height: React.PropTypes.number,
    width: React.PropTypes.number
}
