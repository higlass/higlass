import '../styles/gene.css';

import d3 from 'd3';
import {getRadius} from './helper_module.js';


export function GenePlot() {
    let width = 300;
    let height = 20;
    let xPos = 0;
    let yPos = 0;
    let arrowSpace = 10;     // the space betweent the arrows indicating the direction
                             // of the transcript

    function chart(selection) {
        selection.each(function(geneJson) {
            console.log('geneJson:', geneJson);
                let gMain = d3.select(this).append('g');

                let xScale = d3.scale.linear()
                .domain([+geneJson.txStart, +geneJson.txEnd])
                .range([0,width]);

                console.log('gMain:', gMain);
                gMain.append('line')
                .attr('x1', 0)
                .attr('x2', width)
                .attr('y1', height / 2)
                .attr('y2', height / 2)
                .classed('gene-line', true);

                for (let i = 0; i < geneJson.exonStarts.length; i++) {
                    let exStart = +geneJson.exonStarts[i];
                    let exEnd = +geneJson.exonEnds[i];

                    console.log('geneJson.exonStarts[i]', exStart, xScale(exStart));
                    console.log('geneJson.exonEnds[i]', exEnd, xScale(exEnd));

                    gMain.append('rect')
                    .attr('x', xScale(exStart))
                    .attr('y', 0)
                    .attr('width', xScale(exEnd) - xScale(exStart))
                    .attr('height', height)
                    .classed('exon-rect', true);
                }

                // draw the arrows in the direction that this transcript is facing
                let start = 0;
                while (start < width) {
                    gMain.append('line')
                    .attr('x1', start + 3)
                    .attr('y1', (1 / 4.) * height)
                    .attr('x2', start)
                    .attr('y2', height / 2)
                    .classed('arrow-line', true)

                    gMain.append('line')
                    .attr('x1', start + 3)
                    .attr('y1', (3 / 4.) * height)
                    .attr('x2', start)
                    .attr('y2', height / 2)
                    .classed('arrow-line', true)

                     start += 10;
                }
        });
    }

    chart.width = function(_) {
        if (!arguments.length) return width;
        width = _;
        return chart;
    };

    chart.height = function(_) {
        if (!arguments.length) return height;
        height = _;
        return chart;
    };

    chart.xPos = function(_) {
        if (!arguments.length) return xPos;
        xPos = _;
        return chart;
    };

    chart.yPos = function(_) {
        if (!arguments.length) return yPos;
        yPos = _;
        return chart;
    };

    return chart;
}
