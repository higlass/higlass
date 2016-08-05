import '../styles/ChromosomeAxis.css';
import d3 from 'd3';
import slugid from 'slugid';
import {ChromosomeInfo} from './ChromosomeInfo.js';

export function LeftChromosomeAxis() {
    let bisect = d3.bisector(function(d) { return d.pos; }).left;
    let width = 600;
    let height = 20;
    let zoomDispatch = null;
    let resizeDispatch = null;
    let domain = [0,1];
    let orient = 'top';
    let yScale = null;

    function chart(selection) {
        selection.each(function(d) {
                let localZoomDispatch = zoomDispatch == null ? d3.dispatch('zoom') : zoomDispatch;
                let gChromLabels = null;
                let chromInfo = null;

                ChromosomeInfo(d.source, function(newChromInfo) {
                    chromInfo = newChromInfo;
                    draw();
                });

                let xAxis = null;
                let gAxis = null;
                let lineScale = null;
                let slugId = slugid.nice();
                let zoom = d3.behavior.zoom().y(yScale);

                let svg = d3.select(this).selectAll('svg')
                    .data([d])

                yScale.range([0, d.height]);

                svg.enter()
                .append('svg')
                .style('width', (d) => { return d.width;}) 
                .style('height', (d) => {return d.height;}) 

                let gAxisData = svg.selectAll('g')
                .data([0])

                gAxisData.enter()
                .append('g')

                gAxisData.exit()
                .remove()

                gAxis =  svg.selectAll('g')
                .attr('transform', 'translate(20,0)');

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

                let yMid = (yScale.range()[1] + yScale.range()[0]) / 2;
                if (orient == 'top') {
                    textCenterChr
                    .attr('text-anchor', 'middle')
                    .attr('dy', '-0.5em')
                    //.attr('transform', `rotate(-90)translate(0,${yMid})`)
                    .attr('transform', `translate(0,${yMid})rotate(-90)`)
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
                       //gChromLabels.attr('x', (d) => { return yScale(d.pos); });
                       //gSelect.call(zoomableLabels);
                       console.log('yScale.range()', yScale.range());

                       let ticks = yScale.ticks(5);
                       let tickSpan = ticks[1] - ticks[0]
                       let tickWidth = yScale(ticks[1]) - yScale(ticks[0]);
                       let midDomain = (yScale.domain()[1] + yScale.domain()[0]) / 2;
                       let midRange = (yScale.range()[0] + yScale.range()[1]) / 2;

                       let scaleMid = yScale.range()[1] - tickWidth / 2; //(yScale.range()[1] - yScale.range()[0]) / 2

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
                            pathScale.attr('d', `M-${tickHeight},${scaleMid - tickWidth / 2}` + 
                                    `L0,${scaleMid - tickWidth / 2}` + 
                                    `L0,${scaleMid + tickWidth / 2}` + 
                                    `L-${tickHeight},${scaleMid + tickWidth / 2}`)

                            textScale.attr('dy', '-0.5em')
                        } else {
                            // this scale will be at the bottom of the plot, so orient the ticks
                            // down
                            pathScale.attr('d', `M${tickHeight},${scaleMid - tickWidth / 2}` + 
                                    `L0,${scaleMid - tickWidth / 2}` + 
                                    `L0,${scaleMid + tickWidth / 2}` + 
                                    `L${tichHeight},${scaleMid + tickWidth / 2}`)

                        }

                       textScale
                        .attr('text-anchor', 'start')
                        .attr('transform', `translate(0,${yScale.range()[1] - 5})rotate(-90)`)
                       .text(tickFormat(tickSpan) + " bp");


                       centerTick.attr('y1', midRange)
                           .attr('y2', midRange)
                           .attr('x1', 0)
                           .attr('x2', tickHeight)

                       /*
                       lineScale.attr('x2', yScale.range()[1]);
                       lineScale.attr('x1', yScale.range()[1] - tickWidth);
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

    chart.height = function(_) {
        if (!arguments.length) return height;
        else height = _;
        return chart;
    };

    chart.yScale = function(_) {
        if (!arguments.length) return yScale;
        else yScale = _;
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
