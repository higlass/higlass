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
        return (
                <div style={{width: "100%", height: "100%"}}>
                    { this.props.children }
                </div>
               )
    }
}

SearchableTiledPlot.propTypes = {
    height: React.PropTypes.number,
    width: React.PropTypes.number
}
