import d3 from 'd3';
import {ZoomableLabels} from 'zoomable_labels';

export function ChromosomeAxisPlot() {
    let xScale = null;
    let gChromLabels = null;
    let gSelect = null;
    let zoomableLabels = ZoomableLabels()
    .labelClass('.chromosome-label')
    .markerClass('.chromosome-label')
    .uidString('id')

    let xAxis = null;
    let gAxis = null;

    function chart(selection) {
        selection.each(function(d) {
            gSelect = d3.select(this);
            
            d3.text(d, function(text) {
                let data = d3.tsv.parseRows(text);
                let cumValues = [];
                
                for (let i = 0; i < data.length; i++) {
                    if (i == 0) 
                        cumValues.push({'id': 0, 'chr': data[i][0], 'pos': 0});
                    else 
                        cumValues.push({'id': i, 'chr': data[i][0], 'pos': cumValues[i-1].pos + +data[i-1][1]});
                }

                gAxis = gSelect.append('g')
                .classed('x axis', true);

                console.log('cumValues:', cumValues);

                let bisect = d3.bisector(function(d) { return d.pos; }).left;

                xAxis = d3.svg.axis()
                .scale(xScale)
                .orient('bottom')
                .tickFormat(function(d) {
                    let xdom = xScale.domain();
                    let chrIdx = bisect(cumValues, d);
                    chrIdx = chrIdx == 0 ? 0 : chrIdx - 1;  //if the starting position is 0, then we can have a chrIdx of 0

                    console.log('chrIdx:', d, chrIdx, cumValues[chrIdx]);

                    let chr = cumValues[chrIdx].chr;
                    let valInChr = d - cumValues[chrIdx].pos

                    console.log('chr:', chr);

                    if (xdom[1] - xdom[0] > 1000000) {

                    }

                    console.log('xdom:', xdom);
                    return chr + "." +  valInChr;
                })
                .ticks(3)

                // we always want to display the chromosome names in the middle of the 
                
                // visible region of the chromosome
                /*
                gChromLabels = gSelect.selectAll('.chromosome-label')
                .data(cumValues)
                .enter()
                .append('g')
                .append('text')
                .attr('id', (d) => {return `n->{d.id}`})
                .classed('chromosome-label', true)
                .text((d) => d.chr);
                */

                draw();
            });
        })
    }

    function draw () {
        //gChromLabels.attr('x', (d) => { return xScale(d.pos); });
        //gSelect.call(zoomableLabels);
        if (xAxis != null)
            gAxis.call(xAxis);
    }

    chart.draw = draw;

    chart.width = function(_) {
        if (!arguments.length) return width;
        else width = _;
        return chart;
    };

    chart.xScale = function(_) {
        if (!arguments.length) return xScale;
        else xScale = _;
        return chart;
    }

    return chart;
}
