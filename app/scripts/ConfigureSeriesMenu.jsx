// @ts-nocheck
import React from 'react';

import ContextMenuContainer from './ContextMenuContainer';

// Styles
import classes from '../styles/ContextMenu.module.scss';

export default class ConfigureSeriesMenu extends ContextMenuContainer {
  render() {
    return (
      <div
        ref={(c) => {
          this.div = c;
        }}
        className={classes['context-menu']}
        onMouseLeave={this.props.handleMouseLeave}
        style={{
          left: this.state.left,
          top: this.state.top,
        }}
      />
    );
  }
}
