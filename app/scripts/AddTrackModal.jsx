import '../styles/AddTrackModal.css';
import React from 'react';
import ReactDOM from 'react-dom';
import {Modal,Button,FormGroup,FormControl,ControlLabel,HelpBlock} from 'react-bootstrap';
import {Form, Panel,Collapse} from 'react-bootstrap';
import {TilesetFinder} from './TilesetFinder.jsx';
import {SeriesOptions} from './SeriesOptions.jsx';

export class AddTrackModal extends React.Component {
    constructor(props) {
        super(props);

        options: {};

        console.log('props', props);
        this.state = {
            mainTilesetUuid: null,
            normalizeTilesetUuid: null
        }
    }

    componentDidMount() {

    }


    handleSubmit() {
        if (this.state.normalizeChecked)
            this.props.onTrackChosen(this.state.mainTilesetUuid, this.props.position, 
                    {'normalizeTilesetUuid': this.state.normalizeTilesetUuid});
        else
            this.props.onTrackChosen(this.state.mainTilesetUuid, this.props.position, {});
    }

    mainTilesetChanged(mainTileset) {
        this.setState({
            mainTileset: mainTileset
        });
    }

    handleOptionsChanged(newOptions) {
        this.options = newOptions;
    }

    render() {
        let filetype = '';

        if (this.props.position == 'top' ||
            this.props.position == 'left' ||
            this.props.position == 'right' ||
            this.props.position == 'bottom')
            filetype = 'hitile'
        else
            filetype = 'cooler'

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
                                trackTypeFilter={filetype}
                                onTrackChosen={value => this.props.onTrackChosen(value, this.props.position)}
                                selectedTilesetChanged={this.mainTilesetChanged.bind(this)}
                            />
                            {seriesOptions}
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
