// @ts-nocheck
import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

import ContextMenuContainer from './ContextMenuContainer';
import ContextMenuItem from './ContextMenuItem';
import NestedContextMenu from './NestedContextMenu';

// Styles
import classes from '../styles/ContextMenu.module.scss';

import { THEME_DARK } from './configs';
import OPTIONS_INFO from './options-info';

class ConfigViewMenu extends ContextMenuContainer {
  constructor(props) {
    super(props);

    this.state = {
      submenuShown: false,
    };
  }

  getConfigureViewMenu(position, bbox) {
    const availableOptions = ['backgroundColor'];
    const menuItems = {};
    const newOptions = {};

    for (const optionType of availableOptions) {
      if (optionType in Object.keys(OPTIONS_INFO)) {
        menuItems[optionType] = { name: OPTIONS_INFO[optionType].name };

        if (OPTIONS_INFO[optionType].inlineOptions) {
          // we can simply select this option from the menu
          for (const inlineOptionKey in OPTIONS_INFO[optionType]
            .inlineOptions) {
            const inlineOption =
              OPTIONS_INFO[optionType].inlineOptions[inlineOptionKey];

            // check if there's already available options (e.g.
            // "Top right") for this option type (e.g. "Label
            // position")
            if (!menuItems[optionType].children) {
              menuItems[optionType].children = {};
            }

            const optionSelectorSettings = {
              name: inlineOption.name,
              value: inlineOption.value,
              // missing handler to be filled in below
            };

            // the menu option defines a potential value for this option
            // type (e.g. "top right")
            optionSelectorSettings.handler = () => {
              newOptions[optionType] = inlineOption.value;
              this.props.onOptionsChanged(newOptions);
            };

            menuItems[optionType].children[inlineOptionKey] =
              optionSelectorSettings;
          }
        }
      }
    }

    return (
      <NestedContextMenu
        key="config-series-menu"
        closeMenu={this.props.closeMenu}
        menuItems={menuItems}
        orientation={this.state.orientation}
        parentBbox={bbox}
        position={position}
        theme={this.props.theme}
      />
    );
  }

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
              top: bbox.top,
            }
          : {
              left: this.state.left + bbox.width + 7,
              top: bbox.top,
            };

      const subMenuData = this.state.submenuShown;
      if (subMenuData.option === 'options') {
        return this.getConfigureViewMenu(position, bbox);
      }

      return <div />;
    }

    return <div />;
  }

  render() {
    return (
      <div
        ref={(c) => {
          this.div = c;
        }}
        className={clsx(classes['context-menu'], {
          [classes['context-menu-dark']]: this.props.theme === THEME_DARK,
        })}
        data-menu-type="ConfigViewMenu"
        style={{
          left: this.state.left,
          top: this.state.top,
        }}
      >
        <ContextMenuItem
          onClick={(e) => this.props.onTogglePositionSearchBox(e)}
        >
          Toggle position search box
        </ContextMenuItem>

        {
          // Fritz: This seems to have been forgotten. The on-click handler does
          // nothing so I comment this out
          //
          // <hr className={classes["context-menu-hr"]} />
          //
          // <ContextMenuItem
          //   onClick={() => {}}
          //   onMouseEnter={e => this.handleItemMouseEnter(e,
          //     {
          //       option: 'options',
          //     })
          //   }
          //   onMouseLeave={e => this.handleMouseLeave(e)}
          // >
          //   {'Options'}
          //   <svg className={classes["play-icon"]}>
          //     <use xlinkHref="#play" />
          //   </svg>
          // </ContextMenuItem>
        }

        <hr className={classes['context-menu-hr']} />

        <ContextMenuItem onClick={(e) => this.props.onZoomToData(e)}>
          Zoom to data extent
        </ContextMenuItem>

        <ContextMenuItem onClick={(e) => this.props.onClearView(e)}>
          Clear View
        </ContextMenuItem>

        <hr className={classes['context-menu-hr']} />

        <ContextMenuItem onClick={(e) => this.props.onYankZoom(e)}>
          Take zoom from
        </ContextMenuItem>

        <ContextMenuItem onClick={(e) => this.props.onYankLocation(e)}>
          Take location from
        </ContextMenuItem>

        <ContextMenuItem onClick={(e) => this.props.onYankZoomAndLocation(e)}>
          Take zoom and location from
        </ContextMenuItem>

        <hr className={classes['context-menu-hr']} />

        <ContextMenuItem onClick={this.props.onLockZoom}>
          Lock zoom with
        </ContextMenuItem>

        <ContextMenuItem onClick={this.props.onLockLocation}>
          Lock location with
        </ContextMenuItem>

        <ContextMenuItem onClick={this.props.onLockZoomAndLocation}>
          Lock zoom and location with
        </ContextMenuItem>

        <hr className={classes['context-menu-hr']} />

        <ContextMenuItem onClick={this.props.onTakeAndLockZoomAndLocation}>
          Take and lock zoom and location with
        </ContextMenuItem>

        <hr className={classes['context-menu-hr']} />

        <ContextMenuItem onClick={(e) => this.props.onUnlockZoom(e)}>
          Unlock zoom
        </ContextMenuItem>

        <ContextMenuItem onClick={(e) => this.props.onUnlockLocation(e)}>
          Unlock location
        </ContextMenuItem>

        <ContextMenuItem onClick={(e) => this.props.onUnlockZoomAndLocation(e)}>
          Unlock zoom and location
        </ContextMenuItem>

        <hr className={classes['context-menu-hr']} />

        <ContextMenuItem onClick={(e) => this.props.onProjectViewport(e)}>
          Show this viewport on
        </ContextMenuItem>

        <hr className={classes['context-menu-hr']} />

        <ContextMenuItem onClick={(e) => this.props.onEditViewConfig(e)}>
          Edit view config
        </ContextMenuItem>

        <hr className={classes['context-menu-hr']} />

        <ContextMenuItem onClick={() => this.props.onExportSVG()}>
          Export views as SVG
        </ContextMenuItem>

        <ContextMenuItem onClick={() => this.props.onExportPNG()}>
          Export views as PNG
        </ContextMenuItem>

        <ContextMenuItem onClick={() => this.props.onExportViewAsJSON()}>
          Export views as JSON
        </ContextMenuItem>

        <ContextMenuItem onClick={() => this.props.onExportViewAsLink()}>
          Export views as Link
        </ContextMenuItem>

        {this.getSubmenu()}
      </div>
    );
  }
}

ConfigViewMenu.propTypes = {
  onEditViewConfig: PropTypes.func.isRequired,
  onExportSVG: PropTypes.func,
  onExportPNG: PropTypes.func,
  onExportViewAsJSON: PropTypes.func,
  onExportViewAsLink: PropTypes.func,
  onLockLocation: PropTypes.func,
  onLockZoom: PropTypes.func,
  onLockZoomAndLocation: PropTypes.func,
  onProjectViewport: PropTypes.func,
  onTakeAndLockZoomAndLocation: PropTypes.func,
  onTogglePositionSearchBox: PropTypes.func,
  onUnlockLocation: PropTypes.func,
  onUnlockZoom: PropTypes.func,
  onUnlockZoomAndLocation: PropTypes.func,
  onYankLocation: PropTypes.func,
  onYankZoom: PropTypes.func,
  onYankZoomAndLocation: PropTypes.func,
  onZoomToData: PropTypes.func,
  theme: PropTypes.symbol,
};

export default ConfigViewMenu;
