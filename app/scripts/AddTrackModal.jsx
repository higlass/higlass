import '../styles/AddTrackModal.css';
import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import slugid from 'slugid';
import {Modal,Button,FormGroup,FormControl,ControlLabel,HelpBlock} from 'react-bootstrap';
import {Form, Panel,Collapse} from 'react-bootstrap';
import {TilesetFinder} from './TilesetFinder.jsx';
import {PlotTypeChooser} from './PlotTypeChooser.jsx';

export class AddTrackModal extends React.Component {
    constructor(props) {
        super(props);

        this.tilesetFinder = null;
        this.multiSelect = null;

        options: {};

        this.state = {
            selectedTilesets: [{datatype: 'none'}],
            normalizeTilesetUuid: null
        }
    }

    componentDidMount() {

    }


    handleSubmit() {
        this.props.onTracksChosen(this.state.selectedTilesets, 
                                 this.props.position,
                                 this.props.host);

    }

    selectedTilesetsChanged(selectedTilesets) {
        console.log('selectedTilesets:', selectedTilesets, this.state.selectedTilesets);

        for (let tileset of selectedTilesets)
            tileset.type = this.selectedPlotType;

        this.setState({
            selectedTilesets: selectedTilesets
        });
    }

    handleTilesetPickerDoubleClick(tileset) {
        this.selectedTilesetsChanged(tileset);

        // should iterate over the selected tilesets
        this.props.onTracksChosen(this.state.selectedTilesets, this.props.position);
    }

    handleOptionsChanged(newOptions) {
        this.options = newOptions;
    }

    handlePlotTypeSelected(newPlotType) {
        let selectedTilesets = this.state.selectedTilesets;

        for (let tileset of selectedTilesets)
            tileset.type = newPlotType;

        this.selectedPlotType = newPlotType;

        this.setState({
            selectedTilesets: selectedTilesets
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

        let form = (
                <div>
                            <TilesetFinder
                                onDoubleClick={this.handleTilesetPickerDoubleClick.bind(this)}
                                onTracksChosen={value => this.props.onTracksChosen(value, this.props.position)}
                                orientation={orientation}
                                ref={(c) => this.tilesetFinder = c}
                                selectedTilesetChanged={this.selectedTilesetsChanged.bind(this)}
                                trackSourceServers={this.props.trackSourceServers}
                            />
                    </div>
                )

        return(<Modal 
                onHide={this.props.onCancel}
                show={this.props.show}
               >
                    <Modal.Header closeButton>
                    <Modal.Title>{'Add Track'}</Modal.Title> 
                    </Modal.Header>
                    <Modal.Body>
                        { form }
                        <PlotTypeChooser 
                            ref = {c => this.plotTypeChooser = c}
                            datatypes={this.state.selectedTilesets.map(x => x.datatype)}
                            onPlotTypeSelected={this.handlePlotTypeSelected.bind(this)}
                            orientation={orientation}
                        />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={this.props.onCancel}>{'Cancel'}</Button>
                        <Button onClick={this.handleSubmit.bind(this)}>{'Submit'}</Button>
                    </Modal.Footer>
               </Modal>)
    }
}

AddTrackModal.propTypes = {
    host: PropTypes.object,
    show: PropTypes.bool,
    onCancel: PropTypes.func,
    onTracksChosen: PropTypes.func,
    position: PropTypes.string,
    trackSourceServers: PropTypes.array
}
