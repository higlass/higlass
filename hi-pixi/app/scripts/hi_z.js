import '../styles/hi_z.css';
import d3 from 'd3';
import PIXI from 'pixi.js';

export function MassiveMatrixPlot() {
    var width = 550;
    var height = 400;
    var minX = 0, maxX = 0, minY = 0, maxY = 0;
    let minValue = 0, maxValue = 0;
    var maxZoom = 1;
    var margin = {'top': 50, 'left': 30, 'bottom': 30, 'right': 80};
    let tileDirectory = null;

    let yAxis = null, xAxis = null;

    let totalHeight = null, totalWidth = null;
    let xOrigScale = null, yOrigScale = null;
    let xScale = null, yScale = null, valueScale = null;
    let widthScale = null;
    let zoomTo = null;

    let zoom = null;

    let loadedTiles = {};
    let loadingTiles = {};

    let renderer = null;
    let pMain = null;
    let tileGraphics = {};       // the pixi graphics objects which will contain the tiles

    let minArea = 0;
    let maxArea = 0;
    let xScaleDomain = null, yScaleDomain = null;
    let zoomCallback = null;

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

    let drawingCanvas = document.createElement('canvas');
    drawingCanvas.width = 256;
    drawingCanvas.height = 256;

    function tileId(tile) {
        // uniquely identify the tile with a string
        return tile.join("/");
    }

    function chart(selection) {
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

        function skiAreaMouseover(d, i) {
            d3.select(this)
            .classed('hovered', true);

            console.log('mouseover:', d.name, d.uid);
        }

        function skiAreaMouseout(d) {
            d3.select(this)
            .classed('hovered', false);
        }

        function pointId(d) {
            return d.uid;
        }

        function tileDataToCanvas(data, canvasWidth, canvasHeight) {
            let canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;

            let ctx = canvas.getContext('2d');

            ctx.fillStyle = 'white';
            ctx.fillRect(0,0,canvas.width, canvas.height);

            let pix = ctx.createImageData(canvas.width, canvas.height);
            let pixelValues = data.map((d,i) => {
                let rgbIdx = Math.floor(valueScale(d));
                let rgb = heatedObjectMap[Math.floor(valueScale(d))];

                pix.data[i*4] = rgb[0];
                pix.data[i*4+1] = rgb[1];
                pix.data[i*4+2] = rgb[2];
                pix.data[i*4+3] = 255;
            });
            ctx.putImageData(pix, 0,0);

            return canvas;
        }

        function showTiles(tiles) {
            // refresh the display and make sure the tiles that need to be
            // displayed are displayed
            
            // check to make sure all the tiles we're trying to display
            // are already loaded
            let allLoaded = true;
            let allData = [];

            let shownTiles = {};

            tiles.forEach((t) => {
                allLoaded = allLoaded && isTileLoaded(t);
                if (isTileLoaded(t))
                    allData = allData.concat(loadedTiles[tileId(t)]);
            });
            if (!allLoaded)
                return;

            let allCounts = allData;
            let minCounts = Number.MAX_VALUE;
            let maxCounts = Number.MIN_VALUE;

            for (let i = 0; i < allCounts.length; i++) {
                if (allCounts[i] < minCounts)
                    minCounts = allCounts[i];
                if (allCounts[i] > maxCounts)
                    maxCounts = allCounts[i];
            }
            //let allCounts = allData.map((x) => { return +x.count; });
            valueScale.domain([minCounts, maxCounts])

            for (let i = 0; i < tiles.length; i++) {
                shownTiles[tileId(tiles[i])] = true;

                // check if we already have graphics for these tiles
                if (!(tileId(tiles[i]) in tileGraphics)) {
                    // tile isn't loaded into a pixi graphics container
                    // load that sucker
                    let newGraphics = new PIXI.Graphics();

                    let canvas = tileDataToCanvas(loadedTiles[tileId(tiles[i])]);
                    let sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(canvas));

                    let zoomLevel = tiles[i][0], xTilePos = tiles[i][1], yTilePos = tiles[i][2];

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

                    newGraphics.addChild(sprite);
                    tileGraphics[tileId(tiles[i])] = newGraphics;

                    console.log('adding child:', tiles[i]);
                    pMain.addChild(newGraphics);
                }
            }

            for (let tileIdStr in tileGraphics) {
                if (!(tileIdStr in shownTiles)) {
                    console.log('removing child:', tileIdStr);
                    pMain.removeChild(tileGraphics[tileIdStr]);
                    delete tileGraphics[tileIdStr];
                }
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

            /*
                let data = loadedTiles[tileId(tile)].shown;
                //let labelSort = (a,b) => { return b.area - a.area; };
                //let elevationSort = (a,b) => { return b.max_elev - a.max_elev; };
                //data.sort(labelSort);

                gDataPoints = gTile.selectAll('.data-g')
                .data(data, pointId)
                .enter()
                .append('g')
                .classed('data-g', true)

                // the rectangle showing each rect
                gDataPoints.append('circle')
                .classed('data-point', true)
                .attr('id', pointMarkId)
                //.on('mouseover', skiAreaMouseover)
                //.on('mouseout', skiAreaMouseout)
                .attr("clip-path", "url(#clip)")
                */
            })

            gTilesExit.remove();
            
            // only redraw if the tiles have changed
            if (gTilesEnter.size() > 0 || gTilesExit.size() > 0) {
                /*
                tiles.forEach((t) => {
                    console.log('t:', t);
                });
                */
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
                                if (error != null) {
                                    loadedTiles[tileId(tile)] = [];
                                } else {
                                    loadedTiles[tileId(tile)] = data;
                                }

                                delete loadingTiles[tileId(tile)];
                                showTiles(currentTiles);
                            });
                } else {
                    showTiles(currentTiles);
                }
            });
        }

        var pixiCanvas = selection.append('canvas')
        .attr('width', 0)
        .attr('height', 0)
        .style('left', `${margin.left}px`)
        .style('top', `${margin.top}px`)
        .style('position', 'absolute')

        renderer = PIXI.autoDetectRenderer(width - margin.left - margin.right, height - margin.top - margin.bottom, 
                                       { 
                                           //backgroundColor: 0xdddddd,
                                           backgroundColor: 0xffffff,
                                           antialias: true, 
                                           view: pixiCanvas.node() });

        // setup the data-agnostic parts of the chart
        var svg = selection.append('svg')
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

        zoom = d3.behavior.zoom()
        .on("zoom", zoomed);

        gEnter.insert("rect", "g")
        .attr("class", "pane")
        .attr("width", width)
        .attr("height", height)
        .attr('pointer-events', 'all')

        gEnter.call(zoom);

        var gYAxis = gEnter.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + (width - margin.right) + ",0)");

        var gXAxis = gEnter.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (height - margin.bottom - margin.top) + ")");

        gMain = gEnter.append('g')
        .classed('main-g', true)
        .attr('transform', 'translate(' + margin.left + ',0)');

        gMain.append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom);


        d3.json(tileDirectory + '/tile_info.json', function(error, tile_info) {
            // set up the data-dependent sections of the chart
            minX = tile_info.min_pos[0];
            maxX = tile_info.max_pos[0] + 0.001;

            minY = tile_info.min_pos[1];
            maxY = tile_info.max_pos[1];

            minValue = tile_info.min_value;
            maxValue = tile_info.max_value;

            minArea = tile_info.min_importance;
            maxArea = tile_info.max_importance;

            maxZoom = tile_info.max_zoom;

            totalWidth = tile_info.max_width;
            totalHeight = tile_info.max_width;

            xScaleDomain = [minX, maxX];
            yScaleDomain = [minY, maxY];

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
            .scaleExtent([1,Math.pow(2, maxZoom-1)])
            //.xExtent(xScaleDomain);

            yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("right")
            .tickSize(-(width - margin.left - margin.right))
            .tickPadding(6)
            .ticks(4);

            xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("bottom")
            .tickSize(-(height - margin.top - margin.bottom))
            .tickPadding(6)
            .ticks(4);

            gYAxis.call(yAxis);
            gXAxis.call(xAxis);

            refreshTiles([[0,0,0]]);
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

          // control the pixi zooming
          pMain.position.x = zoom.translate()[0];
          pMain.position.y = zoom.translate()[1];
          pMain.scale.x = zoom.scale();
          pMain.scale.y = zoom.scale();

          //console.log('pMain.scale:', pMain.scale);
          //
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

            gMain.selectAll('.data-point')
            .attr('cx', d => { 
                return xScale(d.pos[0]); })
            .attr('cy', d => { return yScale(d.pos[1]); })
            .attr('r', d => { 
                /*
                  console.log('d.count:', d.count, countTransform(d.count+1),
                             valueScale(countTransform(d.count+1)));
                             */
                return valueScale(countTransform(d.count+1)); 
            })

            // this will become the tiling code
            let zoomLevel = Math.round(Math.log(zoom.scale()) / Math.LN2) + 1;

            // the ski areas are positioned according to their
            // cumulative widths, which means the tiles need to also
            // be calculated according to cumulative width
            
            /*
            let totalWidth = maxX - minX;
            let totalHeight = maxY - minY;
            */

            var tileWidth = totalWidth /  Math.pow(2, zoomLevel);
            var tileHeight = totalHeight / Math.pow(2, zoomLevel);

            let epsilon = 0.000001;
            let tiles = [];

            let rows = d3.range(Math.floor((zoom.x().domain()[0] - minX) / tileWidth),
                                Math.ceil(((zoom.x().domain()[1] - minX) - epsilon) / tileWidth));

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
            refreshTiles(tiles);
        }
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

    return chart;
}

var heatedObjectMap = [
    [  0,   0,   0],
    [ 35,   0,   0],
    [ 52,   0,   0],
    [ 60,   0,   0],
    [ 63,   1,   0],
    [ 64,   2,   0],
    [ 68,   5,   0],
    [ 69,   6,   0],
    [ 72,   8,   0],
    [ 74,  10,   0],
    [ 77,  12,   0],
    [ 78,  14,   0],
    [ 81,  16,   0],
    [ 83,  17,   0],
    [ 85,  19,   0],
    [ 86,  20,   0],
    [ 89,  22,   0],
    [ 91,  24,   0],
    [ 92,  25,   0],
    [ 94,  26,   0],
    [ 95,  28,   0],
    [ 98,  30,   0],
    [100,  31,   0],
    [102,  33,   0],
    [103,  34,   0],
    [105,  35,   0],
    [106,  36,   0],
    [108,  38,   0],
    [109,  39,   0],
    [111,  40,   0],
    [112,  42,   0],
    [114,  43,   0],
    [115,  44,   0],
    [117,  45,   0],
    [119,  47,   0],
    [119,  47,   0],
    [120,  48,   0],
    [122,  49,   0],
    [123,  51,   0],
    [125,  52,   0],
    [125,  52,   0],
    [126,  53,   0],
    [128,  54,   0],
    [129,  56,   0],
    [129,  56,   0],
    [131,  57,   0],
    [132,  58,   0],
    [134,  59,   0],
    [134,  59,   0],
    [136,  61,   0],
    [137,  62,   0],
    [137,  62,   0],
    [139,  63,   0],
    [139,  63,   0],
    [140,  65,   0],
    [142,  66,   0],
    [142,  66,   0],
    [143,  67,   0],
    [143,  67,   0],
    [145,  68,   0],
    [145,  68,   0],
    [146,  70,   0],
    [146,  70,   0],
    [148,  71,   0],
    [148,  71,   0],
    [149,  72,   0],
    [149,  72,   0],
    [151,  73,   0],
    [151,  73,   0],
    [153,  75,   0],
    [153,  75,   0],
    [154,  76,   0],
    [154,  76,   0],
    [154,  76,   0],
    [156,  77,   0],
    [156,  77,   0],
    [157,  79,   0],
    [157,  79,   0],
    [159,  80,   0],
    [159,  80,   0],
    [159,  80,   0],
    [160,  81,   0],
    [160,  81,   0],
    [162,  82,   0],
    [162,  82,   0],
    [163,  84,   0],
    [163,  84,   0],
    [165,  85,   0],
    [165,  85,   0],
    [166,  86,   0],
    [166,  86,   0],
    [166,  86,   0],
    [168,  87,   0],
    [168,  87,   0],
    [170,  89,   0],
    [170,  89,   0],
    [171,  90,   0],
    [171,  90,   0],
    [173,  91,   0],
    [173,  91,   0],
    [174,  93,   0],
    [174,  93,   0],
    [176,  94,   0],
    [176,  94,   0],
    [177,  95,   0],
    [177,  95,   0],
    [179,  96,   0],
    [179,  96,   0],
    [180,  98,   0],
    [182,  99,   0],
    [182,  99,   0],
    [183, 100,   0],
    [183, 100,   0],
    [185, 102,   0],
    [185, 102,   0],
    [187, 103,   0],
    [187, 103,   0],
    [188, 104,   0],
    [188, 104,   0],
    [190, 105,   0],
    [191, 107,   0],
    [191, 107,   0],
    [193, 108,   0],
    [193, 108,   0],
    [194, 109,   0],
    [196, 110,   0],
    [196, 110,   0],
    [197, 112,   0],
    [197, 112,   0],
    [199, 113,   0],
    [200, 114,   0],
    [200, 114,   0],
    [202, 116,   0],
    [202, 116,   0],
    [204, 117,   0],
    [205, 118,   0],
    [205, 118,   0],
    [207, 119,   0],
    [208, 121,   0],
    [208, 121,   0],
    [210, 122,   0],
    [211, 123,   0],
    [211, 123,   0],
    [213, 124,   0],
    [214, 126,   0],
    [214, 126,   0],
    [216, 127,   0],
    [217, 128,   0],
    [217, 128,   0],
    [219, 130,   0],
    [221, 131,   0],
    [221, 131,   0],
    [222, 132,   0],
    [224, 133,   0],
    [224, 133,   0],
    [225, 135,   0],
    [227, 136,   0],
    [227, 136,   0],
    [228, 137,   0],
    [230, 138,   0],
    [230, 138,   0],
    [231, 140,   0],
    [233, 141,   0],
    [233, 141,   0],
    [234, 142,   0],
    [236, 144,   0],
    [236, 144,   0],
    [238, 145,   0],
    [239, 146,   0],
    [241, 147,   0],
    [241, 147,   0],
    [242, 149,   0],
    [244, 150,   0],
    [244, 150,   0],
    [245, 151,   0],
    [247, 153,   0],
    [247, 153,   0],
    [248, 154,   0],
    [250, 155,   0],
    [251, 156,   0],
    [251, 156,   0],
    [253, 158,   0],
    [255, 159,   0],
    [255, 159,   0],
    [255, 160,   0],
    [255, 161,   0],
    [255, 163,   0],
    [255, 163,   0],
    [255, 164,   0],
    [255, 165,   0],
    [255, 167,   0],
    [255, 167,   0],
    [255, 168,   0],
    [255, 169,   0],
    [255, 169,   0],
    [255, 170,   0],
    [255, 172,   0],
    [255, 173,   0],
    [255, 173,   0],
    [255, 174,   0],
    [255, 175,   0],
    [255, 177,   0],
    [255, 178,   0],
    [255, 179,   0],
    [255, 181,   0],
    [255, 181,   0],
    [255, 182,   0],
    [255, 183,   0],
    [255, 184,   0],
    [255, 187,   7],
    [255, 188,  10],
    [255, 189,  14],
    [255, 191,  18],
    [255, 192,  21],
    [255, 193,  25],
    [255, 195,  29],
    [255, 197,  36],
    [255, 198,  40],
    [255, 200,  43],
    [255, 202,  51],
    [255, 204,  54],
    [255, 206,  61],
    [255, 207,  65],
    [255, 210,  72],
    [255, 211,  76],
    [255, 214,  83],
    [255, 216,  91],
    [255, 219,  98],
    [255, 221, 105],
    [255, 223, 109],
    [255, 225, 116],
    [255, 228, 123],
    [255, 232, 134],
    [255, 234, 142],
    [255, 237, 149],
    [255, 239, 156],
    [255, 240, 160],
    [255, 243, 167],
    [255, 246, 174],
    [255, 248, 182],
    [255, 249, 185],
    [255, 252, 193],
    [255, 253, 196],
    [255, 255, 204],
    [255, 255, 207],
    [255, 255, 211],
    [255, 255, 218],
    [255, 255, 222],
    [255, 255, 225],
    [255, 255, 229],
    [255, 255, 233],
    [255, 255, 236],
    [255, 255, 240],
    [255, 255, 244],
    [255, 255, 247],
    [255, 255, 255]
];
