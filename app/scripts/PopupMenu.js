import React from 'react';
import ReactDOM from 'react-dom';

export class PopupMenu extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.popup = document.createElement('div');
    document.body.appendChild(this.popup);

    this.popup.style.zIndex = 99;
    this.popup.style.position = 'absolute';
    this.popup.className = 'hg-popup';

    this.boundHandleDocumentClick = this.handleDocumentClick.bind(this);
    this.boundHandleDocumentResize = this.handleDocumentResize.bind(this);

    document.addEventListener('click', this.boundHandleDocumentClick, true);
    document.addEventListener('contextmenu', this.boundHandleDocumentClick, true);
    window.addEventListener('resize', this.boundHandleDocumentResize, true);

    this._renderLayer();
  }

  componentDidUpdate() {
    this._renderLayer();
  }


  componentWillUnmount() {
    document.removeEventListener('click', this.boundHandleDocumentClick, true);
    document.removeEventListener('contextmenu', this.boundHandleDocumentClick, true);
    window.removeEventListener('resize', this.boundHandleDocumentResize, true);
    ReactDOM.unmountComponentAtNode(this.popup);
    document.body.removeChild(this.popup);
  }


  _renderLayer() {
    ReactDOM.render(this.props.children, this.popup);
  }

  handleDocumentResize() {
    if (this.props.onMenuClosed) { this.props.onMenuClosed(null); }
  }

  handleDocumentClick(evt) {
    if (!this.popup.contains(evt.target)) {
      if (this.props.onMenuClosed) { this.props.onMenuClosed(evt); }
    }
  }

  render() {
    // Render a placeholder
    return (<div 
      ref={c => this.area = c} 
    />);
  }
}

export default PopupMenu;
