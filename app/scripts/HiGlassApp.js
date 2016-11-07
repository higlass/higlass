import '../styles/HiGlassApp.css';
import React from 'react';
import ReactDOM from 'react-dom';
import slugid from 'slugid';
import {MultiViewContainer} from './MultiViewContainer.jsx';
import {MultiTrackContainer} from './MultiTrackContainer.jsx';
import {MultiTrackEditContainer} from './MultiTrackContainer.jsx';
import {HiGlassInput} from './HiGlassInput.jsx';
import {Button, Panel, FormGroup, ControlLabel, FormControl, SafeAnchor} from 'react-bootstrap';

export class HiGlassApp extends React.Component {
    constructor(props) {
        super(props);

    this.defaultViewString = JSON.stringify(JSON.parse(this.props.viewConfigString), null, 2);

    this.state = {
        //viewConfig : []

        viewConfig : { 
            object: JSON.parse(this.props.viewConfigString),
            text: JSON.stringify(JSON.parse(this.props.viewConfigString))
        },
        inputOpen: false
    }

    console.log('this.state:', this.state);
    this.updateLinkedViews(this.state.viewConfig.object);

    }

    updateLinkedViews(viewConfig) {
        console.log('updating linked views:', viewConfig);
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
             viewConfig : { 
                 object: viewConfig,
                 text: JSON.stringify(viewConfig)
             }
         });

    };
        
    handleOpen() {
        console.log('handling open...');
        this.setState({
            'inputOpen': !this.state.inputOpen
        });
    }

    handleViewEdit(newViewConfig) {

    }

    render() {
        /*
        let divStyle = {"paddingLeft": "20px",
                        "paddingRight": "20px"}
        */
       let divStyle = {};

        let toolbarStyle = {"position": "relative",
                       "top": "-1px"};
                    /*
                    <MultiViewEditContainer viewConfig={this.state.viewConfig}
                    handleEdit={this.handleViewEdit.bind(this)}
                    visible={this.state.inputOpen}
                        />
                        */

        return (
                <div style={divStyle}>

                <Panel 
                    ref='displayPanel'
                    className="higlass-display"
                    >
                    <MultiViewContainer 
                        onNewConfig={this.handleNewConfig.bind(this)}
                        viewConfig={this.state.viewConfig} 
                    >
                    { 
                        this.state.viewConfig.object.views.map(function(view, i) 
                                                             {
                                                                 return (<MultiTrackContainer
                                                                         viewConfig ={view}
                                                                         key={slugid.nice()}
                                                                         />)
                                                             })
                    }
                    </MultiViewContainer>

                </Panel>
                { (() => { if (this.state.viewConfig.object.editable) {
                return <HiGlassInput currentConfig={this.defaultViewString} 
                        onNewConfig={this.handleNewConfig.bind(this)} 
                        inputOpen={this.state.inputOpen}
                        handleOpen={this.handleOpen.bind(this)}
                        />
                                                      }})() }
                </div>
        );
    }
}

