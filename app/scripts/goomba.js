import d3 from 'd3';
import {getRadius} from './helper_module.js';
import {GenePlot} from './gene.js';
import {TiledArea} from './tiled_area.js';
import {ZoomableLabels} from 'zoomable_labels';

export {GenePlot} from './gene.js';

export function Goomba() {
    let width = 700, height=40;

    function chart(selection) {
        selection.each(function(tileDirectory) {
            let gMain = d3.select(this).append('g');

            let zoomableLabels = ZoomableLabels()
            .markerClass('.gene-marker')
            .labelClass('.gene-label')
            .labelParent(gMain)
            .labelMarkerId((d) => { return `n-${d.refseqid}`})
            .uidString('refseqid')

            console.log('height:', height);
            let tiledArea = TiledArea().width(width)
            .height(height)
            .tileDirectory(tileDirectory)
            .dataPointLayout(GenePlot)
            .on('draw', () => { gMain.call(zoomableLabels); });

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
