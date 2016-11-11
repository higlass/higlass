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

        return (<TiledPlot 
                tracks={{
                          'top': [{'height': 20, 'value': 1},
                                 {'height': 20, 'value': 2},
                                 {'height': 30, 'value': 3}],
                         'left': [{'width': 20, 'value': 4},
                                  {'width': 20, 'value': 5},
                                  {'width': 30, 'value': 6}], 
                         'right': [{'width': 20, 'value': 7},
                                  {'width': 20, 'value': 8},
                                  {'width': 30, 'value': 9}], 
                          'bottom': [{'height': 20, 'value': 1},
                                 {'height': 20, 'value': 2},
                                 {'height': 30, 'value': 3}],

                         'center': {'height': 40, 'width': 40, 'value': 20}
                        }}
                />)
    }
}
