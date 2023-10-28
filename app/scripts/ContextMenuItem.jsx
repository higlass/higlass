// @ts-nocheck
import PropTypes from 'prop-types';
import React from 'react';

// Styles
import classes from '../styles/ContextMenu.module.scss';

function ContextMenuItem(props) {
  return (
    <div
      data-menu-item-for={
        typeof props.children === 'string' ? props.children : null
      }
      className={classes['context-menu-item']}
      onClick={(e) => props.onClick(e)}
      onMouseEnter={(e) => props.onMouseEnter(e)}
      onMouseLeave={(e) => props.onMouseLeave(e)}
      role="button"
      tabIndex={0}
    >
      <span className={classes['context-menu-span']}>{props.children}</span>
    </div>
  );
}

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
