import React from 'react';
import ReactDOM from 'react-dom';
import slugid from 'slugid';

import {TiledPlot} from './TiledPlot.jsx';

export class SearchableTiledPlot extends React.Component {
    constructor(props) {
        super(props);

        this.uid = slugid.nice();
    }

    render() {
        return (
                <div style={{flex: 1, display: "flex", flexDirection: "column"}} >
                    { this.props.children }
                </div>
               )
    }
}

SearchableTiledPlot.propTypes = {
    height: React.PropTypes.number,
    width: React.PropTypes.number
}
