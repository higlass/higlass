import PIXI from 'pixi.js';
import slugid from 'slugid';
import d3 from 'd3';

export function WigglePixiTrack() {
    let width = 200;
    let height = 15;
    let resizeDispatch = null;
    let xScale = d3.scale.linear();
    let zoomDispatch = null;
    let resolution = 256;

    function tileId(tile) {
        // uniquely identify the tile with a string
        return tile.join(".") + '.' + tile.mirrored;
    }

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

    let chart = function(selection) {
        selection.each(function(d) {
            if (!('resizeDispatch' in d)) {
                d.resizeDispatch = resizeDispatch == null ? d3.dispatch('resize') : resizeDispatch;
            }
            let localResizeDispatch = d.resizeDispatch;
            let slugId = slugid.nice();
            localResizeDispatch.on('resize.' + slugId, sizeChanged);

            let localZoomDispatch = zoomDispatch == null ? d3.dispatch('zoom') : zoomDispatch;
            localZoomDispatch.on('zoom.' + slugId, zoomChanged);


            if (!('tileGraphics' in d)) {
                d.tileGraphics = {};
            }

            let tileData = d3.select(this).selectAll('.tile-g').data();
            let shownTiles = {};

            let minVisibleValue = Math.min(...tileData.map((x) => x.valueRange[0]));
            let maxVisibleValue = Math.max(...tileData.map((x) => x.valueRange[1]));

            let yScale = d3.scale.linear()
            .domain([0, maxVisibleValue])
            .range([0, d.height]);

            let drawTile = function(graphics, tile) {
                console.log('drawing tile:', tile.tileId, xScale.domain(), xScale.range());
                let tileData = loadTileData(tile.data);

                let tileWidth = (tile.xRange[1] - tile.xRange[0]) / Math.pow(2, tile.tilePos[0]);
                // this scale should go from an index in the data array to 
                // a position in the genome coordinates
                let tileXScale = d3.scale.linear().domain([0, tileData.length])
                .range([tile.xRange[0] + tile.tilePos[1] * tileWidth, 
                       tile.xRange[0] + (tile.tilePos[1] + 1) * tileWidth]  );

                graphics.lineStyle(0, 0x0000FF, 1);
                graphics.beginFill(0xFF700B, 1);

                for (let i = 0; i < tileData.length; i++) {
                    let xPos = xScale(tileXScale(i));
                    let yPos = d.height - yScale(tileData[i]);
                    let height = yScale(tileData[i])
                    let width = xScale(tileXScale(i+1)) - xScale(tileXScale(i));

                    if (height > 0 && width > 0) {
                        if (i % 1 == 0) {
                            //console.log('drawRect', xPos, yPos, width, height);
                            graphics.drawRect(xPos, yPos, width, height);
                        }
                    }
                }
            }


            let tiles = d3.select(this).selectAll('.tile-g');

            width = d.width;
            height = d.height;

            d3.select(this).selectAll('canvas')
            .data([1])
            .enter()
            .append('canvas');

            let canvas = d3.select(this).select('canvas');


            if (!('renderer' in d)) {
                d.renderer = PIXI.autoDetectRenderer(d.width, d.height, { antialias: true,
                                                                          view: canvas.node(),
                                                                          transparent: true });

                var stage = new PIXI.Container();
                stage.interactive = true;

                var pMain = new PIXI.Graphics();
                stage.addChild(pMain);

                d.pMain = pMain;
                d.stage = stage;
            }

            var renderer = d.renderer;
            var stage = d.stage;
            var pMain = d.pMain;

            // create the root of the scene graph

            // run the render loop
            animate();

            function animate() {
                renderer.render(stage);
                requestAnimationFrame( animate );
            }

            function sizeChanged(params) {
                yScale.range([0, params.height]);
                console.log('params:', params);
                console.log('d.pMain.position:', d.pMain.position);
                console.log('d:', d);
                renderer.resize(params.width, params.height);
                d.pMain.position.x = -params.left;
            }

            for (let i = 0; i < tileData.length; i++) {
                shownTiles[tileData[i].tileId] = true;

                if (!(tileData[i].tileId in d.tileGraphics)) {
                    // we don't have a graphics object for this tile
                    // so we need to create one
                     let newGraphics = new PIXI.Graphics();
                     drawTile(newGraphics, tileData[i]);
                     pMain.addChild(newGraphics)
                     d.tileGraphics[tileData[i].tileId] = newGraphics
                } 
            }

            for (let tileIdStr in d.tileGraphics) {
                if (!(tileIdStr in shownTiles)) {
                    //we're displaying graphics that are no longer necessary,
                    //so we need to get rid of them
                    console.log('removing tile:', tileIdStr);
                    pMain.removeChild(d.tileGraphics[tileIdStr]);
                    delete d.tileGraphics[tileIdStr];
                }
            }

            function zoomChanged(translate, scale) {
                /*
                for (let tileIdStr in d.tileGraphics) {
                    d.tileGraphics[tileIdStr].position.x = translate[0];
                    d.tileGraphics[tileIdStr].scale.x = scale;
                }
                */
                d.pMain.position.x = translate[0];
                d.pMain.scale.x = scale;
            }
        });
    }

    chart.width = function(_) {
        if (!arguments.length) return width;
        else width = _;
        return chart;
    }

    chart.height = function(_) {
        if (!arguments.length) return height;
        else height = _;
        return chart;
    }

    chart.resizeDispatch = function(_) {
        if (!arguments.length) return resizeDispatch;
        else resizeDispatch = _;
        return chart;
    }

    chart.xScale = function(_) {
        if (!arguments.length) return xScale;
        else xScale = _;
        return chart;
    }

    chart.zoomDispatch = function(_) {
        if (!arguments.length) return zoomDispatch;
        else zoomDispatch = _;
        return chart;
    }

    return chart;
}
