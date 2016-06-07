import '../styles/higlass.css';

import d3 from 'd3';
import PIXI from 'pixi.js';
import {heatedObjectMap} from './colormaps.js'

export {TransferFunctionEditor} from './transfer.js';
export {heatedObjectMap} from './colormaps.js';

export function MassiveMatrixPlot() {
    var width = 550;
    var height = 400;
    var margin = {'top': 50, 'left': 30, 'bottom': 30, 'right': 120};
    let nTicks = 4;
    let zoomDispatch = null;
    let zoomCallback = null;
    let transferEditor = null;
    let xDomain = null, yDomain = null;

    function chart(selection) {
        selection.each(function(tileDirectory) {
            let resolution = 256;
            let minX = 0, maxX = 0, minY = 0, maxY = 0;
            let totalHeight = null, totalWidth = null;
            let maxZoom = 1;
            let yAxis = null, xAxis = null;

            let xOrigScale = null, yOrigScale = null;
            let xScale = null, yScale = null, valueScale = null;
            let widthScale = null;

            let loadedTiles = {};
            let loadingTiles = {};

            let renderer = null;
            let pMain = null;
            let tileGraphics = {};       // the pixi graphics objects which will contain the tiles

            let minArea = 0;
            let maxArea = 0;
            let xScaleDomain = null, yScaleDomain = null;

            let minValue = 0, maxValue = 0;
            let transferFunction = (count) => count > 0 ? Math.log2(1 + Math.log2(1 + count)) : 0;
            let maxTransfer = 1;
            let minVisibleValue = 0, maxVisibleValue = 1;

            let labelSort = (a,b) => { return b.area - a.area; };
            let gMain = null;
            let gDataPoints = null;
            let shownTiles = new Set();
            let pointMarkId = (d) => { return `p-${d.uid}`; };

            var pixiCanvas = d3.select(this).append('canvas')
                .attr('width', 0)
                .attr('height', 0)
                .style('left', `${margin.left}px`)
                .style('top', `${margin.top}px`)
                .style('position', 'absolute')

                renderer = PIXI.autoDetectRenderer(width - margin.right - margin.left, height - margin.top - margin.bottom, 
                        { 
                            //backgroundColor: 0xdddddd,
                            backgroundColor: 0xffffff,
                         antialias: true, 
                         view: pixiCanvas.node() });

            // setup the data-agnostic parts of the chart
            var svg = d3.select(this).append('svg')
                .attr('width', width)
                .attr('height', height)
                .style('left', 0)
                .style('top', 0)
                .style('position', 'absolute');

            var gEnter = svg.append("g")
                .attr('transform', `translate(${margin.left}, ${margin.top})`);

            var stage = new PIXI.Container();
            pMain = new PIXI.Graphics();
            stage.addChild(pMain);

            animate()

                function animate() {
                    renderer.render(stage)
                        requestAnimationFrame(animate);
                }

            let zoom = d3.behavior.zoom()
                .on("zoom", zoomHere);

            gEnter.insert("rect", "g")
                .attr("class", "pane")
                .attr("width", width - margin.left - margin.right)
                .attr("height", height - margin.top - margin.bottom)
                .attr('pointer-events', 'all')

                gEnter.call(zoom);

            var gYAxis = gEnter.append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(" + (width - margin.right - margin.left) + ",0)");

            var gXAxis = gEnter.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + (height - margin.bottom - margin.top) + ")");

            gMain = gEnter.append('g')
                .classed('main-g', true)

                gMain.append("clipPath")
                .attr("id", "clipHiC")
                .append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", width - margin.left - margin.right)
                .attr("height", height - margin.top - margin.bottom);


            let localZoomDispatch = zoomDispatch == null ? d3.dispatch('zoom') : zoomDispatch;
            localZoomDispatch.on('zoom.' + tileDirectory, zoomChanged);

            function zoomHere() {
                localZoomDispatch.zoom(zoom.translate(), zoom.scale());
            }

            function zoomChanged(translate, scale) {
                // something changed the zoom.
                zoom.translate(translate);
                zoom.scale(scale);

                zoomed();
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

            function setPix(pix, data, zoomLevel) {
                //console.log('maxZoom:', maxZoom);
                
                let zoomFactor = Math.pow(2, 2 * (maxZoom - zoomLevel));

                var maxTransfer = transferFunction(maxValue);
                //console.log('maxTransfer:', maxTransfer);
                //console.log('maxTransfer:', maxTransfer, transferFunction(2000), maxValue);
                valueScale.domain([countTransform(minVisibleValue), countTransform(maxVisibleValue)])

                //console.log('sdfsdfs data:', data);
                //console.log('valueScale.domain():', valueScale.domain());

                let lastD = null;
                //console.log('time before:', getTime());

                    try {
                        let pixelValues = data.map((d,i) => {
                            lastD = d;
                            let ct = countTransform(d);

                            let rgbIdx = Math.max(0, Math.min(255, Math.floor(valueScale(countTransform(d)))))

                            /*
                               d = d / zoomFactor;
                               let intensity = transferFunction(d) / maxTransfer;
                               let discretized = Math.floor(255 * (1 - intensity));
                               console.log('discretized:', discretized, intensity)
                               */

                            let rgb = heatedObjectMap[rgbIdx];

                            /*
                               if (i % 1000 == 0) {
                               console.log('rgbIdx:', i, d, rgbIdx, rgb);
                               }
                               */

                            pix.data[i*4] = rgb[0];
                            pix.data[i*4+1] = rgb[1];
                            pix.data[i*4+2] = rgb[2];
                            pix.data[i*4+3] = 255;
                        });
                    } catch (err) {
                        console.log('lastD:', lastD, data);
                        console.log('minVisibleValue, maxVisibleValue', minVisibleValue, maxVisibleValue);
                        /*
                           console.log('rgbIdx:', rgbIdx);
                           return pix;
                           */
                        //console.log("Err:", err);
                    }


                return pix;
            }


            function tileDataToCanvas(data, zoomLevel) {
                let canvas = document.createElement('canvas');
                let zoomFactor = Math.pow(2, 2 * (maxZoom - zoomLevel));

                canvas.width = 256;
                canvas.height = 256;

                let ctx = canvas.getContext('2d');

                ctx.fillStyle = 'transparent';
                ctx.fillRect(0,0,canvas.width, canvas.height);

                let pix = ctx.createImageData(canvas.width, canvas.height);
                pix = setPix(pix, data, zoomLevel);
                ctx.putImageData(pix, 0,0);

                return canvas;
            }

            function setSpriteProperties(sprite, tile) {
                let zoomLevel = tile[0], xTilePos = tile[1], yTilePos = tile[2];

                let tileWidth = totalWidth / Math.pow(2, zoomLevel);
                let tileHeight = totalHeight / Math.pow(2, zoomLevel);

                let tileX = minX + xTilePos * tileWidth;
                let tileY = minY + yTilePos * tileHeight;

                let tileEndX = minX + (xTilePos+1) * tileWidth;
                let tileEndY = minY + (yTilePos+1) * tileHeight;

                sprite.x = xOrigScale(tileX);
                sprite.y = yOrigScale(tileY);
                sprite.width = xOrigScale(tileEndX) - xOrigScale(tileX)
                    sprite.height = yOrigScale(tileEndY) - yOrigScale(tileY)

            }

            function changeTextures() {
                // go through each tile shown tile and change its texture
                // this is normally called when the value of the color scale changes
                // it's a little slow at the moment so it's unused
                console.log('changing textures');
                for (let tileId in loadedTiles) {
                    loadedTiles[tileId].canvasChanged = true;
                }

                for (let tileId in shownTiles) {
                    let sprite = tileGraphics[tileId].children[0];
                    let canvas = getCanvas(tileId);
                    let tile = loadedTiles[tileId];

                    let texture = null;
                    if (tile.pos[0] == maxZoom)
                        texture = PIXI.Texture.fromCanvas(canvas, PIXI.SCALE_MODES.NEAREST);
                    else
                        texture = PIXI.Texture.fromCanvas(canvas);

                    sprite.texture = texture;
                    
                    setSpriteProperties(sprite, loadedTiles[tileId].pos);
                };

            }

            function getCanvas(tileId) {
                let tile = loadedTiles[tileId]
                if (tile.canvasChanged) {
                    tile.canvas = tileDataToCanvas(tile.data, tile.pos[0]);
                }

                tile.canvasChanged = false;
                return tile.canvas;
            }

            function showTiles(tiles) {
                // refresh the display and make sure the tiles that need to be
                // displayed are displayed

                // check to make sure all the tiles we're trying to display
                // are already loaded
                let allLoaded = true;
                let allData = [];

                shownTiles = {};

                tiles.forEach((t) => {
                    allLoaded = allLoaded && isTileLoaded(t);
                });
                if (!allLoaded)
                    return;

                let visibleTiles = tiles.map((d) => { return loadedTiles[tileId(d)]; })
                    .filter((d) => { return d != undefined; })
                    .filter((d) => { return d.data != undefined; })
                    .filter((d) => { return d.data.length > 0; });

                for (let i = 0; i < tiles.length; i++) {
                    shownTiles[tileId(tiles[i])] = true;

                    // check if we already have graphics for these tiles
                    if (!(tileId(tiles[i]) in tileGraphics)) {
                        // tile isn't loaded into a pixi graphics container
                        // load that sucker
                        let newGraphics = new PIXI.Graphics();

                        let canvas = getCanvas(tileId(tiles[i])); //loadedTiles[tileId(tiles[i])].canvas; //tileDataToCanvas(loadedTiles[tileId(tiles[i])].data, tiles[i][0]);
                        let sprite = null;

                        if (tiles[i][0] == maxZoom) {
                            sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(canvas, PIXI.SCALE_MODES.NEAREST));
                        } else {
                            sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(canvas));
                        }
                        //let sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(canvas));

                        setSpriteProperties(sprite, tiles[i]);

                            newGraphics.addChild(sprite);
                        tileGraphics[tileId(tiles[i])] = newGraphics;

                        pMain.addChild(newGraphics);
                    } else {
                        //let canvas = //tileDataToCanvas(loadedTiles[tileId(tiles[i])].data, tiles[i][0]);
                    }
                }

                for (let tileIdStr in tileGraphics) {
                    if (!(tileIdStr in shownTiles)) {
                        pMain.removeChild(tileGraphics[tileIdStr]);
                        delete tileGraphics[tileIdStr];
                    }
                }

                let prevMinVisibleValue = minVisibleValue;
                let prevMaxVisibleValue = maxVisibleValue;

                minVisibleValue = Math.min( ...visibleTiles.map((x) => x.valueRange[0]));
                maxVisibleValue = Math.max( ...visibleTiles.map((x) => x.valueRange[1]));

                if (prevMinVisibleValue != minVisibleValue || prevMaxVisibleValue != maxVisibleValue) {
                    //changeTextures();
                }

                let gTiles = gMain.selectAll('.tile-g')
                    .data(tiles, tileId)

                    let gTilesEnter = gTiles.enter()
                    let gTilesExit = gTiles.exit()

                    gTilesEnter.append('g')
                    .attr('id', (d) => 'i-' + tileId(d))
                    .classed('tile-g', true)
                    .each(function(tile) {
                        let gTile = d3.select(this);

                        if (loadedTiles[tileId(tile)] === undefined)
                        return;

                    })

                gTilesExit.remove();

                // only redraw if the tiles have changed
                if (gTilesEnter.size() > 0 || gTilesExit.size() > 0)
                    draw();
            }

            function removeTile(tile) {
                // remove all of the elements associated with this tile
                //
            }

            function loadTileData(tile_value) {
                if ('dense' in tile_value)
                    return tile_value['dense'];
                else if ('sparse' in tile_value) {
                    let values = Array.apply(null, 
                            Array(resolution * resolution)).map(Number.prototype.valueOf, 0);
                    for (let i = 0; i < tile_value.sparse.length; i++) {
                        values[tile_value.sparse[i].pos[1] * resolution +
                               tile_value.sparse[i].pos[0]] = tile_value.sparse[i].value;
                    }
                    return values;

                } else {
                    return [];
                }

            }

            function refreshTiles(currentTiles) {
                // be shown and add those that should be shown
                currentTiles.forEach((tile) => {
                    if (!isTileLoaded(tile) && !isTileLoading(tile)) {
                        // if the tile isn't loaded, load it
                        let tileSubPath = tile.join('.')
                            let tilePath = tileDirectory + "/" + tileSubPath;
                        loadingTiles[tileId(tile)] = true;

                        d3.json(tilePath,
                                function(error, tile_json) {
                                    if (error != null) {
                                        loadedTiles[tileId(tile)] = {data: []};
                                        let canvas = tileDataToCanvas([], tile[0]);
                                        loadedTiles[tileId(tile)].canvas = canvas;
                                        loadedTiles[tileId(tile)].pos = tile;
                                    } else {
                                        let tile_value = tile_json._source.tile_value;
                                        let data = loadTileData(tile_value);

                                        loadedTiles[tileId(tile)] = {data: data};
                                        let canvas = tileDataToCanvas(data, tile[0]);
                                        loadedTiles[tileId(tile)].canvas = canvas;
                                        loadedTiles[tileId(tile)].pos = tile;
                                        loadedTiles[tileId(tile)].valueRange = [tile_value.min_value, tile_value.max_value];
                                    }

                                    delete loadingTiles[tileId(tile)];
                                    showTiles(currentTiles);
                                });
                    } else {
                        showTiles(currentTiles);
                    }
                });
            }


            d3.json(tileDirectory + '/tileset_info', function(error, tile_info) {
                // set up the data-dependent sections of the chart
                console.log('tile_info:', tile_info);
                tile_info = tile_info._source.tile_value;

                resolution = tile_info.bins_per_dimension;

                minX = tile_info.min_pos[0];
                maxX = tile_info.max_pos[0] + 0.001;

                minY = tile_info.min_pos[1];
                maxY = tile_info.max_pos[1];

                minValue = tile_info.min_value;
                maxValue = tile_info.max_value;

                if (transferEditor != null) {
                    transferEditor.domain = [0.01, maxValue+1];
                    //transferFunction = tF.binnedMap(10000);

                    transferEditor.onChange(tF => {
                       transferFunction = tF.binnedMap(10000); 
                       changeTextures();
                    });

                }


                maxTransfer = transferFunction(maxValue);

                minArea = tile_info.min_importance;
                maxArea = tile_info.max_importance;

                maxZoom = tile_info.max_zoom;

                console.log('xDomain:', xDomain);
                console.log('yDomain:', yDomain);

                if (xDomain == null) {
                    xScaleDomain = [minX, maxX];
                } else {
                    xScaleDomain = xDomain;
                }

                if (yDomain == null) {
                    yScaleDomain = [minY, maxY];
                } else {
                    yScaleDomain = yDomain;
                }

                //totalWidth = maxX - minX;
                //totalHeight = maxY - minY;
                totalHeight = tile_info.max_width;
                totalWidth = tile_info.max_width;

                xScale = d3.scale.linear()
                    .domain(xScaleDomain)
                    .range([0, width - margin.left - margin.right]);

                yScale = d3.scale.linear()
                    .domain(yScaleDomain)
                    .range([height - margin.top - margin.bottom, 0]);

                valueScale = d3.scale.linear()
                    .domain([countTransform(minValue+1), countTransform(maxValue+1)])
                    .range([255,0]);

                xOrigScale = xScale.copy();
                yOrigScale = yScale.copy();

                zoom.x(xScale)
                    .y(yScale)
                    .scaleExtent([1,Math.pow(2, maxZoom + 2)])
                    //.xExtent(xScaleDomain);

                    yAxis = d3.svg.axis()
                    .scale(yScale)
                    .orient("right")
                    .tickSize(-(width - margin.left - margin.right))
                    .tickPadding(6)
                    .ticks(nTicks);

                xAxis = d3.svg.axis()
                    .scale(xScale)
                    .orient("bottom")
                    .tickSize(-(height - margin.top - margin.bottom))
                    .tickPadding(6)
                    .ticks(nTicks);

                gYAxis.call(yAxis);
                gXAxis.call(xAxis);

                refreshTiles([[0,0,0]]);
            });

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

                // control the pixi zooming
                pMain.position.x = zoom.translate()[0];
                pMain.position.y = zoom.translate()[1];
                pMain.scale.x = zoom.scale();
                pMain.scale.y = zoom.scale();

                if (zoomCallback)
                    zoomCallback(xScale, zoom.scale());

                draw();
            }

            function draw() {
                // draw the scene, if we're zooming, then we need to check if we
                // need to redraw the tiles, otherwise it's irrelevant
                //

                gYAxis.call(yAxis);
                gXAxis.call(xAxis);

                // this will become the tiling code
                let zoomScale = Math.max((maxX - minX) / (xScale.domain()[1] - xScale.domain()[0]), 1);
                let zoomLevel = Math.round(Math.log(zoomScale) / Math.LN2) + 1;

                if (zoomLevel > maxZoom)
                    return;

                /*
                let totalWidth = maxX - minX;
                let totalHeight = maxY - minY;
                */

                var tileWidth = totalWidth /  Math.pow(2, zoomLevel);
                var tileHeight = totalHeight / Math.pow(2, zoomLevel);

                let epsilon = 0.000001;
                let tiles = [];

                /*
                let rows = d3.range(Math.floor((zoom.x().domain()[0] - minX) / tileWidth),
                        Math.ceil(((zoom.x().domain()[1] - minX) - epsilon) / tileWidth));

                */
                    let rows = d3.range(Math.max(0,Math.floor((zoom.x().domain()[0] - minX) / tileWidth)),
                            Math.min(Math.pow(2, zoomLevel), Math.ceil(((zoom.x().domain()[1] - minX) - epsilon) / tileWidth)));

                let cols = d3.range(Math.floor((zoom.y().domain()[0] - minY) / tileHeight),
                        Math.ceil(((zoom.y().domain()[1] - minY) - epsilon) / tileHeight));



                for (let i = 0; i < rows.length; i++) {
                    for (let j = 0; j < cols.length; j++) {
                        tiles.push([zoomLevel, rows[i], cols[j]]);
                    }
                }
                // hey hye
                /*
                   let tiles = [];
                   rows.forEach((r) => { tiles.push([zoomLevel, r]);});
                   */
               
                //console.log('rows:', zoomLevel, rows, zoom.x().domain(), tileWidth);
                //console.log('cols:', cols);
                

                refreshTiles(tiles);
            }
        });
    }
    //endchart

    function countTransform(count) {
        return Math.sqrt(Math.sqrt(count + 1));
        //return Math.log(count);
        //return count;
    }

    function tileId(tile) {
        // uniquely identify the tile with a string
        return tile.join(".");
    }

    function pointId(d) {
        return d.uid;
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

    chart.tileDirectory = function(_) {
        if (!arguments.length) return tileDirectory;
        tileDirectory = _;
        return chart;
    };

    chart.zoomTo = function(_) {
        // 
        return zoomTo;
    };

    chart.xScale = function(_) {
        return xScale;
    };

    chart.zoomLevel = function(_) {
        return zoom.scale();
    };

    chart.zoomCallback = function(_) {
        if (!arguments.length) return zoomCallback;
        else zoomCallback = _;
        return chart;
    }

    chart.nTicks = function(_) {
        if (!arguments.length) return nTicks;
        else nTicks = _;
        return chart;
    }

    chart.zoomDispatch = function(_) {
        if (!arguments.length) return zoomDispatch;
        else zoomDispatch = _;
        return chart;
    }

    chart.margin = function(_) {
        if (!arguments.length) return margin;
        else margin = _;
        return chart;
    }

    chart.transferEditor = function(_) {
        if (!arguments.length) return transferEditor;
        else transferEditor = _;
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

