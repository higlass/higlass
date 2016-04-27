import d3 from 'd3';

function GenePlot() {
    function chart(selection) {
        let width = 300;
        let height = 20;
        let xPos = 0;
        let yPos = 0;

    }

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

    chart.xPos = function(_) {
        if (!arguments.length) return xPos;
        xPos = _;
        return chart;
    };

    chart.yPos = function(_) {
        if (!arguments.length) return yPos;
        yPos = _;
        return chart;
    };

    return chart;
}
