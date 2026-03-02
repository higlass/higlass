// @ts-nocheck
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

import Button from './Button';
import Cross from './Cross';
import Modal from './Modal';
import withModal from './hocs/with-modal';

import classes from '../styles/Dialog.module.scss';

function Dialog({
  cancelTitle = 'Cancel',
  hide = false,
  maxHeight = false,
  okayOnly = false,
  okayTitle = 'Ok',
  modal,
  onCancel,
  onOkay,
  title,
  cancelShortcut,
  okayShortcut,
  children,
}) {
  const handleCancel = () => {
    modal.close();
    if (onCancel) onCancel();
  };

  const handleOkay = () => {
    modal.close();
    if (onOkay) onOkay();
  };

  return (
    <Modal closeButton={false} hide={hide} maxHeight={maxHeight}>
      <>
        <header className={classes['dialog-header']}>
          <h3>{title}</h3>
          <Button onClick={handleCancel}>
            <Cross />
          </Button>
        </header>
        {maxHeight ? (
          <main
            className={clsx(maxHeight && classes['dialog-main-max-height'])}
          >
            {children}
          </main>
        ) : (
          <main>{children}</main>
        )}
        <footer
          className={
            classes[maxHeight ? 'dialog-footer-max-height' : 'dialog-footer']
          }
        >
          {okayOnly ? (
            <div />
          ) : (
            <Button onClick={handleCancel} shortcut={cancelShortcut}>
              {cancelTitle}
            </Button>
          )}
          <Button onClick={handleOkay} shortcut={okayShortcut}>
            {okayTitle}
          </Button>
        </footer>
      </>
    </Modal>
  );
}

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
