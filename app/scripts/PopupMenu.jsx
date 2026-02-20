// @ts-nocheck
import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';

import intoTheVoid from './utils/into-the-void';

class PopupMenu extends React.Component {
  constructor(props) {
    super(props);

    this.popup = null;
    this.clickHandlerBound = this.clickHandler.bind(this);
    this.contextMenuHandlerBound = this.contextMenuHandler.bind(this);
    this.resizeHandlerBound = this.resizeHandler.bind(this);
  }

  componentDidMount() {
    this.popup = document.createElement('div');
    document.body.appendChild(this.popup);

    this.popup.style.zIndex = 99;
    this.popup.style.position = 'absolute';
    this.popup.className = 'hg-popup';

    document.addEventListener('click', this.clickHandlerBound, true);
    document.addEventListener(
      'contextmenu',
      this.contextMenuHandlerBound,
      true,
    );
    window.addEventListener('resize', this.resizeHandlerBound, true);

    // Re-render now that this.popup is ready for the portal
    this.forceUpdate();
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.clickHandlerBound, true);
    document.removeEventListener(
      'contextmenu',
      this.contextMenuHandlerBound,
      true,
    );
    window.removeEventListener('resize', this.resizeHandlerBound, true);
    // React automatically cleans up the portal contents
    document.body.removeChild(this.popup);
  }

  clickHandler(event) {
    if (!this.popup.contains(event.target)) {
      if (this.props.onMenuClosed) this.props.onMenuClosed(event);
    }
  }

  contextMenuHandler(event) {
    if (event.altKey) return;
    event.preventDefault();
    this.clickHandler(event);
  }

  resizeHandler() {
    this.props.onMenuClosed(null);
  }

  render() {
    if (!this.popup) return null;
    return ReactDOM.createPortal(this.props.children, this.popup);
  }
}

PopupMenu.defaultProps = {
  onMenuClosed: intoTheVoid,
};

PopupMenu.propTypes = {
  children: PropTypes.node.isRequired,
  onMenuClosed: PropTypes.func,
};

export default PopupMenu;
