import d3 from 'd3';
import {getRadius} from './helper_module.js';
import {GenePlot} from './gene.js';
import {TiledArea} from './tiled_area.js';
import {ZoomableLabels} from 'zoomable_labels';

export {GenePlot} from './gene.js';
export {ChromosomeAxisPlot} from './ChromosomeAxisPlot.js';

export function Goomba() {
    let width = 700, height=40;
    let xScale = d3.scale.linear();

    function chart(selection) {
        selection.each(function(tileDirectory) {
            let gMain = d3.select(this).append('g');

            let zoomableLabels = ZoomableLabels()
            .markerClass('.gene-marker')
            .labelClass('.gene-label')
            .labelParent(gMain)
            .labelMarkerId((d) => { return `n-${d.refseqid}`})
            .uidString('refseqid')

            let tiledArea = TiledArea().width(width)
            .height(height)
            .tileDirectory(tileDirectory)
            .dataPointLayout(GenePlot)
            //.on('draw', () => { gMain.call(zoomableLabels); })
            .xScale(xScale);

            let chromAxisPlot = goomba.ChromosomeAxisPlot()
            .width(width)
            .xScale(goombaPlot.xScale());

            let gChromAxis = gMain.append('g')
            .attr('transform', `translate(0,${height})`)
            .classed('g-axis', true)
            .datum('jsons/hg19/chromInfo.txt')
            .call(chromAxisPlot);

            tiledArea.on('draw', () => {
                gMain.call(zoomableLabels);
                chromAxisPlot.draw();
            });
            //tiledArea.on('draw', () => { chromAxisPlot.draw(); });

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

    chart.xScale = function(_) {
        if (!arguments.length) return xScale;
        xScale = _;
        return chart;
    }

    chart.on = function(event, _) {
        dispatch.on(event, _);
        return chart;
    }

    return chart;
}
