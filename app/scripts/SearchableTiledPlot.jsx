import React from 'react';
import ReactDOM from 'react-dom';

import {TiledPlot} from './TiledPlot.jsx';

export class SearchableTiledPlot extends React.Component {
    constructor(props) {
        super(props);

        this.width = 50;
        this.height = 50;
    }

    render() {
        console.log('searchabletiledplot width:', this.props.width);
        console.log('searchabletiledplot height:', this.props.height);


        return (<TiledPlot />)
    }
}

SearchableTiledPlot.propTypes = {
    height: React.PropTypes.number,
    width: React.PropTypes.number
}
