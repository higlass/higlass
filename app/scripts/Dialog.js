import React from 'react';
import PropTypes from 'prop-types';

import Button from './Button';
import Cross from './Cross';
import Modal from './Modal';
import withModal from './hocs/with-modal';

import '../styles/Dialog.module.scss';

const Dialog = (props) => {
  const handleCancel = () => {
    props.modal.close();
    if (props.onCancel) props.onCancel();
  };

  const handleOkay = () => {
    props.modal.close();
    if (props.onOkay) props.onOkay();
  };

  return (
    <Modal
      closeButton={false}
      fullHeight={props.fullHeight}
      hide={props.hide}
      maxHeight={props.maxHeight}
    >
      <header styleName={`dialog-header ${Number.isFinite(props.maxHeight) ? 'dialog-header-max' : ''}`}>
        <h3>{props.title}</h3>
        <Button onClick={handleCancel}><Cross /></Button>
      </header>
      <main styleName={`${props.fullHeight ? 'dialog-main-full-height' : ''} ${Number.isFinite(props.maxHeight) ? 'dialog-main-max-height' : ''}`}>
        {props.children}
      </main>
      <footer styleName={`dialog-footer ${Number.isFinite(props.maxHeight) ? 'dialog-footer-max-height' : ''}`}>
        {props.okayOnly ? (
          <div />
        ) : (
          <Button onClick={handleCancel} shortcut={props.cancelShortcut}>
            {props.cancelTitle}
          </Button>
        )}
        <Button onClick={handleOkay} shortcut={props.okayShortcut}>
          {props.okayTitle}
        </Button>
      </footer>
    </Modal>
  );
};

Dialog.defaultProps = {
  cancelTitle: 'Cancel',
  hide: false,
  fullHeight: false,
  maxHeight: Number.NaN,
  okayOnly: false,
  okayTitle: 'Ok',
};

Dialog.propTypes = {
  cancelShortcut: PropTypes.string,
  cancelTitle: PropTypes.string,
  children: PropTypes.func.isRequired,
  hide: PropTypes.bool,
  fullHeight: PropTypes.bool,
  maxHeight: PropTypes.number,
  modal: PropTypes.object.isRequired,
  okayShortcut: PropTypes.string,
  okayTitle: PropTypes.string,
  okayOnly: PropTypes.bool,
  onCancel: PropTypes.func.isRequired,
  onOkay: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
};

export default withModal(Dialog);
