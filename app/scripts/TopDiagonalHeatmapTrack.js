import {heatedObjectMap} from './colormaps.js';
import PIXI from 'pixi.js';
import slugid from 'slugid';
import d3 from 'd3';
import {workerProcess2DTile} from './worker.js';
import {WorkerPool} from './WorkerPool.js';

export function TopDiagonalHeatmapRectangleTrack() {
    let width = 200;
    let height = 15;
    let resizeDispatch = null;

    let xScale = d3.scale.linear();
    let yScale = d3.scale.linear();

    let zoomedXScale = d3.scale.linear();
    let zoomDispatch = null;
    let resolution = 256;
    let pixiStage = null;
    let inD = 0;
    let dataDomain = [];
    let transferFunction = (count) => count > 0 ? Math.log2(1 + Math.log2(1 + count)) : 0;
    let valueScale = d3.scale.linear()
                    .range([255,0]);
    let threadPool = null;

    let workerPool = new WorkerPool('scripts/worker.js', 2);

    /*
    let worker = new Worker('scripts/worker.js');
    worker.postMessage = worker.webkitPostMessage || worker.postMessage;

        worker.addEventListener('message', function(e) {
            //should only ever receive a message in the event that workerSetPix completed;
            tileDataLoaded(e.data.shownTileId, e.data.tile, e.data.pixData)
        }, false);
        */

    function tileId(tile) {
        // uniquely identify the tile with a string
        return tile.join(".") + '.' + tile.mirrored;
    }

    function tileDataToCanvas(pixData, minVisibleValue, maxVisibleValue) {
        let canvas = document.createElement('canvas');
        let t1 =  new Date().getTime();

        canvas.width = 256;
        canvas.height = 256;

        let ctx = canvas.getContext('2d');

        ctx.fillStyle = 'transparent';
        ctx.fillRect(0,0,canvas.width, canvas.height);

        let pix = new ImageData(pixData, canvas.width, canvas.height);

        ctx.putImageData(pix, 0,0);

        return canvas;
    }

    function countTransform(count) {
        return Math.sqrt(Math.sqrt(count + 1));
    }

    function allIn(set1, set2) {
        //check if all the keys in set1 are in set2
        for (let key1 in set1)
            if (!(key1 in set2)) return false;
        return true;
    }

    function setSpriteProperties(sprite, tile) {
        let zoomLevel = tile.tilePos[0], xTilePos = tile.tilePos[1], yTilePos = tile.tilePos[2];

        let totalWidth = tile.xRange[1] - tile.xRange[0];
        let totalHeight = tile.xRange[1] - tile.xRange[0];


        let minX = tile.xRange[0];
        let minY = tile.yRange[0];

        let tileWidth = totalWidth / Math.pow(2, zoomLevel);
        let tileHeight = totalHeight / Math.pow(2, zoomLevel);

        let tileX = minX + xTilePos * tileWidth;
        let tileY = minY + yTilePos * tileHeight;

        let tileEndX = minX + (xTilePos+1) * tileWidth;
        let tileEndY = minY + (yTilePos+1) * tileHeight;

        let spriteWidth = tile.xOrigScale(tileEndX) - tile.xOrigScale(tileX) ;
        let spriteHeight = tile.yOrigScale(tileEndY) - tile.yOrigScale(tileY)

            // this is a mirrored tile that represents the other half of a 
            // triangular matrix
            sprite.x = tile.xOrigScale(tileX);
            sprite.y = tile.yOrigScale(tileY);

            sprite.width = spriteHeight;
            sprite.height = spriteWidth;
    }

    let chart = function(selection) {
        selection.each(function(d) {
            let currentTranslate = [0,0], currentScale = 1;
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
                d.pMain.position.y = d.top + d.height * (1 - currentScale);
            }

            if (!('rendering' in d)) {
                d.rendering = {};
            }

            let zoomLevel = null;
            let localXScale = null;
            let dataWidth = null;
            let prevTranslate = null;
            let prevScale = null;

            let minVisibleValue = null;
            let maxVisibleValue = null;

            function redrawTile() {
                let tiles = d3.select(this).selectAll('.tile-g').data();

                let prevMinVisibleValue = minVisibleValue;
                let prevMaxVisibleValue = maxVisibleValue;

                minVisibleValue = Math.min( ...tiles.map((x) => x.valueRange[0]));
                maxVisibleValue = Math.max( ...tiles.map((x) => x.valueRange[1]));


                let visibleTiles = {};

                function createShownTileId(tileId) {
                    return tileId + '.' + minVisibleValue + '.' + maxVisibleValue;
                }

                for (let i = 0; i < tiles.length; i++) {
                   visibleTiles[createShownTileId(tiles[i].tileId)] = true; 
                }

                function removeAllGraphicsExcept(tileIdsToKeep) {
                    // remove all graphics objects except the ones specified
                    for (let tileIdStr in d.tileGraphics) {
                        if (!(tileIdStr in tileIdsToKeep)) {
                            d.pMain.removeChild(d.tileGraphics[tileIdStr]);
                            delete d.tileGraphics[tileIdStr];
                        }
                    }

                }

                function tileDataLoaded(shownTileId, tile, pixData) {
                    let canvas = tileDataToCanvas(pixData,  minVisibleValue, maxVisibleValue);

                    delete d.rendering[shownTileId];
                    let numRendering = Object.keys(d.rendering).length;

                    if (shownTileId in visibleTiles) {

                        tile.xOrigScale = d3.scale.linear().domain(tile.xOrigDomain).range(tile.xOrigRange);
                        tile.yOrigScale = d3.scale.linear().domain(tile.yOrigDomain).range(tile.yOrigRange);

                        console.log('tile.xOrigScale', tile.xOrigScale.domain(), tile.xOrigScale.range());

                        // tile isn't loaded into a pixi graphics container
                        // load that sucker
                        let newGraphics = new PIXI.Graphics();
                        let sprite = null;

                        if (tile.tilePos[0] == tile.maxZoom) {
                            sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(canvas, PIXI.SCALE_MODES.NEAREST));
                        } else {
                            sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(canvas));
                        }
                        setSpriteProperties(sprite, tile);

                        newGraphics.addChild(sprite);
                        if (shownTileId in d.tileGraphics) {
                            console.log("LOADING duplicate tile");
                        }


                        newGraphics.scale.y = 1 / Math.sqrt(2);
                        newGraphics.scale.x = -1 / Math.sqrt(2);
                        newGraphics.rotation = -3 * Math.PI / 4;
                        //newGraphics.position.y = d.height;
                        newGraphics.position.y = 0;
                        d.tileGraphics[shownTileId] = newGraphics;


                        d.pMain.addChild(newGraphics);

                    }

                    if (!numRendering && allIn(visibleTiles, d.tileGraphics)) {
                        // only clear out graphics when we're done rendering
                        removeAllGraphicsExcept(visibleTiles);
                    }
                }

                for (let i = 0; i < tiles.length; i++) {

                    // check if we already have graphics for these tiles
                    if (!(createShownTileId(tiles[i].tileId) in d.tileGraphics) && 
                        !(createShownTileId(tiles[i].tileId) in d.rendering)) {
                        let tileWidth = 256;

                        d.rendering[createShownTileId(tiles[i].tileId)] = true;
                        //let tileData = loadTileData(tiles[i].data);
                        //let pixData = setPix(tileWidth * tileWidth, tileData, minVisibleValue, maxVisibleValue);
                        let workerObj = {'shownTileId': createShownTileId(tiles[i].tileId),
                                                      'tile': { 'data': tiles[i].data.buffer.slice(0),
                                                      'mirrored': tiles[i].mirrored,
                                                      'uid': d.uid + '.thread',
                                                      'type': tiles[i].type,
                                                      'dataLength': tiles[i].data.length,
                                                      'tileId': tiles[i].tileId,
                                                      'tilePos': tiles[i].tilePos,
                                                      'xRange': tiles[i].xRange,
                                                      'yRange': tiles[i].yRange,
                                                      'maxZoom': tiles[i].maxZoom,
                                                      'xOrigDomain': tiles[i].xOrigScale.domain(),
                                                      'xOrigRange': tiles[i].xOrigScale.range(),
                                                      'yOrigDomain': tiles[i].yOrigScale.domain(),
                                                      'yOrigRange': tiles[i].yOrigScale.range() },
                            minVisibleValue: minVisibleValue, maxVisibleValue: maxVisibleValue}
                        //worker.postMessage(workerObj, [workerObj.tile.data]);
                        workerPool.submitMessage(workerObj, [workerObj.tile.data], function(e) {
                            tileDataLoaded(e.data.shownTileId, e.data.tile, e.data.pixData);
                        })
                    } else {

                    }
                }
            }

            redrawTile.bind(this)();

            let localResizeDispatch = d.resizeDispatch;

            let slugId = d.uid + '.top_diagonal';
            //let slugId = slugid.nice();
            localResizeDispatch.on('resize.' + slugId, sizeChanged);
            localResizeDispatch.on('close.' + slugId, closeClicked);

            let localZoomDispatch = zoomDispatch == null ? d3.dispatch('zoom') : zoomDispatch;
            localZoomDispatch.on('zoom.' + slugId, zoomChanged);

            function sizeChanged() {
                d.pMask.position.x = d.left;
                d.pMask.position.y = d.top + d.height * (1 - currentScale);

                d.pMask.scale.x = d.width;
                d.pMask.scale.y = d.height;

                console.log('d.pMask.position', d.pMask.position.x, d.pMask.position.y);
            }

            function closeClicked() {
                localZoomDispatch.on('zoom.' + slugId, () => {});
                localResizeDispatch.on('resize.' + slugId, () => {});
                localResizeDispatch.on('close.' + slugId, () => {});
                d.stage.removeChild(d.pMain);
                delete d.pMain;
            }

            function zoomChanged(translate, scale) {
                currentTranslate = translate;
                currentScale = scale;

                d.pMain.position.x =  translate[0];
                d.pMain.position.y = d.top + d.height * (1 - scale)//#translate[1];
                d.pMain.scale.x = scale;
                d.pMain.scale.y = scale;
            }

            sizeChanged();
            if (d.translate != null && d.scale != null) {
                // change the zoom and scale before redrawing new elements
                // helps to avoid flickering
                zoomChanged(d.translate, d.scale);
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

    chart.yScale = function(_) {
        if (!arguments.length) return yScale;
        else yScale = _;
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

    chart.threadPool = function(_) {
        if (!arguments.length) return threadPool;
        else threadPool = _;
        return chart;
    }

    return chart;
}
