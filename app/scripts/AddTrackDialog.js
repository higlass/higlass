import React from 'react';
import PropTypes from 'prop-types';

import Dialog from './Dialog';
import TilesetFinder from './TilesetFinder';
import TrackSourceEditor from './TrackSourceEditor';
import PlotTypeChooser from './PlotTypeChooser';

// Configs
import { AVAILABLE_TRACK_TYPES } from './configs';

// Styles
import '../styles/AddTrackDialog.module.scss';

class AddTrackDialog extends React.Component {
  constructor(props) {
    super(props);

    this.multiSelect = null;

    this.options = {};

    this.state = {
      selectedTilesets: [],
      activeTab: this.getActiveTab(),
    };

    this.handlePlotTypeSelectedBound = this.handlePlotTypeSelected.bind(this);
    this.handleSearchBoxBound = this.handleSearchBox.bind(this);
    this.handleSubmitBound = this.handleSubmit.bind(this);
    this.handleTilesetPickerDoubleClickBound = this.handleTilesetPickerDoubleClick.bind(this);
    this.handleTrackChosenBound = this.handleTrackChosen.bind(this);
    this.selectedTilesetsChangedBound = this.selectedTilesetsChanged.bind(this);
    this.handleTrackSourceSavedBound = this.handleTrackSourceSaved.bind(this);
  }

  componentWillUpdate(nextProps, nextState) {
    if (nextState.selectedTilesets.length === 0) {
      this.selectedPlotType = undefined;
    }
  }

  componentDidUpdate(props, state) {
    if (this.updateTab) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        activeTab: this.getActiveTab()
      });
      this.updateTab = false;
    }
  }

  getActiveTab() {
    if (this.props.trackSourceServers.length === 0) return 'trackSources';
    if (!this.state || this.state.selectedTilesets.length === 0) return 'datasets';
    if (!this.selectedPlotType && !this.props.hidePlotTypeChooser) return 'trackTypes';
    return 'configurations';
  }

  /**
   * Get the track available track orientations for the given
   * track position. Generally "top" or "bottom" equal "1d-horizontal",
   * "left" or "right" correspond to "1d-vertical" and "center" means "2d".
   *
   * Arguments
   * ---------
   *  position: string
   *
   * Returns
   * -------
   *
   *  A string containing the track orientation.
   */
  getOrientation(position) {
    let orientation = null;

    if (position === 'top' || position === 'bottom') {
      orientation = '1d-horizontal';
    } else if (position === 'left' || position === 'right') {
      orientation = '1d-vertical';
    } else {
      orientation = '2d';
    }

    return orientation;
  }

  handleSubmit(evt) {
    if (evt) evt.preventDefault();

    this.props.onTracksChosen(
      this.state.selectedTilesets,
      this.props.position,
      this.props.host
    );
  }

  /**
   * The user double clicked a tileset in the tileset finder dialog.
   * This means that only one is selected.
   *
   * Arguments
   * ---------
   *  tileset: { uuid: 'CXCX', filetype: 'cooler' ....}
   */
  handleTilesetPickerDoubleClick(tileset) {
    this.selectedTilesetsChanged([tileset]);

    // should iterate over the selected tilesets
    this.props.onTracksChosen(
      this.state.selectedTilesets,
      this.props.position,
      this.props.host
    );
  }

  handleOptionsChanged(newOptions) {
    this.options = newOptions;
  }

  handlePlotTypeSelected(newPlotType) {
    const { selectedTilesets } = this.state;

    for (const tileset of selectedTilesets) { tileset.type = newPlotType; }

    this.selectedPlotType = newPlotType;

    this.updateTab = true;

    this.setState({ selectedTilesets });
  }

  handleSearchBox(element) {
    this.tilesetFinderSearchBox = element;
  }

  handleTrackChosen(value) {
    this.props.onTracksChosen(value, this.props.position);
  }

  async handleTrackSourceSaved(sources) {
    await this.props.onTrackSourceChanged(sources);
    this.setState({ activeTab: this.getActiveTab() });
  }

  selectedTilesetsChanged(selectedTilesetsIn) {
    let allSame = true;
    let selectedTilesets = null;

    if (selectedTilesetsIn.length === 0) {
      // no tilesets are selected
      selectedTilesets = [{ datatype: 'none' }];
    } else {
      selectedTilesets = selectedTilesetsIn;
    }

    const firstDatatype = selectedTilesets[0].datatype;
    for (const tileset of selectedTilesets) {
      if (tileset.datatype !== firstDatatype) { allSame = false; }
    }

    if (allSame) {
      // only one datatype is present in the set of selected tilesets
      for (const tileset of selectedTilesets) {
        tileset.type = this.selectedPlotType;
      }
    } else {
      // more than one dataype present, we assign the default track type
      // to each tileset
      for (const tileset of selectedTilesets) {
        let datatypes = [tileset.datatype];

        if (tileset.filetype === 'cooler') {
          datatypes = [tileset.datatype, 'chromsizes'];
        }

        tileset.type = AVAILABLE_TRACK_TYPES([datatypes],
          this.getOrientation(this.props.position))[0].type;
      }
    }

    this.updateTab = true;

    this.setState({ selectedTilesets });
  }

  open(activeTab) {
    return () => this.setState({ activeTab });
  }

  render() {
    const orientation = this.getOrientation(this.props.position);

    return (
      <Dialog
        okayTitle="Submit"
        onCancel={this.props.onCancel}
        onOkay={this.handleSubmitBound}
        title="Add Track"
      >
        <div
          styleName={
            this.state.activeTab === 'trackSources'
              ? 'add-track-dialog-toggable-open'
              : 'add-track-dialog-toggable'
          }
        >
          <div
            styleName={
              this.state.activeTab === 'trackSources'
                ? 'add-track-dialog-toggler-active'
                : 'add-track-dialog-toggler'
            }
          >
            <button onClick={this.open('trackSources')} type="button">
              {this.props.trackSourceServers.length > 1 && (
                <span>
                  <span>Change track source servers: </span>
                  <span styleName="add-track-dialog-toggler-value">
                    {this.props.trackSourceServers[0]}
                    &hellip;
                  </span>
                </span>
              )}
              {this.props.trackSourceServers.length === 1 && (
                <span>
                  <span>Change track source servers: </span>
                  <span styleName="add-track-dialog-toggler-value">
                    {this.props.trackSourceServers[0]}
                  </span>
                </span>
              )}
              {this.props.trackSourceServers.length === 0 && (
                <span>Set track source servers</span>
              )}
              <span styleName="add-track-dialog-toggler-triangle" />
            </button>
          </div>
          <div
            styleName={
              this.state.activeTab === 'trackSources'
                ? 'add-track-dialog-toggable-content-open'
                : 'add-track-dialog-toggable-content'
            }
          >
            {this.state.activeTab === 'trackSources' && (
              <TrackSourceEditor
                onTrackSourceChanged={this.props.onTrackSourceChanged}
                onTrackSourceSaved={this.handleTrackSourceSavedBound}
                trackSources={this.props.trackSourceServers}
              />
            )}
          </div>
        </div>
        <div
          styleName={
            this.state.activeTab === 'datasets'
              ? 'add-track-dialog-toggable-open'
              : 'add-track-dialog-toggable'
          }
        >
          <div
            styleName={
              this.state.activeTab === 'datasets'
                ? 'add-track-dialog-toggler-active'
                : 'add-track-dialog-toggler'
            }
          >
            <button onClick={this.open('datasets')} type="button">
              {this.state.selectedTilesets.length > 1 && (
                <span>
                  <span>Change datasets: </span>
                  <span styleName="add-track-dialog-toggler-value">
                    {this.state.selectedTilesets[0].name}
                    &hellip;
                  </span>
                </span>
              )}
              {this.state.selectedTilesets.length === 1 && (
                <span>
                  <span>Change datasets: </span>
                  <span styleName="add-track-dialog-toggler-value">
                    {this.state.selectedTilesets[0].name}
                  </span>
                </span>
              )}
              {this.state.selectedTilesets.length === 0 && (
                <span>Select datasets</span>
              )}
              <span styleName="add-track-dialog-toggler-triangle" />
            </button>
          </div>
          <div
            styleName={
              this.state.activeTab === 'datasets'
                ? 'add-track-dialog-toggable-content-open'
                : 'add-track-dialog-toggable-content'
            }
          >
            {this.state.activeTab === 'datasets' && (
              <TilesetFinder
                // Only for testing purposes
                ref={(c) => { this.tilesetFinder = c; }}
                datatype={this.props.datatype}
                onDoubleClick={this.handleTilesetPickerDoubleClickBound}
                onTracksChosen={this.handleTrackChosenBound}
                orientation={orientation}
                searchBox={this.handleSearchBoxBound}
                selectedTilesetChanged={this.selectedTilesetsChangedBound}
                trackSourceServers={this.props.trackSourceServers}
              />
            )}
          </div>
        </div>
        {!this.props.hidePlotTypeChooser && (
          <div
            styleName={
              this.state.activeTab === 'trackTypes'
                ? 'add-track-dialog-toggable-open'
                : 'add-track-dialog-toggable'
            }
          >
            <div
              styleName={
                this.state.activeTab === 'trackTypes'
                  ? 'add-track-dialog-toggler-active'
                  : 'add-track-dialog-toggler'
              }
            >
              <button
                disabled={this.state.selectedTilesets.length === 0}
                onClick={this.open('trackTypes')}
                type="button"
              >
                {this.selectedPlotType ? (
                  <span>
                    <span>Change track type: </span>
                    <span styleName="add-track-dialog-toggler-value">
                      {this.selectedPlotType}
                    </span>
                  </span>
                ) : (
                  <span>Select track type</span>
                )}
                <span styleName="add-track-dialog-toggler-triangle" />
              </button>
            </div>
            <div
              styleName={
                this.state.activeTab === 'trackTypes'
                  ? 'add-track-dialog-toggable-content-open'
                  : 'add-track-dialog-toggable-content'
              }
            >
              {this.state.activeTab === 'trackTypes' && (
                <PlotTypeChooser
                  // Only for testing purposes
                  ref={(c) => { this.plotTypeChooser = c; }}
                  datatypes={this.state.selectedTilesets.map((x) => {
                    if (x.filetype === 'cooler') {
                      // cooler files can also supply chromsizes
                      return [x.datatype, 'chromsizes'];
                    }

                    return [x.datatype];
                  })}
                  onPlotTypeSelected={this.handlePlotTypeSelectedBound}
                  orientation={orientation}
                  plotType={this.selectedPlotType}
                />
              )}
            </div>
          </div>
        )}
        <div
          styleName={
            this.state.activeTab === 'configurations'
              ? 'add-track-dialog-toggable-open'
              : 'add-track-dialog-toggable'
          }
        >
          <div
            styleName={
              this.state.activeTab === 'configurations'
                ? 'add-track-dialog-toggler-active'
                : 'add-track-dialog-toggler'
            }
          >
            <button
              disabled={
                this.state.selectedTilesets.length === 0 || !this.selectedPlotType
              }
              onClick={this.open('configurations')}
              type="button"
            >
              <span>Configure track</span>
              <span styleName="add-track-dialog-toggler-triangle" />
            </button>
          </div>
          <div
            styleName={
              this.state.activeTab === 'configurations'
                ? 'add-track-dialog-toggable-content-open'
                : 'add-track-dialog-toggable-content'
            }
          >
            {this.state.activeTab === 'configurations' && (
              <p>Nice!</p>
            )}
          </div>
        </div>
      </Dialog>
    );
  }
}

AddTrackDialog.defaultProps = {
  hidePlotTypeChooser: false,
  position: 'top',
};

AddTrackDialog.propTypes = {
  datatype: PropTypes.string.isRequired,
  hidePlotTypeChooser: PropTypes.bool,
  host: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  onTracksChosen: PropTypes.func.isRequired,
  onTrackSourceChanged: PropTypes.func.isRequired,
  position: PropTypes.string,
  trackSourceServers: PropTypes.array.isRequired,
};

export default AddTrackDialog;
