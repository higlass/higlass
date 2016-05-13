import d3 from 'd3';
import {getRadius} from './helper_module.js';
import {GenePlot} from './gene.js';
import {TiledArea} from './tiled_area.js';
import {ZoomableLabels} from 'zoomable_labels';

export {GenePlot} from './gene.js';
export {ChromosomeAxis} from './ChromosomeAxis.js';

export function Goomba() {
    let width = 700, height=40;
    let xScale = d3.scale.linear();
    /*
    let chromAxis = goomba.ChromosomeAxis('/jsons/hg19/chromInfo.txt')
        .xScale(xScale);
        */
    let drawAxis = false;
    let chromAxis = null;

    let zoom = d3.behavior.zoom();
    let tiledArea = null;
    let currentZoom = 1;

    function chart(selection) {
        selection.each(function(tileDirectory) {
            let gMain = d3.select(this).append('g');

            let zoomableLabels = ZoomableLabels()
            .markerClass('.gene-marker')
            .labelClass('.gene-label')
            .labelParent(gMain)
            .labelMarkerId((d) => { return `n-${d.refseqid}`})
            .uidString('refseqid')

            tiledArea = TiledArea().width(width)
            .height(height)
            .tileDirectory(tileDirectory)
            .dataPointLayout(GenePlot)
            //.on('draw', () => { gMain.call(zoomableLabels); })
            .xScale(xScale)
            .zoom(zoom);

            console.log('xScale', xScale.domain());
            if (drawAxis)
                chromAxis = goomba.ChromosomeAxis('/jsons/hg19/chromInfo.txt')
                    .xScale(xScale);

            let gChromAxis = null
            if (drawAxis)
                gChromAxis = gMain.append('g')
                .attr('transform', `translate(30,${height - 20})`)
                .classed('g-axis', true)
                .call(chromAxis);

            tiledArea.on('draw', () => {
                gMain.call(zoomableLabels);
                if (drawAxis)
                    gChromAxis.call(chromAxis);
            });
            //tiledArea.on('draw', () => { chromAxisPlot.draw(); });

            gMain.call(tiledArea)

        });
    }

    chart.drawAxis = function(_) {
        if (!arguments.length) return drawAxis;
        else drawAxis = _;
        return chart;
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

    chart.zoom = function(_) {
        if (!arguments.length) return zoom;
        zoom = _;
        return chart;
    }

    chart.xScale = function(_) {
        if (!arguments.length) return xScale;
        xScale = _;

        if (tiledArea != null)
            tiledArea.xScale(_);

        return chart;
    }

    chart.on = function(event, _) {
        dispatch.on(event, _);
        return chart;
    }

    chart.draw = function() {
        tiledArea.draw();
    }

    chart.currentZoom = function(_) {
        if (!arguments.length) return currentZoom;
        else currentZoom = _;

        if (tiledArea != null)
            tiledArea.currentZoom(_);

        return chart;
    }


    return chart;
}
