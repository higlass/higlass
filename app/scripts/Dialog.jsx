// @ts-nocheck
import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

import Button from './Button';
import Cross from './Cross';
import Modal from './Modal';
import withModal from './hocs/with-modal';

import classes from '../styles/Dialog.module.scss';

function Dialog(props) {
  const handleCancel = () => {
    props.modal.close();
    if (props.onCancel) props.onCancel();
  };

  const handleOkay = () => {
    props.modal.close();
    if (props.onOkay) props.onOkay();
  };

  return (
    <Modal closeButton={false} hide={props.hide} maxHeight={props.maxHeight}>
      <>
        <header className={classes['dialog-header']}>
          <h3>{props.title}</h3>
          <Button onClick={handleCancel}>
            <Cross />
          </Button>
        </header>
        {props.maxHeight ? (
          <main
            className={clsx(
              props.maxHeight && classes['dialog-main-max-height'],
            )}
          >
            {props.children}
          </main>
        ) : (
          <main>{props.children}</main>
        )}
        <footer
          className={
            classes[
              props.maxHeight ? 'dialog-footer-max-height' : 'dialog-footer'
            ]
          }
        >
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
      </>
    </Modal>
  );
}

Dialog.defaultProps = {
  cancelTitle: 'Cancel',
  hide: false,
  maxHeight: false,
  okayOnly: false,
  okayTitle: 'Ok',
};

Dialog.propTypes = {
  cancelShortcut: PropTypes.string,
  cancelTitle: PropTypes.string,
  children: PropTypes.object,
  hide: PropTypes.bool,
  maxHeight: PropTypes.bool,
  modal: PropTypes.object.isRequired,
  okayShortcut: PropTypes.string,
  okayTitle: PropTypes.string,
  okayOnly: PropTypes.bool,
  onCancel: PropTypes.func.isRequired,
  onOkay: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
};

export default withModal(Dialog);
