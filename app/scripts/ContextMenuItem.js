import PropTypes from 'prop-types';
import React from 'react';

// Styles
import '../styles/ContextMenu.module.scss';

const ContextMenuItem = props => (
  <div
    onClick={e => props.onClick(e)}
    onMouseEnter={e => props.onMouseEnter && props.onMouseEnter(e)}
    onMouseLeave={e => props.onMouseLeave && props.onMouseLeave(e)}
    role="button"
    styleName="context-menu-item"
    tabIndex={0}
  >
    <span
      styleName="context-menu-span"
    >
      {props.children}
    </span>
  </div>
);

ContextMenuItem.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
  onMouseEnter: PropTypes.func.isRequired,
  onMouseLeave: PropTypes.func.isRequired
};

export default ContextMenuItem;
