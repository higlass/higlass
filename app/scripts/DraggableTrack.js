import '../styles/DraggableTrack.css';
import d3 from 'd3';
import slugid from 'slugid';

export function DraggableTrack() {
    let minWidth = 20;
    let minHeight = 15;
    let width = 200;
    let height = 200;
    let resizeDispatch = null;

    function chart(selection) {
        let currTop = 0;

        selection.each(function(d, i) {

            if (!('resizeDispatch' in d)) {
                d.resizeDispatch = resizeDispatch == null ? d3.dispatch('resize') : resizeDispatch;
            }
            let localResizeDispatch = d.resizeDispatch;

            let slugId = slugid.nice();
            localResizeDispatch.on('resize.' + slugId, sizeChanged);

            let div = d3.select(this);

            let trackWidth = width;
            let trackHeight = height;

            if ('width' in d)
                trackWidth = d.width;

            if ('height' in d)
                trackHeight = d.height;

            d.left = 0;
            d.top = currTop;
            d.height = trackHeight;
            d.width = trackWidth;

            currTop += d.height;

            // handles for resizing
            let topLeft  = div.selectAll('.top-left-handle')
            .data([1])
            .enter()
            .append('div')
            .classed('top-left-handle', true)
            .style('position', 'absolute')
            .style('left', '0px')
            .style('width', '5px')
            .style('height', '5px')
            .style('cursor', 'nwse-resize')

            
            let topRight  = div.selectAll('.top-right-handle')
            .data([1])
            .enter()
            .append('div')
            .classed('top-right-handle', true)
            .style('position', 'absolute')
            .style('right', '0px')
            .style('width', '5px')
            .style('height', '5px')
            .style('cursor', 'nesw-resize')

            let bottomRight  = div.selectAll('.bottom-right-handle')
            .data([1])
            .enter()
            .append('div')
            .classed('bottom-right-handle', true)
            .style('position', 'absolute')
            .style('right', '0px')
            .style('bottom', '0px')
            .style('width', '5px')
            .style('height', '5px')
            .style('cursor', 'nwse-resize')

            let bottomLeft  = div.selectAll('.bottom-left-handle')
            .data([1])
            .enter()
            .append('div')
            .classed('bottom-left-handle', true)
            .style('position', 'absolute')
            .style('left', '0px')
            .style('bottom', '0px')
            .style('width', '5px')
            .style('height', '5px')
            .style('cursor', 'nesw-resize')

            let bottomHandleWidth = 20;

            // handle for dragging
            let bottomDrag  = div.selectAll('.bottom-handle')
            .data([1])
            .enter()
            .append('div')
            .classed('bottom-handle', true)
            .style('cursor', 'move')

            div.style('position', 'absolute')
            .style('top', (d) => { return d.top + 'px'; })
            .style('left', (d) => { return d.left + 'px'; })
            .style('width', trackWidth + 'px')
            .style('height', trackHeight + 'px')
            .style('background-color', '#eeeeee');

            let resizable = div;

            function sizeChanged(params) {
                d.top = params.top;
                d.left = params.left;

                d.width = params.width;
                d.height = params.height;

                resizable.style('height', params.height + 'px');
                resizable.style('top', params.top + "px"); 
                resizable.style('left', params.left + 'px');
                resizable.style('width', params.width + 'px');

                draw();
            }

            function changeSize(params) {
                localResizeDispatch.resize(params);
            }


            let bottomMove = function() {
                let ms = d3.mouse(this.parentNode.parentNode);

                changeSize({'top': dragStartTop + ms[1] - dragStartMousePos[1],
                             'left': dragStartLeft + ms[0] - dragStartMousePos[0],
                             'width': d.width, 'height': d.height});
            }

            let dragStartTop = null;
            let dragStartLeft = null;
            let dragStartWidth = null;
            let dragStartHeight = null;
            let dragStartMousePos = null;

            let dragBottom = d3.behavior.drag()
            .on('dragstart', function() {
                dragStartTop = d.top;
                dragStartLeft = d.left;

                dragStartMousePos = d3.mouse(this.parentNode.parentNode);  
            })
            .on('drag', function() {
                bottomMove.bind(this)();
            })

            let dragTopLeft = d3.behavior.drag()
                .on('dragstart', function() {
                    dragStartMousePos = d3.mouse(this.parentNode.parentNode);

                    dragStartWidth = d.width;
                    dragStartHeight = d.height;

                    dragStartTop = d.top;
                    dragStartLeft = d.left;
                })
            .on('drag', function() {
                let ms = d3.mouse(this.parentNode.parentNode);

                let newWidth = dragStartWidth - (ms[0] - dragStartMousePos[0]);
                newWidth = newWidth > minWidth ? newWidth : minWidth;

                let newLeft = dragStartLeft + ms[0] - dragStartMousePos[0];
                newLeft = newWidth > minWidth ? newLeft : dragStartLeft + dragStartWidth - minWidth;

                let newHeight = dragStartHeight - (ms[1] - dragStartMousePos[1]);
                newHeight = newHeight > minHeight ? newHeight : minHeight;

                let newTop = dragStartTop + ms[1] - dragStartMousePos[1];
                newTop = newHeight > minHeight ? newTop : dragStartTop + dragStartHeight - minHeight;


                changeSize({'top': newTop,
                            'left': newLeft,
                            'width': newWidth,
                            'height': newHeight });
            });

            let dragBottomLeft = d3.behavior.drag()
                .on('dragstart', function() {
                    dragStartMousePos = d3.mouse(this.parentNode.parentNode);

                    dragStartWidth = d.width;
                    dragStartHeight = d.height;

                    dragStartLeft = d.left;
                })
            .on('drag', function() {
                let ms = d3.mouse(this.parentNode.parentNode);

                let newHeight = dragStartHeight + (ms[1] - dragStartMousePos[1]);
                newHeight = newHeight > minHeight ? newHeight : minHeight;

                let newWidth = dragStartWidth - (ms[0] - dragStartMousePos[0]);
                newWidth = newWidth > minWidth ? newWidth : minWidth;

                let newLeft = dragStartLeft + ms[0] - dragStartMousePos[0];
                newLeft = newWidth > minWidth ? newLeft : dragStartLeft + dragStartWidth - minWidth;

                changeSize({'top': d.top,
                            'left': newLeft,
                            'width': newWidth,
                            'height': newHeight})
            });

            let dragTopRight = d3.behavior.drag()
                .on('dragstart', function() {
                    dragStartMousePos = d3.mouse(this.parentNode.parentNode);

                    dragStartWidth = d.width;
                    dragStartHeight = d.height;

                    dragStartTop = d.top;
                })
            .on('drag', function() {
                let ms = d3.mouse(this.parentNode.parentNode);

                let newHeight = dragStartHeight - (ms[1] - dragStartMousePos[1]);
                newHeight = newHeight > minHeight ? newHeight : minHeight;

                let newTop = dragStartTop + ms[1] - dragStartMousePos[1];
                newTop = newHeight > minHeight ? newTop : dragStartTop + dragStartHeight - minHeight;

                let newWidth = dragStartWidth + (ms[0] - dragStartMousePos[0]);
                newWidth = newWidth > minWidth ? newWidth : minWidth;

                changeSize({'top': newTop,
                            'left': d.left,
                            'width': newWidth,
                            'height': newHeight });
            });

            let dragBottomRight = d3.behavior.drag()
                .on('dragstart', function() {
                    dragStartMousePos = d3.mouse(this.parentNode.parentNode);

                    dragStartWidth = d.width;
                    dragStartHeight = d.height;

                    dragStartTop = d.top;
                })
            .on('drag', function() {
                let ms = d3.mouse(this.parentNode.parentNode);

                let newWidth = dragStartWidth + (ms[0] - dragStartMousePos[0]);
                newWidth = newWidth > minWidth ? newWidth : minWidth;

                let newHeight = dragStartHeight + (ms[1] - dragStartMousePos[1]);
                newHeight = newHeight > minHeight ? newHeight : minHeight;

                changeSize({'top': d.top,
                            'left': d.left,
                            'width': newWidth,
                            'height': newHeight });
            });


            topRight.call(dragTopRight);
            topLeft.call(dragTopLeft);
            bottomLeft.call(dragBottomLeft);
            bottomRight.call(dragBottomRight);
            bottomDrag.call(dragBottom);

            function draw() {

                div.selectAll('.bottom-handle')
                .style('position', 'absolute')
                .style('left', (d.width / 2 - bottomHandleWidth / 2) + 'px')
                .style('bottom', '-4px')
                .style('width', bottomHandleWidth + 'px')
                .style('height', '6px')
            }

            draw();
        });
    }

    chart.width = function(_) {
        if (!arguments.length) return width;
        else width = _;
        return chart;
    }

    chart.minWidth = function(_) {
        if (!arguments.length) return minWidth;
        else minWidth = _;
        return chart;
    }

    chart.height = function(_) {
        if (!arguments.length) return height;
        else height = _;
        return chart;
    }

    chart.minHeight = function(_) {
        if (!arguments.length) return minHeight;
        else minHeight = _;
        return chart;
    }

    chart.resizeDispatch = function(_) {
        if (!arguments.length) return resizeDispatch;
        else resizeDispatch = _;
        return chart;
    }

    return chart;
}
