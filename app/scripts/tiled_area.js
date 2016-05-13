import '../styles/tiled_area.css';
import d3 from 'd3';

export function TiledArea() {
    var width = 550;
    var height = 400;
    var minX = 0, maxX = 0, minY = 0, maxY = 0;
    let minValue = 0, maxValue = 0;
    var maxZoom = 1;
    var margin = {'top': 30, 'left': 30, 'bottom': 30, 'right': 30};
    let tileDirectory = null;
    let currentZoom = 1;

    let oneDimensional = true;     // will these be 1D tiles or 2D?

    let xOrigScale = null, yOrigScale = null;
    let xScale = null, yScale = null, valueScale = null;
    let widthScale = null;
    let zoomTo = null;

    let loadedTiles = {};
    let loadingTiles = {};
    let dispatch = d3.dispatch('draw');

    let xAxis = null;

    let minArea = 0, maxArea = 0;
    let minImportance = 0, maxImportance = 0;
    let xScaleDomain = null, yScaleDomain = null;
    let zoom = d3.behavior.zoom();

    let labelSort = (a,b) => { return b.area - a.area; };
    let gMain = null;
    let gDataPoints = null;
    let shownTiles = new Set();
    let pointMarkId = (d) => { return `p-${d.uid}`; };
            function countTransform(count) {
                return Math.sqrt(Math.sqrt(count + 1));
                //return Math.log(count);
                //return count;
            }
    let dataPointLayout = null; //the function to draw each data point in the tile

    function tileId(tile) {
        // uniquely identify the tile with a string
        return tile.join("/");
    }

    function chart(selection) {

        // setup the data-agnostic parts of the chart
        var gEnter = selection.append("g");

        zoom.on("zoom", zoomed);

        var gYAxis = gEnter.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + (width - margin.right) + "," + margin.top + ")");

        var gXAxis = gEnter.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + (margin.left) + "," + (height - margin.bottom) + ")");

        gMain = gEnter.append('g')
        .classed('main-g', true)
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        gMain.insert("rect", "g")
        .attr("class", "pane")
        .attr("width", width)
        .attr("height", height)
        .attr('pointer-events', 'all')

        gMain.append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("x", 0)
        .attr("y", -margin.top)
        .attr("width", width - margin.left - margin.right)
        .attr("height", height);

        gMain.style('clip-path', 'url(#clip)')

        gMain.call(zoom);

        d3.json(tileDirectory + '/tile_info.json', function(error, tile_info) {
            // set up the data-dependent sections of the chart
            minX = tile_info.min_pos[0];
            maxX = tile_info.max_pos[0] + 0.001;

            if (!oneDimensional) {
                minY = tile_info.min_pos[1];
                maxY = tile_info.max_pos[1];
            } else {
                minY = 0;
                maxY = 1;
            }

            minValue = tile_info.min_value;
            maxValue = tile_info.max_value;

            minArea = tile_info.min_importance;
            maxArea = tile_info.max_importance;

            minImportance = tile_info.min_importance;
            maxImportance = tile_info.max_importance;

            maxZoom = tile_info.max_zoom;

            xScaleDomain = [minX, maxX];
            yScaleDomain = [minY, maxY];

            xScale.domain(xScaleDomain)
            .range([0, width - margin.left - margin.right]);

            yScale = d3.scale.linear()
            .domain(yScaleDomain)
            .range([height - margin.top - margin.bottom, 0]);

            valueScale = d3.scale.linear()
            .domain([countTransform(minValue+1), countTransform(maxValue+1)])
            .range([0, 8]);

            xOrigScale = xScale.copy();
            yOrigScale = yScale.copy();

            zoom.x(xScale)
            //.scaleExtent([1,Math.pow(2, maxZoom-1)])
            .scaleExtent([1,Math.pow(2, maxZoom+8)])
            //.xExtent(xScaleDomain);
        
            xAxis = d3.svg.axis()
            .scale(xScale)
            .orient('bottom')
            .ticks(3);
            //gXAxis.call(xAxis);

            if (!oneDimensional) {
                zoom.y(yScale)
                refreshTiles([[0,0,0]]);
            } else {
                refreshTiles([[0,0]]);
            }
        });

        zoomTo = function(xValue, yValue, value) {
            // zoom to a particular location on the genome
            
            let scale = 1 / (20 / totalWidth);
            let translate = [xOrigScale.range()[0] - xOrigScale((xValue - 10 - value) * scale), 
                             yOrigScale.range()[0] - yOrigScale((yValue - 10 - value) * scale)];

            gEnter.transition()
            .duration(750)
            .call(zoom.translate(translate).scale(scale).event);

            // so the visible area needs to encompass [cumarea - 10, cumarea + 20]
        };

        function zoomed() {
            var reset_s = 0;

          if ((xScale.domain()[1] - xScale.domain()[0]) >= (maxX - minX)) {
            zoom.x(xScale.domain([minX, maxX]));
            reset_s = 1;
          }
          if ((yScale.domain()[1] - yScale.domain()[0]) >= (maxY - minY)) {
            //zoom.y(yScale.domain([minY, maxY]));
            zoom.y(yScale.domain([minY, maxY]));
            reset_s += 1;
          }
          if (reset_s == 2) { // Both axes are full resolution. Reset.
            zoom.scale(1);
            zoom.translate([0,0]);
          }
          else {
            if (xScale.domain()[0] < minX) {
              xScale.domain([minX, xScale.domain()[1] - xScale.domain()[0] + minX]);

              zoom.translate([xOrigScale.range()[0] - xOrigScale(xScale.domain()[0]) * zoom.scale(),
                             zoom.translate()[1]])
            }
            if (xScale.domain()[1] > maxX) {
              var xdom0 = xScale.domain()[0] - xScale.domain()[1] + maxX;
              xScale.domain([xdom0, maxX]);

              zoom.translate([xOrigScale.range()[0] - xOrigScale(xScale.domain()[0]) * zoom.scale(),
                             zoom.translate()[1]])
            }
            if (yScale.domain()[0] < minY) {
              yScale.domain([minY, yScale.domain()[1] - yScale.domain()[0] + minY]);

              zoom.translate([zoom.translate()[0], yOrigScale.range()[0] - yOrigScale(yScale.domain()[0]) * zoom.scale()])
            }
            if (yScale.domain()[1] > maxY) {
              var ydom0 = yScale.domain()[0] - yScale.domain()[1] + maxY;
              yScale.domain([ydom0, maxY]);

              zoom.translate([zoom.translate()[0], yOrigScale.range()[0] - yOrigScale(yScale.domain()[0]) * zoom.scale()])
            }
          }

            currentZoom = zoom.scale();

            draw();
        }
    }

        function isTileLoading(tile) {
            // check if a particular tile is currently being loaded

            if (tileId(tile) in loadingTiles)
                return true;
            else
                return false;
        }

        function isTileLoaded(tile) {
            // check if a particular tile is already loaded
            // go through the shownTiles dictionary to check
            // if this tile is already loaded

            if (tileId(tile) in loadedTiles)
                return true;
            else
                return false;
        }

        function pointId(d) {
            return d.uid;
        }

        function showTiles(tiles) {
            // refresh the display and make sure the tiles that need to be
            // displayed are displayed
            
            // check to make sure all the tiles we're trying to display
            // are already loaded
            let allLoaded = true;
            let allData = [];
            tiles.forEach((t) => {
                allLoaded = allLoaded && isTileLoaded(t);
                if (isTileLoaded(t))
                    allData = allData.concat(loadedTiles[tileId(t)]);
            });
            if (!allLoaded)
                return;
            
            let gTiles = gMain.selectAll('.tile-g')
            .data(tiles, tileId)

            let gTilesEnter = gTiles.enter()
            let gTilesExit = gTiles.exit()

            // add all the new tiles
            gTilesEnter.append('g')
            .classed('tile-g', true)
            .each(function(tile) {
                let gTile = d3.select(this);

                if (loadedTiles[tileId(tile)] === undefined)
                    return;

                let data = loadedTiles[tileId(tile)];

                //let labelSort = (a,b) => { return b.area - a.area; };
                //let elevationSort = (a,b) => { return b.max_elev - a.max_elev; };
                //data.sort(labelSort);
                data.map((d) => { 
                    d.pointLayout = dataPointLayout()
                    .xScale(xScale)
                    .minImportance(minImportance)
                    .maxImportance(maxImportance); 
                })

                // draw each point
                gDataPoints = gTile.selectAll('.data-g')
                .data(data)
                .enter()
                .append('g')
                .classed('data-g', true)
                .each(function(d) {
                    d3.select(this)
                    .call(d.pointLayout);
                    d.pointLayout.draw();
                });
            })

            gTilesExit.remove();
            /*
            let allCounts = allData.map((x) => { return +x.count; });
            valueScale.domain([countTransform(Math.min.apply(null, allCounts)),
                               countTransform(Math.max.apply(null, allCounts))])
            */
            
            // only redraw if the tiles have changed
            if (gTilesEnter.size() > 0 || gTilesExit.size() > 0) {
                draw();
            }

        }

        function removeTile(tile) {
            // remove all of the elements associated with this tile
            //
        }

        function refreshTiles(currentTiles) {
            // be shown and add those that should be shown
            currentTiles.forEach((tile) => {
                if (!isTileLoaded(tile) && !isTileLoading(tile)) {
                    // if the tile isn't loaded, load it
                    let tileSubPath = tile.join('/') + '.json'
                    let tilePath = tileDirectory + "/" + tileSubPath;
                    loadingTiles[tileId(tile)] = true;
                    d3.json(tilePath,
                            function(error, data) {
                                delete loadingTiles[tileId(tile)];
                                loadedTiles[tileId(tile)] = data;
                                showTiles(currentTiles);
                            });
                } else {
                    showTiles(currentTiles);
                }
            });
        }

        function draw() {
            // draw the scene, if we're zooming, then we need to check if we
            // need to redraw the tiles, otherwise it's irrelevant
            //
            //gXAxis.call(xAxis);

            gMain.selectAll('.data-g')
            .each((d) => { 
                d.pointLayout.draw(); 
            });

            // this will become the tiling code
            let zoomLevel = Math.round(Math.log(currentZoom) / Math.LN2) + 2;

            if (zoomLevel > maxZoom)
                zoomLevel = maxZoom;

            // the ski areas are positioned according to their
            // cumulative widths, which means the tiles need to also
            // be calculated according to cumulative width
            let totalWidth = maxX - minX;
            let totalHeight = maxY - minY;

            var tileWidth = totalWidth /  Math.pow(2, zoomLevel);
            var tileHeight = totalHeight / Math.pow(2, zoomLevel);

            let epsilon = 0.000001;
            let tiles = [];

            let rows = d3.range(Math.floor((zoom.x().domain()[0] - minX) / tileWidth),
                                Math.ceil(((zoom.x().domain()[1] - minX) - epsilon) / tileWidth));

            if (! oneDimensional ) {
                let cols = d3.range(Math.floor((zoom.y().domain()[0] - minY) / tileHeight),
                                    Math.ceil(((zoom.y().domain()[1] - minY) - epsilon) / tileHeight));

                for (let i = 0; i < rows.length; i++) {
                    for (let j = 0; j < cols.length; j++) {
                        tiles.push([zoomLevel, rows[i], cols[j]]);
                    }
                }
            } else {
                rows.forEach((r) => { tiles.push([zoomLevel, r]);});

            }
            // hey hye
            /*
            let tiles = [];
            */
           dispatch.draw();

            refreshTiles(tiles);
        }

    chart.draw = draw;

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

    chart.minX = function(_) {
        if (!arguments.length) return minX;
        minX = _;
        return chart;
    };

    chart.minY = function(_) {
        if (!arguments.length) return minY;
        minY = _;
        return chart;
    };

    chart.maxX = function(_) {
        if (!arguments.length) return maxX;
        maxX = _;
        return chart;
    };

    chart.maxY = function(_) {
        if (!arguments.length) return maxY;
        maxY = _;
        return chart;
    };

    chart.maxZoom = function(_) {
        if (!arguments.length) return maxZoom;
        maxZoom = _;
        return chart;
    };

    chart.tileDirectory = function(_) {
        if (!arguments.length) return tileDirectory;
        tileDirectory = _;
        return chart;
    };

    chart.zoomTo = function(_) {
        // 
        return zoomTo;
    };

    chart.dataPointLayout = function(_) {
        if (!arguments.length) return dataPointLayout;
        else dataPointLayout = _;
        return chart;
    };

    chart.zoom = function(_) {
        if (!arguments.length) return zoom;
        else zoom = _;
        return chart;
    }

    chart.currentZoom = function(_) {
        if (!arguments.length) return currentZoom;
        else currentZoom = _;
        return chart;
    }

    chart.on = function(event, _) {
        dispatch.on(event, _);
        return chart;
    }

    chart.xScale = function(_) {
        if (!arguments) return xScale;
        else xScale = _;
        return chart;
    }

    return chart;
}
