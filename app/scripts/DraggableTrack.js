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
        selection.each(function(d) {
            let localResizeDispatch = resizeDispatch == null ? d3.dispatch('resize') :
                resizeDispatch;
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
            d.top = 0;
            d.height = trackHeight;
            d.width = trackWidth;

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

            div.style('position', 'relative')
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
                console.log('params:', params);
                localResizeDispatch.resize(params);
            }

            let topHandleDrag = function() {
                let y = d3.mouse(this.parentNode)[1];
                let currTop = d3.mouse(this.parentNode.parentNode)[1];
                let prevHeight = this.parentNode.clientHeight;

                let newHeight = prevHeight - y;
                let newTop = currTop;

                if (newHeight < minHeight) {
                    newTop = currTop - (minHeight - newHeight);
                    newHeight = minHeight;
                }


                d.top = newTop;
                d.height = newHeight;

                console.log('newHeight:', newHeight);

                changeSize({'top': newTop, 'left': d.left,
                            'width': d.width, 'height': newHeight});
            }

            let leftHandleDrag = function() {
                let prevLeft = this.parentNode.offsetLeft;
                let currLeft = d3.mouse(this.parentNode.parentNode)[0];

                let prevWidth = this.parentNode.clientWidth;

                let x = d3.mouse(this.parentNode)[0];
                // Avoid negative or really small widths
                //console.log('this.parentNode:', this.parentNode);

                let newWidth = prevWidth - x;
                let newLeft = currLeft;

                if (newWidth < minWidth) {
                    newLeft = currLeft - (minWidth - newWidth);
                    newWidth = minWidth;
                }

                resizable.style('width', (newWidth) + 'px');
                resizable.style('left', newLeft + "px"); 
                
                d.left = newLeft;
                d.width = newWidth;

                changeSize({'top': d.top, 'left': newLeft,
                            'width': newWidth, 'height': d.height});

            }

            let rightHandleDrag = function() {
                // Determine resizer position relative to resizable (parent)
                let x = d3.mouse(this.parentNode)[0];
                // Avoid negative or really small widths

                x = Math.max(minWidth, x);
                resizable.style('width', x + 'px');

                d.width = x;

                changeSize({'top': d.top, 'left': d.left,
                            'width': x, 'height': d.height});
            }

            let bottomHandleDrag = function() {
                // Determine resizer position relative to resizable (parent)
                let y = d3.mouse(this.parentNode)[1];
                // Avoid negative or really small widths

                y = Math.max(minHeight, y);
                resizable.style('height', y + 'px');
                d.height = y;

                changeSize({'top': d.top, 'left': d.left,
                            'width': d.width, 'height': y});
            }


            let dragTopLeftResize = d3.behavior.drag()
            .on('drag', function() {
                // Determine resizer position relative to resizable (parent)
                topHandleDrag.bind(this)();
                leftHandleDrag.bind(this)();
            });

            let dragBottomLeftResize = d3.behavior.drag()
            .on('drag', function() {
                // Determine resizer position relative to resizable (parent)
                bottomHandleDrag.bind(this)();
                leftHandleDrag.bind(this)();

            });

            let dragBottomRightResize = d3.behavior.drag()
            .on('drag', function() {
                // Determine resizer position relative to resizable (parent)
                bottomHandleDrag.bind(this)();
                rightHandleDrag.bind(this)();

            });

            let dragTopRightResize = d3.behavior.drag()
            .on('drag', function() {
                topHandleDrag.bind(this)();
                rightHandleDrag.bind(this)();

            });

            let bottomMove = function() {
                let ms = d3.mouse(this.parentNode.parentNode);

                changeSize({'top': dragStartTop + ms[1] - dragStartMousePos[1],
                             'left': dragStartLeft + ms[0] - dragStartMousePos[0],
                             'width': d.width, 'height': d.height});
            }

            let dragStartTop = null;
            let dragStartLeft = null;
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

            topRight.call(dragTopRightResize);
            topLeft.call(dragTopLeftResize);
            bottomLeft.call(dragBottomLeftResize);
            bottomRight.call(dragBottomRightResize);
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
