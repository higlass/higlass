import PIXI from 'pixi.js';
import slugid from 'slugid';
import d3 from 'd3';

export function WigglePixiTrack() {
    let width = 200;
    let height = 15;
    let resizeDispatch = null;
    let xScale = d3.scale.linear();

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
            let localResizeDispatch = resizeDispatch == null ? d3.dispatch('resize') :
                resizeDispatch;
            let slugId = slugid.nice();
            localResizeDispatch.on('resize.' + slugId, sizeChanged);

            if (!('tileGraphics' in d)) {
                d.tileGraphics = {};
            }

            let tileData = d3.select(this).selectAll('.tile-g').data();
            let shownTiles = {};

            console.log('tileData:', tileData);

            let minVisibleValue = Math.min(...tileData.map((x) => x.valueRange[0]));
            let maxVisibleValue = Math.max(...tileData.map((x) => x.valueRange[1]));

            console.log('minVisibleValue', minVisibleValue);
            console.log('maxVisibleValue', maxVisibleValue);

            let yScale = d3.scale.linear()
            .domain([0, maxVisibleValue])
            .range([0, d.height]);

            let drawTile = function(graphics, tile) {
                let tileData = loadTileData(tile.data);
                console.log('tileData:', tileData);

                let tileWidth = (tile.xRange[1] - tile.xRange[0]) / Math.pow(2, tile.tilePos[0]);
                // this scale should go from an index in the data array to 
                // a position in the genome coordinates
                let tileXScale = d3.scale.linear().domain([0, tileData.length])
                .range([tile.xRange[0] + tile.tilePos[1] * tileWidth, 
                       tile.xRange[0] + (tile.tilePos[1] + 1) * tileWidth]  );

                console.log('tileWidth:', tileWidth);

                graphics.lineStyle(2, 0x0000FF, 1);
                graphics.beginFill(0xFF700B, 1);

                for (let i = 0; i < tileData.length; i++) {
                    let xPos = xScale(tileXScale(i));
                    let yPos = d.height - yScale(tileData[i]);
                    let height = yScale(tileData[i])
                    let width = xScale(tileXScale(i+1)) - xScale(tileXScale(i));

                    if (height > 0 && width > 0) {
                        console.log('drawRect', xPos, yPos, width, height);
                        graphics.drawRect(xPos, yPos, width, height);
                    }
                }
            }


            console.log('WigglePixiTrack', d);
            let tiles = d3.select(this).selectAll('.tile-g');

            console.log('tiles:', tiles, tiles.data());

            width = d.width;
            height = d.height;

            console.log('this:', d3.select(this));
            d3.select(this).on('resize', function(e) {
                console.log('resize:', e);
            });
            
            d3.select(this).selectAll('canvas')
            .data([1])
            .enter()
            .append('canvas');

            let canvas = d3.select(this).selectAll('canvas');

            var renderer = PIXI.autoDetectRenderer(d.width, d.height, { antialias: true,
            view: canvas.node() });

            // create the root of the scene graph
            var stage = new PIXI.Container();

            stage.interactive = true;

            var graphics = new PIXI.Graphics();
            var pMain = new PIXI.Graphics();

            /*
            // set a fill and line style
            graphics.beginFill(0xFF3300);
            graphics.lineStyle(4, 0xffd900, 1);

            // draw a shape
            graphics.moveTo(50,50);
            graphics.lineTo(250, 50);
            graphics.lineTo(100, 100);
            graphics.lineTo(50, 50);
            graphics.endFill();

            // set a fill and a line style again and draw a rectangle
            graphics.lineStyle(2, 0x0000FF, 1);
            graphics.beginFill(0xFF700B, 1);
            graphics.drawRect(50, 250, 120, 120);

            // draw a rounded rectangle
            graphics.lineStyle(2, 0xFF00FF, 1);
            graphics.beginFill(0xFF00BB, 0.25);
            graphics.drawRoundedRect(150, 450, 300, 100, 15);
            graphics.endFill();

            // draw a circle, set the lineStyle to zero so the circle doesn't have an outline
            graphics.lineStyle(0);
            graphics.beginFill(0xFFFF0B, 0.5);
            graphics.drawCircle(470, 90,60);
            graphics.endFill();
            */

            stage.addChild(graphics);
            stage.addChild(pMain);

            // run the render loop
            animate();

            function animate() {
                renderer.render(stage);
                requestAnimationFrame( animate );
            }

            function sizeChanged(params) {
                console.log('resizing renderer', params);
                yScale.range([0, params.height]);
                renderer.resize(params.width, params.height);
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
                    pMain.removeChild(d.tileGraphics[tileIdStr]);
                    delete d.tileGraphics[tileIdStr];
                }
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

    return chart;
}
