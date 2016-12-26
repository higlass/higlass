import '../styles/AddTrackModal.css';
import React from 'react';
import ReactDOM from 'react-dom';
import slugid from 'slugid';
import {Modal,Button,FormGroup,FormControl,ControlLabel,HelpBlock} from 'react-bootstrap';
import {Form, Panel,Collapse} from 'react-bootstrap';
import {TilesetFinder} from './TilesetFinder.jsx';
import {SeriesOptions} from './SeriesOptions.jsx';
import {PlotTypeChooser} from './PlotTypeChooser.jsx';

export class AddTrackModal extends React.Component {
    constructor(props) {
        super(props);

        options: {};

        this.state = {
            mainTileset: {datatype: 'none'},
            normalizeTilesetUuid: null
        }
    }

    componentDidMount() {

    }


    handleSubmit() {
        this.props.onTrackChosen(this.state.mainTileset, this.props.position);

        /*
        if (this.state.normalizeChecked)
            this.props.onTrackChosen(this.state.mainTilesetUuid, this.props.position, 
                    {'normalizeTilesetUuid': this.state.normalizeTilesetUuid});
        else
            this.props.onTrackChosen(this.state.mainTilesetUuid, this.props.position, {});
        */
    }

    mainTilesetChanged(mainTileset) {
        console.log('mainTileset:', mainTileset);

        this.setState({
            mainTileset: mainTileset
        });
    }

    handleOptionsChanged(newOptions) {
        this.options = newOptions;
    }

    handlePlotTypeSelected(newPlotType) {
        let mainTileset = this.state.mainTileset;
        mainTileset.type = newPlotType;

        this.setState({
            mainTileset: mainTileset
        });
    }

    render() {
        let filetype = '';
        let orientation = null;

        if (this.props.position == 'top' ||
            this.props.position == 'bottom')
            orientation = '1d-horizontal'
        else if ( this.props.position == 'left' ||
            this.props.position == 'right')
            orientation = '1d-vertical'
        else
            orientation = '2d'

        // only get options if there's a dataset selected
        let seriesOptions = null;
        if (this.state.mainTileset) {

            seriesOptions = (
                            <SeriesOptions
                                trackCategory={this.state.mainTileset.category}
                                onOptionsChanged={this.handleOptionsChanged.bind(this)}
                            />
                    );
        }

        let form = (
                <div>
                            <TilesetFinder
                                orientation={orientation}
                                onTrackChosen={value => this.props.onTrackChosen(value, this.props.position)}
                                selectedTilesetChanged={this.mainTilesetChanged.bind(this)}
                                onDoubleClick={value => this.props.onTrackChosen(value, this.props.position)}
                            />
                    </div>
                )

        return(<Modal 
                onHide={this.props.handleNoTrackAdded}
                show={this.props.show}
                >
                    <Modal.Header closeButton>
                    <Modal.Title>Add Track</Modal.Title> 
                    </Modal.Header>
                    <Modal.Body>
                        { form }
                        <PlotTypeChooser 
                            onPlotTypeSelected={this.handlePlotTypeSelected.bind(this)}
                            datatype={this.state.mainTileset.datatype}
                            orientation={orientation}
                        />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={this.props.onCancel}>Cancel</Button>
                        <Button onClick={this.handleSubmit.bind(this)}>Submit</Button>
                    </Modal.Footer>
               </Modal>)
    }
}

AddTrackModal.propTypes = {
    show: React.PropTypes.bool,
    onTrackChosen: React.PropTypes.func
}
