import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

// Styles
import classes from '../styles/ContextMenu.module.scss';

/**
 * @typedef ContextMenuItemProps
 * @prop {string} [className]
 * @prop {(evt: React.MouseEvent) => void} onClick
 * @prop {(evt: React.MouseEvent) => void} [onMouseEnter]
 * @prop {(evt: React.MouseEvent) => void} [onMouseLeave]
 */

/**
 * @param {React.PropsWithChildren<ContextMenuItemProps>} props
 */
function ContextMenuItem({
  onMouseEnter = () => undefined,
  onMouseLeave = () => undefined,
  onClick,
  className,
  children,
}) {
  return (
    <div
      data-menu-item-for={typeof children === 'string' ? children : null}
      className={clsx(classes['context-menu-item'], className)}
      onClick={(e) => onClick(e)}
      onMouseEnter={(e) => onMouseEnter(e)}
      onMouseLeave={(e) => onMouseLeave(e)}
      // biome-ignore lint/a11y/useSemanticElements:
      role="button"
      tabIndex={0}
    >
      <span className={classes['context-menu-span']}>{children}</span>
    </div>
  );
}

ContextMenuItem.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
};

export default ContextMenuItem;
