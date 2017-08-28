import React from 'react';
import PropTypes from 'prop-types';

import ContextMenuItem from './ContextMenuItem';

// Styles
import '../styles/ContextMenu.scss';

export class ConfigViewMenu extends React.Component {
  render() {
    return (
      <div>
        <ContextMenuItem
          onClick={e => this.props.onTogglePositionSearchBox(e)}
        >
          {'Toggle position search box'}
        </ContextMenuItem>

        <hr styleName="contect-menu-hr" />

        <ContextMenuItem
          onClick={e => this.props.onZoomToData(e)}
        >
        {'Zoom to data extent'}
        </ContextMenuItem>

        <hr styleName="contect-menu-hr" />

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

        <hr styleName="contect-menu-hr" />

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

        <hr styleName="contect-menu-hr" />

        <ContextMenuItem
          onClick={this.props.onTakeAndLockZoomAndLocation}
        >
          {'Take and lock zoom and location with'}
        </ContextMenuItem>

        <hr styleName="contect-menu-hr" />

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

        <hr styleName="contect-menu-hr" />

        <ContextMenuItem
          onClick={e => this.props.onProjectViewport(e)}
        >
        {'Show this viewport on'}
        </ContextMenuItem>

        <hr styleName="contect-menu-hr" />

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
