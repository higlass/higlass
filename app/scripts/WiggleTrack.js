export function WiggleTileLayout() {
    let xScale = null;
    let minImportance = 0;
    let maxImportance = 0;

    function chart(selection) {
        selection.each(function(tileG) {
            let gDataPoints = d3.select(this).selectAll('.data-g')
                .data(tileG.data)

                console.log('tileG.data:', tileG.data);

                gDataPoints.enter()
                .append('g')
                .classed('data-g', true)

                gDataPoints.exit()
                .remove()

                gDataPoints
                .each(function(d) {
                    d3.select(this)
                        .call(genePlot);
                });
        });
    }

    chart.minImportance = function(_) {
        if (!arguments.length) return minImportance;
        minImportance = _;
        genePlot.minImportance(minImportance);
        return chart;
    }

    chart.maxImportance = function(_) {
        if (!arguments.length) return maxImportance;
        maxImportance = _;
        genePlot.maxImportance(maxImportance);
        return chart;
    }

    chart.xScale = function(_) {
        if (!arguments.length) return xScale;
        xScale = _;
        genePlot.xScale(xScale);
        return chart;
    }
    //function 
    
    return chart;
}

export function WiggleTrack() {
    let xScale = null;

    function draw() {

    }
}
