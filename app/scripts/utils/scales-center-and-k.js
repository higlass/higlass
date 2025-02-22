/**
 * Calculate the center of the scale as well as its scale
 * factor
 *
 * Assumes the two scales have the same k
 *
 * @param xScale: A d3 scale.
 * @param yScale: A d3 scale.
 * @return: [domainCenter, k]
 */
const scalesCenterAndK = (xScale, yScale) => {
  const xCenter = xScale.invert((xScale.range()[0] + xScale.range()[1]) / 2);
  const yCenter = yScale.invert((yScale.range()[0] + yScale.range()[1]) / 2);
  const k = xScale.invert(1) - xScale.invert(0);

  return [xCenter, yCenter, k];
};

export default scalesCenterAndK;
