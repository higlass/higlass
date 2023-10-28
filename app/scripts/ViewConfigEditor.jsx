// @ts-nocheck
import PropTypes from 'prop-types';
import React from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-json';
import Ajv from 'ajv';
import clsx from 'clsx';

import schema from '../schema.json';
import Button from './Button';
import Dialog from './Dialog';
import withModal from './hocs/with-modal';
import withPubSub from './hocs/with-pub-sub';
import { timeout } from './utils';

import classes from '../styles/ViewConfigEditor.module.scss';

class ViewConfigEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      code: props.viewConfig,
      hide: false,
      showLog: false,
      logMsgs: this.getLogMsgs(props.viewConfig),
    };

    this.handleChangeBound = this.handleChange.bind(this);
    this.handleKeyDownBound = this.handleKeyDown.bind(this);
    this.handleKeyUpBound = this.handleKeyUp.bind(this);
    this.handleSubmitBound = this.handleSubmit.bind(this);
    this.hideBound = this.hide.bind(this);
    this.showBound = this.show.bind(this);
    this.toggleLogBound = this.toggleLog.bind(this);

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

      if (this.editorWrap) {
        this.editorWrap.scrollTop = 0;
      }
    }
  }

  componentWillUnmount() {
    this.pubSubs.forEach((subscription) =>
      this.props.pubSub.unsubscribe(subscription),
    );
    this.pubSubs = [];
  }

  handleChange(code) {
    const logMsgs = this.getLogMsgs(code);
    this.setState({ code, logMsgs });
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

  getLogMsgs(code) {
    const logMsgs = [];
    let viewConfig;
    try {
      viewConfig = JSON.parse(code);
    } catch (e) {
      console.warn(e);
      logMsgs.push({ type: 'Error', msg: e.toString() });
      return logMsgs;
    }
    const validate = new Ajv().compile(schema);
    const valid = validate(viewConfig);
    if (!valid) {
      console.warn('Invalid viewconf');
      logMsgs.push({ type: 'Warning', msg: 'Invalid viewconf' });
    }
    if (validate.errors) {
      console.warn(JSON.stringify(validate.errors, null, 2));
      validate.errors.forEach((e) => {
        logMsgs.push({ type: 'Warning', msg: JSON.stringify(e, null, 2) });
      });
    }
    if (logMsgs.length === 0) {
      logMsgs.push({ type: 'Success', msg: 'No error or warnings' });
    }
    return logMsgs;
  }

  hide() {
    this.setState({ hide: true });
  }

  show() {
    this.setState({ hide: false });
  }

  hideLog() {
    this.setState({ showLog: false });
  }

  showLog() {
    this.setState({ showLog: true });
  }

  toggleLog() {
    if (this.state.showLog) {
      this.hideLog();
    } else {
      this.showLog();
    }
  }

  render() {
    const logMessages = this.state.logMsgs.map((d, i) => {
      const key = `${i}-${d.msg}`;
      return (
        <tr key={key}>
          <td
            className={clsx(classes.title, classes[d.type])}
          >{`[${i}] ${d.type}`}</td>
          <td>
            <pre>{d.msg}</pre>
          </td>
        </tr>
      );
    });

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
        <>
          <header className={classes['view-config-editor-header']}>
            <Button
              onBlur={this.showBound}
              onMouseDown={this.hideBound}
              onMouseOut={this.showBound}
              onMouseUp={this.showBound}
            >
              Hide While Mousedown
            </Button>
            <Button
              onClick={() => {
                this.props.onChange(this.state.code);
              }}
              shortcut="⌘+S"
            >
              Save
            </Button>
          </header>
          <div
            ref={(c) => {
              this.editorWrap = c;
            }}
            className={classes['view-config-editor']}
          >
            <Editor
              ref={(c) => {
                this.editor = c;
              }}
              highlight={(code) => highlight(code, languages.json)}
              onValueChange={this.handleChangeBound}
              padding={10}
              style={{
                fontFamily: '"Fira code", "Fira Mono", monospace',
                fontSize: 'inherit',
              }}
              value={this.state.code}
            />
          </div>
          <div
            className={classes['view-config-log']}
            style={{
              height: this.state.showLog ? '50%' : '30px',
            }}
          >
            <div
              className={classes['view-config-log-header']}
              onClick={() => this.toggleLogBound()}
            >
              {`Log Messages (${
                this.state.logMsgs.filter((d) => d.type !== 'Success').length
              })`}
            </div>
            <div
              className={classes['view-config-log-msg']}
              style={{
                padding: this.state.showLog ? '10px' : 0,
              }}
            >
              <table>
                <tbody>{logMessages}</tbody>
              </table>
            </div>
          </div>
        </>
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
  viewConfig: PropTypes.string.isRequired,
};

export default withPubSub(withModal(ViewConfigEditor));
