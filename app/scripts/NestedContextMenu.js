import React from 'react';

import ContextMenuContainer from './ContextMenuContainer';
import ContextMenuItem from './ContextMenuItem';

import { THEME_DARK } from './configs';

// Styles
import '../styles/ContextMenu.module.scss';

class NestedContextMenu extends ContextMenuContainer {
  getSubmenu() {
    if (this.state.submenuShown) {
      // the bounding box of the element which initiated the subMenu
      // necessary so that we can position the submenu next to the initiating
      // element
      const bbox = this.state.submenuSourceBbox;
      const position =
        this.state.orientation === 'left'
          ? {
              left: this.state.left,
              top: bbox.top
            }
          : {
              left: this.state.left + bbox.width + 7,
              top: bbox.top
            };

      const menuItem = this.state.submenuShown;

      return (
        <NestedContextMenu
          menuItems={menuItem.children}
          orientation={this.state.orientation}
          parentBbox={bbox}
          position={position}
          theme={this.props.theme}
        />
      );
    }
    return <div />;
  }

  componentWillUnmount() {}

  render() {
    const menuItems = [];

    // iterate over the list
    for (const menuItemKey in this.props.menuItems) {
      const menuItem = this.props.menuItems[menuItemKey];

      menuItems.push(
        <ContextMenuItem
          key={menuItemKey}
          onClick={menuItem.handler ? menuItem.handler : () => null}
          onMouseEnter={
            menuItem.children
              ? e => this.handleItemMouseEnter(e, menuItem)
              : this.handleOtherMouseEnter.bind(this)
          }
          onMouseLeave={this.handleMouseLeave}
        >
          {menuItem.name}
          {menuItem.children && (
            <svg styleName="play-icon">
              <use xlinkHref="#play" />
            </svg>
          )}
        </ContextMenuItem>
      );
    }

    let styleNames = 'context-menu';
    if (this.props.theme === THEME_DARK) styleNames += ' context-menu-dark';

    return (
      <div
        ref={c => {
          this.div = c;
        }}
        style={{
          left: this.state.left,
          top: this.state.top
        }}
        styleName={styleNames}
      >
        {menuItems}
        {this.getSubmenu()}
      </div>
    );
  }
}

export default NestedContextMenu;
