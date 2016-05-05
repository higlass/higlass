import d3 from 'd3';
import {getRadius} from './helper_module.js';
import {GenePlot} from './gene.js';
import {TiledArea} from './tiled_area.js';

export {GenePlot} from './gene.js';

export function Goomba() {
    let width = 500, height=300;

    function drawDataPoint(xScale, yScale) {
        // draw a single data point in a tile
        let genePlot = GenePlot();

        function drawRefGene(selection) {
            genePlot.xScale(xScale);
            selection.each(function(d) {
                d3.select(this).call(genePlot);

                genePlot.draw();
            });
            console.log('drawing:', selection);
        }

        return drawRefGene;
    }

    function chart(selection) {
        selection.each(function(tileDirectory) {
            let gMain = d3.select(this).append('g');

            let tiledArea = TiledArea().width(width)
            .height(height)
            .tileDirectory(tileDirectory)
            .drawDataPoint(drawDataPoint);

            gMain.call(tiledArea)
        });
    }

    chart.width = function(_) {
        if (!arguments.length) return width;
        width = _;
        return chart;
    }

    chart.height = function(_) {
        if (!arguments.length) return height;
        height = _;
        return chart;
    }

    return chart;
}
