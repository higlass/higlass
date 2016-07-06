import '../styles/CrosshairsPlot.css';
import d3 from 'd3';
import slugid from 'slugid';

export function CrosshairsPlot() {
    var margin = {'top': 50, 'left': 30, 'bottom': 30, 'right': 120};
    let locationDispatch = null;

    function chart(selection) {
        var svg = d3.select('svg')
        let slugId = slugid.nice();

        var gCoordinates = svg.append('g')
        .classed('coordinates-g', true)
        .attr('transform', `translate(${margin.left}, ${margin.top})`)

        let xLine = gCoordinates.append('line')
        .classed('x-crosshair', true)

        let yLine = gCoordinates.append('line')
        .classed('y-crosshair', true);

        
        let localLocationDispatch = locationDispatch == null ? d3.dispatch('move') : locationDispatch;
        localLocationDispatch.on('move.' + slugId, moveChanged);

        function moveChanged(coords) {
            console.log('coords:', coords);
        }
    }

    chart.locationDispatch = function(_) {
        if (!arguments.length) return _;
        else locationDispatch = _;
        return chart;
    };

    return chart;
}
