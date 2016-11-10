import React from 'react';
import slugid from 'slugid';
import ReactDOM from 'react-dom';
import {MultiTrackContainer} from './MultiTrackContainer.jsx';
import {MultiTrackEditContainer} from './MultiTrackEditContainer.jsx';

export class MultiViewEditContainer extends React.Component {
    constructor(props) {
        console.log('hi', props);
        super(props);
    }

    componentWillReceiveProps(newProps) {
        console.log('newProps:', newProps);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return true;
    }

    render() {
        let divStyle = {float: 'left', width: '100%'};
        return (
            <div style={divStyle} className="MultiViewEditContainer">
                { this.props.viewConfig.object.views.map(function(view, i) 
                    {
                    return (<MultiTrackEditContainer
                        viewConfig ={view}
                        key={slugid.nice()}
                        />)
                    })
                }
            </div>
        );
    }
}

