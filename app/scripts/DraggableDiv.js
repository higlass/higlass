import "../styles/DraggableDiv.css"
import {drag} from 'd3-drag';
import {select} from 'd3-selection';

import React from 'react';
import {mouse,event} from 'd3-selection';

export class DraggableDiv extends React.Component {
    constructor(props) {
        super(props);

        this.dragTopRight = drag()
                              .on('start', this.dragStart.bind(this))
                              .on('drag', this.dragTopRightFunc.bind(this));
        this.dragTopLeft = drag()
                              .on('start', this.dragStart.bind(this))
                              .on('drag', this.dragTopLeftFunc.bind(this));
        this.dragBottomRight = drag()
                              .on('start', this.dragStart.bind(this))
                              .on('drag', this.dragBottomRightFunc.bind(this));
        this.dragBottomLeft = drag()
                              .on('start', this.dragStart.bind(this))
                              .on('drag', this.dragBottomLeftFunc.bind(this));
        this.dragBottom = drag()
                              .on('start', this.dragStart.bind(this))
                              .on('drag', this.dragBottomFunc.bind(this));

        this.minWidth = 10;
        this.minHeight = 10;
        this.bottomHandleWidth = 20;

        this.state = {
            uid: props.uid,
            width: props.width,
            height: props.height,
            top: props.top,
            left: props.left
        }

        this.domBody = select('body').node()
    }

    componentWillReceiveProps(newProps) {
        if ('width' in newProps) {
            this.setState({width: newProps.width}); 
        }

        if ('height' in newProps) {
            this.setState({height: newProps.height}); 
        }

    }

    componentDidMount() {
        select(this.neHandle).call(this.dragTopRight);
        select(this.nwHandle).call(this.dragTopLeft);
        select(this.swHandle).call(this.dragBottomLeft);
        select(this.seHandle).call(this.dragBottomRight);
        select(this.bottomHandle).call(this.dragBottom);
        select(this.closeHandle).on('click', this.closeClicked.bind(this));
        select(this.rotateHandle).on('click', this.rotateClicked.bind(this));
    }

    dragBottomFunc() {
        let ms = mouse(this.domBody);

        let newTop = this.dragStartTop + ms[1] - this.dragStartMousePos[1];
        let newLeft = this.dragStartLeft + ms[0] - this.dragStartMousePos[0];
        let newWidth = this.state.width; 
        let newHeight = this.state.height;

        this.setState({'top': newTop,
            'left': newLeft });

        this.sizeChanged();
    }

    dragBottomLeftFunc() {
        let ms = mouse(this.domBody);

        let newHeight = this.dragStartHeight + (ms[1] - this.dragStartMousePos[1]);
        newHeight = newHeight > this.minHeight ? newHeight : this.minHeight;

        let newWidth = this.dragStartWidth - (ms[0] - this.dragStartMousePos[0]);
        newWidth = newWidth > this.minWidth ? newWidth : this.minWidth;

        let newLeft = this.dragStartLeft + ms[0] - this.dragStartMousePos[0];
        newLeft = newWidth > this.minWidth ? newLeft : this.dragStartLeft + this.dragStartWidth - this.minWidth;

        let newState = {'top': this.state.top,
            'left': newLeft,
            'width': newWidth,
            'height': newHeight};
        this.setState(newState);

        event.sourceEvent.stopPropagation();
        this.sizeChanged()
    }

    dragBottomRightFunc() {
        let ms = mouse(this.domBody);

        let newWidth = this.dragStartWidth + (ms[0] - this.dragStartMousePos[0]);
        newWidth = newWidth > this.minWidth ? newWidth : this.minWidth;

        let newHeight = this.dragStartHeight + (ms[1] - this.dragStartMousePos[1]);
        newHeight = newHeight > this.minHeight ? newHeight : this.minHeight;

        let newState = {'top': this.state.top,
            'left': this.state.left,
            'width': newWidth,
            'height': newHeight };
        this.setState(newState);

        event.sourceEvent.stopPropagation();
        this.sizeChanged();
    }


    dragTopRightFunc() {
        let ms = mouse(this.domBody);
        console.log('ms:', ms);

        let newHeight = this.dragStartHeight - (ms[1] - this.dragStartMousePos[1]);
        newHeight = newHeight > this.minHeight ? newHeight : this.minHeight;

        let newTop = this.dragStartTop + ms[1] - this.dragStartMousePos[1];
        newTop = newHeight > this.minHeight ? newTop : this.dragStartTop + this.dragStartHeight - this.minHeight;

        let newWidth = this.dragStartWidth + (ms[0] - this.dragStartMousePos[0]);
        newWidth = newWidth > this.minWidth ? newWidth : this.minWidth;

        let newState = {'top': newTop,
            'left': this.state.left,
            'width': newWidth,
            'height': newHeight };

        this.setState(newState);
        console.log('newHeight:', newHeight);

        event.sourceEvent.stopPropagation();
        this.sizeChanged();
    }

    dragTopLeftFunc() {
        let ms = mouse(this.domBody);

        let newWidth = this.dragStartWidth - (ms[0] - this.dragStartMousePos[0]);
        newWidth = newWidth > this.minWidth ? newWidth : this.minWidth;

        let newLeft = this.dragStartLeft + ms[0] - this.dragStartMousePos[0];
        newLeft = newWidth > this.minWidth ? newLeft : this.dragStartLeft + this.dragStartWidth - this.minWidth;

        let newHeight = this.dragStartHeight - (ms[1] - this.dragStartMousePos[1]);
        newHeight = newHeight > this.minHeight ? newHeight : this.minHeight;

        let newTop = this.dragStartTop + ms[1] - this.dragStartMousePos[1];
        newTop = newHeight > this.minHeight ? newTop : this.dragStartTop + this.dragStartHeight - this.minHeight;

        let newState =  {'top': newTop,
                    'left': newLeft,
                    'width': newWidth,
                    'height': newHeight }

        this.setState(newState);

        event.sourceEvent.stopPropagation();

        this.sizeChanged();
    }

    dragStart() {
        this.dragStartMousePos = mouse(this.domBody);

        this.dragStartWidth = this.state.width;
        this.dragStartHeight = this.state.height;

        this.dragStartTop = this.state.top;
        this.dragStartLeft = this.state.left;

        event.sourceEvent.stopPropagation();

    }

    sizeChanged() {
        if ('sizeChanged' in this.props) {
            this.props.sizeChanged(this.state);
        }
    }

    rotateClicked() {
        console.log('rotate clicked');
        this.props.trackRotated(this.state.uid);
    }

    closeClicked() {
        console.log('close clicked');
        this.props.trackClosed(this.state.uid);
    }


    render() {
            let divStyle = { position: 'absolute',
                             top: this.state.top,
                             left: this.state.left,
                             width: this.state.width,
                             height: this.state.height,
                             'backgroundColor': 'transparent',
                             "boxSizing": "border-box",
                             opacity: this.props.opacity };

            let neStyle = { position: 'absolute',
                            right: 1,
                            top: 1,
                            width: 6,
                            height: 6,
                            cursor: 'nesw-resize'};
            let nwStyle = { position: 'absolute',
                            left: 1,
                            top: 1,
                            width: 6,
                            height: 6,
                            cursor: 'nwse-resize'};

            let swStyle = { position: 'absolute',
                            left: 1,
                            bottom: 1,
                            width: 6,
                            height: 6,
                            cursor: 'nesw-resize'};
            let seStyle = { position: 'absolute',
                            right: 1,
                            bottom: 1,
                            width: 6,
                            height: 6,
                            cursor: 'nwse-resize'};
            /*
            let bottomStyle = { position: 'absolute',
                              left: (this.state.width / 2 - this.bottomHandleWidth / 2),
                              bottom: -4,
                              width: this.bottomHandleWidth,
                              height: 6,
                              cursor: 'move' };

            let closeStyle = { position: 'absolute',
                               right: 23,
                               width: 10,
                               height: 5,
                               top: 2,
                               opacity: 0.5 }
            */

            let iStyle = { display: 'inline', 'marginRight': 3 };
            /*
                        <div style={bottomStyle} ref={(c) => this.bottomHandle = c} 
                            className = 'bottom-handle' />

                        <div style={closeStyle} className = 'close-handle' >
                        </div>
                        */

            return (
                    <div style={divStyle} ref={(c) => this.divContainer = c} className={this.props.className}>
                        <div style={neStyle} ref={(c) => this.neHandle = c }
                            className="ne-handle" />
                        <div style={nwStyle} ref={(c) => this.nwHandle = c} 
                            className = 'nw-handle' />
                        <div style={swStyle} ref={(c) => this.swHandle = c} 
                            className = 'sw-handle' />
                        <div style={seStyle} ref={(c) => this.seHandle = c} 
                            className = 'se-handle' />

                    </div>
                   );
                            /*
                            <i className='fa fa-rotate-left' style={iStyle} ref={(c) => this.rotateHandle = c}></i>
                            <i className='fa fa-close' style={iStyle} ref={(c)=> this.closeHandle = c}></i>
                            */
    }
}
