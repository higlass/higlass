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
        let divStyle = {float: 'left', width: '100%'};
        return (
            <div style={divStyle} className="MultiViewContainer">
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

