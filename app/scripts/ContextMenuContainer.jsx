import '../styles/ContextMenuContainer.css';
import React from 'react';
import ReactDOM from 'react-dom';

export class ContextMenuItem extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
                <div 
                    className={"context-menu-item"}
                    onMouseEnter={(e) => this.props.onMouseEnter ? this.props.onMouseEnter(e) : null }
                    onClick={e => this.props.onClick(e)}
                >
                    <span
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        {this.props.text}
                    </span>
                </div>
               );
    }
}

export class ContextMenuContainer extends React.Component {
    constructor(props) {
        /**
         * A window that is opened when a user clicks on the track configuration icon.
         */
        super(props);

        this.adjusted = false;
        console.log('cmc props:', props);

        this.state = {
            orientation: this.props.orientation ? this.props.orientation : 'right',
            left: this.props.position.left,
            top: this.props.position.top,
            submenuShown: null
        }
    }

    componentWillReceiveProps(newProps) {
        this.adjusted = false;

        this.setState({
            left: newProps.position.left,
            top: newProps.position.top
        });
    }

    updateOrientation() {
        if (this.adjusted)
            return;

        this.adjusted = true;
        this.divDom = ReactDOM.findDOMNode(this.div);
        let bbox = this.divDom.getBoundingClientRect();

        console.log('cmc bbox:', bbox);

        if (this.state.orientation == 'left') {
            this.setState({
                left: this.props.position.left - bbox.width,
                top: this.props.position.top
            });
        }  else {
            if ((bbox.left + bbox.width) > window.innerWidth) {
                this.setState({
                    left: this.props.position.left - bbox.width,
                    top: this.props.position.top,
                    orientation: 'left'
                });
            }
        }
    }

    componentDidUpdate() {
        this.updateOrientation();
    }

    componentDidMount() {
        this.updateOrientation();
    }

    /*
    handleSeriesMouseEnter(evt, uid) {
        let domNode = evt.currentTarget;

        this.setState({
            submenuShown: uid,
            submenuSourceBbox: domNode.getBoundingClientRect()
        });
    }

    handleMouseLeave(evt) {
        return;
    }

    handleOtherMouseEnter(evt) {
        this.setState({
            submenuShown: null
        });
    }
    */

    render() {
        let stylePosition = {'left': this.state.left}

        if (!this.state.left)
            stylePosition = {'right': this.state.right}

        let otherStyle = { position: 'fixed',
            top: this.state.top,
            border: '1px solid black'
        };

        let wholeStyle = Object.assign(stylePosition, otherStyle);

        return(
            <div className={'context-menu'}
                    ref={c => this.div = c}
                    style={ wholeStyle }
                >
                {this.props.children}
            </div>
        )
    }
}
