// @ts-nocheck
import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';

import intoTheVoid from './utils/into-the-void';

class PopupMenu extends React.Component {
  constructor(props) {
    super(props);

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

    this._renderLayer();
  }

  componentDidUpdate() {
    this._renderLayer();
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.clickHandlerBound, true);
    document.removeEventListener(
      'contextmenu',
      this.contextMenuHandlerBound,
      true,
    );
    window.removeEventListener('resize', this.resizeHandlerBound, true);
    ReactDOM.unmountComponentAtNode(this.popup);
    document.body.removeChild(this.popup);
  }

  _renderLayer() {
    ReactDOM.render(this.props.children, this.popup);
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
    // Render a placeholder
    return <div />;
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
