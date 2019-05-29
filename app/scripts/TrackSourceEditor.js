import PropTypes from 'prop-types';
import React from 'react';

import Button from './Button';
import Input from './Input';

import styles from '../styles/TrackSourceEditor.module.scss';

class TrackSourceEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      trackSources: new Array(props.trackSources).fill(undefined)
    };

    this.handleAddBound = this.handleAdd.bind(this);
    this.handleSaveBound = this.handleSave.bind(this);
  }

  componentWillUpdate(newProps) {

  }

  handleAdd() {
    this.props.onTrackSourceChanged([...this.props.trackSources, '']);
  }

  handleChange(i) {
    return ({ target: { value } }) => {
      this.setState((prevState) => {
        const newTrackSources = [...prevState.trackSources];
        newTrackSources[i] = value;
        return { trackSources: newTrackSources };
      });
    };
  }

  handleDelete(i) {
    return () => {
      const newTrackSources = [...this.props.trackSources];
      newTrackSources.splice(i, 1);
      this.props.onTrackSourceChanged(newTrackSources);
    };
  }

  handleSave() {
    const newTrackSources = [...this.props.trackSources];

    this.state.trackSources.forEach((trackSource, i) => {
      newTrackSources[i] = trackSource || newTrackSources[i];
    });

    this.props.onTrackSourceSaved(newTrackSources);

    this.setState((prevState) => {
      const newInternalTrackSources = [...prevState.trackSources];
      newInternalTrackSources.forEach((trackSource, i) => {
        newInternalTrackSources[i] = undefined;
      });
      return { trackSources: newInternalTrackSources };
    });
  }

  render() {
    return (
      <div>
        {this.props.trackSources.map((trackSource, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={`${trackSource}-${i}`} styleName="styles.trackSource">
            <Input
              className={styles.trackSourceInput}
              onChange={this.handleChange(i)}
              placeholder="http://higlass.io/api/v1"
              type="url"
              value={this.state.trackSources[i] || trackSource}
            />
            <Button
              className={styles.trackSourceDelete}
              onClick={this.handleDelete(i)}
            >
              Delete
            </Button>
          </div>
        ))}
        <footer styleName="styles.trackSourceFooter">
          <Button onClick={this.handleAddBound}>
            Add new source
          </Button>
          <Button
            className={styles.trackSourceSave}
            onClick={this.handleSaveBound}
          >
            Save
          </Button>
        </footer>
      </div>
    );
  }
}

TrackSourceEditor.propTypes = {
  onTrackSourceChanged: PropTypes.func.isRequired,
  onTrackSourceSaved: PropTypes.func.isRequired,
  trackSources: PropTypes.array.isRequired,
};

export default TrackSourceEditor;
