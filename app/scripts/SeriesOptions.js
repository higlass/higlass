import React from 'react';
import ReactDOM from 'react-dom';
import {Collapse,Panel,Checkbox} from 'react-bootstrap';

import CollapsePanel from './CollapsePanel';
import TilesetFinder from './TilesetFinder';

export class SeriesOptions extends React.Component {
    constructor(props) {
        super(props);

        // data category to plot type



        this.state = {
            advancedVisible: true
        }
    }

    handleNormalizeTilesetChanged() {

    }

    handleNormalizeCheckboxChanged(e) {
        let domElement = ReactDOM.findDOMNode(this.normalizeCheckbox);

        this.setState({
            normalizeChecked: e.target.checked
        });
    }

    toggleAdvancedVisible() {
        this.setState({
            advancedVisible: !this.state.advancedVisible
        });
    }


    render() {
        // console.log('trackType:', this.props.trackType);

        return (
                <CollapsePanel
                    collapsed={this.state.advancedVisible}
                    toggleCollapse={this.toggleAdvancedVisible.bind(this)}
                >
                    <Checkbox
                        ref={c => this.normalizeCheckbox = c }
                        onChange={ this.handleNormalizeCheckboxChanged.bind(this) }
                    >
                    Normalize By
                    </Checkbox>

                    <Collapse in={this.state.normalizeChecked}>
                        <Panel>
                            <TilesetFinder
                                trackOrientation={orientation}
                                onTrackChosen={value => this.props.onTrackChosen(value, this.props.position)}
                                selectedTilesetChanged={this.handleNormalizeTilesetChanged.bind(this)}
                            />
                        </Panel>
                    </Collapse>

                </CollapsePanel>
        );
    }
}

export default SeriesOptions;
