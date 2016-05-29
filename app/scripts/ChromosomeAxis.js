import '../styles/ChromosomeAxis.css';
import d3 from 'd3';
import slugid from 'slugid';

export function ChromosomeAxis(chromInfoFile) {
    let bisect = d3.bisector(function(d) { return d.pos; }).left;
    let width = 600;
    let zoomDispatch = null;
    let domain = [0,1];

    function chart(selection) {
        selection.each(function(d) {
                let localZoomDispatch = zoomDispatch == null ? d3.dispatch('zoom') : zoomDispatch;
                let gChromLabels = null;
                let gSelect = null;
                let xScale = d3.scale.linear().domain(domain).range([0,width]);

                let cumValues = d.cumPositions;
                let xAxis = null;
                let gAxis = null;
                let lineScale = null;
                let slugId = slugid.nice();
                let zoom = d3.behavior.zoom().x(xScale);

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

                localZoomDispatch.on('zoom.' + slugId, zoomChanged);

                function zoomChanged(translate, scale) {
                    // something changed the zoom.
                    zoom.translate(translate);
                    zoom.scale(scale);

                    draw();
                }
                           console.log('cumValues:', cumValues);

                   function draw () {
                       //gChromLabels.attr('x', (d) => { return xScale(d.pos); });
                       //gSelect.call(zoomableLabels);
                       if (xAxis != null)
                           gAxis.call(xAxis);

                       let ticks = xScale.ticks(5);
                       let tickSpan = ticks[1] - ticks[0]
                       let tickWidth = xScale(ticks[1]) - xScale(ticks[0]);

                       let scaleMid = (xScale.range()[1] - xScale.range()[0]) / 2

                       let tickHeight = 4;
                       let tickFormat = d3.format(",d")

                        let bsLeft = bisect(cumValues, xScale.domain()[0])
                        if (bsLeft == 0)
                            bsLeft += 1

                        let chrLeft = cumValues[bsLeft-1].chr
                        
                       let bsRight =  bisect(cumValues, xScale.domain()[1])

                       if (bsRight == cumValues.length)
                           bsRight -= 1

                        let chrRight = cumValues[bsRight-1].chr

                        let leftInChrPos = Math.floor(xScale.domain()[0] - cumValues[bsLeft - 1].pos);
                        let rightInChrPos = Math.floor(xScale.domain()[1] - cumValues[bsRight - 1].pos);

                        textLeftChr.text(chrLeft + ":" + tickFormat(leftInChrPos))
                        textRightChr.text(chrRight + ":" + tickFormat(rightInChrPos))
                       pathScale.attr('d', `M${scaleMid - tickWidth / 2},${tickHeight}` + 
                                      `L${scaleMid - tickWidth / 2}, 0` + 
                                          `L${scaleMid + tickWidth / 2}, 0` + 
                                              `L${scaleMid + tickWidth / 2},${tickHeight}`)

                                              textScale.attr('x', scaleMid)
                                              .text(tickFormat(tickSpan) + " bp");

                       /*
                       lineScale.attr('x2', xScale.range()[1]);
                       lineScale.attr('x1', xScale.range()[1] - tickWidth);
                       lineScale.attr('y1', 10)
                       lineScale.attr('y2', 10)
                       */

                       textLeftChr.attr('x', 0);
                       textRightChr.attr('x', 0 + xScale.range()[1]);
                   }

                   draw();
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

    chart.domain = function(_) {
        if (!arguments.length) return domain;
        else domain = _;
        return chart;
    }

    chart.zoomDispatch = function(_) {
        if (!arguments.length) return zoomDispatch;
        else zoomDispatch = _;
        return chart;
    }

    return chart;
}
