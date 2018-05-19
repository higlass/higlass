/**
 * Unsets the automatically set brush style of D3.
 * @param   {object}  el  Element which is brushed on.
 * @param   {string}  className  New class name to be set.
 */
const resetD3BrushStyle = (el, className) => {
  el.select('.selection')
    .attr('fill', null)
    .attr('fill-opacity', null)
    .attr('stroke', null)
    .classed(className, true);
};

export default resetD3BrushStyle;
