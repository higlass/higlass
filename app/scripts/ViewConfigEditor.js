import PropTypes from 'prop-types';
import React from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-json';

import Button from './Button';
import Dialog from './Dialog';

// Styles
import '../styles/ViewConfigEditor.module.scss';

class ViewConfigEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      code: props.viewConfig,
      hide: false,
    };
  }

  handleSubmit(evt) {
    if (evt) evt.preventDefault();

    this.props.onSave(this.state.code);
  }

  render() {
    return (
      <Dialog
        hide={this.state.hide}
        maxHeight={true}
        okayTitle="Save and Close"
        onCancel={this.props.onCancel}
        onOkay={this.handleSubmitBound}
        title="Edit View Config"
      >
        <header styleName="view-config-editor-header">
          <Button
            onBlur={() => { this.setState({ hide: false }); }}
            onMouseDown={() => { this.setState({ hide: true }); }}
            onMouseOut={() => { this.setState({ hide: false }); }}
            onMouseUp={() => { this.setState({ hide: false }); }}
          >
            Hide While Mousedown
          </Button>
          <Button
            onClick={() => { this.props.onChange(this.state.code); }}
          >
            Save
          </Button>
        </header>
        <div styleName="view-config-editor">
          <Editor
            highlight={code => highlight(code, languages.json)}
            onValueChange={(code) => { this.setState({ code }); }}
            padding={10}
            style={{
              fontFamily: '"Fira code", "Fira Mono", monospace',
              fontSize: 'inherit',
              overflow: 'auto'
            }}
            value={this.state.code}
          />
        </div>
      </Dialog>
    );
  }
}

ViewConfigEditor.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  viewConfig: PropTypes.object.isRequired
};

export default ViewConfigEditor;
