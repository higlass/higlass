import React from 'react';
import PropTypes from 'prop-types';

import Button from './Button';
import Dialog from './Dialog';

import '../styles/ExportLinkDialog.module.scss';

class ExportLinkDialog extends React.Component {
  render() {
    return (
      <Dialog
        okayOnly={true}
        okayTitle="Done"
        onOkay={this.props.onDone}
        title="Share view link"
      >
        <div styleName="export-link-dialog-wrapper">
          <input
            ref={(element) => {
              if (!element) return;
              this.input = element;
              element.focus();
              element.select();
            }}
            onClick={(event) => {
              event.target.select();
            }}
            placeholder="Generating the link..."
            readOnly={true}
            value={this.props.url}
          />
          <Button
            onClick={(event) => {
              this.input.select();
              document.execCommand('copy');
            }}
          >
            Copy
          </Button>
        </div>
      </Dialog>
    );
  }
}

ExportLinkDialog.defaultProps = {
  onDone: () => {},
  url: '',
};

ExportLinkDialog.propTypes = {
  onDone: PropTypes.func,
  url: PropTypes.string,
};

export default ExportLinkDialog;
