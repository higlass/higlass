import {getRadius} from './helper_module.js';
import {GenePlot} from './gene.js';
import {TiledArea} from './tiled_area.js';
import {ZoomableLabels} from 'zoomable_labels';

export {GenePlot} from './gene.js';
export {GeneTileLayout} from './gene.js';
export {WiggleTileLayout} from './WiggleTrack.js';
export {ChromosomeAxis} from './ChromosomeAxis.js';
export {ChromosomeInfo} from './ChromosomeInfo.js';
export {TiledArea} from './tiled_area.js';
export {ZoomableLabels} from 'zoomable_labels';
export {SearchField} from './search_field.js';

export function Goomba() {
    let width = 700, height=40;
    let xScale = d3.scale.linear();
    /*
    let chromAxis = goomba.ChromosomeAxis('/jsons/hg19/chromInfo.txt')
        .xScale(xScale);
        */
    let drawAxis = false;

    let zoom = d3.behavior.zoom();
    let tiledArea = null;
    let currentZoom = 1;
    let zoomDispatch = null;

    function chart(selection) {
        selection.each(function(tileDirectory) {
            let localZoomDispatch = zoomDispatch == null ? d3.dispatch('zoom') : zoomDispatch;

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
            .xScale(xScale)
            .zoom(zoom);
                
            function zoomHere() {
                localZoomDispatch.zoom(zoom.translate(), zoom.scale());
            }

            tiledArea.on('draw', () => {
                gMain.call(zoomableLabels);
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
