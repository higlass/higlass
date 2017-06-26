import '../styles/AddTrackModal.css';
import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import slugid from 'slugid';
import {Modal,Button,FormGroup,FormControl,ControlLabel,HelpBlock} from 'react-bootstrap';
import {Form, Panel,Collapse} from 'react-bootstrap';
import {TilesetFinder} from './TilesetFinder.jsx';
import {PlotTypeChooser} from './PlotTypeChooser.jsx';
import {availableTrackTypes} from './config.js';

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
        let allSame = true;
        let firstDatatype = selectedTilesets[0].datatype;
        for (let tileset of selectedTilesets) {
            if (tileset.datatype != firstDatatype)
                allSame = false;
        }

        if (allSame) {
            // only one datatype is present in the set of selected tilesets
            for (let tileset of selectedTilesets) {
                tileset.type = this.selectedPlotType;
            }
        } else {
            // more than one dataype present, we assign the default track type
            // to each tileset
            for (let tileset of selectedTilesets) {
                tileset.type = availableTrackTypes([tileset.datatype], 
                    this.getOrientation(this.props.position))[0].type;
            }
        }

        this.setState({
            selectedTilesets: selectedTilesets
        });
    }

    handleTilesetPickerDoubleClick(tileset) {
        /**
         * The user double clicked a tileset in the tileset finder dialog.
         * This means that only one is selected.
         *
         * Arguments
         * ---------
         *  tileset: { uuid: 'CXCX', filetype: 'cooler' ....}
         */
        this.selectedTilesetsChanged([tileset]);

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

    getOrientation(position) {
        /**
         * Get the track available track orientations for the given
         * track position. Generally "top" or "bottom" equal "1d-horizontal",
         * "left" or "right" correspond to "1d-vertical" and "center" means "2d".
         *
         * Arguments
         * ---------
         *  position: string
         *
         * Returns
         * -------
         *
         *  A string containing the track orientation.
         */
        let orientation = null;

        if (position == 'top' ||
            position == 'bottom')
            orientation = '1d-horizontal'
        else if ( position == 'left' ||
            position == 'right')
            orientation = '1d-vertical'
        else
            orientation = '2d'

        return orientation;
    }

    render() {
        let filetype = '';
        let orientation = this.getOrientation(this.props.position);

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
