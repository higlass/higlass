import '../styles/TrackOptions.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { CompactPicker } from 'react-color';
import {MultiViewContainer} from './MultiViewContainer.jsx';
import slugid from 'slugid';

import {Modal,Button,FormGroup,FormControl,ControlLabel,HelpBlock} from 'react-bootstrap';

export class HeatmapOptions extends React.Component {
    constructor(props) {
        super(props);
        // props should include the definition of the heatmap data series
        
        this.state = {
            fromColor : props.track.options.colorRange[0],
            toColor : props.track.options.colorRange[1]
        }

    }

    handleColorsChanged(fromColor, toColor) {
        this.props.onTrackOptionsChanged(Object.assign(this.props.track.options,
                                                       {colorRange: [fromColor, 
                                                           toColor]}));
        this.setState({
            fromColor: fromColor,
            toColor, toColor
        });
    }

    handleSubmit() {
        let options = this.props.track.options;

        options.colorRange = [this.state.fromColor, this.state.toColor];

        this.props.onSubmit(this.props.track.options);
    }

    render() {
        let leftAlign = {'textAlign': 'left'}
        let rightAlign = {'textAlign': 'right'}
        let centerAlign = {'textAlign': 'center'}

        let centerTrack = Object.assign(this.props.track, 
                                        {height: 100,
                                            options: {
                                         colorRange: [this.state.fromColor, 
                                                      this.state.toColor]
                                        }} );

        let mvConfig = {
            'editable': false,
            zoomFixed: true,
            'views': [{

            'uid': 'hmo-' + this.props.track.uid,
            'initialXDomain': this.props.xScale ? this.props.xScale.domain() : [0,1],
            'initialYDomain': this.props.yScale ? this.props.yScale.domain() : [0,1],
            'tracks': {'center': [centerTrack] }
        }]};

        return(<Modal 
                onHide={this.props.handleCancel}
                show={true}
                >
                    <Modal.Header closeButton>
                    <Modal.Title>{'Heatmap Options'}</Modal.Title> 
                    </Modal.Header>
                    <Modal.Body>
                        <table className='table-track-options'>
                            <thead></thead>
                            <tbody>
                                <tr>
                                    <td className='td-track-options' style={centerAlign}>
                                    {'From color'}<br/>
                                    <CompactPicker 
                                        color={this.state.fromColor}
                                        onChangeComplete = {(color) =>
                                            this.handleColorsChanged(color.hex,
                                                                     this.state.toColor)
                                        }
                                    /></td>
                                 <td rowSpan="2" className='td-track-options'>
                                 <div style={{width:250}}>
                                    Preview:
                                    <MultiViewContainer 
                                        viewConfig={mvConfig}
                                    />
                                </div>
                                 
                                 </td>
                                </tr>
                                <tr>
                                    <td className='td-track-options' style={centerAlign}>
                                    {'To color'}<br/>
                                    <CompactPicker 
                                        color={this.state.toColor}
                                        onChangeComplete={(color) =>
                                        this.handleColorsChanged(this.state.fromColor,
                                                                 color.hex)
                                        }
                                    />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={this.props.onCancel}>Cancel</Button>
                        <Button onClick={this.handleSubmit.bind(this)}>Submit</Button>
                    </Modal.Footer>
               </Modal>)

    }
}
