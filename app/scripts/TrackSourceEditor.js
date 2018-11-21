import PropTypes from 'prop-types';
import React from 'react';

import '../styles/TrackSourceEditor.module.scss';

class TrackSourceEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = { trackSources: [] };
    this.onAddBound = this.onAdd.bind(this);
  }

  onAdd() {
    this.props.onTrackSourceChanged([...this.props.trackSources, '']);
  }

  onChange(i) {
    return ({ target: { value } }) => {
      this.setState((prevState) => {
        const newTrackSources = [...prevState.trackSources];
        newTrackSources[i] = value;
        return { trackSources: newTrackSources };
      });
    };
  }

  onDelete(i) {
    return () => {
      const newTrackSources = [...this.props.trackSources];
      newTrackSources.splice(i, 1);
      this.props.onTrackSourceChanged(newTrackSources);
    };
  }

  onSave(i) {
    return () => {
      if (this.state.trackSources[i] === this.props.trackSources[i]) return;
      const newTrackSources = [...this.props.trackSources];
      newTrackSources[i] = this.state.trackSources[i];
      this.props.onTrackSourceChanged(newTrackSources);
      this.setState((prevState) => {
        const newInternalTrackSources = [...prevState.trackSources];
        newInternalTrackSources[i] = undefined;
        return { trackSources: newInternalTrackSources };
      });
    };
  }

  render() {
    return (
      <div>
        {this.props.trackSources.map((trackSource, i) => (
          <div key={trackSource} className="flex-c" styleName="track-source">
            <input
              className="flex-g-1 hg-input"
              onChange={this.onChange(i)}
              placeholder="Enter track source server"
              styleName="track-source-input"
              type="url"
              value={this.state.trackSources[i] || trackSource}
            />
            <button
              className="hg-button"
              onClick={this.onDelete(i)}
              styleName="track-source-delete"
              type="button"
            >
              Delete
            </button>
            <button
              className="hg-button"
              disabled={!this.state.trackSources[i]}
              onClick={this.onSave(i)}
              styleName="track-source-save"
              type="button"
            >
              Save
            </button>
          </div>
        ))}
        <div className="flex-c">
          <button
            className="hg-button"
            onClick={this.onAddBound}
            type="button"
          >
            Add new source
          </button>
        </div>
      </div>
    );
  }
}

TrackSourceEditor.propTypes = {
  onTrackSourceChanged: PropTypes.func.isRequired,
  trackSources: PropTypes.array.isRequired,
};

export default TrackSourceEditor;
