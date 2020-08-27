import PropTypes from 'prop-types';
import React from 'react';
import { Collapse, Panel, Checkbox } from 'react-bootstrap';

import CollapsePanel from './CollapsePanel';
import TilesetFinder from './TilesetFinder';

export class SeriesOptions extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      advancedVisible: true,
    };
  }

  handleNormalizeTilesetChanged() {}

  handleNormalizeCheckboxChanged(e) {
    this.setState({
      normalizeChecked: e.target.checked,
    });
  }

  toggleAdvancedVisible() {
    this.setState((prevState) => ({
      advancedVisible: !prevState.advancedVisible,
    }));
  }

  render() {
    // console.log('trackType:', this.props.trackType);

    return (
      <CollapsePanel
        collapsed={this.state.advancedVisible}
        toggleCollapse={this.toggleAdvancedVisible.bind(this)}
      >
        <Checkbox
          ref={(c) => {
            this.normalizeCheckbox = c;
          }}
          onChange={this.handleNormalizeCheckboxChanged.bind(this)}
        >
          Normalize By
        </Checkbox>

        <Collapse in={this.state.normalizeChecked}>
          <Panel>
            <TilesetFinder
              onTrackChosen={(value) =>
                this.props.onTrackChosen(value, this.props.position)
              }
              selectedTilesetChanged={this.handleNormalizeTilesetChanged.bind(
                this,
              )}
            />
          </Panel>
        </Collapse>
      </CollapsePanel>
    );
  }
}

SeriesOptions.propTypes = {
  onTrackChosen: PropTypes.func,
  position: PropTypes.string,
};

export default SeriesOptions;
