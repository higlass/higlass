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



            console.log('div:', div)

            div.style('position', 'relative')
               .style('width', width + 'px')
               .style('height', height + 'px')
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
