import React from 'react';
import PropTypes from 'prop-types';

import Button from './Button';
import Cross from './Cross';
import withModal from './hocs/with-modal';

import '../styles/Modal.module.scss';

const getRowHeight = (props) => {
  if (props.fullHeight) {
    return '4rem auto 5rem';
  }
  if (Number.isFinite(props.maxHeight)) {
    return `4rem minmax(auto, ${props.maxHeight - 9}rem) 5rem`;
  }
  return null;
};

const Modal = (props) => {
  const handleClose = () => {
    props.modal.close();
    if (props.onClose) props.onClose();
  };

  return (
    <div styleName={`modal-background ${props.hide ? 'modal-hide' : ''}`}>
      <div styleName="modal-wrap">
        <div
          style={{
            maxHeight: Number.isFinite(props.maxHeight) ? `${props.maxHeight}rem` : ''
          }}
          styleName={`modal-window ${props.fullHeight || Number.isFinite(props.maxHeight) ? 'modal-window-full-height' : ''}`}
        >
          {props.closeButton && (
            <Button onClick={handleClose}><Cross /></Button>
          )}
          <div
            style={{
              gridTemplateRows: getRowHeight(props)
            }}
            styleName={`modal-content ${props.fullHeight ? 'modal-content-full-height' : ''} ${props.maxHeight ? 'modal-content-max-height' : ''}`}
          >
            {props.children}
          </div>
        </div>
      </div>
    </div>
  );
};

Modal.defaultProps = {
  closeButton: true,
  hide: false,
  fullHeight: false,
  maxHeight: Number.NaN,
};

Modal.propTypes = {
  children: PropTypes.element.isRequired,
  closeButton: PropTypes.bool,
  hide: PropTypes.bool,
  fullHeight: PropTypes.bool,
  maxHeight: PropTypes.number,
  modal: PropTypes.object.isRequired,
  onClose: PropTypes.func
};

export default withModal(Modal);
