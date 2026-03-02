// @ts-nocheck
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

import Button from './Button';
import Cross from './Cross';
import withModal from './hocs/with-modal';

import classes from '../styles/Modal.module.scss';

function Modal({
  closeButton = true,
  hide = false,
  maxHeight = false,
  modal,
  onClose,
  children,
}) {
  const handleClose = () => {
    modal.close();
    if (onClose) onClose();
  };

  return (
    <div
      className={clsx(classes['modal-background'], {
        [classes['modal-hide']]: hide,
      })}
    >
      <div className={classes['modal-wrap']}>
        <div
          className={clsx(classes['modal-window'], {
            [classes['modal-window-max-height']]: maxHeight,
          })}
        >
          {closeButton && (
            <Button onClick={handleClose}>
              <Cross />
            </Button>
          )}
          <div className={classes['modal-content']}>{children}</div>
        </div>
      </div>
    </div>
  );
}

Modal.propTypes = {
  children: PropTypes.element.isRequired,
  closeButton: PropTypes.bool,
  hide: PropTypes.bool,
  maxHeight: PropTypes.bool,
  modal: PropTypes.object.isRequired,
  onClose: PropTypes.func,
};

export default withModal(Modal);
