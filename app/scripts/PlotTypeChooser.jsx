import "../styles/PlotTypeChooser.css";
import React from 'react';
import ReactDOM from 'react-dom';
import {select} from 'd3-selection';
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
                if (!(datatype in this.datatypeToTrackType))
                    this.datatypeToTrackType[datatype] = [];
            

                this.datatypeToTrackType[datatype].push(ti)
            });
        });

        this.datatypeToTrackType['none'] = [];

        this.availableTrackTypes = this.getAvailableTrackTypes(this.props.datatypes);

        this.state = {
            selectedPlotType: this.availableTrackTypes[0]
        }
    }

    getAvailableTrackTypes(datatypes) {
        /**
         * Retrieve the available track types given the datatypes passed in.
         *
         * Returns
         * -------
         * ['2d-chromosome-annotations',...]
         *      A list of available track types.
         */
        let firstDatatype = datatypes[0];
        let allSame = true;
        for (let datatype of datatypes)
            if (datatype != firstDatatype)
                allSame = false;

        if (allSame) {
            // only display available track types if all of the selected datasets are
            // the same
            return this.datatypeToTrackType[datatypes[0]];
        }

        return [];
    }

    componentWillReceiveProps(newProps) {
        this.availableTrackTypes = this.getAvailableTrackTypes(newProps.datatypes);

        if (this.availableTrackTypes && this.availableTrackTypes.length > 0) {
            if (!this.availableTrackTypes.includes(this.state.selectedPlotType)) {
                this.handlePlotTypeSelected(this.availableTrackTypes[0]);
            }
        }
    }

    handlePlotTypeSelected(key) {
        this.setState({
            selectedPlotType: key
        });

        this.props.onPlotTypeSelected(key.type);
    }

    render() {
        let availableTrackTypesList = "No plot types available for track";
        let trackTypeToInfo = {};

        tracksInfo.forEach(ti => {
            trackTypeToInfo[ti.type] = ti;
        });

        if (this.availableTrackTypes) {
            availableTrackTypesList = this.availableTrackTypes
                .sort((a,b) => { return a.type < b.type})
                .map(x => {
                let thumbnail = trackTypeToInfo[x.type].thumbnail;
                let plotTypeClass = this.state.selectedPlotType.type == x.type ? 'plot-type-selected' : 'unselected'
                let imgTag = trackTypeToInfo[x.type].thumbnail ? 
                        <div style={{display: 'inline-block', marginRight: 10, verticalAlign: "middle"}} 
                            dangerouslySetInnerHTML={{__html: thumbnail.outerHTML}}
                        /> :
                        <div style={{display: 'inline-block', marginRight: 10, verticalAlign: "middle"}} >
                            <svg width={30} height={20} />
                        </div>
                return (<li
                            className={plotTypeClass}
                            key={x.type}
                            onClick={ 
                                (e) => {
                                    this.setState({selectedPlotType: x});
                                    this.props.onPlotTypeSelected(x.type);
                                }
                            }
                            style={{listStyle: 'none', paddingLeft: 5, paddingBottom: 0}}
                        >

                            {imgTag}
                            <span
                                style={{verticalAlign: "middle"}}
                            >
                                {x.type}
                            </span>
                        </li>);
            });
        }

        return (<div>
                    { availableTrackTypesList }
                </div>)
    }
}
