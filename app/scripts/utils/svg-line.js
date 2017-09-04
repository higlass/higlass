export const svgLine = (x1, y1, x2, y2, strokeWidth, strokeColor) => {
  const line = document.createElement('line');

  line.setAttribute('x1', x1);
  line.setAttribute('x2', x2);
  line.setAttribute('y1', y1);
  line.setAttribute('y2', y2);

  if (strokeWidth) { line.setAttribute('stroke-width', strokeWidth); }
  if (strokeColor) { line.setAttribute('stroke', strokeColor); }

  return line;
};

export default svgLine;
