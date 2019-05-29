import React from 'react';
import PropTypes from 'prop-types';

import styles from '../styles/Input.module.scss';

const doNothing = () => {};

const Input = React.forwardRef((props, ref) => (
  <input
    ref={ref}
    className={`${styles.input} ${props.className}`}
    disable={props.disable}
    onBlur={props.onBlur}
    onChange={props.onChange}
    onClick={props.onClick}
    onFocus={props.onFocus}
    placeholder={props.placeholder}
    type={props.type}
    value={props.value}
  />
));

Input.defaultProps = {
  className: '',
  onClick: doNothing,
  onChange: doNothing,
  onFocus: doNothing,
  onBlur: doNothing,
  placeholder: '',
  type: 'text',
  value: '',
};

Input.propTypes = {
  className: PropTypes.string,
  disable: PropTypes.bool,
  onBlur: PropTypes.func,
  onChange: PropTypes.func,
  onClick: PropTypes.func,
  onFocus: PropTypes.func,
  placeholder: PropTypes.string,
  shortcut: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.string,
};

export default Input;
