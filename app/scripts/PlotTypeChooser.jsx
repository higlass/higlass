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

        this.availableTrackTypes = this.datatypeToTrackType[this.props.datatype];

        this.state = {
            selectedPlotType: 'none'
        }
    }

    componentWillReceiveProps(newProps) {
        this.availableTrackTypes = this.datatypeToTrackType[newProps.datatype];

        if (this.availableTrackTypes && this.availableTrackTypes.length > 0) {
            if (!this.availableTrackTypes.includes(this.state.selectedPlotType)) {
                this.handlePlotTypeSelected(this.availableTrackTypes[0]);
            }
        }
    }

    handleClickOnItem(key, e) {
        let parent = select(e.currentTarget.parentNode);
        let elem = select(e.currentTarget);

        parent.selectAll('li')
        .classed('plot-type-selected', false)
        
        elem.classed('plot-type-selected', true);
        
        this.props.onPlotTypeSelected(key); 
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
                let thumbnailLocation = "images/thumbnails/" + trackTypeToInfo[x.type].thumbnail;
                let blankLocation = "images/thumbnails/blank.png";
                let imgTag = trackTypeToInfo[x.type].thumbnail ? 
                        <img src={thumbnailLocation} width={15} className='context-menu-thumbnail'/> :
                        <img src={blankLocation} width={15} className='context-menu-thumbnail'/> 
                return (<li
                            style= {{listStyle: 'none', paddingLeft: 5, paddingBottom: 0}}
                            className={ this.state.selectedPlotType.type == x.type ? 'plot-type-selected' : ''}
                            onClick={this.handleClickOnItem.bind(this, x.type)}
                            key={x.type}>

                            {imgTag}

                                <span>
                                {x.type}</span>
                        </li>);
            });
        }

        return (<div>
                    { availableTrackTypesList }
                </div>)
    }
}
