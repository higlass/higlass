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

    function chart(selection) {
        selection.each(function(d) {
            gSelect = d3.select(this);
            
            d3.text(d, function(text) {
                let data = d3.tsv.parseRows(text);
                let cumValues = [];
                
                for (let i = 0; i < data.length; i++) {
                    if (i == 0) 
                        cumValues.push({'id': 0, 'chr': data[i][0], 'pos': +data[i][1]});
                    else 
                        cumValues.push({'id': i, 'chr': data[i][0], 'pos': cumValues[i-1].pos + +data[i][1]});
                }

                // we always want to display the chromosome names in the middle of the 
                // visible region of the chromosome
                gChromLabels = gSelect.selectAll('.chromosome-label')
                .data(cumValues)
                .enter()
                .append('g')
                .append('text')
                .attr('id', (d) => {return `n->{d.id}`})
                .classed('chromosome-label', true)
                .text((d) => d.chr);

                draw();
            });
        })
    }

    function draw () {
        gChromLabels.attr('x', (d) => { return xScale(d.pos); });
        gSelect.call(zoomableLabels);
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
