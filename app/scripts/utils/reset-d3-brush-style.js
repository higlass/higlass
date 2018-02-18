const resetD3BrushStyle = (el, className) => {
  el.select('.selection')
    .attr('fill', null)
    .attr('fill-opacity', null)
    .attr('stroke', null)
    .classed(className, true);
};

export default resetD3BrushStyle;
