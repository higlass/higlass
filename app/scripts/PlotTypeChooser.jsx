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
            let datatypes = ti.datatype;

            if (!Array.isArray(ti.datatype))
                datatypes = [datatypes];

            datatypes.forEach(datatype => {
                console.log('ti.datatype:', datatype);
                if (!(datatype in this.datatypeToTrackType))
                    this.datatypeToTrackType[datatype] = [];
            

                this.datatypeToTrackType[datatype].push(ti)
            });
        });

        this.datatypeToTrackType['none'] = [];

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
        if (this.availableTrackTypes) {
            availableTrackTypesList = this.availableTrackTypes.map(x => {
                return (<li
                            className={ this.state.selectedPlotType.type == x.type ? 'plot-type-selected' : ''}
                            key={x.type}>
                                {x.type}
                        </li>);
            });
        }

        return (<div>
                    { availableTrackTypesList }
                </div>)
    }
}
