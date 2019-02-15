import React from 'react';

// Configs
import {
  TRACKS_INFO,
  DATATYPE_TO_TRACK_TYPE,
  AVAILABLE_TRACK_TYPES,
} from './configs';

// Styles
import '../styles/PlotTypeChooser.css';

class PlotTypeChooser extends React.Component {
  constructor(props) {
    super(props);

    this.DATATYPE_TO_TRACK_TYPE = DATATYPE_TO_TRACK_TYPE(this.props.orientation);
    this.AVAILABLE_TRACK_TYPES = AVAILABLE_TRACK_TYPES(
      this.props.datatypes, this.props.orientation
    );

    this.state = {
      selectedPlotType: this.AVAILABLE_TRACK_TYPES[0],
    };
  }

  componentWillReceiveProps(newProps) {
    this.AVAILABLE_TRACK_TYPES = AVAILABLE_TRACK_TYPES(newProps.datatypes, this.props.orientation);

    if (!this.AVAILABLE_TRACK_TYPES) { return; }

    if (this.AVAILABLE_TRACK_TYPES.length > 0) {
      if (!this.AVAILABLE_TRACK_TYPES.includes(this.state.selectedPlotType)) {
        this.handlePlotTypeSelected(this.AVAILABLE_TRACK_TYPES[0]);
      }
    } else {
      // no available track types
      // this could be because the datatype is unknown
      // or because there's multiple different datatypes
    }
  }

  handlePlotTypeSelected(key) {
    this.setState({
      selectedPlotType: key,
    });

    this.props.onPlotTypeSelected(key.type);
  }

  render() {
    let AVAILABLE_TRACK_TYPES_LIST = 'No plot types available for track';
    const trackTypeToInfo = {};

    TRACKS_INFO.forEach((ti) => {
      trackTypeToInfo[ti.type] = ti;
    });

    if (this.AVAILABLE_TRACK_TYPES) {
      AVAILABLE_TRACK_TYPES_LIST = this.AVAILABLE_TRACK_TYPES
        .sort((a, b) => a.type < b.type)
        .map((x) => {
          const thumbnail = trackTypeToInfo[x.type].thumbnail;
          const plotTypeClass = this.state.selectedPlotType.type === x.type ? 'plot-type-selected' : 'unselected';
          const imgTag = trackTypeToInfo[x.type].thumbnail
            ? (
              <div
                dangerouslySetInnerHTML={{ __html: thumbnail.outerHTML }}
                style={{ display: 'inline-block', marginRight: 10, verticalAlign: 'middle' }}
              />
            )
            : (
              <div style={{ display: 'inline-block', marginRight: 10, verticalAlign: 'middle' }}>
                <svg height={20} width={30} />
              </div>
            );
          return (
            <li
              key={x.type}
              className={plotTypeClass}
              onClick={
                (e) => {
                  this.setState({ selectedPlotType: x });
                  this.props.onPlotTypeSelected(x.type);
                }
              }
              style={{ listStyle: 'none', paddingLeft: 5, paddingBottom: 0 }}
            >
              {imgTag}
              <span
                style={{ verticalAlign: 'middle' }}
              >
                {x.type}
              </span>
            </li>
          );
        });
    }

    return (
      <div>
        { AVAILABLE_TRACK_TYPES_LIST.length > 0
          && (
            <div
              className="plot-type-container"
            >
              { AVAILABLE_TRACK_TYPES_LIST }
            </div>
          )
        }
      </div>
    );
  }
}

export default PlotTypeChooser;
