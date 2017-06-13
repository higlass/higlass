import '../styles/AddTrackModal.css';
import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import slugid from 'slugid';
import {Modal,Button,FormGroup,FormControl,ControlLabel,HelpBlock} from 'react-bootstrap';
import {Form, Panel,Collapse} from 'react-bootstrap';
import {TilesetFinder} from './TilesetFinder.jsx';
import {SeriesOptions} from './SeriesOptions.jsx';
import {PlotTypeChooser} from './PlotTypeChooser.jsx';

export class AddTrackModal extends React.Component {
    constructor(props) {
        super(props);

        this.tilesetFinder = null;
        this.multiSelect = null;

        options: {};

        this.state = {
            mainTileset: {datatype: 'none'},
            normalizeTilesetUuid: null
        }
    }

    componentDidMount() {

    }


    handleSubmit() {
        this.props.onTrackChosen(this.state.mainTileset, 
                                 this.props.position,
                                 this.props.host);

        /*
        if (this.state.normalizeChecked)
            this.props.onTrackChosen(this.state.mainTilesetUuid, this.props.position, 
                    {'normalizeTilesetUuid': this.state.normalizeTilesetUuid});
        else
            this.props.onTrackChosen(this.state.mainTilesetUuid, this.props.position, {});
        */
    }

    mainTilesetChanged(mainTileset) {
        mainTileset.type = this.selectedPlotType;

        this.setState({
            mainTileset: mainTileset
        });
    }

    handleTilesetPickerDoubleClick(tileset) {
        /**
         * Arguments
         * ---------
         *  tileset: {object}
         *      The object describing this track containing information
         *      such as the track type and data source.
         *
         * Returns
         * -------
         *
         *  { uid: "", width: }:
         *      The trackConfig object describing this track. Essentially
         *      the newTrack object passed in with some extra information
         *      (such as the uid) added.
         */
        this.mainTilesetChanged(tileset);

        return this.props.onTrackChosen(this.state.mainTileset, this.props.position);
    }

    handleOptionsChanged(newOptions) {
        this.options = newOptions;
    }

    handlePlotTypeSelected(newPlotType) {
        let mainTileset = this.state.mainTileset;
        mainTileset.type = newPlotType;

        this.selectedPlotType = newPlotType;

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
                                onOptionsChanged={this.handleOptionsChanged.bind(this)}
                                trackCategory={this.state.mainTileset.category}
                            />
                    );
        }

        let form = (
                <div>
                            <TilesetFinder
                                onDoubleClick={this.handleTilesetPickerDoubleClick.bind(this)}
                                onTrackChosen={value => this.props.onTrackChosen(value, this.props.position)}
                                orientation={orientation}
                                ref={(c) => this.tilesetFinder = c}
                                selectedTilesetChanged={this.mainTilesetChanged.bind(this)}
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
                            datatype={this.state.mainTileset.datatype}
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
    onTrackChosen: PropTypes.func,
    position: PropTypes.string,
    trackSourceServers: PropTypes.array
}
