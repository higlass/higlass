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

        let tracks = {
                          'top': [{'height': 20, 'value': ''},
                                 {'height': 20, 'value': ''},
                                 {'height': 30, 'value': ''}],
                         'left': [{'width': 20, 'value': ''},
                                  {'width': 20, 'value': ''},
                                  {'width': 30, 'value': ''}], 
                         'right': [{'width': 20, 'value': ''},
                                  {'width': 20, 'value': ''},
                                  {'width': 30, 'value': ''}], 
                          'bottom': [{'height': 20, 'value': ''},
                                 {'height': 20, 'value': ''},
                                 {'height': 30, 'value': ''}],

                         'center': {'height': 40, 'width': 40, 'value': 20}
                        }

        let topTracks = {
                          'top': [{'height': 20, 'value': 1},
                                 {'height': 20, 'value': 2},
                                 {'height': 30, 'value': 3}],
                          'left': [], 'right': [], 'bottom': [], 'center': []}
                            

        return (<TiledPlot 
                tracks={tracks}
                />)
    }
}

SearchableTiledPlot.propTypes = {
    height: React.PropTypes.number,
    width: React.PropTypes.number
}
