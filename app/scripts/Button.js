import React from 'react';
import PropTypes from 'prop-types';

import '../styles/Button.module.scss';

const Button = React.forwardRef((props, ref) => (
  <button
    ref={ref}
    disable={props.disable}
    onBlur={props.onBlur}
    onClick={props.onClick}
    onMouseDown={props.onMouseDown}
    onMouseOut={props.onMouseOut}
    onMouseUp={props.onMouseUp}
    styleName={`button ${props.styleName}`}
    type="button"
  >
    {props.children}
  </button>
));

Button.defaultProps = {
  onClick: () => {},
  styleName: '',
  type: 'button',
};

Button.propTypes = {
  children: PropTypes.func.isRequired,
  disable: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  onClick: PropTypes.func,
  onMouseDown: PropTypes.func,
  onMouseOut: PropTypes.func,
  onMouseUp: PropTypes.func,
  styleName: PropTypes.string,
  type: PropTypes.string,
};

export default Button;
