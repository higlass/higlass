import PropTypes from 'prop-types';
import React from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-json';

import Button from './Button';
import Dialog from './Dialog';
import withModal from './hocs/with-modal';
import withPubSub from './hocs/with-pub-sub';
import { timeout } from './utils';

import '../styles/ViewConfigEditor.module.scss';

class ViewConfigEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      code: props.viewConfig,
      hide: false,
    };

    this.handleChangeBound = this.handleChange.bind(this);
    this.handleKeyDownBound = this.handleKeyDown.bind(this);
    this.handleKeyUpBound = this.handleKeyUp.bind(this);
    this.handleSubmitBound = this.handleSubmit.bind(this);
    this.hideBound = this.hide.bind(this);
    this.showBound = this.show.bind(this);

    this.pubSubs = [];

    this.pubSubs.push(
      this.props.pubSub.subscribe('keydown', this.handleKeyDownBound),
    );
    this.pubSubs.push(
      this.props.pubSub.subscribe('keyup', this.handleKeyUpBound),
    );
  }

  async componentDidMount() {
    if (this.editor) {
      this.editor._input.focus();
      this.editor._input.setSelectionRange(0, 0);
      await timeout(0);
      this.editorWrap.scrollTop = 0;
    }
  }

  componentWillUnmount() {
    this.pubSubs
      .forEach(subscription => this.props.pubSub.unsubscribe(subscription));
    this.pubSubs = [];
  }

  handleChange(code) {
    this.setState({ code });
  }

  handleKeyDown(event) {
    if (event.key === 's' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.props.onChange(this.state.code);
    }
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.props.onChange(this.state.code);
      this.props.modal.close();
    }
  }

  handleKeyUp(event) {
    this.setState({ hide: false });

    if (event.key === 'Escape') {
      event.preventDefault();
      this.props.modal.close();
      this.props.onCancel();
    }
  }

  handleSubmit(event) {
    if (event) event.preventDefault();

    this.props.onSave(this.state.code);
  }

  hide() {
    this.setState({ hide: true });
  }

  show() {
    this.setState({ hide: false });
  }

  render() {
    return (
      <Dialog
        cancelShortcut="ESC"
        cancelTitle="Discard Changes"
        hide={this.state.hide}
        maxHeight={true}
        okayShortcut="⌘+Enter"
        okayTitle="Save and Close"
        onCancel={this.props.onCancel}
        onOkay={this.handleSubmitBound}
        title="Edit View Config"
      >
        <header styleName="view-config-editor-header">
          <Button
            onBlur={this.showBound}
            onMouseDown={this.hideBound}
            onMouseOut={this.showBound}
            onMouseUp={this.showBound}
          >
            Hide While Mousedown
          </Button>
          <Button
            onClick={() => { this.props.onChange(this.state.code); }}
            shortcut="⌘+S"
          >
            Save
          </Button>
        </header>
        <div
          ref={(c) => { this.editorWrap = c; }}
          styleName="view-config-editor"
        >
          <Editor
            ref={(c) => { this.editor = c; }}
            highlight={code => highlight(code, languages.json)}
            onValueChange={this.handleChangeBound}
            padding={10}
            style={{
              fontFamily: '"Fira code", "Fira Mono", monospace',
              fontSize: 'inherit'
            }}
            value={this.state.code}
          />
        </div>
      </Dialog>
    );
  }
}

ViewConfigEditor.propTypes = {
  modal: PropTypes.object.isRequired,
  onCancel: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  pubSub: PropTypes.object.isRequired,
  viewConfig: PropTypes.object.isRequired
};

export default withPubSub(withModal(ViewConfigEditor));
