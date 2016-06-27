import '../styles/wiggle.css';

export function WiggleTileLayout(tile_info) {
    let xScale = null;
    let minImportance = 0;
    let maxImportance = 0;
    let height = 20;
    let resolution = tile_info.bins_per_dimension;
    let minVisibleValue = 0;
    let maxVisibleValue =  0;
    console.log('wiggle tile_info:', tile_info)

    function loadTileData(tile_value) {
        if ('dense' in tile_value)
            return tile_value['dense'];
        else if ('sparse' in tile_value) {
            let values = Array.apply(null, 
                    Array(resolution)).map(Number.prototype.valueOf,0);
            for (let i = 0; i < tile_value.sparse.length; i++) {
                if ('pos' in tile_value.sparse[i])
                    values[ tile_value.sparse[i].pos[0]] = tile_value.sparse[i].value;
                else
                    values[ tile_value.sparse[i][0]] = tile_value.sparse[i][1];

            }
            return values;

        } else {
            return [];
        }

    }

    function chart(selection) {
        selection.each(function(tile) {
            let yScale = d3.scale.linear().domain([0, maxVisibleValue])
            .range([0, height])

            let tileData = loadTileData(tile.data);

            let gDataPoints = d3.select(this).selectAll('.data-g')
                .data(tileData)

                //console.log('tile.data:', tile.data);

                gDataPoints.enter()
                .append('rect')
                .classed('data-g', true)

                gDataPoints.exit()
                .remove()

                let tileWidth = (tile.xRange[1] - tile.xRange[0]) / Math.pow(2, tile.tilePos[0]);

                // this scale should go from an index in the data array to 
                // a position in the genome coordinates
                let tileXScale = d3.scale.linear().domain([0, tileData.length])
                .range([tile.xRange[0] + tile.tilePos[1] * tileWidth, 
                       tile.xRange[0] + (tile.tilePos[1] + 1) * tileWidth]  );

                gDataPoints.attr('x',function(d,i) {
                    return xScale(tileXScale(i)); 
                })
                .attr('width', function(d,i) {
                    return xScale(tileXScale(i+1)) - xScale(tileXScale(i));
                })
                .attr('y', function(d,i) {
                    let toScale = d / Math.pow(2, tile.maxZoom - tile.tilePos[0])

                    return height - yScale(d);

                })
                .attr('height', function(d, i) {
                    let toScale = d / Math.pow(2, tile.maxZoom - tile.tilePos[0])

                    return yScale(d);
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

    chart.minVisibleValue = function(_) {
        if (!arguments.length) return minVisibleValue;
        minVisibleValue = _;
        return chart;
    }

    chart.maxVisibleValue = function(_) {
        if (!arguments.length) return maxVisibleValue;
        maxVisibleValue = _;
        return chart;
    }

    //function 
    
    return chart;
}
