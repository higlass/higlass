import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

// Styles
import classes from '../styles/ContextMenu.module.scss';

/**
 * @typedef ContextMenuItemProps
 * @prop {string} [className]
 * @prop {(evt: React.MouseEvent) => void} onClick
 * @prop {(evt: React.MouseEvent) => void} onMouseEnter
 * @prop {(evt: React.MouseEvent) => void} onMouseLeave
 */

/**
 * @param {React.PropsWithChildren<ContextMenuItemProps>} props
 */
function ContextMenuItem(props) {
  return (
    <div
      data-menu-item-for={
        typeof props.children === 'string' ? props.children : null
      }
      className={clsx(classes['context-menu-item'], props.className)}
      onClick={(e) => props.onClick(e)}
      onMouseEnter={(e) => props.onMouseEnter(e)}
      onMouseLeave={(e) => props.onMouseLeave(e)}
      // biome-ignore lint/a11y/useSemanticElements:
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
