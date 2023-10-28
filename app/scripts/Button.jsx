// @ts-nocheck
import React from 'react';
import PropTypes from 'prop-types';

import classes from '../styles/Button.module.scss';

const Button = React.forwardRef((props, ref) => (
  <button
    ref={ref}
    className={classes[props.styleName] ?? classes.button}
    disabled={props.disable}
    onBlur={props.onBlur}
    onClick={props.onClick}
    onMouseDown={props.onMouseDown}
    onMouseOut={props.onMouseOut}
    onMouseUp={props.onMouseUp}
    type="button"
  >
    {props.children}
    {props.shortcut && (
      <span className={classes['button-shortcut']}>{props.shortcut}</span>
    )}
  </button>
));

Button.defaultProps = {
  onClick: () => {},
  styleName: '',
  type: 'button',
};

Button.propTypes = {
  children: PropTypes.any,
  disable: PropTypes.bool,
  onBlur: PropTypes.func,
  onClick: PropTypes.func,
  onMouseDown: PropTypes.func,
  onMouseOut: PropTypes.func,
  onMouseUp: PropTypes.func,
  shortcut: PropTypes.string,
  type: PropTypes.string,
  styleName: PropTypes.string,
};

export default Button;
