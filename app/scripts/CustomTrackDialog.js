import React from 'react';
import PropTypes from 'prop-types';

import Dialog from './Dialog';

// Styles
import '../styles/AddTrackDialog.module.scss';

class CustomTrackDialog extends React.PureComponent {
  render() {
    const TrackSuppliedContent = this.props.children;

    return (
      <Dialog
        maxHeight={true}
        okayOnly={true}
        okayTitle="Close"
        onCancel={this.props.onCancel}
        onOkay={this.props.onCancel}
        title={this.props.title}
      >
        <TrackSuppliedContent {...this.props.bodyProps} />
      </Dialog>
    );
  }
}

CustomTrackDialog.defaultProps = {};

CustomTrackDialog.propTypes = {
  onCancel: PropTypes.func.isRequired,
};

export default CustomTrackDialog;
