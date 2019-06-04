import React from 'react';
import PropTypes from 'prop-types';

import styles from '../styles/Button.module.scss';

const Button = React.forwardRef((props, ref) => (
  <button
    ref={ref}
    className={`${styles.button} ${props.className || ''}`}
    disable={props.disable}
    onBlur={props.onBlur}
    onClick={props.onClick}
    onMouseDown={props.onMouseDown}
    onMouseOut={props.onMouseOut}
    onMouseUp={props.onMouseUp}
    type="button"
  >
    {props.children}
    {props.shortcut && (
      <span styleName="styles.button-shortcut">{props.shortcut}</span>
    )}
  </button>
));

Button.defaultProps = {
  className: '',
  onClick: () => {},
  type: 'button',
};

Button.propTypes = {
  children: PropTypes.func.isRequired,
  className: PropTypes.string,
  disable: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  onClick: PropTypes.func,
  onMouseDown: PropTypes.func,
  onMouseOut: PropTypes.func,
  onMouseUp: PropTypes.func,
  shortcut: PropTypes.string,
  type: PropTypes.string,
};

export default Button;
