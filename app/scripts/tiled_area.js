import slugid from 'slugid';
import '../styles/tiled_area.css';

export function TiledArea() {
    var width = 550;
    var height = 400;
    var margin = {'top': 30, 'left': 30, 'bottom': 30, 'right': 30};

    let oneDimensional = true;     // will these be 1D tiles or 2D?

    let xOrigScale = null, yOrigScale = null;
    let xScale = null, yScale = null, valueScale = null;
    let widthScale = null;
    let zoomTo = null;
    let domain = null;
    let tileLayout = null;

    let dispatch = d3.dispatch('draw');
    let zoomDispatch = null;

    let xAxis = null;

    let labelSort = (a,b) => { return b.area - a.area; };
    let gDataPoints = null;
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
        selection.each(function(tileDirectory) {
            let xScaleDomain = null, yScaleDomain = null;
            let loadedTiles = {};
            let loadingTiles = {};
            let shownTiles = new Set();
            let concreteTileLayout = null;

            let localZoomDispatch = zoomDispatch == null ? d3.dispatch('zoom') : zoomDispatch;
            let minX = 0, maxX = 0, minY = 0, maxY = 0,
                minImportance = 0, maxImportance = 0,
                minValue = 0, maxValue = 0;
            let  maxZoom = 1;

            let zoom = d3.behavior.zoom();
            let slugId = slugid.nice();

            // setup the data-agnostic parts of the chart
            var gEnter = d3.select(this).append("g");

            zoom.on("zoom", zoomHere);

            let gYAxis = gEnter.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + (width - margin.right) + "," + margin.top + ")");

            let gXAxis = gEnter.append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(" + (margin.left) + "," + (height - margin.bottom) + ")");

            let gMain = gEnter.append('g')
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

                localZoomDispatch.on('zoom.' + slugId, zoomChanged);

                function zoomChanged(translate, scale) {
                    // something changed the zoom.
                    zoom.translate(translate);
                    zoom.scale(scale);

                    zoomed();
                }

                function zoomHere() {
                    localZoomDispatch.zoom(zoom.translate(), zoom.scale());
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
                    tiles.forEach((t) => {
                        allLoaded = allLoaded && isTileLoaded(t);
                    });
                    if (!allLoaded)
                        return;

                    let visibleTiles = tiles.map((d) => { return loadedTiles[tileId(d)]; })
                        .filter((d) => { return d != undefined; })
                        .filter((d) => { return d.data != undefined; });

                    let gTiles = gMain.selectAll('.tile-g')
                        .data(visibleTiles, (d) => { return d.tileId; });         //the point key

                    let gTilesEnter = gTiles.enter();
                    let gTilesExit = gTiles.exit();

                    // add all the new tiles
                    gTilesEnter.append('g')
                        .classed('tile-g', true)

                    gTilesExit.remove();

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
                            let tileSubPath = tile.join('/') + '.json';
                            let tilePath = tileDirectory + "/" + tileSubPath;
                            loadingTiles[tileId(tile)] = true;
                            d3.json(tilePath, function(error, data) {
                                delete loadingTiles[tileId(tile)];
                                loadedTiles[tileId(tile)] = {'tileId': tileId(tile), 
                                    'maxZoom': maxZoom,
                                    'tilePos': tile,
                                    'xRange': [minX, maxX],
                                    'importanceRange': [minImportance, maxImportance],
                                    'valueRange': [minValue, maxValue],
                                    'data': data,};
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

                    /*
                    gMain.selectAll('.data-g')
                        .each((d) => { 
                            d.pointLayout.draw(); 
                        });
                    */
                    gMain.selectAll('.tile-g')
                    .call(concreteTileLayout
                            .xScale(xScale)
                            .minImportance(minImportance)
                            .maxImportance(maxImportance));

                    // this will become the tiling code
                    let zoomScale = Math.max((maxX - minX) / (xScale.domain()[1] - xScale.domain()[0]), 1);
                    let zoomLevel = Math.round(Math.log(zoomScale) / Math.LN2) + 1;

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

                    let rows = d3.range(Math.max(0,Math.floor((zoom.x().domain()[0] - minX) / tileWidth)),
                            Math.min(Math.pow(2, zoomLevel), Math.ceil(((zoom.x().domain()[1] - minX) - epsilon) / tileWidth)));

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

                    dispatch.draw();

                    refreshTiles(tiles);
                }

                function zoomTo(xValue, yValue, value) {
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

                    let minAllowedX = xScaleDomain[0];
                    let maxAllowedX = xScaleDomain[1];

                    if ((xScale.domain()[1] - xScale.domain()[0]) >= (maxAllowedX - minAllowedX)) {
                        zoom.x(xScale.domain([minAllowedX, maxAllowedX]));
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
                        if (xScale.domain()[0] < minAllowedX) {
                            xScale.domain([minAllowedX, xScale.domain()[1] - xScale.domain()[0] + minAllowedX]);

                            zoom.translate([xOrigScale.range()[0] - xOrigScale(xScale.domain()[0]) * zoom.scale(),
                                    zoom.translate()[1]])
                        }
                        if (xScale.domain()[1] > maxAllowedX) {
                            var xdom0 = xScale.domain()[0] - xScale.domain()[1] + maxAllowedX;
                            xScale.domain([xdom0, maxAllowedX]);

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

                    draw();
                }

                d3.json(tileDirectory + '/tile_info.json', function(error, tile_info) {
                    // set up the data-dependent sections of the chart
                    minX = tile_info.min_pos[0];
                    maxX = tile_info.max_pos[0] + 0.001;
                    concreteTileLayout = tileLayout(tile_info);

                    if (!oneDimensional) {
                        minY = tile_info.min_pos[1];
                        maxY = tile_info.max_pos[1];
                    } else {
                        minY = 0;
                        maxY = 1;
                    }

                    minValue = tile_info.min_value;
                    maxValue = tile_info.max_value;

                    let minArea = tile_info.min_importance;
                    let maxArea = tile_info.max_importance;

                    minImportance = tile_info.min_importance;
                    maxImportance = tile_info.max_importance;

                    maxZoom = tile_info.max_zoom;

                    if (domain == null)
                        xScaleDomain = [minX, maxX];
                    else
                        xScaleDomain = domain;

                    yScaleDomain = [minY, maxY];

                    if (xScale == null) {
                        xScale = d3.scale.linear()
                            .domain(xScaleDomain)
                            .range([0, width - margin.left - margin.right]);
                    }

                    if (yScale == null) {
                        yScale = d3.scale.linear()
                            .domain(yScaleDomain)
                            .range([height - margin.top - margin.bottom, 0]);
                    }

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

        });
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

    chart.on = function(event, _) {
        dispatch.on(event, _);
        return chart;
    }

    chart.xScale = function(_) {
        if (!arguments) return xScale;
        else xScale = _;
        return chart;
    }

    chart.margin = function(_) {
        if (!arguments) return margin;
        else margin = _;
        return chart;
    }

    chart.domain = function(_) {
        if (!arguments) return domain;
        else domain = _;
        return chart;
    }

    chart.zoomDispatch = function(_) {
        if (!arguments) return zoomDispatch;
        else zoomDispatch = _;
        return chart;
    }

    chart.tileLayout = function(_) {
        if (!arguments) return tileLayout;
        else tileLayout = _;
        return chart;
    }

    return chart;
}
