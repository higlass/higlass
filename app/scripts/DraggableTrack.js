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

            console.log('div:', div)

            
            let topRight  = div.selectAll('.top-right-handle')
            .data([1])
            .enter()
            .append('div')
            .classed('top-right-handle', true)
            .style('position', 'absolute')
            .style('right', '0px')
            .style('width', '5px')
            .style('height', '5px')

            div.style('position', 'relative')
               .style('width', trackWidth + 'px')
               .style('height', trackHeight + 'px')
               .style('background-color', '#eeeeee');
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
