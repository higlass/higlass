import "../styles/DraggableDiv.css"

import React from 'react';
import PIXI from 'pixi.js';
import d3 from 'd3';

export class DraggableDiv extends React.Component {
    constructor(props) {
        super(props);

        this.dragTopRight = d3.behavior.drag()
                              .on('dragstart', this.dragStart.bind(this))
                              .on('drag', this.dragTopRightFunc.bind(this));
        this.dragTopLeft = d3.behavior.drag()
                              .on('dragstart', this.dragStart.bind(this))
                              .on('drag', this.dragTopLeftFunc.bind(this));
        this.dragBottomRight = d3.behavior.drag()
                              .on('dragstart', this.dragStart.bind(this))
                              .on('drag', this.dragBottomRightFunc.bind(this));
        this.dragBottomLeft = d3.behavior.drag()
                              .on('dragstart', this.dragStart.bind(this))
                              .on('drag', this.dragBottomLeftFunc.bind(this));
        this.dragBottom = d3.behavior.drag()
                              .on('dragstart', this.dragStart.bind(this))
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
    }

    componentDidMount() {
        d3.select(this.neHandle).call(this.dragTopRight);
        d3.select(this.nwHandle).call(this.dragTopLeft);
        d3.select(this.swHandle).call(this.dragBottomLeft);
        d3.select(this.seHandle).call(this.dragBottomRight);
        d3.select(this.bottomHandle).call(this.dragBottom);
        d3.select(this.closeHandle).on('click', this.closeClicked.bind(this));
        d3.select(this.rotateHandle).on('click', this.rotateClicked.bind(this));
    }

    dragBottomFunc() {
        let ms = d3.mouse(this.divContainer.parentNode);

        let newTop = this.dragStartTop + ms[1] - this.dragStartMousePos[1];
        let newLeft = this.dragStartLeft + ms[0] - this.dragStartMousePos[0];
        let newWidth = this.state.width; 
        let newHeight = this.state.height;

        this.setState({'top': newTop,
            'left': newLeft });

        this.sizeChanged();
    }

    dragBottomLeftFunc() {
        let ms = d3.mouse(this.divContainer.parentNode);

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

        d3.event.sourceEvent.stopPropagation();
        this.sizeChanged()
    }

    dragBottomRightFunc() {
        let ms = d3.mouse(this.divContainer.parentNode);

        let newWidth = this.dragStartWidth + (ms[0] - this.dragStartMousePos[0]);
        newWidth = newWidth > this.minWidth ? newWidth : this.minWidth;

        let newHeight = this.dragStartHeight + (ms[1] - this.dragStartMousePos[1]);
        newHeight = newHeight > this.minHeight ? newHeight : this.minHeight;

        let newState = {'top': this.state.top,
            'left': this.state.left,
            'width': newWidth,
            'height': newHeight };
        this.setState(newState);

        d3.event.sourceEvent.stopPropagation();
        this.sizeChanged();
    }


    dragTopRightFunc() {
        let ms = d3.mouse(this.divContainer.parentNode);

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

        d3.event.sourceEvent.stopPropagation();
        this.sizeChanged();
    }

    dragTopLeftFunc() {
        let ms = d3.mouse(this.divContainer.parentNode);

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

        d3.event.sourceEvent.stopPropagation();

        this.sizeChanged();
    }

    dragStart() {
        this.dragStartMousePos = d3.mouse(this.divContainer.parentNode);

        this.dragStartWidth = this.state.width;
        this.dragStartHeight = this.state.height;

        this.dragStartTop = this.state.top;
        this.dragStartLeft = this.state.left;

        d3.event.sourceEvent.stopPropagation();

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
                             'backgroundColor': '#ffffff',
                             opacity: this.props.opacity };

            let neStyle = { position: 'absolute',
                            right: 0,
                            width: 5,
                            height: 5,
                            cursor: 'nesw-resize'};
            let nwStyle = { position: 'absolute',
                            left: 0,
                            width: 5,
                            height: 5,
                            cursor: 'nwse-resize'};

            let swStyle = { position: 'absolute',
                            left: 0,
                            bottom: 0,
                            width: 5,
                            height: 5,
                            cursor: 'nesw-resize'};
            let seStyle = { position: 'absolute',
                            right: 0,
                            bottom: 0,
                            width: 5,
                            height: 5,
                            cursor: 'nwse-resize'};
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

            let iStyle = { display: 'inline', 'marginRight': 3 };

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

                        <div style={bottomStyle} ref={(c) => this.bottomHandle = c} 
                            className = 'bottom-handle' />

                        <div style={closeStyle} className = 'close-handle' >
                        </div>
                    </div>
                   );
                            /*
                            <i className='fa fa-rotate-left' style={iStyle} ref={(c) => this.rotateHandle = c}></i>
                            <i className='fa fa-close' style={iStyle} ref={(c)=> this.closeHandle = c}></i>
                            */
    }
}
