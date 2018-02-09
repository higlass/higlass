const isWithin = (x, y, minX, maxX, minY, maxY) => (
  x >= minX && x <= maxX &&
  y >= minX && y <= maxY
);

export default isWithin;
