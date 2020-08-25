import React from 'react';

import ContextMenuContainer from './ContextMenuContainer';

// Styles
import '../styles/ContextMenu.module.scss';

export default class ConfigureSeriesMenu extends ContextMenuContainer {
  render() {
    return (
      <div
        ref={(c) => {
          this.div = c;
        }}
        onMouseLeave={this.props.handleMouseLeave}
        style={{
          left: this.state.left,
          top: this.state.top,
        }}
        styleName="context-menu"
      />
    );
  }
}
