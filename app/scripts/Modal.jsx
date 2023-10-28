// @ts-nocheck
import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

import Button from './Button';
import Cross from './Cross';
import withModal from './hocs/with-modal';

import classes from '../styles/Modal.module.scss';

function Modal(props) {
  const handleClose = () => {
    props.modal.close();
    if (props.onClose) props.onClose();
  };

  return (
    <div
      className={clsx(classes['modal-background'], {
        [classes['modal-hide']]: props.hide,
      })}
    >
      <div className={classes['modal-wrap']}>
        <div
          className={clsx(classes['modal-window'], {
            [classes['modal-window-max-height']]: props.maxHeight,
          })}
        >
          {props.closeButton && (
            <Button onClick={handleClose}>
              <Cross />
            </Button>
          )}
          <div className={classes['modal-content']}>{props.children}</div>
        </div>
      </div>
    </div>
  );
}

Modal.defaultProps = {
  closeButton: true,
  hide: false,
  maxHeight: false,
};

Modal.propTypes = {
  children: PropTypes.element.isRequired,
  closeButton: PropTypes.bool,
  hide: PropTypes.bool,
  maxHeight: PropTypes.bool,
  modal: PropTypes.object.isRequired,
  onClose: PropTypes.func,
};

export default withModal(Modal);
