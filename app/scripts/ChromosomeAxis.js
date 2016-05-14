import '../styles/ChromosomeAxis.css';
import d3 from 'd3';

export function ChromosomeAxis(chromInfoFile) {
    let bisect = d3.bisector(function(d) { return d.pos; }).left;
    let width = 600;


    function chart(selection) {
        selection.each(function(d) {
            d3.text(d, function(text) {
                let gChromLabels = null;
                let gSelect = null;

                /*
                let zoomableLabels = ZoomableLabels()
                .labelClass('.chromosome-label')
                .markerClass('.chromosome-label')
                .uidString('id')
                */

                let xScale = d3.scale.linear().range([0, width]);
                let xAxis = null;
                let gAxis = null;
                let lineScale = null;

                let data = d3.tsv.parseRows(text);
                let cumValues = [];

                for (let i = 0; i < data.length; i++) {
                    if (i == 0) 
                        cumValues.push({'id': 0, 'chr': data[i][0], 'pos': 0});
                    else 
                        cumValues.push({'id': i, 'chr': data[i][0], 'pos': cumValues[i-1].pos + +data[i-1][1]});
                }

                gSelect = d3.select(this);

                let gAxisData = gSelect.selectAll('g')
                .data([0])

                gAxisData.enter()
                .append('g')

                gAxisData.exit()
                .remove()

                gAxis =  gSelect.selectAll('g')

                gAxis.selectAll('.text-left')
                .data([0])
                .enter()
                .append('text')
                .classed('text-left', true)

                gAxis.selectAll('.text-right')
                .data([0])
                .enter()
                .append('text')
                .classed('text-right', true);

                gAxis.selectAll('.scale-path')
                .data([0])
                .enter()
                .append('path')
                .classed('scale-path', true)

                gAxis.selectAll('.text-scale')
                .data([0])
                .enter()
                .append('text')
                .classed('text-scale', true)
                .attr('text-anchor', 'middle')
                .attr('dy', '1.2em');

                let textLeftChr = gAxis.select('.text-left')
                let textRightChr = gAxis.select('.text-right')
                let pathScale = gAxis.select('.scale-path')
                let textScale = gAxis.select('.text-scale')

                textLeftChr.attr('x', xScale.range()[0])
                .attr('text-anchor', 'start')
                .attr('dy', '1.2em');

                textRightChr.attr('x', xScale.range()[1])
                .attr('text-anchor', 'end')
                .attr('dy', '1.2em');

                if (cumValues == null)
                    return;

                let chrLeft = cumValues[bisect(cumValues, xScale.domain()[0])].chr
                let chrRight = cumValues[bisect(cumValues, xScale.domain()[1])].chr

                textLeftChr.text(chrLeft)
                textRightChr.text(chrRight)

                let ticks = xScale.ticks(5);
                let tickSpan = ticks[1] - ticks[0]
                let tickWidth = xScale(ticks[1]) - xScale(ticks[0]);

                let scaleMid = (xScale.range()[1] - xScale.range()[0]) / 2

                let tickHeight = 4;
                let tickFormat = d3.format(",d")

                pathScale.attr('d', `M${scaleMid - tickWidth / 2},${tickHeight}` + 
                               `L${scaleMid - tickWidth / 2}, 0` + 
                                   `L${scaleMid + tickWidth / 2}, 0` + 
                                       `L${scaleMid + tickWidth / 2},${tickHeight}`)
                                       textScale.attr('x', scaleMid)
                                       .text(tickFormat(tickSpan) + " bp");

                   function draw () {
                       //gChromLabels.attr('x', (d) => { return xScale(d.pos); });
                       //gSelect.call(zoomableLabels);
                       if (xAxis != null)
                           gAxis.call(xAxis);

                       let ticks = xScale.ticks(5);
                       let tickSpan = ticks[1] - ticks[0]
                       let tickWidth = xScale(ticks[1]) - xScale(ticks[0]);

                       lineScale.attr('x2', xScale.range()[1]);
                       lineScale.attr('x1', xScale.range()[1] - tickWidth);
                       lineScale.attr('y1', 10)
                       lineScale.attr('y2', 10)

                       textLeftChr.attr('x', 0);
                       textRightChr.attr('x', 0 + xScale.range()[1]);
                   }
            })
        });
    }

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
