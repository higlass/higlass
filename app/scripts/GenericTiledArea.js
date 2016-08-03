import slugid from 'slugid';

export function GenericTiledArea() {
    var width = 550;
    var height = 400;

    let oneDimensional = true;     // will these be 1D tiles or 2D?

    let xOrigScale = null, yOrigScale = null;
    let xScale = null, yScale = null, valueScale = null;
    let widthScale = null;
    let domain = null;
    let scaleExtent = null;
    let horizontal = true;

    let dispatch = d3.dispatch('draw');
    let zoomDispatch = null;
    let tileType = 'div';
    let tilesChanged = function() { };
    let mirrorTiles = false;

    let xAxis = null;

    let labelSort = (a,b) => { return b.area - a.area; };
    let gDataPoints = null;
    let pointMarkId = (d) => { return `p-${d.uid}`; };
    function countTransform(count) {
        return Math.sqrt(Math.sqrt(count + 1));
        //return Math.log(count);
        //return count;
    }

    function tileId(tile) {
        // uniquely identify the tile with a string
        return tile.join("/") + '.' + tile.mirrored;
    }

    function chart(selection) {
        selection.each(function(d) {
            let element = this;
            let xScaleDomain = null, yScaleDomain = null;
            let loadedTiles = {};
            let loadingTiles = {};
            let shownTiles = new Set();
            let tileDirectory = d.source;

            let totalWidth = null;
            let totalHeight = null;

            let localZoomDispatch = zoomDispatch == null ? d3.dispatch('zoom', 'zoomend') : zoomDispatch;
            let minX = 0, maxX = 0, minY = 0, maxY = 0, minImportance = 0, maxImportance = 0, minValue = 0, maxValue = 0;

            let  maxZoom = 1;

            let zoom = d3.behavior.zoom();
            let slugId = d.uid;

            // setup the data-agnostic parts of the chart
            var gMain = d3.select(this)

            zoom.on("zoomend", zoomHere);

            localZoomDispatch.on('zoom.' + slugId, zoomChanged);

            function zoomChanged(translate, scale) {
                // something changed the zoom.
                if (horizontal) 
                    zoom.translate(translate);
                else
                    // if we're displaying a vertical scale, then we need to 
                    // reverse the translation
                    zoom.translate([translate[1], translate[0]]);

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

            if ('resizeDispatch' in d) {
                d.resizeDispatch.on('close.' + slugId, function(d) {
                    localZoomDispatch.on('zoom.' + slugId, null);
                });
            }

            function showTiles(tiles) {
                // refresh the display and make sure the tiles that need to be
                // displayed are displayed

                // check to make sure all the tiles we're trying to display
                // are already loaded
                let t1 = new Date().getTime();
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
                gTilesEnter.append(tileType)
                .classed('tile-g', true)

                gTilesExit.remove();

                // only redraw if the tiles have changed
                if (gTilesEnter.size() > 0 || gTilesExit.size() > 0) {
                    let t2 = new Date().getTime();
                    tilesChanged.bind(element)(d);
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
                        let tileSubPath = tile.join('.');
                        let tilePath = tileDirectory + "/" + tileSubPath;
                        loadingTiles[tileId(tile)] = true;
                        d3.json(tilePath, function(error, data) {
                            if (error != null) {
                                loadedTiles[tileId(tile)] = {};

                                showTiles(currentTiles);
                                return;     // tile probably wasn't found
                            }

                            let tile_value = data._source.tile_value;
                            delete loadingTiles[tileId(tile)];
                            let tileWidth = (totalWidth) / Math.pow(2, tile[0]);
                            let tileData = null;

                            let tileType = null;
                            if ('sparse' in tile_value) {
                                tileType = 'sparse';
                                tileData = tile_value['sparse'];
                            }

                            if ('dense' in tile_value) {
                                tileType = 'dense';
                                tileData = tile_value['dense']
                            }

                            loadedTiles[tileId(tile)] = {'tileId': tileId(tile), 
                                'maxZoom': maxZoom,
                                'tilePos': tile,
                                'xRange': [minX, minX + totalWidth],
                                'yRange': [minY, minY + totalHeight],
                                'tileXRange': [minX + tile[1] * tileWidth, minX + (tile[1] + 1) * tileWidth],
                                'importanceRange': [minImportance, maxImportance],
                                'valueRange': [tile_value.min_value, tile_value.max_value],
                                'data': new Float32Array(tileData),
                                'type': tileType,
                                'xOrigScale': xOrigScale,
                                'yOrigScale': yOrigScale ,
                                'mirrored': tile.mirrored
                            };
                                showTiles(currentTiles);
                        });
                    }
                });
                showTiles(currentTiles);
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
                  /*
                gMain.selectAll('.tile-g')
                    .call(concreteTileLayout
                            .xScale(xScale)
                            .minImportance(minImportance)
                            .maxImportance(maxImportance)
                            .minVisibleValue(minVisibleValue)
                            .maxVisibleValue(maxVisibleValue));
                            */

                // this will become the tiling code
                let zoomScale = Math.max((maxX - minX) / (xScale.domain()[1] - xScale.domain()[0]), 1);
                let addedZoom = Math.ceil(Math.log(width / 256) / Math.LN2);
                let zoomLevel = Math.round(Math.log(zoomScale) / Math.LN2) + addedZoom;

                if (zoomLevel > maxZoom)
                    zoomLevel = maxZoom;

                // the ski areas are positioned according to their
                // cumulative widths, which means the tiles need to also
                // be calculated according to cumulative width
                    //

                var tileWidth = totalWidth /  Math.pow(2, zoomLevel);
                var tileHeight = totalHeight / Math.pow(2, zoomLevel);

                let epsilon = 0.0000001;
                let tiles = [];

                let rows = null;

                rows = d3.range(Math.max(0,Math.floor((zoom.x().domain()[0] - minX) / tileWidth)),
                                Math.min(Math.pow(2, zoomLevel), Math.ceil(((zoom.x().domain()[1] - minX) - epsilon) / tileWidth)));

                if (! oneDimensional ) {
                    let cols = d3.range(Math.floor((zoom.y().domain()[0] - minY) / tileHeight),
                            Math.ceil(((zoom.y().domain()[1] - minY) - epsilon) / tileHeight));

                    for (let i = 0; i < rows.length; i++) {
                        for (let j = 0; j < cols.length; j++) {
                            if (mirrorTiles) {
                                if (rows[i] >= cols[j]) {
                                    // if we're in the upper triangular part of the matrix, then we need to load
                                    // a mirrored tile
                                    let newTile = [zoomLevel, cols[j], rows[i]];
                                    newTile.mirrored = true;
                                    tiles.push(newTile); 
                                } else {
                                    // otherwise, load an original tile
                                    let newTile = [zoomLevel, rows[i], cols[j]];
                                    newTile.mirrored = false;
                                    tiles.push(newTile); 

                                }

                                if (rows[i] == cols[j]) {
                                    // on the diagonal, load original tiles
                                    let newTile = [zoomLevel, rows[i], cols[j]];
                                    newTile.mirrored = false;
                                    tiles.push(newTile);
                                }

                            } else {
                                let newTile = [zoomLevel, rows[i], cols[j]];
                                newTile.mirrored = false;

                                tiles.push(newTile)
                            }
                        }
                    }
                } else {
                    rows.forEach((r) => { tiles.push([zoomLevel, r]);});
                }

                dispatch.draw();

                refreshTiles(tiles);
            }

            function zoomed() {
                var reset_s = 0;

                if (xScaleDomain == null)
                    return;

                let minAllowedX = xScaleDomain[0];
                let maxAllowedX = xScaleDomain[1];

                /*
                // constrain the scales to the allowed regions
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
                */

                draw();
            }

            d3.json(tileDirectory + '/tileset_info', function(error, tile_info) {
                // set up the data-dependent sections of the chart
                tile_info = tile_info._source.tile_value;

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
                    .range([0, width]);
                }

                if (yScale == null) {
                    yScale = d3.scale.linear()
                    .domain(yScaleDomain)
                    .range([0, height]);
                }

                if ('max_width' in tile_info) {
                    totalWidth = tile_info.max_width;
                    totalHeight = tile_info.max_width
                } else {
                    totalWidth = maxX - minX;
                    totalHeight = maxY - minY;
                }

                valueScale = d3.scale.linear()
                .domain([countTransform(minValue+1), countTransform(maxValue+1)])
                .range([0, 8]);

                xOrigScale = xScale.copy();
                yOrigScale = yScale.copy();

                if (scaleExtent == null)
                    zoom.x(xScale)
                //.scaleExtent([1,Math.pow(2, maxZoom-1)])
                .scaleExtent([1,Math.pow(2, maxZoom+8)])
                else
                    zoom.x(xScale)
                .scaleExtent(scaleExtent);

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

    chart.oneDimensional = function(_) {
        if (!arguments.length) return oneDimensional;
        oneDimensional = _;
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

    chart.scaleExtent = function(_) {
        if (!arguments) return scaleExtent;
        else scaleExtent = _;
        return chart;
    }

    chart.tileType = function(_) {
        if (!arguments) return tileType;
        else tileType = _;
        return chart;
    }

    chart.tilesChanged = function(_) {
        if (!arguments) return tilesChanged;
        else tilesChanged = _;
        return chart;
    }

    chart.horizontal = function(_) {
        if (!arguments) return horizontal;
        else horizontal = _;
        return chart;
    }

    chart.mirrorTiles = function(_) {
        if (!arguments) return mirrorTiles;
        else mirrorTiles = _;
        return chart;
    }

    return chart;
}
