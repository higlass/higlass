import PropTypes from 'prop-types';
import React from 'react';

// Styles
import '../styles/ContextMenu.scss';

export class ContextMenuItem extends React.Component {
  render() {
    return (
      <div
        className="context-menu-item"
        onClick={e => this.props.onClick(e)}
        onMouseEnter={e => this.props.onMouseEnter && this.props.onMouseEnter(e)}
        onMouseLeave={e => this.props.onMouseLeave && this.props.onMouseLeave(e)}
      >
        <span
          className="context-menu-span"
          style={{ whiteSpace: 'nowrap' }}
        >
          {this.props.children}
        </span>
      </div>
    );
  }
}

ContextMenuItem.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func
};

export default ContextMenuItem;
