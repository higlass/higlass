import React from 'react';
import PropTypes from 'prop-types';

import '../styles/Button.module.scss';

const Button = React.forwardRef((props, ref) => (
  <button
    ref={ref}
    disable={props.disable}
    onClick={props.onClick}
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
  onClick: PropTypes.func,
  styleName: PropTypes.string,
  type: PropTypes.string,
};

export default Button;
