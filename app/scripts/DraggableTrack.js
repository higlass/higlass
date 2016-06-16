import '../styles/DraggableTrack.css';
import d3 from 'd3';

export function DraggableTrack() {
    let width = 200;
    let height = 200;

    function chart(selection) {
        console.log('selection:', selection);
        selection.each(function(d) {
            let div = d3.select(this);

            let trackWidth = width;
            let trackHeight = height;

            if ('width' in d)
                trackWidth = d.width;

            if ('height' in d)
                trackHeight = d.height;

            d.height = trackHeight;
            d.width = trackWidth;

            console.log('div:', div)

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

            
            let topRight  = div.selectAll('.top-right-handle')
            .data([1])
            .enter()
            .append('div')
            .classed('top-right-handle', true)
            .style('position', 'absolute')
            .style('right', '0px')
            .style('width', '5px')
            .style('height', '5px')

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

            let bottomHandleWidth = 20;

            // handle for dragging
            let bottomDrag  = div.selectAll('.bottom-handle')
            .data([1])
            .enter()
            .append('div')
            .classed('bottom-handle', true)

            div.style('position', 'relative')
               .style('width', trackWidth + 'px')
               .style('height', trackHeight + 'px')
               .style('background-color', '#eeeeee');

               let resizable = div;


               let topHandleDrag = function() {
                   let y = d3.mouse(this.parentNode)[1];
                   let currTop = d3.mouse(this.parentNode.parentNode)[1];
                   let prevHeight = this.parentNode.clientHeight;

                   let newHeight = prevHeight - y;
                   let newTop = currTop;

                   if (newHeight < trackHeight) {
                        newTop = currTop - (trackHeight - newHeight);
                        newHeight = trackHeight;
                   }

                   resizable.style('height', (newHeight) + 'px');
                   resizable.style('top', newTop + "px"); 

                   d.height = newHeight;

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

                   if (newWidth < 50) {
                       newLeft = currLeft - (50 - newWidth);
                       newWidth = 50;
                   }

                   resizable.style('width', (newWidth) + 'px');
                   resizable.style('left', newLeft + "px"); 

                   d.width = newWidth;

               }

               let rightHandleDrag = function() {
                   // Determine resizer position relative to resizable (parent)
                   let x = d3.mouse(this.parentNode)[0];
                   // Avoid negative or really small widths

                   x = Math.max(50, x);
                   resizable.style('width', x + 'px');

                   d.width = x;
               }

               let bottomHandleDrag = function() {
                   // Determine resizer position relative to resizable (parent)
                   let y = d3.mouse(this.parentNode)[1];
                   // Avoid negative or really small widths

                   y = Math.max(trackHeight, y);
                   resizable.style('height', y + 'px');
                    d.height = y;
               }

               let dragTopLeftResize = d3.behavior.drag()
               .on('drag', function() {
                   // Determine resizer position relative to resizable (parent)
                   topHandleDrag.bind(this)();
                   leftHandleDrag.bind(this)();
                   draw();
               });

               let dragBottomLeftResize = d3.behavior.drag()
               .on('drag', function() {
                   // Determine resizer position relative to resizable (parent)
                   bottomHandleDrag.bind(this)();
                   leftHandleDrag.bind(this)();
                   draw();
               });

               let dragBottomRightResize = d3.behavior.drag()
               .on('drag', function() {
                   // Determine resizer position relative to resizable (parent)
                   bottomHandleDrag.bind(this)();
                   rightHandleDrag.bind(this)();
                   draw();
               });

               let dragTopRightResize = d3.behavior.drag()
               .on('drag', function() {
                   topHandleDrag.bind(this)();
                   rightHandleDrag.bind(this)();
                   draw();
               });

               topRight.call(dragTopRightResize);
               topLeft.call(dragTopLeftResize);
               bottomLeft.call(dragBottomLeftResize);
               bottomRight.call(dragBottomRightResize);

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

    chart.height = function(_) {
        if (!arguments.length) return height;
        else height = _;
        return chart;
    }

    return chart;
}
