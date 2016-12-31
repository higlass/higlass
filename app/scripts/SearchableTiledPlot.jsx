import React from 'react';
import ReactDOM from 'react-dom';
import slugid from 'slugid';

import {ResizeSensor,ElementQueries} from 'css-element-queries';
import {TiledPlot} from './TiledPlot.jsx';

export class SearchableTiledPlot extends React.Component {
    constructor(props) {
        super(props);

        this.uid = slugid.nice();
        this.div = null;
    }

    componentDidMount() {
    }

    render() {
        return (
                <div 
                ref={c => this.div = c}
                style={{flex: 1, display: "flex", flexDirection: "column"}} >
                    { this.props.children }
                </div>
               )
    }
}

SearchableTiledPlot.propTypes = {
    height: React.PropTypes.number,
    width: React.PropTypes.number
}
