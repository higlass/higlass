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

    let xScale = null;
    let gMain = null;

    let lineGene = null;
    let rectExons = [];
    let circleGene = null;

    let exonRects = null;

    function draw() {
        let geneJson = lineGene.data()[0];
        let lineLength = xScale(geneJson.txEnd) - xScale(geneJson.txStart);

        if (lineLength < 4) {
            // if we're so zoomed out that the genes are barely visible
            // just draw a circle instead
            circleGene.attr('visibility', 'visible')
            .attr('cx', (d) => { return xScale(+geneJson.txStart + geneJson.chromOffset); })
            .attr('cy', (d) => { return height / 2})
            .attr('r', 5)
        } else {
            exonRects.attr('x', (d) => xScale(d[0]))
                    .attr('y', 0)
                    .attr('width', (d) => xScale(d[1]) - xScale(d[0]))
                    //.attr('width', 10)
                    .attr('height', height)
                    .attr('visibility', 'visible');

            lineGene.attr('x1', (d) => xScale(d.chromOffset + +d.txStart))
                    .attr('x2', (d) => xScale(d.chromOffset + +d.txEnd))
                    .attr('y1', height / 2)
                    .attr('y2', height / 2)
                    .attr('visibility', 'visible');
        }
    }

    function chart(selection) {
        selection.each(function(geneJson) {
                geneJson.chromOffset = geneJson.genomeTxStart - geneJson.txStart;
                let gMain = d3.select(this).append('g');

                lineGene = gMain.append('line')
                .classed('gene-line', true);

                circleGene = gMain.append('circle')
                .classed('gene-circle', true);

                function zip(arrays) {
                    return arrays[0].map(function(_,i){
                        return arrays.map(function(array){return array[i]})
                    });
                }

                let exons = zip([geneJson.exonStarts.split(','), 
                                 geneJson.exonEnds.split(',')]);
                exons = exons.map((d) => { return [geneJson.chromOffset + +d[0], 
                                                   geneJson.chromOffset + +d[1]] })
                exonRects = gMain.selectAll('rect')
                .data(exons)
                .enter()
                .append('rect')
                .classed('exon-rect', true)

                // draw the arrows in the direction that this transcript is facing
                /*
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
                */
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

    chart.xScale = function(_) {
        if (!arguments.length) return xScale;
        xScale = _;
        return chart;
    };

    chart.draw = draw;

    return chart;
}
