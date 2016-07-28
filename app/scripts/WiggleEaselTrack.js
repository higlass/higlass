import PIXI from 'pixi.js';
import slugid from 'slugid';
import d3 from 'd3';
//require('node-easel');

export function WiggleEaselTrack() {
    let width = 200;
    let height = 15;
    let resizeDispatch = null;
    let xScale = d3.scale.linear();
    let zoomDispatch = null;
    let resolution = 256;
    let easelStage = null;
    let inD = 0;

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

            if (!('easelStage' in d)) {
                d.stage = easelStage; 
            }

            if (!('pMain' in d)) {

                //let pMain = new createjs.Graphics();
                let pMain = new createjs.Container();
                //pMain.drawCircle(0,0,30);
                d.stage.addChild(pMain);
                /*var circle = new createjs.Shape();
                circle.graphics.beginFill("DeepSkyBlue").drawCircle(0, 0, 50);
                circle.x = 100;
                circle.y = 100;
                d.stage.addChild(circle);
                d.stage.update();
                */
                d.pMain = pMain;

            }
                
            function redrawTile() {
                let tileData = d3.select(this).selectAll('.tile-g').data();
                let minVisibleValue = Math.min(...tileData.map((x) => x.valueRange[0]));
                let maxVisibleValue = Math.max(...tileData.map((x) => x.valueRange[1]));

                let yScale = d3.scale.linear()
                .domain([0, maxVisibleValue])
                .range([0, 1]);

                let drawTile = function(graphics, tile) {
                    //console.log('drawing tile:', tile.tileId, xScale.domain(), xScale.range());
                    let tileData = loadTileData(tile.data);

                    let tileWidth = (tile.xRange[1] - tile.xRange[0]) / Math.pow(2, tile.tilePos[0]);
                    // this scale should go from an index in the data array to 
                    // a position in the genome coordinates
                    let tileXScale = d3.scale.linear().domain([0, tileData.length])
                    .range([tile.xRange[0] + tile.tilePos[1] * tileWidth, 
                           tile.xRange[0] + (tile.tilePos[1] + 1) * tileWidth]  );

                    var circle = new createjs.Shape();
                    var j=0;
                    var rect = new createjs.Shape();
                    var line = new createjs.Shape();
                    for (let i = 0; i < tileData.length; i++) {
                        let xPos = xScale(tileXScale(i));
                        //let yPos = -(d.height - yScale(tileData[i]));
                        let yPos = -1; //-(d.height - yScale(tileData[i]));
                        let height = yScale(tileData[i])
                        let width = xScale(tileXScale(i+1)) - xScale(tileXScale(i));
                        
                        
                        /** Line
                        if(j == 0){
                            line.graphics.moveTo(xPos, 100-height*100);
                            j++;
                        }   
                        else{
                            
                            line.graphics.beginStroke("black");
                            line.graphics.lineTo(xPos, 100-height*100); 
                            line.graphics.endStroke();
                        }
                        line.graphics.moveTo(xPos, 100-height*100);
                        graphics.addChild(line);*/
                        /** rect 
                        rect.graphics.beginFill("black").drawRect(xPos,100-height*100, width, height*100);
                 
                        graphics.addChild(rect); 
                        //*/

                        /**circle
                        circle.graphics.beginFill("black").drawCircle(xPos,100-height*100, width);
                 
                        graphics.addChild(circle);
                        */
                        

                    }
                    /*/Line 
                    line.graphics.beginStroke("black");
                    line.graphics.moveTo(0, 0);
                    line.graphics.lineTo(100, 100); 
                    line.graphics.endStroke();
                    graphics.addChild(line);*/
                    
                }

                let shownTiles = {};

                for (let i = 0; i < tileData.length; i++) {
                    shownTiles[tileData[i].tileId] = true;

                    if (!(tileData[i].tileId in d.tileGraphics)) {
                        // we don't have a graphics object for this tile
                        // so we need to create one
                         let newGraphics = new createjs.Container();
                         drawTile(newGraphics, tileData[i]);
                         d.pMain.addChild(newGraphics)
                         d.tileGraphics[tileData[i].tileId] = newGraphics;
                    } 
                }
                

                for (let tileIdStr in d.tileGraphics) {
                    if (!(tileIdStr in shownTiles)) {
                        //we're displaying graphics that are no longer necessary,
                        //so we need to get rid of them
                        d.pMain.removeChild(d.tileGraphics[tileIdStr]);
                        delete d.tileGraphics[tileIdStr];
                    }
                }

                d.stage.update();

            }

            redrawTile.bind(this)();

            let localResizeDispatch = d.resizeDispatch;
            //console.log('localResizeDispatch', d.resizeDispatch);

            let slugId = slugid.nice();
            localResizeDispatch.on('resize.' + slugId, sizeChanged);

            let localZoomDispatch = zoomDispatch == null ? d3.dispatch('zoom') : zoomDispatch;
            localZoomDispatch.on('zoom.' + slugId, zoomChanged);

            function sizeChanged() {
               // d.pMain.position.y = d.top;
               // d.pMain.scale.y = -d.height;
            }

            function zoomChanged(translate, scale) {
                d.translate = translate;
                d.scale = scale;
                d.pMain.setTransform(d.translate[0], 0, scale);
              //  d.pMain.scale.x = scale;
             //   d.pMain.position.x = d.translate[0];
                d.stage.update();
                sizeChanged();
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

    chart.easelStage = function(_) {
        if (!arguments.length) return easelStage;
        else easelStage = _;
        return chart;
    }

    return chart;
}
