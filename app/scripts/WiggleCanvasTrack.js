import PIXI from 'pixi.js';
import slugid from 'slugid';
import d3 from 'd3';

export function WiggleCanvasTrack() {
    let width = 200;
    let height = 15;
    let resizeDispatch = null;
    let xScale = d3.scale.linear();
    let zoomDispatch = null;
    let resolution = 256;
    let pixiStage = null;
    let inD = 0;
    let chartType = "line";


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
            
            var colorRange = [];
            var chart;
            var yValues = [];
            var isHeatMap = false;

            function drawCanvas() {
                let tileData = d3.select(this).selectAll('.tile-g').data();
                let maxValue = Math.max(...tileData.map((x) => x.valueRange[1]));
                
                let canvasData = [];
                
                canvasData = retrieveData(tileData[0], maxValue);


                CanvasJS.addColorSet("heatmap", colorRange);
                CanvasJS.addColorSet("constant", ["#3385ff"]);
                chart = new CanvasJS.Chart("chartContainer", {
                    colorSet: "constant",

                    title:{
                        text:"Canvas Bar Wiggle"              

                    },
                   // animationEnabled: true,
                    axisX:{

                        //min , max
                    },
                    axisY:{
                       maximum: 1.2,
                       valueFormatString: " ",
                       gridThickness: 0

                    },

                    data: canvasData
                });

                chart.render();

                $("#mode input[name=type]").change(function () { 
                    if($("#mode input[name=type]:checked").val() == "heatmap"){
                        isHeatMap = true;
                        chart.options.data[0].type = "column";
                        chartType = "column";
                        for(let i= 0; i <chart.options.data[0].dataPoints.length; i++){
                            chart.options.data[0].dataPoints[i].y = 1;
                        }
                        chart.options.colorSet = "heatmap";
                        chart.render();
                    } else{
                        isHeatMap = false;
                        var selectedChartType = $("#mode input[name=type]:checked").val();
                        chartType = selectedChartType;
                        chart.options.data[0].type = selectedChartType;
                        for(let i= 0; i <chart.options.data[0].dataPoints.length; i++){
                            chart.options.data[0].dataPoints[i].y = yValues[i];
                        }
                        chart.options.colorSet = "constant";
                        chart.render();
                    }
                });
            }

            function retrieveData(tile, maxValue) {
                let yScale = d3.scale.linear()
                    .domain([0, maxValue])
                    .range([0, 1]);

                let color=d3.scale.linear()
                    .domain([0,1])
                    .range(["red","blue"]);



                let canvasData = [];
                let canvasDatapoints = [];
                let tileData = loadTileData(tile.data);

                let tileWidth = (tile.xRange[1] - tile.xRange[0]) / Math.pow(2, tile.tilePos[0]);
                // this scale should go from an index in the data array to 
                // a position in the genome coordinates
                let tileXScale = d3.scale.linear().domain([0, tileData.length])
                .range([tile.xRange[0] + tile.tilePos[1] * tileWidth, 
                           tile.xRange[0] + (tile.tilePos[1] + 1) * tileWidth]  );

                let y = 1;
                for (let i = 0; i < tileData.length; i++) {
                        if(isHeatMap) {
                            canvasDatapoints.push({
                                y: 1,
                                x: xScale(tileXScale(i)) 
                            }); 
                        } else {
                            canvasDatapoints.push({
                                y: yScale(tileData[i]),
                                x: xScale(tileXScale(i)) 
                            });
                        }
                        
                        yValues.push(yScale(tileData[i]));
                        colorRange.push(color(yScale(tileData[i])));
                        
                        
                }
                
                
                canvasData.push({
                    type: chartType,
                    //color: "#014D65",   
                    dataPoints: canvasDatapoints
                });
                
                
                return canvasData;

            }

            drawCanvas.bind(this)();

            let localResizeDispatch = d.resizeDispatch;
            //console.log('localResizeDispatch', d.resizeDispatch);

            let slugId = slugid.nice();
            localResizeDispatch.on('resize.' + slugId, sizeChanged);

            function sizeChanged() {

             //   d.pMain.position.y = d.top;
               // d.pMain.scale.y = -d.height;
            }

            let localZoomDispatch = zoomDispatch == null ? d3.dispatch('zoom') : zoomDispatch;
            localZoomDispatch.on('zoom.' + slugId, zoomChanged);

            function zoomChanged(translate, scale) {

                console.log(translate);
                if(chart != null) {

                    chart.options.axisX.viewportMinimum = -translate[0]/scale;
                    chart.options.axisX.viewportMaximum = 448/scale - translate[0]/scale;
                    chart.render();
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

    chart.chartType = function(_){
        if (!arguments.length) return chartType;
        else chartType = _;

        return chart;
    }

    return chart;
}
