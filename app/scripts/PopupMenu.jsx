import React from 'react';
import ReactDOM from 'react-dom';

export class PopupMenu extends React.Component {
    constructor(props) {
        super(props);
    }

  componentDidMount() {
    this.popup = document.createElement("div");
    document.body.appendChild(this.popup);

    this.boundHandleDocumentClick = this.handleDocumentClick.bind(this);
    this.boundHandleDocumentResize = this.handleDocumentResize.bind(this);

    document.addEventListener('click', this.boundHandleDocumentClick, true);
    window.addEventListener('resize', this.boundHandleDocumentResize, true);

    this._renderLayer();
  }

  componentDidUpdate() {
    this._renderLayer();
  }


  componentWillUnmount() {
    console.log('removing event handler');
    document.removeEventListener('click', this.boundHandleDocumentClick, true);
    window.removeEventListener('resize', this.boundHandleDocumentResize, true);
    ReactDOM.unmountComponentAtNode(this.popup);
    document.body.removeChild(this.popup);
  }


  _renderLayer() {
    ReactDOM.render(this.props.children, this.popup);
  }

  handleDocumentResize() {
    this.props.onMenuClosed(null)
  }

  handleDocumentClick(evt) {
      if (!this.popup.contains(evt.target)) {
          this.props.onMenuClosed(evt)
      }
  }


  render() {
    // Render a placeholder
    return(<div ref={(c) => this.area=c } />) 
  }
}
