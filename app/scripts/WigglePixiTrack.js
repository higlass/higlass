import PIXI from 'pixi.js';
import slugid from 'slugid';
import d3 from 'd3';

export function WigglePixiTrack() {
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
                d.stage.addChild(pMain);

                d.pMain = pMain;

            }

            let zoomLevel = null;
            let localXScale = null;
            let dataWidth = null;
            let prevTranslate = null;
            let prevScale = null;
                
            function redrawTile() {
                let tileData = d3.select(this).selectAll('.tile-g').data();
                let minVisibleValue = Math.min(...tileData.map((x) => x.valueRange[0]));
                let maxVisibleValue = Math.max(...tileData.map((x) => x.valueRange[1]));

                dataWidth = tileData[0].xRange[1] - tileData[0].xRange[0];

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
                        //console.log('tileXScale(i)', tileXScale(i), localXScale.domain());
                        let xPos = localXScale(tileXScale(i));
                        //let yPos = -(d.height - yScale(tileData[i]));
                        let yPos = -1; //-(d.height - yScale(tileData[i]));
                        let height = yScale(tileData[i])
                        let width = localXScale(tileXScale(i+1)) - localXScale(tileXScale(i));

                        if (height > 0 && width > 0) {
                            graphics.drawRect(xPos, yPos, width, height);
                        }
                    }

                }

                let shownTiles = {};

                console.log('redrawing tile');
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
                         drawTile(newGraphics, tileData[i]);
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
                d.pMain.scale.y = -d.height;
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

                console.log('newStart:', newStart);

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

    chart.dataDomain = function(_) {
        if (!arguments.length) return dataDomain;
        else dataDomain = _;
        return chart;
    }

    return chart;
}
