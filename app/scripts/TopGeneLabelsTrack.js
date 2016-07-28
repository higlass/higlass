import PIXI from 'pixi.js';
import slugid from 'slugid';
import d3 from 'd3';

export function TopGeneLabelsTrack() {
    let width = 200;
    let height = 15;
    let resizeDispatch = null;
    let xScale = d3.scale.linear();
    let zoomedXScale = d3.scale.linear();
    let zoomDispatch = null;
    let resolution = 256;
    let pixiStage = null;
    let inD = 0;
    let dataDomain = [];

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
            let dataWidth = null;
            let prevTranslate = null;
            let prevScale = null;
            let drawTile = null;
            let tileData = null;
                
            function redrawTile() {
                tileData = d3.select(this).selectAll('.tile-g').data();

                let minVisibleValue = Math.min(...tileData.map((x) => x.importanceRange[0]));
                let maxVisibleValue = Math.max(...tileData.map((x) => x.importanceRange[1]));

                dataWidth = tileData[0].xRange[1] - tileData[0].xRange[0];

                zoomLevel = tileData[0].tilePos[0];
                let tileWidth = (tileData[0].xRange[1] - tileData[0].xRange[0]) / Math.pow(2, zoomLevel);
                let minXRange = Math.min(...tileData.map((x) => x.tileXRange[0]));
                let maxXRange = Math.max(...tileData.map((x) => x.tileXRange[1]));


                if (d.translate != null && d.scale != null) {
                    // change the zoom and scale before redrawing new elements
                    // helps to avoid flickering
                    zoomChanged(d.translate, d.scale);
                }

                let yScale = d3.scale.linear()
                .domain([0, Math.log(maxVisibleValue+1)])
                .range([0, 10]);

                drawTile = function(graphics, tile) {
                    let tileData = tile.data;
                    graphics.clear();


                    let tileWidth = (tile.xRange[1] - tile.xRange[0]) / Math.pow(2, tile.tilePos[0]);
                    // this scale should go from an index in the data array to 
                    // a position in the genome coordinates
                    graphics.lineStyle(0, 0x0000FF, 1);
                    graphics.beginFill(0xFF700B, 1);

                    while (graphics.children[0]) { graphics.removeChild(graphics.children[0]); };
                    console.log('-------------');

                    for (let i = 0; i < tileData.length; i++) {
                        let xPos = zoomedXScale(tileData[i].txStart);

                        let text = new PIXI.Text(tileData[i].geneName, {font:"10px Arial", 
                                                                       fill:"red", 
                                                                       textBaseLine: "middle"});
                        text.anchor.x = 0.5;
                        text.anchor.y = 1;

                        graphics.addChild(text)

                        //let yPos = -(d.height - yScale(tileData[i]));
                        let height = yScale(Math.log(+tileData[i].count+1))
                        let width = yScale(Math.log(+tileData[i].count+1));

                        text.position.x = xPos;
                        text.position.y = yPos + 5;

                        console.log('tileData[i]', tileData[i].geneName, xPos);

                        let yPos = (d.height - height) / 2 ; //-(d.height - yScale(tileData[i]));

                        if (height > 0 && width > 0) {
                            graphics.drawRect(xPos, yPos, width, height);
                        }
                    }
                }

                let shownTiles = {};

                for (let i = 0; i < tileData.length; i++) {
                    shownTiles[tileData[i].tileId] = true;
                    
                    if (tileData[i].tileId in d.tileGraphics) {
                        d.pMain.removeChild(d.tileGraphics[tileData[i].tileId]);
                        delete d.tileGraphics[tileData[i].tileId];
                    }

                    for (let tileIdStr in d.tileGraphics) {
                        if (!(tileIdStr in shownTiles)) {
                            //we're displaying graphics that are no longer necessary,
                            //so we need to get rid of them
                            d.pMain.removeChild(d.tileGraphics[tileIdStr]);
                            delete d.tileGraphics[tileIdStr];
                        }
                    }

                    if (!(tileData[i].tileId in d.tileGraphics)) {
                        // we don't have a graphics object for this tile
                        // so we need to create one
                         let newGraphics = new PIXI.Graphics();
                         drawTile(newGraphics, tileData[i], zoomedXScale);
                         d.pMain.addChild(newGraphics)
                         d.tileGraphics[tileData[i].tileId] = newGraphics
                    } 
                }

            }

            redrawTile.bind(this)();

            let localResizeDispatch = d.resizeDispatch;

            let slugId = d.uid + '.wiggle';
            //let slugId = slugid.nice();
            localResizeDispatch.on('resize.' + slugId, sizeChanged);
            localResizeDispatch.on('close.' + slugId, closeClicked);

            let localZoomDispatch = zoomDispatch == null ? d3.dispatch('zoom') : zoomDispatch;
            localZoomDispatch.on('zoom.' + slugId, zoomChanged);

            function sizeChanged() {
                d.pMain.position.y = d.top;

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

                zoomedXScale = xScale.copy();
                zoomedXScale.domain(xScale.range()
                                          .map(function(x) { return (x - translate[0]) / scale })
                                          .map(xScale.invert))

                if (drawTile != null) {
                    for (let i = 0; i < tileData.length; i++) {
                        let tileGraphics = d.tileGraphics[tileData[i].tileId]
                        drawTile(tileGraphics, tileData[i], zoomedXScale);
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

    chart.width = function(_) {
        if (!arguments.length) return width;
        else width = _;
        return chart;
    }

    chart.dataDomain = function(_) {
        if (!arguments.length) return dataDomain;
        else dataDomain = _;
        return chart;
    }

    return chart;
}
