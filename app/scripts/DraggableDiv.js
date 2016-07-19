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

        this.minWidth = 20;
        this.minHeight = 15;

        this.state = {
            uid: props.key,
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

    render() {
            let divStyle = { position: 'absolute',
                             top: this.state.top,
                             left: this.state.left,
                             width: this.state.width,
                             height: this.state.height,
                             'backgroundColor': '#eeeeee' };

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
                              
            return (
                    <div style={divStyle} ref={(c) => this.divContainer = c} >
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
    }
}
