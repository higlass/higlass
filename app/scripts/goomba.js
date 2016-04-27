import d3 from 'd3';
import {getRadius} from './helper_module.js';

export function drawCircle(divName) {
   let svg = d3.select(divName)
   .append('svg')
   .attr('width', 250)
   .attr('height', 250)

    svg.append('circle')
    .attr('cx', 125)
    .attr('cy', 125)
    .attr('r', getRadius())
    .attr('fill', 'blue')
}
