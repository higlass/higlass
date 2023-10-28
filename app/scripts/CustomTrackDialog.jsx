// @ts-nocheck
import React from 'react';
import PropTypes from 'prop-types';

import Dialog from './Dialog';

// Styles
import '../styles/AddTrackDialog.module.scss';

class CustomTrackDialog extends React.PureComponent {
  render() {
    const childrenWithProp = [];
    this.props.children.forEach((Child, i) => {
      const key = `customTrackDialog_${i}`;
      // eslint-disable-next-line react/jsx-props-no-spreading
      childrenWithProp.push(<Child key={key} {...this.props.bodyProps[i]} />);
    });

    return (
      <Dialog
        maxHeight={true}
        okayOnly={true}
        okayTitle="Close"
        onCancel={this.props.onCancel}
        onOkay={this.props.onCancel}
        title={this.props.title}
      >
        {childrenWithProp}
      </Dialog>
    );
  }
}

CustomTrackDialog.defaultProps = {};

CustomTrackDialog.propTypes = {
  onCancel: PropTypes.func.isRequired,
  title: PropTypes.string,
  bodyProps: PropTypes.array,
  children: PropTypes.array,
};

export default CustomTrackDialog;
