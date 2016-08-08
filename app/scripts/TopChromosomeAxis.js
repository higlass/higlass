import '../styles/ChromosomeAxis.css';
import d3 from 'd3';
import slugid from 'slugid';
import {ChromosomeInfo} from './ChromosomeInfo.js';

export function TopChromosomeAxis() {
    let bisect = d3.bisector(function(d) { return d.pos; }).left;
    let width = 600;
    let zoomDispatch = null;
    let resizeDispatch = null;
    let domain = [0,1];
    let orient = 'top';
    let xScale = null;

    function chart(selection) {
        selection.each(function(d) {
                let localZoomDispatch = zoomDispatch == null ? d3.dispatch('zoom') : zoomDispatch;
                let gChromLabels = null;
                let chromInfo = null;

                ChromosomeInfo(d.source, function(newChromInfo) {
                    chromInfo = newChromInfo;
                    console.log('chromInfo:', chromInfo);
                    draw();
                });

                let gAxis = null;
                let lineScale = null;
                let slugId = slugid.nice();
                let zoom = d3.behavior.zoom().x(xScale);

                let svg = d3.select(this).selectAll('svg')
                    .data([d])

                xScale.range([0, d.width]);

                svg.enter()
                .append('svg')
                .style('width', (d) => { console.log('width:', d.width); return d.width;}) 
                .style('height', (d) => {return d.height;}) 

                let gAxisData = svg.selectAll('g')
                .data([0])

                gAxisData.enter()
                .append('g')

                gAxisData.exit()
                .remove()

                gAxis =  svg.selectAll('g')
                .attr('transform', 'translate(0,15)');

                gAxis.selectAll('.text-center')
                .data([0])
                .enter()
                .append('text')
                .classed('text-center', true)

                gAxis.selectAll('.center-tick')
                .data([0])
                .enter()
                .append('line')
                .classed('center-tick', true);

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

                let textCenterChr = gAxis.select('.text-center');
                let pathScale = gAxis.select('.scale-path');
                let textScale = gAxis.select('.text-scale');
                let centerTick = gAxis.select('.center-tick');

                if (orient == 'top') {
                    textCenterChr.attr('x', (xScale.range()[1] + xScale.range()[0]) / 2)
                    .attr('text-anchor', 'middle')
                    .attr('dy', '-0.5em');
                } else {
                    // FIXME
                }
                

                localZoomDispatch.on('zoom.' + slugId, zoomChanged);

                function zoomChanged(translate, scale) {
                    // something changed the zoom.
                    zoom.translate(translate);
                    zoom.scale(scale);

                    draw();
                }

                   function draw () {
                       if (chromInfo == null)
                           return;

                        let cumValues = chromInfo.cumPositions;
                       //gChromLabels.attr('x', (d) => { return xScale(d.pos); });
                       //gSelect.call(zoomableLabels);
                       let ticks = xScale.ticks(5);
                       let tickSpan = ticks[1] - ticks[0]
                       let tickWidth = xScale(ticks[1]) - xScale(ticks[0]);
                       let midDomain = (xScale.domain()[1] + xScale.domain()[0]) / 2;
                       let midRange = (xScale.range()[0] + xScale.range()[1]) / 2;

                       let scaleMid = xScale.range()[1] - tickWidth / 2; //(xScale.range()[1] - xScale.range()[0]) / 2

                       let tickHeight = 4;
                       let tickFormat = d3.format(",d")

                       let bsCenter = bisect(cumValues, midDomain);

                       if (bsCenter == 0)
                           bsCenter += 1;
                       if (bsCenter == cumValues.length)
                           bsCenter -= 1;

                       let chrCenter = cumValues[bsCenter-1].chr
                        let centerInChrPos = Math.floor(midDomain - cumValues[bsCenter - 1].pos);

                        textCenterChr.text(chrCenter + ":" + tickFormat(centerInChrPos))


                        if (orient == 'top') {
                            // this scale will be at the top of the plot, so orient the ticks up
                            pathScale.attr('d', `M${scaleMid - tickWidth / 2},-${tickHeight}` + 
                                    `L${scaleMid - tickWidth / 2}, 0` + 
                                    `L${scaleMid + tickWidth / 2}, 0` + 
                                    `L${scaleMid + tickWidth / 2},-${tickHeight}`)

                            textScale.attr('dy', '-0.5em')
                        } else {
                            // this scale will be at the bottom of the plot, so orient the ticks
                            // down
                            pathScale.attr('d', `M${scaleMid - tickWidth / 2},${tickHeight}` + 
                                    `L${scaleMid - tickWidth / 2}, 0` + 
                                    `L${scaleMid + tickWidth / 2}, 0` + 
                                    `L${scaleMid + tickWidth / 2},${tickHeight}`)

                        }

                       textScale.attr('x', xScale.range()[1] - 5)
                        .attr('text-anchor', 'end')
                       .text(tickFormat(tickSpan) + " bp");


                       centerTick.attr('x1', midRange)
                           .attr('x2', midRange)
                           .attr('y1', 0)
                           .attr('y2', tickHeight)

                       /*
                       lineScale.attr('x2', xScale.range()[1]);
                       lineScale.attr('x1', xScale.range()[1] - tickWidth);
                       lineScale.attr('y1', 10)
                       lineScale.attr('y2', 10)
                       */
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

    chart.resizeDispatch = function(_) {
        if (!arguments.length) return resizeDispatch;
        else resizeDispatch = _;
        return chart;
    }

    chart.orient = function(_) {
        if (!arguments.length) return orient;
        else orient = _;
        return chart;
    }

    return chart;
}
