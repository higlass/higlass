import PIXI from 'pixi.js';
import slugid from 'slugid';
import d3 from 'd3';

export function WigglePixiLine() {
    let width = 200;//200
    let height = 15;//15
    let resizeDispatch = null;
    let xScale = d3.scale.linear();
    let zoomDispatch = null;
    let resolution = 256;
    let pixiStage = null;
    let inD = 0;
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

            if (!('pMain' in d)) {

                let pMain = new PIXI.Graphics();
                d.stage.addChild(pMain);

                d.pMain = pMain;

            }
            
            let localXScale = null;
            let zoomLevel = null;

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

                let yScale = d3.scale.linear()
                .domain([0, maxVisibleValue])
                .range([0, 1]);

                if (d.translate != null && d.scale != null) {
                    // change the zoom and scale before redrawing new elements
                    // helps to avoid flickering
                    zoomChanged(d.translate, d.scale);
                }

                
                let reset = function(){
                    xPoints = [];
                    yPoints = [];
                    tileIDs = [];
                }
                

                let drawTile = function(graphics, tile) {

                    let tileData = loadTileData(tile.data);

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


                        let xPos = localXScale(tileXScale(i));
                        //let yPos = -(d.height - yScale(tileData[i]));
                        let yPos = -1; //-(d.height - yScale(tileData[i]));
                        let height = yScale(tileData[i])
                        let width = localXScale(tileXScale(i+1)) - localXScale(tileXScale(i));

                       // if (height > 0 && width > 0) {
                         //   graphics.drawRect(xPos, yPos, width, height);
                       // }
                       xPoints.push(xPos);
                       yPoints.push(50 - 50*height);

                       if(j == 0){
                            graphics.moveTo(xPos*d.scale, 50 - 50*height);
                            j++;
                        }

                        graphics.lineTo(localXScale(tileXScale(i+1))*d.scale, 50 - 50*yScale(tileData[i+1]));
                    }
                }

                let shownTiles = {};
                shownT = {};
                let k = 0;
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
                    shownT[tileData[i].tileId] = true;

                    if (tileData[i].tileId in d.tileGraphics) {
                        d.pMain.removeChild(d.tileGraphics[tileData[i].tileId]);
                        delete d.tileGraphics[tileData[i].tileId];
                    }

                    if (!(tileData[i].tileId in d.tileGraphics)) {
                        // we don't have a graphics object for this tile
                        // so we need to create one
                        
                        if(k == 0){
                           reset();
                           k++; 
                        }
                         
                         let newGraphics = new PIXI.Graphics();
                         drawTile(newGraphics, tileData[i]);
                         d.pMain.addChild(newGraphics);
                         tileIDs.push(tileData[i].tileId);
                         d.tileGraphics[tileData[i].tileId] = newGraphics
                    } 
                }

            }

            redrawTile.bind(this)();

            let localResizeDispatch = d.resizeDispatch;

            let slugId = slugid.nice();
            localResizeDispatch.on('resize.' + slugId, sizeChanged);

            let localZoomDispatch = zoomDispatch == null ? d3.dispatch('zoom') : zoomDispatch;
            localZoomDispatch.on('zoom.' + slugId, zoomChanged);

            function sizeChanged() {
                d.pMain.position.y = d.top;
            //    d.pMain.scale.y = d.height;
            }

            function zoomChanged(translate, scale) {

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


                console.log('scale:', d.pMain.scale.x);
                d.pMain.clear();

                let divider = 1000;
                if(scale > 8){
                    divider = 100;
                }

                if(Math.round(preScale*divider) != Math.round(scale*divider)){
                    // stretch a little before redrawing

                    d.pMain.scale.x = 1;
                    for (let tileIdStr in d.tileGraphics) {
                        if ((tileIdStr in shownT)) {
                            //we're displaying graphics that are no longer necessary,
                            //so we need to get rid of them
                            d.pMain.removeChild(d.tileGraphics[tileIdStr]);
                            delete d.tileGraphics[tileIdStr];
                        }
                    }
                    d.pMain.removeChild(d.tileGraphics[1000]);
                    delete d.tileGraphics[1000];

                    let graphics = new PIXI.Graphics();
                    graphics.lineStyle(1, 0x0000FF, 1);
                    let j = 0;
                    let width = Math.round(xPoints[1]*newScale-xPoints[0]*newScale);

                    for(let i = 0; i < xPoints.length-1; i++){

                        if(Math.abs(Math.round(xPoints[i+1]*newScale-xPoints[i]*newScale) - width) > 3) { 
                            graphics.lineStyle(0, 0xFF0000, 1);
                        } else {
                            graphics.lineStyle(1, 0x0000FF, 1);       
                        }    

                        if(j == 0){
                                graphics.moveTo(xPoints[i]*newScale, yPoints[i]);
                                j++;
                            }

                        graphics.lineTo(xPoints[i+1]*newScale, yPoints[i+1]);

                    }

                    d.pMain.addChild(graphics);

                    d.tileGraphics[1000] = graphics;
                }
                else{
                    d.pMain.scale.x = 1+preScale-newScale;
                }                    //}
             //   d.pMain.scale.x = scale;
                /*d.pMain.position.x = d.translate[0];

               */

                d.pMain.position.x =  zoomedXScale(newStart);
                sizeChanged();
                preScale = newScale;
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
