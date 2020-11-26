import PropTypes from 'prop-types';
import React from 'react';

// Styles
import '../styles/ContextMenu.module.scss';

const ContextMenuItem = (props) => (
  <div
    data-menu-item-for={
      typeof props.children === 'string' ? props.children : null
    }
    onClick={(e) => props.onClick(e)}
    onMouseEnter={(e) => props.onMouseEnter(e)}
    onMouseLeave={(e) => props.onMouseLeave(e)}
    role="button"
    styleName="context-menu-item"
    tabIndex={0}
  >
    <span styleName="context-menu-span">{props.children}</span>
  </div>
);

ContextMenuItem.defaultProps = {
  onMouseEnter: () => undefined,
  onMouseLeave: () => undefined,
};

ContextMenuItem.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
};

export default ContextMenuItem;
