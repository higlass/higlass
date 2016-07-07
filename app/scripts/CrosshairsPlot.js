import '../styles/CrosshairsPlot.css';
import d3 from 'd3';
import slugid from 'slugid';

export function CrosshairsPlot() {
    var margin = {'top': 50, 'left': 30, 'bottom': 30, 'right': 120};
    let locationDispatch = null;
    var width = 550;
    var height = 400;
    let xDomain = null;
    let yDomain = null;
    let zoomDispatch = null;

    function chart(selection) {
        selection.each(function(d) {
        var svg = d3.select(this).select('.mainSVG').select('.g-enter')
        let slugId = slugid.nice();

        let xScale = d3.scale.linear()
            .domain(xDomain)
            .range([0, width - margin.left - margin.right]);

        let yScale = d3.scale.linear()
            .domain(yDomain)
            .range([0, height - margin.top - margin.bottom]);

            console.log('svg:',svg);
        var gCoordinates = svg.append('g')
        .classed('coordinates-g', true)
        //.attr('transform', `translate(${margin.left}, ${margin.top})`)

        let xLine = gCoordinates.append('line')
        .classed('x-crosshair', true)

        let yLine = gCoordinates.append('line')
        .classed('y-crosshair', true);

        let zoom = d3.behavior.zoom()
            .x(xScale)
            .y(yScale)

        let localZoomDispatch = zoomDispatch == null ? d3.dispatch('zoom', 'zoomend') : zoomDispatch;
        let localLocationDispatch = locationDispatch == null ? d3.dispatch('move') : locationDispatch;
        localLocationDispatch.on('move.' + slugId, moveChanged);

        function moveChanged(coords) {
            xLine.attr('x1', xScale(coords[0]))
                 .attr('x2', xScale(coords[0]))
                 .attr('y1', 0)
                 .attr('y2', height - margin.top - margin.bottom);

            yLine.attr('x1', 0)
                 .attr('x2', width - margin.left - margin.right)
                 .attr('y1', yScale(coords[1]))
                 .attr('y2', yScale(coords[1]))
        }

        localZoomDispatch.on('zoom.' + slugId, zoomChanged);

            function zoomChanged(translate, scale) {
                // something changed the zoom.
                zoom.translate(translate);
                zoom.scale(scale);
            }
        });
    }

    chart.zoomDispatch = function(_) {
        if (!arguments.length) return zoomDispatch;
        else zoomDispatch = _;
        return chart;
    }


    chart.locationDispatch = function(_) {
        if (!arguments.length) return _;
        else locationDispatch = _;
        return chart;
    };

    chart.width = function(_) {
        if (!arguments.length) return width;
        width = _;
        return chart;
    };

    chart.height = function(_) {
        if (!arguments.length) return height;
        height = _;
        return chart;
    };

    chart.margin = function(_) {
        if (!arguments.length) return margin;
        else margin = _;
        return chart;
    }

    chart.xDomain = function(_) {
        if (!arguments.length) return xDomain;
        else xDomain = _;
        return chart;
    }

    chart.yDomain = function(_) {
        if (!arguments.length) return yDomain;
        else yDomain = _;
        return chart;
    }

    return chart;
}
