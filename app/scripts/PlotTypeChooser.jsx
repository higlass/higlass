import "../styles/PlotTypeChooser.css";
import React from 'react';
import ReactDOM from 'react-dom';
import {tracksInfo} from './config.js';

export class PlotTypeChooser extends React.Component {
    constructor(props) {
        super(props);

        this.datatypeToTrackType = {};

        tracksInfo
        .filter(x => x.orientation == this.props.orientation)
        .forEach(ti => {
            if (!(ti.datatype in this.datatypeToTrackType))
                this.datatypeToTrackType[ti.datatype] = [];

            this.datatypeToTrackType[ti.datatype].push(ti)
        });

        this.datatypeToTrackType['none'] = [];
        console.log('datatypeToTrackType', this.datatypeToTrackType);


        this.availableTrackTypes = this.datatypeToTrackType[this.props.datatype];

        this.state = {
            selectedPlotType: 'none'
        }
    }

    componentWillReceiveProps(newProps) {
        this.availableTrackTypes = this.datatypeToTrackType[newProps.datatype];

        if (this.availableTrackTypes && this.availableTrackTypes.length > 0) {
            if (!this.availableTrackTypes.includes(this.state.selectedPlotType)) {
                this.state.selectedPlotType = this.availableTrackTypes[0];
                this.handlePlotTypeSelected();
            }
        }
    }

    handlePlotTypeSelected() {
        this.props.onPlotTypeSelected(this.state.selectedPlotType.type);
    }

    render() {
        let availableTrackTypesList = "No plot types available for track";
        console.log('thisss', this.state.selectedPlotType);
        if (this.availableTrackTypes) {
            availableTrackTypesList = this.availableTrackTypes.map(x => {
                return (<li
                            className={ this.state.selectedPlotType.type == x.type ? 'plot-type-selected' : ''}
                            key={x.type}>
                                {x.type}
                        </li>);
            });
        }
        console.log('availableTrackTypesList:', availableTrackTypesList);

        return (<div>
                    { availableTrackTypesList }
                </div>)
    }
}
