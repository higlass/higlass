import React from 'react';
import PropTypes from 'prop-types';

import Button from './Button';
import Cross from './Cross';
import withModal from './hocs/with-modal';

import '../styles/Modal.module.scss';

const Modal = (props) => {
  const handleClose = () => {
    props.modal.close();
    if (props.onClose) props.onClose();
  };

  return (
    <div styleName={`modal-background ${props.hide ? 'modal-hide' : ''}`}>
      <div styleName="modal-wrap">
        <div
          styleName={`modal-window ${
            props.maxHeight ? 'modal-window-max-height' : ''
          }`}
        >
          {props.closeButton && (
            <Button onClick={handleClose}>
              <Cross />
            </Button>
          )}
          <div styleName="modal-content">{props.children}</div>
        </div>
      </div>
    </div>
  );
};

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
