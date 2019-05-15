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
    <Modal closeButton={false}>
      <header styleName="dialog-header">
        <h3>{props.title}</h3>
        <Button onClick={handleCancel}><Cross /></Button>
      </header>
      <main>{props.children}</main>
      <footer styleName="dialog-footer">
        <Button onClick={handleCancel}>
          {props.cancelTitle}
        </Button>
        <Button onClick={handleOkay}>
          {props.okayTitle}
        </Button>
      </footer>
    </Modal>
  );
};

Dialog.defaultProps = {
  cancelTitle: 'Cancel',
  okayTitle: 'Ok',
};

Dialog.propTypes = {
  cancelTitle: PropTypes.string,
  children: PropTypes.func.isRequired,
  modal: PropTypes.object.isRequired,
  okayTitle: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onOkay: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
};

export default withModal(Dialog);
