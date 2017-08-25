import "../styles/PlotTypeChooser.css";
import React from 'react';
import {
    tracksInfo,
    datatypeToTrackType,
    availableTrackTypes
} from './config.js';

export class PlotTypeChooser extends React.Component {
    constructor(props) {
        super(props);

        this.datatypeToTrackType = datatypeToTrackType(this.props.orientation);
        this.availableTrackTypes = availableTrackTypes(this.props.datatypes, this.props.orientation);

        this.state = {
            selectedPlotType: this.availableTrackTypes[0]
        }
    }

    componentWillReceiveProps(newProps) {
        this.availableTrackTypes = availableTrackTypes(newProps.datatypes, this.props.orientation);

        if (!this.availableTrackTypes)
            return;

        if (this.availableTrackTypes.length > 0) {
            if (!this.availableTrackTypes.includes(this.state.selectedPlotType)) {
                this.handlePlotTypeSelected(this.availableTrackTypes[0]);
            }
        } else {
            // no available track types
            // this could be because the datatype is unknown
            // or because there's multiple different datatypes
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

export default PlotTypeChooser;
