import React from 'react';

import {TiledPlot} from './TiledPlot.jsx';

export class SearchableTiledPlot extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (<TiledPlot 
                tracks={{'top': [1,2,3], 'left': [4], 'center': [5]}}
                />)
    }
}
