import '../styles/TrackOptions.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { CompactPicker } from 'react-color';
import {MultiViewContainer} from './MultiViewContainer.jsx';
import SketchInlinePicker from './SketchInlinePicker.jsx';
import slugid from 'slugid';

import {Modal,Button,FormGroup,FormControl,ControlLabel,HelpBlock} from 'react-bootstrap';

export class HeatmapOptions extends React.Component {
    constructor(props) {
        super(props);
        // props should include the definition of the heatmap data series
        
        this.state = {
            fromColor : props.track.options.colorRange[0],
            toColor : props.track.options.colorRange[1],
            colors: props.track.options.colorRange
        }

    }

    handleColorsChanged(fromColor, toColor) {
        this.props.onTrackOptionsChanged(Object.assign(this.props.track.options,
                                                       {colorRange: [fromColor, 
                                                           toColor]}));
        this.setState({
            fromColor: fromColor,
            toColor: toColor
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

        let colorRow = {height: 10}

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

        let colorFields = this.state.colors.map((x,i) => {
            console.log('i:', i);
            return(<td
                        key={"l" + i}
                        style={{ border: "0px solid", 
                                 position: "relative",
                                 outline: "none",
                        }}
                   >
                            <img 
                                onClick={() => { this.handleCloseView(view.uid)}}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    right: 0,
                                    opacity: 0.5
                                }}
                                src="images/cross.svg" 
                                width="10px" 
                            />
                        <SketchInlinePicker 
                            key={i}
                            onChange={c => {
                                    this.state.colors[i] = c;
                                    this.setState({
                                        colors: this.state.colors
                                    });
                                }
                            }
                        />
                    </td>);
        });

        return(<Modal 
                onHide={this.props.handleCancel}
                show={true}
                >
                    <Modal.Header closeButton>
                    <Modal.Title>{'Heatmap Options'}</Modal.Title> 
                    </Modal.Header>
                    <Modal.Body>
                        <div style={{marginBottom: 5}}>
                            Heatmap colors:
                        </div>
                        <table>
                            <tbody>
                            <tr>
                                {colorFields}
                            </tr>
                            </tbody>
                        </table>
                         <div style={{width:250}}>
                            <MultiViewContainer 
                                viewConfig={mvConfig}
                            />
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={this.props.onCancel}>Cancel</Button>
                        <Button onClick={this.handleSubmit.bind(this)}>Submit</Button>
                    </Modal.Footer>
               </Modal>)

    }
}
