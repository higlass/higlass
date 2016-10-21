import '../styles/ChromosomeGrid.css';
import d3 from 'd3';
import slugid from 'slugid';
import {ChromosomeInfo} from './ChromosomeInfo.js';

export function ChromosomeGrid() {
    let bisect = d3.bisector(function(d) { return d.pos; }).left;
    let width = 600, height=600;
    let zoomDispatch = null;
    let resizeDispatch = null;
    let domain = [0,1];
    let orient = 'top';
    let xScale = null, yScale = null;
    let zoomedXScale = d3.scale.linear();
    let zoomedYScale = d3.scale.linear();

    function chart(selection) {
        selection.each(function(d) {
            console.log('chromosome-grid called');

            if (!('resizeDispatch' in d)) {
                d.resizeDispatch = resizeDispatch == null ? d3.dispatch('resize') : resizeDispatch;
            }

            let slugId = d.uid + '.top-axis';
            d.resizeDispatch.on('resize.' + slugId, sizeChanged.bind(this));

                let localZoomDispatch = zoomDispatch == null ? d3.dispatch('zoom') : zoomDispatch;
                let gChromLabels = null;
                let chromInfo = null;
                let cumValues = null;

                let verticalLines = null;
                let horizontalLines = null;


                let gHorizontalLines = null;
                let gVerticalLines = null;
                let lineXScale = null;
                let lineYScale = null;

                let zoom = d3.behavior.zoom();

                // create one svg
                let svg = d3.select(this).selectAll('svg')
                    .data([d])

                svg.enter()
                .append('svg')
                .style('width', (d) => { return d.width;}) 
                .style('height', (d) => {return d.height;}) 
                .style('opacity', 0.5)
                .classed('chromosome-grid', true);

                let gGridData = svg.selectAll('g')
                .data([0])

                gGridData.enter()
                .append('g')

                gGridData.exit()
                .remove()

                let gGrid =  svg.selectAll('g')
                .attr('transform', 'translate(' + (-d.leftMargin) + ',0)');

                ChromosomeInfo(d.source, function(newChromInfo) {
                    chromInfo = newChromInfo;

                    cumValues = chromInfo.cumPositions;
                    gGrid.selectAll('.horizontal-line')
                    .data(cumValues)
                    .enter()
                    .append('path')
                    .classed('horizontal-line', true)

                    gGrid.selectAll('.vertical-line')
                    .data(cumValues)
                    .enter()
                    .append('path')
                    .classed('vertical-line', true)

                    horizontalLines = gGrid.selectAll('.horizontal-line');
                    verticalLines = gGrid.selectAll('.vertical-line');
                    draw();
                });

                localZoomDispatch.on('zoom.' + slugId, zoomChanged);

                function zoomChanged(translate, scale) {
                    // something changed the zoom.
                    zoom.translate(translate);
                    zoom.scale(scale);

                    draw();
                }

            function sizeChanged() {
                let svg = d3.select(this).selectAll('svg')
                svg.style('width', d.width);
                draw();
            }

            function draw () {
                zoomedXScale.range(xScale.range());
                zoomedXScale.domain(xScale.range()
                        .map(function(x) { return (x - zoom.translate()[0]) / zoom.scale() })
                        .map(xScale.invert))

                zoomedYScale.range(yScale.range());
                zoomedYScale.domain(yScale.range()
                        .map(function(y) { return (y - zoom.translate()[1]) / zoom.scale() })
                        .map(yScale.invert))

               if (chromInfo == null)
                   return;

               verticalLines.attr('d', function(d) {
                    return(`M ${zoomedXScale(d.pos)} ${zoomedYScale(0)} L ${zoomedXScale(d.pos)} ${zoomedYScale(chromInfo.totalLength)}`);
               });
               horizontalLines.attr('d', function(d) {
                    return(`M ${zoomedXScale(0)} ${zoomedYScale(d.pos)} L ${zoomedXScale(chromInfo.totalLength)} ${zoomedYScale(d.pos)}`);
               });
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
    }

    chart.xScale = function(_) {
        if (!arguments.length) return xScale;
        else xScale = _;
        return chart;
    }

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
