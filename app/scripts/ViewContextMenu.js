import React from 'react';
import PropTypes from 'prop-types';

import ContextMenuItem from './ContextMenuItem';

// Styles
import '../styles/ContextMenu.module.scss';

export class ViewContextMenu extends React.Component {
  render() {
    console.log('rendering vcm', this.props.coords);
    return (
      <div>
        <ContextMenuItem
          onClick={() => this.props.onAddTrack({
            type: 'horizontal-rule',
            y: this.props.coords[1], 
            position: 'whole',
          })}
        >
          {'Add Horizontal Rule'}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => this.props.onAddTrack({
            type: 'vertical-rule',
            x: this.props.coords[0], 
            position: 'whole',
          })}
        >
          {'Add Vertical Rule'}
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => this.props.onAddTrack({
            type: 'cross-rule',
            x: this.props.coords[0], 
            y: this.props.coords[1], 
            position: 'whole',
          })}
        >
          {'Add Cross Rule'}
        </ContextMenuItem>

      </div>
    );
  }
}

ViewContextMenu.propTypes = {
  coords: PropTypes.array,  // the data coordinates where this context menu
                            // was initiated
}

export default ViewContextMenu;
