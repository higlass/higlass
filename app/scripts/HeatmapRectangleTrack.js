import {heatedObjectMap} from './colormaps.js';
import PIXI from 'pixi.js';
import slugid from 'slugid';
import d3 from 'd3';

export function HeatmapRectangleTrack() {
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

    function tileId(tile) {
        // uniquely identify the tile with a string
        return tile.join(".") + '.' + tile.mirrored;
    }

    function loadTileData(tile_value) {
        let t1 = new Date().getTime();
        if ('dense' in tile_value)
            return tile_value['dense'];
        else if ('sparse' in tile_value) {
            let values = Array.apply(null, 
                    Array(resolution * resolution)).map(Number.prototype.valueOf, 0);

            for (let i = 0; i < tile_value.sparse.length; i++) {

                if ('pos' in tile_value.sparse[i]) {
                    values[tile_value.sparse[i].pos[1] * resolution +
                        tile_value.sparse[i].pos[0]] = tile_value.sparse[i].value;
                } else {
                    let x = tile_value.sparse[i][0];
                    values[tile_value.sparse[i][0][1] * resolution +
                        tile_value.sparse[i][0][0]] = tile_value.sparse[i][1];

                }
            }

            return values;


        } else {
            return [];
        }

    }

    function tileDataToCanvas(data, minVisibleValue, maxVisibleValue) {
        let canvas = document.createElement('canvas');

        canvas.width = 256;
        canvas.height = 256;

        let ctx = canvas.getContext('2d');

        ctx.fillStyle = 'transparent';
        ctx.fillRect(0,0,canvas.width, canvas.height);

        let pix = ctx.createImageData(canvas.width, canvas.height);
        pix = setPix(pix, data, minVisibleValue, maxVisibleValue);
        ctx.putImageData(pix, 0,0);

        return canvas;
    }

    function countTransform(count) {
        return Math.sqrt(Math.sqrt(count + 1));
    }

    function setPix(pix, data, minVisibleValue, maxVisibleValue) {
        valueScale.domain([countTransform(minVisibleValue), countTransform(maxVisibleValue)])
        let t1 = new Date().getTime();

        try {
            let t1 = new Date().getTime();
            for (let i = 0; i < data.length; i++) {
                let d = data[i];
                let ct = countTransform(d);

                let rgbIdx = Math.max(0, Math.min(255, Math.floor(valueScale(ct))))
                let rgb = heatedObjectMap[rgbIdx];


                pix.data[i*4] = rgb[0];
                pix.data[i*4+1] = rgb[1];
                pix.data[i*4+2] = rgb[2];
                pix.data[i*4+3] = rgb[3];
            };
        } catch (err) {

            console.log('ERROR:', err);

        }

        return pix;
    }

    function setSpriteProperties(sprite, tile) {
        console.log('tile:', tile);
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

            sprite.width = tile.xOrigScale(tileEndX) - tile.xOrigScale(tileX)
            sprite.height = tile.yOrigScale(tileEndY) - tile.yOrigScale(tileY)

            if (tile.mirrored) {
                // this is a mirrored tile that represents the other half of a 
                // triangular matrix
                sprite.x = xOrigScale(tileY);
                sprite.y = yOrigScale(tileX);

                sprite.pivot = [xOrigScale.range()[1] / 2, yOrigScale.range()[1] / 2];
                sprite.rotation = -Math.PI / 2;
                sprite.scale.x *= -1;

                sprite.width = spriteHeight;
                sprite.height = spriteWidth;
            } else {
                sprite.x = tile.xOrigScale(tileX);
                sprite.y = tile.yOrigScale(tileY);

                console.log('sprite.x:', sprite.x, 'sprite.y:', sprite.y)
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

                let shownTiles = {};

                for (let i = 0; i < tiles.length; i++) {
                    let tileData = loadTileData(tiles[i].data);
                    shownTiles[tiles[i].tileId] = true;

                    if (prevMinVisibleValue != minVisibleValue || prevMaxVisibleValue != maxVisibleValue) {
                        // we need to rescale our data which means redrawing it...
                        // and redrawing it means removing the graphics we have for it
                        let tileIdStr = tiles[i].tileId;
                        if (tileIdStr in d.tileGraphics) {
                            d.pMain.removeChild(d.tileGraphics[tileIdStr]);
                            delete d.tileGraphics[tileIdStr];
                        }
                    }

                    // check if we already have graphics for these tiles
                    if (!(tiles[i].tileId in d.tileGraphics)) {
                        // tile isn't loaded into a pixi graphics container
                        // load that sucker
                        let newGraphics = new PIXI.Graphics();

                        let canvas = tileDataToCanvas(tileData,  minVisibleValue, maxVisibleValue);
                        let sprite = null;

                        if (tiles[i].tilePos == tiles[i].maxZoom) {

                            sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(canvas, PIXI.SCALE_MODES.NEAREST));
                        } else {
                            sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(canvas));
                        }
                        //let sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(canvas));

                        setSpriteProperties(sprite, tiles[i]);
                         /*  newGraphics.lineStyle(2, 0x0000FF, 1);
                                newGraphics.moveTo(sprite.x, sprite.y);
                                newGraphics.lineTo(sprite.x+sprite.width, sprite.y);
                                newGraphics.lineTo(sprite.x+sprite.width, sprite.y+sprite.height);
                                newGraphics.lineTo(sprite.x, sprite.y+sprite.height);
                                newGraphics.lineTo(sprite.x, sprite.y);*/
                        

                        newGraphics.addChild(sprite);
                        d.tileGraphics[tiles[i].tileId] = newGraphics;

                        d.pMain.addChild(newGraphics);
                    } else {

                    }
                }

                for (let tileIdStr in d.tileGraphics) {
                    if (!(tileIdStr in shownTiles)) {
                        d.pMain.removeChild(d.tileGraphics[tileIdStr]);
                        delete d.tileGraphics[tileIdStr];
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
                //console.log('d.top:', d.top)
                /*
                d.pMain.position.y = d.top;
                d.pMain.scale.y = -d.height;
                */
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

                d.pMain.position.x =  translate[0];
                d.pMain.position.y = translate[1];
                d.pMain.scale.x = scale;
                d.pMain.scale.y = scale;
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

    return chart;
}
