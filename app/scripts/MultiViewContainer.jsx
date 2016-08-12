import React from 'react';
import slugid from 'slugid';
import {MultiTrackContainer} from './MultiTrackContainer.jsx';

export class MultiViewContainer extends React.Component {
    constructor(props) {
        console.log('hi');
        super(props);

    }
    
    render() {
        console.log('rendering multi view container', this.props.viewConfig);
        let divStyle = {float: 'left'};
        return (
            <div style={divStyle}>
                { this.props.viewConfig.map(function(view, i) 
                    {
                    return (<MultiTrackContainer
                        viewConfig ={view}
                        key={slugid.nice()}
                        />)
                    })
                }
            </div>
        );
    }
}
