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
                    onMouseLeave={(e) => this.props.onMouseLeave ? this.props.onMouseLeave(e) : null }
                    onClick={e => this.props.onClick(e)}
                >
                    <span className='context-menu-span'
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        {this.props.children}
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

        console.log('this.state.orientation:', this.state.orientation);

        let parentBbox = this.props.parentBbox ?  this.props.parentBbox :
            {'top': this.props.position.top,
             'left': this.props.position.left,
             'width': 0, 'height': 0};

        let orientation = this.state.orientation;

        if (this.state.orientation == 'left') {
            let leftPosition = parentBbox.left - bbox.width;
            if (leftPosition < 0)  {
                if (parentBbox.left + parentBbox.width + bbox.width > window.innerWidth) {
                    leftPosition = 0;  // goes off the side either way
                } else {
                    // switch to the right
                    leftPosition = parentBbox.left + parentBbox.width;
                    orientation = 'right';
                    console.log('x lp', leftPosition, parentBbox.left, parentBbox.width);
                }
            } 

            // we're fine keeping it left oriented

            this.setState({
                left: leftPosition,
                top: this.props.position.top,
                orientation: orientation
            });
        }  else {
            let leftPosition = parentBbox.left + parentBbox.width;

            if ((parentBbox.left + parentBbox.width + bbox.width) > window.innerWidth) {
                if (parentBbox.left - bbox.width < 0) {
                    // goes off both sides
                    leftPosition = 0;
                    orientation = 'right';
                } else {
                    console.log('yyy');
                    leftPosition = parentBbox.left - bbox.width;
                    orientation = 'left';

                }
                /*
                console.log('here:', this.props.position);
                leftPosition = leftPosition < 0 ? 0 : leftPosition;

                console.log('leftPosition:', leftPosition);
                */
            }
            this.setState({
                left: leftPosition,
                top: this.props.position.top,
                orientation: orientation
            });
        }
    }

    componentDidUpdate() {
        this.updateOrientation();
    }

    componentDidMount() {
        this.updateOrientation();
    }

    handleItemMouseEnter(evt, series) {
        let domNode = evt.currentTarget;
        let boundingRect = domNode.getBoundingClientRect();
        //console.log('seriesMouseEnter:', domNode);
        //console.log('boundingRect:', boundingRect);

        this.setState({
            submenuShown: series,
            submenuSourceBbox: boundingRect
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

        console.log('this.state.left:', this.state.left)

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
