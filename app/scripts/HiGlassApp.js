import '../styles/HiGlassApp.css';
import React from 'react';
import ReactDOM from 'react-dom';
import {MultiViewContainer} from './MultiViewContainer.jsx';
import {HiGlassInput} from './HiGlassInput.jsx';
import {Button, Panel, FormGroup, ControlLabel, FormControl, SafeAnchor} from 'react-bootstrap';

export class HiGlassApp extends React.Component {
    constructor(props) {
        super(props);

    this.defaultViewString = JSON.stringify(JSON.parse(this.props.viewConfigString), null, 2);

    this.state = {
        //viewConfig : []

        viewConfig : JSON.parse(this.props.viewConfigString),
        inputOpen: false
    }

    this.updateLinkedViews(this.state.viewConfig);

    }

    updateLinkedViews(viewConfig) {
        for (let i = 0; i < viewConfig.views.length; i++) {
            if (typeof viewConfig.views[i].zoomLock ==  'undefined')
                viewConfig.views[i].zoomDispatch = d3.dispatch('zoom', 'zoomend')
            else {
                let zoomLock = viewConfig.views[i].zoomLock;
                if (typeof viewConfig.views[zoomLock].zoomDispatch == 'undefined') {
                    console.log('WARNING: view requests zoom lock to another view with an undefined zoomDispatch:', zoomLock);
                    viewConfig.views[i].zoomDispatch = d3.dispatch('zoom', 'zoomend')
                } else {
                    viewConfig.views[i].zoomDispatch = viewConfig.views[zoomLock].zoomDispatch;
                }
            }
        }

    }

    handleNewConfig(configText) {
        let viewConfig = JSON.parse(configText);
        this.updateLinkedViews(viewConfig);

        this.setState(
         {
             viewConfig : viewConfig
         });

    };
        

    render() {
        /*
        let divStyle = {"paddingLeft": "20px",
                        "paddingRight": "20px"}
        */
       let divStyle = {};

        let toolbarStyle = {"position": "relative",
                       "top": "-1px"};

        return (
                <div style={divStyle}>

                <Panel 
                    ref='displayPanel'
                    className="higlass-display"
                    >
                    <MultiViewContainer viewConfig={this.state.viewConfig.views}
                    />
                </Panel>
                { (() => { if (this.state.viewConfig.editable) {
                return <HiGlassInput currentConfig={this.defaultViewString} 
                        onNewConfig={this.handleNewConfig.bind(this)} 
                        />
                                                      }})() }
                </div>
        );
    }
}

