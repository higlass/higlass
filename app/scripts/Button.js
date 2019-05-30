import React from 'react';
import PropTypes from 'prop-types';

import styles from '../styles/Button.module.scss';

const doNothing = () => {};

const Button = React.forwardRef((props, ref) => (
  // eslint-disable-next-line react/button-has-type
  <button
    ref={ref}
    className={`${styles.button} ${props.primary ? styles.buttonPrimary : ''} ${props.className}`}
    disable={props.disable.toString()}
    onBlur={props.onBlur}
    onClick={props.onClick}
    onFocus={props.onFocus}
    onMouseDown={props.onMouseDown}
    onMouseOut={props.onMouseOut}
    onMouseUp={props.onMouseUp}
    type={props.type}
  >
    {props.children}
    {props.shortcut && (
      <span className={styles.buttonShortcut}>{props.shortcut}</span>
    )}
  </button>
));

Button.defaultProps = {
  className: '',
  disable: false,
  onBlur: doNothing,
  onClick: doNothing,
  onFocus: doNothing,
  onMouseDown: doNothing,
  onMouseOut: doNothing,
  onMouseUp: doNothing,
  primary: false,
  type: 'button',
};

Button.propTypes = {
  children: PropTypes.func.isRequired,
  className: PropTypes.string,
  disable: PropTypes.bool,
  onBlur: PropTypes.func,
  onClick: PropTypes.func,
  onMouseDown: PropTypes.func,
  onMouseOut: PropTypes.func,
  onMouseUp: PropTypes.func,
  primary: PropTypes.bool,
  shortcut: PropTypes.string,
  type: PropTypes.string,
};

export default Button;
