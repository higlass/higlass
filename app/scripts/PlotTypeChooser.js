import React from 'react';
import PropTypes from 'prop-types';

// Configs
import {
  TRACKS_INFO,
  DATATYPE_TO_TRACK_TYPE,
  AVAILABLE_TRACK_TYPES,
} from './configs';

// Utils
import {
  getDefaultTrackForDatatype,
} from './utils';

// Styles
import '../styles/PlotTypeChooser.module.scss';

class PlotTypeChooser extends React.Component {
  constructor(props) {
    super(props);

    this.datatypeToTrackType = DATATYPE_TO_TRACK_TYPE(
      this.props.orientation
    );
    this.availableTrackTypes = AVAILABLE_TRACK_TYPES(
      this.props.datatypes, this.props.orientation
    );

    let selectedPlotType;
    this.availableTrackTypes.some((track) => {
      if (track.type === this.props.plotType) {
        selectedPlotType = track;
        return true;
      }
      return false;
    });

    this.state = { selectedPlotType };
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(newProps) {
    this.availableTrackTypes = AVAILABLE_TRACK_TYPES(newProps.datatypes, this.props.orientation);

    if (!this.availableTrackTypes) { return; }

    if (!newProps.allTracksSameDatatype) { return; }

    if (this.availableTrackTypes.length > 0) {
      if (!this.availableTrackTypes.includes(this.state.selectedPlotType)) {
        const defaultTrackType = getDefaultTrackForDatatype(
          newProps.datatypes[0][0],
          this.props.position,
          this.availableTrackTypes
        );
        this.handlePlotTypeSelected(defaultTrackType);
      }
    } else {
      // no available track types
      // this could be because the datatype is unknown
      // or because there's multiple different datatypes
      // that don't have common track types
    }
  }

  handlePlotTypeSelected(key) {
    return async () => {
      await this.setState({
        selectedPlotType: key,
      });

      this.props.onPlotTypeSelected(key.type);
    };
  }

  render() {
    let availableTrackTypesList = 'No plot types available for track';
    const trackTypeToInfo = {};

    TRACKS_INFO.forEach((ti) => {
      trackTypeToInfo[ti.type] = ti;
    });

    this.availableTrackTypes = AVAILABLE_TRACK_TYPES(
      this.props.datatypes, this.props.orientation
    );

    if (this.availableTrackTypes) {
      availableTrackTypesList = this.availableTrackTypes
        .sort((a, b) => a.type < b.type)
        .map((x) => {
          const plotTypeClass = (
            this.state.selectedPlotType
            && this.state.selectedPlotType.type === x.type
          )
            ? 'plot-type-selected'
            : 'plot-type';
          return (
            <li
              key={x.type}
              onClick={this.handlePlotTypeSelected(x)}
              styleName={plotTypeClass}
            >
              {trackTypeToInfo[x.type].thumbnail ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: trackTypeToInfo[x.type].thumbnail.outerHTML
                  }}
                  styleName="plot-type-choser-thumbnail"
                />
              ) : (
                <div styleName="plot-type-choser-thumbnail">
                  <svg height={20} width={20} />
                </div>
              )}
              <span styleName="plot-type-choser-label">
                {x.type}
              </span>
            </li>
          );
        });
    }

    return (
      <div>
        { (availableTrackTypesList.length > 0 && this.props.allTracksSameDatatype)
          && (
            <div
              className="plot-type-container"
            >
              { availableTrackTypesList }
            </div>
          )
        }
        { (!this.props.allTracksSameDatatype)
          && (
            <div
              className="plot-type-container-empty"
            >
              Datasets with multiple datatypes chosen.
              They will be added with their default track types.
            </div>
          )
        }
      </div>
    );
  }
}

PlotTypeChooser.propTypes = {
  datatypes: PropTypes.array.isRequired,
  onPlotTypeSelected: PropTypes.func.isRequired,
  orientation: PropTypes.string.isRequired,
  plotType: PropTypes.string,
};

export default PlotTypeChooser;
