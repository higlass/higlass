import PIXI from 'pixi.js';
import slugid from 'slugid';
import d3 from 'd3';
import {load1DTileData} from './TileData.js';

export function WigglePixiHeatmap() {
    let width = 200;
    let height = 15;
    let resizeDispatch = null;
    let xScale = d3.scale.linear();
    let zoomedXScale = d3.scale.linear();
    let zoomDispatch = null;
    let resolution = 256;
    let pixiStage = null;
    let inD = 0;

    function tileId(tile) {
        // uniquely identify the tile with a string
        return tile.join(".") + '.' + tile.mirrored;
    }

    let chart = function(selection) {
        selection.each(function(d) {
            inD += 1;

            if (!('resizeDispatch' in d)) {
                d.resizeDispatch = resizeDispatch == null ? d3.dispatch('resize', 'close') : resizeDispatch;
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

            if (!('pMain' in d)) {

                let pMain = new PIXI.Graphics();
                let pAbove = new PIXI.Graphics();
                let pMask = new PIXI.Graphics();

                pMask.beginFill();
                pMask.drawRect(0, 0, 1, 1);
                pMask.endFill();

                pAbove.addChild(pMain);
                pAbove.addChild(pMask);
                d.stage.addChild(pAbove);

                d.pAbove = pAbove;
                d.pMain = pMain;
                d.pMask = pMask;

                pMain.mask = pMask;
            }

            let zoomLevel = null;
            let localXScale = null;
            let prevTranslate = null;
            let prevScale = null;
                
            function redrawTile() {
                let tileData = d3.select(this).selectAll('.tile-g').data();
                let minVisibleValue = Math.min(...tileData.map((x) => x.valueRange[0]));
                let maxVisibleValue = Math.max(...tileData.map((x) => x.valueRange[1]));

                zoomLevel = tileData[0].tilePos[0];
                let tileWidth = (tileData[0].xRange[1] - tileData[0].xRange[0]) / Math.pow(2, zoomLevel);
                let minXRange = Math.min(...tileData.map((x) => x.tileXRange[0]));
                let maxXRange = Math.max(...tileData.map((x) => x.tileXRange[1]));

                localXScale = d3.scale.linear()
                    .range([0, width])
                    .domain([minXRange, minXRange + 2 * tileWidth ]);

                if (d.translate != null && d.scale != null) {
                    // change the zoom and scale before redrawing new elements
                    // helps to avoid flickering
                    zoomChanged(d.translate, d.scale);
                }

                let yScale = d3.scale.linear()
                .domain([0, maxVisibleValue])
                .range([0, 1]);

                let drawTile = function(graphics, tile) {
                    let tileData = load1DTileData(tile.data, tile.type);

                    let tileWidth = (tile.xRange[1] - tile.xRange[0]) / Math.pow(2, tile.tilePos[0]);
                    // this scale should go from an index in the data array to 
                    // a position in the genome coordinates
                    let tileXScale = d3.scale.linear().domain([0, tileData.length])
                    .range([tile.xRange[0] + tile.tilePos[1] * tileWidth, 
                           tile.xRange[0] + (tile.tilePos[1] + 1) * tileWidth]  );

                   // graphics.lineStyle(0, 0x0000FF, 1);
                    //graphics.beginFill(0xFF700B, 1);

                    let color=d3.scale.linear()
                            .domain([0,1])
                            .range(["white","black"]);

                    for (let i = 0; i < tileData.length; i++) {
                        let xPos = localXScale(tileXScale(i));
                        //let yPos = -(d.height - yScale(tileData[i]));
                        let yPos = -1; //-(d.height - yScale(tileData[i]));
                        let height = yScale(tileData[i])
                        let width = localXScale(tileXScale(i+1)) - localXScale(tileXScale(i));

                         graphics.beginFill(color(height).replace("#","0x"), 1);
                        graphics.drawRect(xPos, yPos, width, 1);
                        graphics.endFill();

                        
                    }

                }

                let shownTiles = {};

                for (let tileIdStr in d.tileGraphics) {
                    if (!(tileIdStr in shownTiles)) {
                        //we're displaying graphics that are no longer necessary,
                        //so we need to get rid of them
                        d.pMain.removeChild(d.tileGraphics[tileIdStr]);
                        delete d.tileGraphics[tileIdStr];
                    }
                }

                for (let i = 0; i < tileData.length; i++) {
                    shownTiles[tileData[i].tileId] = true;
                    
                    if (tileData[i].tileId in d.tileGraphics) {
                        d.pMain.removeChild(d.tileGraphics[tileData[i].tileId]);
                        delete d.tileGraphics[tileData[i].tileId];
                    }


                    if (!(tileData[i].tileId in d.tileGraphics)) {
                        // we don't have a graphics object for this tile
                        // so we need to create one
                         let newGraphics = new PIXI.Graphics();
                         drawTile(newGraphics, tileData[i]);
                         d.pMain.addChild(newGraphics)
                         d.tileGraphics[tileData[i].tileId] = newGraphics
                    } 
                }

            }

            redrawTile.bind(this)();

            let localResizeDispatch = d.resizeDispatch;

            let slugId = d.uid + '.heatmap';
            //let slugId = slugid.nice();
            localResizeDispatch.on('resize.' + slugId, sizeChanged);
            localResizeDispatch.on('close.' + slugId, closeClicked);

            let localZoomDispatch = zoomDispatch == null ? d3.dispatch('zoom') : zoomDispatch;
            localZoomDispatch.on('zoom.' + slugId, zoomChanged);

            function sizeChanged() {
                d.pMain.position.y = d.top;
                d.pMain.scale.y = -d.height;

                d.pMask.position.x = d.left;
                d.pMask.position.y = d.top;

                d.pMask.scale.x = d.width;
                d.pMask.scale.y = d.height;
            }

            function closeClicked() {
                localZoomDispatch.on('zoom.' + slugId, () => {});
                localResizeDispatch.on('resize.' + slugId, () => {});
                localResizeDispatch.on('close.' + slugId, () => {});
                d.stage.removeChild(d.pMain);
                delete d.pMain;
            }

            function zoomChanged(translate, scale) {
                sizeChanged();

                d.translate = translate;
                d.scale = scale;

                let scaleModifier = (localXScale.domain()[1] - localXScale.domain()[0]) / (xScale.domain()[1] - xScale.domain()[0])
                let newStart = localXScale.domain()[0]
                let xWidth = xScale.domain()[1] - xScale.domain()[0]
                zoomedXScale = xScale.copy();
                let zoomedLocalScale = localXScale.copy();
                let newScale = scale * scaleModifier;

                zoomedXScale.domain(xScale.range()
                                          .map(function(x) { return (x - translate[0]) / scale })
                                          .map(xScale.invert))

                d.pMain.position.x =  zoomedXScale(newStart);
                d.pMain.scale.x = newScale;
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

    chart.width = function(_) {
        if (!arguments.length) return width;
        else width = _;
        return chart;
    }

    return chart;
}
