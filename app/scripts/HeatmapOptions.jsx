import '../styles/TrackOptions.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { CompactPicker } from 'react-color';
import {HiGlassComponent} from './HiGlassComponent.jsx';
import SketchInlinePicker from './SketchInlinePicker.jsx';
import slugid from 'slugid';

import {Modal,Button,FormGroup,FormControl,ControlLabel,HelpBlock} from 'react-bootstrap';

export class HeatmapOptions extends React.Component {
    constructor(props) {
        super(props);
        // props should include the definition of the heatmap data series


        this.state = {
            colors: props.track.options.colorRange.slice()
        }

    }

    handleColorsChanged(newColors) {
        /*
        this.props.onTrackOptionsChanged(Object.assign(this.props.track.options,
                                                       {colorRange: newColors}));
        */
        this.setState({
            colors: newColors
        });
    }

    handleSubmit() {
        let options = this.props.track.options;

        options.colorRange = this.state.colors;

        this.props.onSubmit(this.props.track.options);
    }

    handleAddColor() {
        /**
         * Add a color to the end
         */
        this.setState({
            colors: this.state.colors.concat(this.state.colors[this.state.colors.length-1])
        });

    }
    handleRemoveColor(i) {
        /**
         * Remove one of the colors from the color map
         */

        this.setState({
            colors: this.state.colors.slice(0, i).concat(this.state.colors.slice(i+1))
        });
    }

    render() {
        let leftAlign = {'textAlign': 'left'}
        let rightAlign = {'textAlign': 'right'}
        let centerAlign = {'textAlign': 'center'}

        let colorRow = {height: 10}

        let track = JSON.parse(JSON.stringify(this.props.track));


        let centerTrack = Object.assign(track,
                                        {height: 100,
                                            options: {
                                         colorRange: this.state.colors
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
            // only let colors be removed if there's more than two present
            let closeButton = (this.state.colors.length > 2 && i == this.state.colors.length-1) ?
                ( <div
                            style={{
                                background: 'white',
                                    position: "absolute",
                                    top: 0,
                                    right: 0,
                                    opacity: 1,
                                    width: 14,
                                    height: 14,
                                    borderRadius: 2

                            }}
                        >
                            <svg
                                onClick={() => this.handleRemoveColor(i)}
                                style={{
                                    position: "absolute",
                                    top: 2,
                                    right: 2,
                                    opacity: 0.5,
                                    width: 10,
                                    height: 10
                                }}
                                height="10px">
                                <use href="#cross"></use>
                            </svg>
                            </div>
                        )
                    : null; //closebutton

            return(<td
                        key={"l" + i}
                        style={{ border: "0px solid",
                                 position: "relative",
                                 outline: "none",
                        }}
                   >
                        {closeButton}
                        <SketchInlinePicker
                            key={i}
                            color={this.state.colors[i]}
                            onChange={c => {
                                    this.state.colors[i] = c;
                                    this.handleColorsChanged(this.state.colors);
                                }
                            }
                        />
                    </td>);
        });

        let addButton = this.state.colors.length < 4 ?
            (<td
                    style={{ border: "0px solid",
                             position: "relative",
                             outline: "none",
                    }}
             >
                <div
                    style={{
                             height: 24,
                             marginLeft: 5
                    }}

                >
                            <svg
                                onClick={this.handleAddColor.bind(this)}
                                style={{
                                    opacity: 0.5,
                                }}
                                width="10px"
                                height="10px">
                                <use href="#plus"></use>
                            </svg>
                </div>
             </td>)
            : null; //addButton

        return(<Modal
                onHide={this.props.handleCancel}
                show={true}
                className={'hg-modal'}
                >
                    <Modal.Header closeButton>
                    <Modal.Title>{'Heatmap Options'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                            <table className='table-track-options'>
                            <thead></thead>
                              <tbody>
                                  <tr>
                                    <td className='td-track-options'>
                                        {'Colors'}
                                    </td>
                                    </tr>
                                    <tr>
                                    <td className='td-track-options'>
                                        <table>
                                            <tbody>
                                            <tr>
                                                {colorFields}
                                                {addButton}
                                            </tr>
                                            </tbody>
                                        </table>
                                    </td>

                                  </tr>
                                  <tr>
                                    <td className='td-track-options'>
                                        {'Preview'}
                                    </td>
                                    </tr>
                                  <tr>
                                 <td rowSpan="2" className='td-track-options'>
                                 <div style={{width:200 }}>
                                      <MultiViewContainer
                                          viewConfig={mvConfig}
                                      />
                                  </div>

                                   </td>
                                  </tr>
                                  <tr>
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
