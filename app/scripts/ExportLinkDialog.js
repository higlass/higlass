import React from 'react';
import PropTypes from 'prop-types';

import Dialog from './Dialog';

import '../styles/ExportLinkDialog.module.scss';

const ExportLinkDialog = props => (
  <Dialog
    okayOnly={true}
    okayTitle="Done"
    onOkay={props.onDone}
    title="Share view link"
  >
    <input
      onClick={event => event.target.select()}
      placeholder="Generating the link..."
      readOnly={true}
      styleName="full-width"
      value={props.url}
    />
  </Dialog>
);

ExportLinkDialog.defaultProps = {
  onDone: () => {},
  url: ''
};

ExportLinkDialog.propTypes = {
  onDone: PropTypes.func,
  url: PropTypes.string
};

export default ExportLinkDialog;
