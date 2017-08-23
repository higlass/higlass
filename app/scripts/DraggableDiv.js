import "../styles/DraggableTrack.css"
import {drag} from 'd3-drag';
import {select} from 'd3-selection';

import React from 'react';
import {mouse,event} from 'd3-selection';

export default class DraggableDiv extends React.Component {
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
        this.dragTop = drag()
                              .on('start', this.dragStart.bind(this))
                              .on('drag', this.dragTopFunc.bind(this));
        this.dragLeft = drag()
                              .on('start', this.dragStart.bind(this))
                              .on('drag', this.dragLeftFunc.bind(this));
        this.dragRight = drag()
                              .on('start', this.dragStart.bind(this))
                              .on('drag', this.dragRightFunc.bind(this));

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
        /*
        select(this.neHandle).call(this.dragTopRight);
        select(this.nwHandle).call(this.dragTopLeft);
        select(this.swHandle).call(this.dragBottomLeft);
        select(this.seHandle).call(this.dragBottomRight);
        */

        select(this.bottomHandle).call(this.dragBottom);
        select(this.topHandle).call(this.dragTop);

        select(this.leftHandle).call(this.dragLeft);
        select(this.rightHandle).call(this.dragRight);

        /*
        select(this.closeHandle).on('click', this.closeClicked.bind(this));
        select(this.rotateHandle).on('click', this.rotateClicked.bind(this));
        */
    }

    dragBottomFunc() {
        let ms = mouse(this.domBody);

        let newHeight = this.dragStartHeight + (ms[1] - this.dragStartMousePos[1]);
        newHeight = newHeight > this.minHeight ? newHeight : this.minHeight;


        let newState = {
            'height': newHeight};
        this.setState(newState);

        event.sourceEvent.stopPropagation();
        this.sizeChanged()
    }

    dragLeftFunc() {
        let ms = mouse(this.domBody);

        let newWidth = this.dragStartWidth - (ms[0] - this.dragStartMousePos[0]);
        newWidth = newWidth > this.minWidth ? newWidth : this.minWidth;

        let newLeft = this.dragStartLeft + ms[0] - this.dragStartMousePos[0];
        newLeft = newWidth > this.minWidth ? newLeft : this.dragStartLeft + this.dragStartWidth - this.minWidth;

        let newState = {
            'left': newLeft,
            'width': newWidth
        };
        this.setState(newState);

        event.sourceEvent.stopPropagation();
        this.sizeChanged()
    }

    dragTopFunc() {
        let ms = mouse(this.domBody);
        //console.log('ms:', ms);

        let newHeight = this.dragStartHeight - (ms[1] - this.dragStartMousePos[1]);
        newHeight = newHeight > this.minHeight ? newHeight : this.minHeight;

        let newTop = this.dragStartTop + ms[1] - this.dragStartMousePos[1];
        newTop = newHeight > this.minHeight ? newTop : this.dragStartTop + this.dragStartHeight - this.minHeight;

        let newState = {'top': newTop,
            'height': newHeight };

        this.setState(newState);

        event.sourceEvent.stopPropagation();
        this.sizeChanged();
    }

    dragRightFunc() {
        let ms = mouse(this.domBody);

        let newWidth = this.dragStartWidth + (ms[0] - this.dragStartMousePos[0]);
        newWidth = newWidth > this.minWidth ? newWidth : this.minWidth;

        let newState = {
            'width': newWidth
        };

        this.setState(newState);

        event.sourceEvent.stopPropagation();
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
        //console.log('ms:', ms);

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
        //console.log('newHeight:', newHeight);

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
        this.props.trackRotated(this.state.uid);
    }

    closeClicked() {
        this.props.trackClosed(this.state.uid);
    }


    render() {
            let divStyle = { top: this.state.top,
                             left: this.state.left,
                             width: this.state.width,
                             height: this.state.height,
                             'backgroundColor': 'transparent',
                             "boxSizing": "border-box",
                             opacity: this.props.opacity };

            let resizeWidth = 10;
            let resizeHeight = 10;

            let bottomStyle = { position: 'absolute',
                            left: this.state.width / 2 - resizeWidth / 2,
                            bottom: 1,
                            width: resizeWidth,
                            opacity: 0.2,
                            height: 4,
                            borderBottom: '1px solid black',
                            borderTop: '1px solid black',
                            cursor: 'row-resize'};
            let topStyle = { position: 'absolute',
                            left: this.state.width / 2 - resizeWidth / 2,
                            top: 1,
                            width: resizeWidth,
                            opacity: 0.2,
                            height: 4,
                            borderBottom: '1px solid black',
                            borderTop: '1px solid black',
                            cursor: 'row-resize'};
            let leftStyle = { position: 'absolute',
                            left: 1,
                            top: this.state.height / 2 - resizeHeight / 2,
                            opacity: 0.2,
                            width: 4,
                            height: resizeHeight,
                            borderLeft: '1px solid black',
                            borderRight: '1px solid black',
                            cursor: 'col-resize'};
            let rightStyle = { position: 'absolute',
                            right: 1,
                            opacity: 0.2,
                            top: this.state.height / 2 - resizeHeight / 2,
                            width: 4,
                            height: resizeHeight,
                            borderLeft: '1px solid black',
                            borderRight: '1px solid black',
                            cursor: 'col-resize'};

            let resizeHandleDivs = {
                'bottom': (
                        <div key={'bottom'} className="bottom-draggable-handle" style={bottomStyle} ref={c => this.bottomHandle = c} />
                ),
                'top': (
                        <div key={'top'} className="top-draggable-handle" style={topStyle} ref={c => this.topHandle = c} />
                ),
                'right': (
                        <div key={'right'} className="right-draggable-handle" style={rightStyle} ref={c => this.rightHandle = c} />
                ),
                'left': (
                        <div key={'left'} className="left-draggable-handle" style={leftStyle} ref={c => this.leftHandle = c} />
                )
            }
            let resizeHandles = [...this.props.resizeHandles].map(x => resizeHandleDivs[x]);

            return (
                    <div style={divStyle} ref={(c) => this.divContainer = c} className={this.props.className}>

                        {resizeHandles}

                    </div>
                   );
    }
}
