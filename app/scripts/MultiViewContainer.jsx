import React from 'react';
import slugid from 'slugid';
import ReactDOM from 'react-dom';
import {MultiTrackContainer} from './MultiTrackContainer.jsx';

export class MultiViewContainer extends React.Component {
    constructor(props) {
        console.log('hi');
        super(props);
    }

    componentWillReceiveProps(newProps) {
        console.log('newProps:', newProps);
    }


    render() {
        console.log('rendering multi view container', this.props.viewConfig);
        let divStyle = {float: 'left', width: '50%'};
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

