import React from 'react';
import PropTypes from 'prop-types';

import ContextMenuContainer from './ContextMenuContainer';
import ContextMenuItem from './ContextMenuItem';

// Styles
import '../styles/ContextMenu.module.scss';

class ConfigViewMenu extends ContextMenuContainer {
  constructor(props) {
    super(props);

    this.state = {
      submenuShown: false,
    };
  }

  getSubmenu() {
    if (this.state.submenuShown) {
      // the bounding box of the element which initiated the subMenu
      // necessary so that we can position the submenu next to the initiating
      // element
      const bbox = this.state.submenuSourceBbox;
      const position = this.state.orientation === 'left' ? (
        {
          left: this.state.left,
          top: bbox.top,
        }
      ) : (
        {
          left: this.state.left + bbox.width + 7,
          top: bbox.top,
        }
      );

      const subMenuData = this.state.submenuShown;
      if (subMenuData.option == 'options') {
        console.log('options');
        //return this.getConfigureSeriesMenu(position, bbox, track);
      }

      return(<div />);
    }

    return (<div />);
  }

  render() {
    console.log('render', this.state.submenuShown);

    let styleNames = 'context-menu';

    return (
      <div
        ref={c => this.div = c}
        style={{
          left: this.state.left,
          top: this.state.top,
        }}
        styleName={styleNames}
      >
        <ContextMenuItem
          onClick={e => this.props.onZoomToData(e)}
        >
        {'Zoom to data extent'}
        </ContextMenuItem>

        <hr styleName="context-menu-hr" />

        <ContextMenuItem
          onClick={this.props.onConfigureTrack}
          onMouseEnter={e => this.handleItemMouseEnter(e,
            {
              option: 'options',
            })
          }
          onMouseLeave={e => this.handleMouseLeave(e)}
        >
          {'View options'}
          <svg styleName="play-icon" >
            <use xlinkHref="#play" />
          </svg>
        </ContextMenuItem>

        <hr styleName="context-menu-hr" />

        <ContextMenuItem
          onClick={e => this.props.onClearView(e)}
        >
        {'Clear View'}
        </ContextMenuItem>

        <hr styleName="context-menu-hr" />

        <ContextMenuItem
          onClick={e => this.props.onYankZoom(e)}
        >
          {'Take zoom from'}
        </ContextMenuItem>

        <ContextMenuItem
          onClick={e => this.props.onYankLocation(e)}
        >
          {'Take location from'}
        </ContextMenuItem>

        <ContextMenuItem
          onClick={e => this.props.onYankZoomAndLocation(e)}
        >
          {'Take zoom and location from'}
        </ContextMenuItem>

        <hr styleName="context-menu-hr" />

        <ContextMenuItem
          onClick={this.props.onLockZoom}
        >
          {'Lock zoom with'}
        </ContextMenuItem>

        <ContextMenuItem
          onClick={this.props.onLockLocation}
        >
          {'Lock location with'}
        </ContextMenuItem>

        <ContextMenuItem
          onClick={this.props.onLockZoomAndLocation}
        >
          {'Lock zoom and location with'}
        </ContextMenuItem>

        <hr styleName="context-menu-hr" />

        <ContextMenuItem
          onClick={this.props.onTakeAndLockZoomAndLocation}
        >
          {'Take and lock zoom and location with'}
        </ContextMenuItem>

        <hr styleName="context-menu-hr" />

        <ContextMenuItem
          onClick={e => this.props.onUnlockZoom(e)}
        >
          {'Unlock zoom'}
        </ContextMenuItem>

        <ContextMenuItem
          onClick={e => this.props.onUnlockLocation(e)}
        >
          {'Unlock location'}
        </ContextMenuItem>

        <ContextMenuItem
          onClick={e => this.props.onUnlockZoomAndLocation(e)}
        >
          {'Unlock zoom and location'}
        </ContextMenuItem>

        <hr styleName="context-menu-hr" />

        <ContextMenuItem
          onClick={e => this.props.onProjectViewport(e)}
        >
        {'Show this viewport on'}
        </ContextMenuItem>

        <hr styleName="context-menu-hr" />

        <ContextMenuItem
          onClick={() => this.props.onExportSVG()}
        >
        {'Export views as SVG'}
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => this.props.onExportViewAsJSON()}
        >
        {'Export views as JSON'}
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => this.props.onExportViewAsLink()}
        >
        {'Export views as Link'}
        </ContextMenuItem>

        {this.getSubmenu()}

      </div>
    );
  }
}

ConfigViewMenu.propTypes = {
  onExportSVG: PropTypes.func,
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
  onZoomToData: PropTypes.func
}

export default ConfigViewMenu;
