import React from 'react';
import PropTypes from 'prop-types';
import slugid from 'slugid';

export class SearchableTiledPlot extends React.Component {
  constructor(props) {
    super(props);

    this.uid = slugid.nice();
    this.div = null;

    this.state = {
      genomePositionSearchBoxVisible: true,
    };
  }

  componentDidMount() {
  }

  render() {
    return (
      <div
        ref={c => this.div = c}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        { this.props.children }
      </div>
    );
  }
}

SearchableTiledPlot.propTypes = {
  height: PropTypes.number,
  width: PropTypes.number,
};

export default SearchableTiledPlot;
