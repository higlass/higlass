import PIXI from 'pixi.js';
import slugid from 'slugid';
import d3 from 'd3';
import {load1DTileData} from './TileData.js';

export function WigglePixiLine() {
    let width = 200;//200
    let height = 15;//15
    let resizeDispatch = null;
    let xScale = d3.scale.linear();
    let zoomDispatch = null;
    let resolution = 256;
    let pixiStage = null;
    var xPoints;
    var yPoints;
    var tileIDs;
    var shownT = {};
    var preScale = 1; 
    let zoomedXScale = d3.scale.linear();

    function tileId(tile) {
        // uniquely identify the tile with a string
        return tile.join(".") + '.' + tile.mirrored;
    }

    let chart = function(selection) {
        selection.each(function(d) {
            if (!('resizeDispatch' in d)) {
                d.resizeDispatch = resizeDispatch == null ? d3.dispatch('resize') : resizeDispatch;
            }

            if (!('translate' in d)) {
                d.translate = [0,0];
            }

            if (!('scale' in d)) {
                d.scale = 1;
            }

            if (!('tileGraphics' in d)) {
                d.tileGraphics = {};
            }

            if (!('pixiStage' in d)) {
                d.stage = pixiStage; 
            }

            if (!('preHeight' in d)) {
                d.preHeight = d.height; 
            }

            if (!('pMain' in d)) {

                let pMain = new PIXI.Graphics();
                let pAbove = new PIXI.Graphics();
                let pMask = new PIXI.Graphics();
                let pAxis = new PIXI.Graphics();

                pMask.beginFill();
                pMask.drawRect(0, 0, 1, 1);
                pMask.endFill();

                pAbove.addChild(pMain);
                pAbove.addChild(pAxis);
                pAbove.addChild(pMask);
                d.stage.addChild(pAbove);

                d.pAbove = pAbove;
                d.pAxis = pAxis;
                d.pMain = pMain;
                d.pMask = pMask;

                pMain.mask = pMask;


            }

            if (!('maxText' in d)) {
                d.maxText = new PIXI.Text("", {font: '8px Arial', fill: "black"});
                d.maxTextBg = new PIXI.Graphics();

                d.pAxis.addChild(d.maxText);
                d.pAxis.addChild(d.maxTextBg);
            }

            if (!('minText' in d)) {
                d.minText = new PIXI.Text("", {font: '8px Arial', fill: "black"});
                d.minTextBg = new PIXI.Graphics();

                d.pAxis.addChild(d.minText);
                d.pAxis.addChild(d.minTextBg);
            }

            
            let zoomLevel = null;
            let drawTile = null;
            let drawAxis = null;
            let allTiles = null;

            function redrawTile() {
                allTiles = d3.select(this).selectAll('.tile-g').data();

                let minVisibleValue = Math.min(...allTiles.map((x) => x.valueRange[0]));
                let maxVisibleValue = Math.max(...allTiles.map((x) => x.valueRange[1]));

                if (allTiles.length == 0)
                    return;

                zoomLevel = allTiles[0].tilePos[0];
                let tileWidth = (allTiles[0].xRange[1] - allTiles[0].xRange[0]) / Math.pow(2, zoomLevel);
                let minXRange = Math.min(...allTiles.map((x) => x.tileXRange[0]));
                let maxXRange = Math.max(...allTiles.map((x) => x.tileXRange[1]));

                let yScale = d3.scale.linear()
                .domain([0, maxVisibleValue])
                .range([0, 1]);

                if (d.translate != null && d.scale != null) {
                    // change the zoom and scale before redrawing new elements
                    // helps to avoid flickering
                    zoomChanged(d.translate, d.scale);
                }

                d.pAxis.removeChild(d.maxTextBg);
                d.pAxis.removeChild(d.minTextBg);

                d.maxTextBg = new PIXI.Graphics();
                d.minTextBg = new PIXI.Graphics();

                d.pAxis.addChild(d.maxTextBg);
                d.pAxis.addChild(d.minTextBg);

                d.maxTextBg.beginFill(0xFFFFFF,1);
                d.minTextBg.beginFill(0xFFFFFF,1);
                //d.maxTextBg.drawRect(0, 0, 30, 9);
                

                d.pAxis.removeChild(d.maxText);
                d.pAxis.removeChild(d.minText);

                let format = d3.format(".2s")

                d.maxText = new PIXI.Text(format(maxVisibleValue), {font: '9px Arial', fill: "black"});

                d.maxText.anchor.x = 0;
                d.maxText.anchor.y = 0;

                d.maxText.position.x = d.left + 0;
                d.maxText.position.y = 0;

                d.pAxis.addChild(d.maxText);
                let bounds = d.maxText.getBounds();
                d.maxTextBg.drawRect(d.left + bounds.x, bounds.y, bounds.width, bounds.height);

                d.minText = new PIXI.Text(format(minVisibleValue), {font: '9px Arial', fill: "black"});

                d.minText.anchor.x = 0;
                d.minText.anchor.y = 1;

                d.minText.position.x = d.left + 0;
                d.minText.position.y = d.height;

                d.pAxis.addChild(d.minText);

                bounds = d.minText.getBounds();
                d.minTextBg.drawRect(d.left + bounds.x, bounds.y + d.height, bounds.width, bounds.height);


                drawTile = function(graphics, tile) {
                    let tileData = load1DTileData(tile.data, tile.type);
                    graphics.clear();

                    let tileWidth = (tile.xRange[1] - tile.xRange[0]) / Math.pow(2, tile.tilePos[0]);
                    // this scale should go from an index in the data array to 
                    // a position in the genome coordinates
                    let tileXScale = d3.scale.linear().domain([0, tileData.length])
                    .range([tile.xRange[0] + tile.tilePos[1] * tileWidth, 
                           tile.xRange[0] + (tile.tilePos[1] + 1) * tileWidth]  );

                    graphics.lineStyle(1, 0x0000FF, 1);
                   // graphics.beginFill(0xFF700B, 1);
                    let j = 0;

                    for (let i = 0; i < tileData.length; i++) {


                        let xPos = zoomedXScale(tileXScale(i));
                        let height = yScale(tileData[i])
                        let width = zoomedXScale(tileXScale(i+1)) - zoomedXScale(tileXScale(i));

                       if(j == 0){
                            graphics.moveTo(xPos, d.height - d.height*height);
                            j++;
                        }
                        graphics.lineTo(zoomedXScale(tileXScale(i+1)), d.height - d.height*yScale(tileData[i+1]));
                    }
                }

                let shownTiles = {};

                for (let i = 0; i < allTiles.length; i++) {
                    shownTiles[allTiles[i].tileId] = true;
                    
                    if (allTiles[i].tileId in d.tileGraphics) {
                        d.pMain.removeChild(d.tileGraphics[allTiles[i].tileId]);
                        delete d.tileGraphics[allTiles[i].tileId];
                    }

                    for (let tileIdStr in d.tileGraphics) {
                        if (!(tileIdStr in shownTiles)) {
                            //we're displaying graphics that are no longer necessary,
                            //so we need to get rid of them
                            d.pMain.removeChild(d.tileGraphics[tileIdStr]);
                            delete d.tileGraphics[tileIdStr];
                        }
                    }

                    if (!(allTiles[i].tileId in d.tileGraphics)) {
                        // we don't have a graphics object for this tile
                        // so we need to create one
                         let newGraphics = new PIXI.Graphics();
                         drawTile(newGraphics, allTiles[i]);
                         d.pMain.addChild(newGraphics)
                         d.tileGraphics[allTiles[i].tileId] = newGraphics
                    } 
                }

            }

            redrawTile.bind(this)();

            let localResizeDispatch = d.resizeDispatch;

            let slugId = d.uid + '.line';
            localResizeDispatch.on('resize.' + slugId, sizeChanged);

            let localZoomDispatch = zoomDispatch == null ? d3.dispatch('zoom') : zoomDispatch;
            localZoomDispatch.on('zoom.' + slugId, zoomChanged);

            function sizeChanged() {
                d.pMain.position.y = d.top;
                d.pAxis.position.y = d.top;
            //    d.pMain.scale.y = d.height;
                if(d.preHeight != d.height){
                    if (drawTile != null) {
                        for (let i = 0; i < allTiles.length; i++) {
                            let tileGraphics = d.tileGraphics[allTiles[i].tileId]
                            drawTile(tileGraphics, allTiles[i], zoomedXScale);
                        }
                    }
                }
                d.preHeight = d.height;

                d.pMask.position.x = d.left;
                d.pMask.position.y = d.top;

                d.pMask.scale.x = d.width;
                d.pMask.scale.y = d.height;
            }

            function zoomChanged(translate, scale) {
                sizeChanged();

                d.translate = translate;
                d.scale = scale;

                zoomedXScale.range(xScale.range());
                zoomedXScale.domain(xScale.range()
                                          .map(function(x) { return (x - translate[0]) / scale })
                                          .map(xScale.invert))

                if (drawTile != null) {
                    for (let i = 0; i < allTiles.length; i++) {
                        let tileGraphics = d.tileGraphics[allTiles[i].tileId]
                        drawTile(tileGraphics, allTiles[i], zoomedXScale);
                    }
                }
            }

            sizeChanged();
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

    chart.pixiStage = function(_) {
        if (!arguments.length) return pixiStage;
        else pixiStage = _;
        return chart;
    }

    return chart;
}
