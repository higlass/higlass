import React from 'react';
import PropTypes from 'prop-types';

import Dialog from './Dialog';
import TilesetFinder from './TilesetFinder';
import PlotTypeChooser from './PlotTypeChooser';

// Configs
import { AVAILABLE_TRACK_TYPES } from './configs';

class AddTrackDialog extends React.Component {
  constructor(props) {
    super(props);

    this.multiSelect = null;

    this.options = {};

    this.state = {
      selectedTilesets: [{ datatype: 'none' }],
    };

    this.handleSubmitBound = this.handleSubmit.bind(this);

    this.handleTilesetPickerDoubleClickBound = this.handleTilesetPickerDoubleClick.bind(this);
    this.selectedTilesetsChangedBound = this.selectedTilesetsChanged.bind(this);
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
    this.props.onTracksChosen(this.state.selectedTilesets,
      this.props.position,
      this.props.host);
  }

  handleOptionsChanged(newOptions) {
    this.options = newOptions;
  }

  handlePlotTypeSelected(newPlotType) {
    const { selectedTilesets } = this.state;

    for (const tileset of selectedTilesets) { tileset.type = newPlotType; }

    this.selectedPlotType = newPlotType;

    this.setState({
      selectedTilesets,
    });
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

    this.setState({ selectedTilesets });
  }

  render() {
    const orientation = this.getOrientation(this.props.position);
    const form = (
      <div>
        <TilesetFinder
          // Only for testing purposes
          ref={(c) => { this.tilesetFinder = c; }}
          datatype={this.props.datatype}
          onDoubleClick={this.handleTilesetPickerDoubleClick.bind(this)}
          onTracksChosen={value => this.props.onTracksChosen(value, this.props.position)}
          orientation={orientation}
          selectedTilesetChanged={this.selectedTilesetsChanged.bind(this)}
          trackSourceServers={this.props.trackSourceServers}
        />
      </div>
    );

    return (
      <Dialog
        maxHeight={true}
        okayTitle="Submit"
        onCancel={this.props.onCancel}
        onOkay={this.handleSubmitBound}
        title="Add Track"
      >
        { form }
        {
          !this.props.hidePlotTypeChooser && (
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
              onPlotTypeSelected={this.handlePlotTypeSelected.bind(this)}
              orientation={orientation}
            />
          )
        }
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
  position: PropTypes.string,
  trackSourceServers: PropTypes.array.isRequired,
};

export default AddTrackDialog;
