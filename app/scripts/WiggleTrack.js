export function WiggleTileLayout() {
    let xScale = null;
    let minImportance = 0;
    let maxImportance = 0;
    let height = 20;

    function chart(selection) {
        selection.each(function(tile) {
            let yScale = d3.scale.linear().domain([0, tile.valueRange[1]])
            .range([0, height])

            let gDataPoints = d3.select(this).selectAll('.data-g')
                .data(tile.data)

                //console.log('tile.data:', tile.data);

                gDataPoints.enter()
                .append('rect')
                .classed('data-g', true)

                gDataPoints.exit()
                .remove()

                let tileWidth = (tile.xRange[1] - tile.xRange[0]) / Math.pow(2, tile.tilePos[0]);

                // this scale should go from an index in the data array to 
                // a position in the genome coordinates
                let tileXScale = d3.scale.linear().domain([0, tile.data.length])
                .range([tile.xRange[0] + tile.tilePos[1] * tileWidth, 
                       tile.xRange[0] + (tile.tilePos[1] + 1) * tileWidth]  );

                gDataPoints.attr('x',function(d,i) {
                    return xScale(tileXScale(i)); 
                })
                .attr('width', function(d,i) {
                    return xScale(tileXScale(i+1)) - xScale(tileXScale(i));
                })
                .attr('height', function(d, i) {
                    let toScale = d / Math.pow(2, tile.maxZoom - tile.tilePos[0])
                    //console.log('yScale.domain()', yScale.domain(), toScale)

                    return yScale(toScale);
                })
                .classed('wiggle-bar', true);
        });
    }

    chart.minImportance = function(_) {
        if (!arguments.length) return minImportance;
        minImportance = _;
        return chart;
    }

    chart.maxImportance = function(_) {
        if (!arguments.length) return maxImportance;
        maxImportance = _;
        return chart;
    }

    chart.xScale = function(_) {
        if (!arguments.length) return xScale;
        xScale = _;
        return chart;
    }

    chart.height = function(_) {
        if (!arguments.length) return height;
        height = _;
        return chart;
    }
    //function 
    
    return chart;
}
