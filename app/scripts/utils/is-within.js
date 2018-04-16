/**
 * Check if some 2D point is within a rectangle
 * @param   {number}  x  The point's X coordinate.
 * @param   {number}  y  The point's Y coordinate.
 * @param   {number}  minX  The rectangle's start X coordinate.
 * @param   {number}  maxX  The rectangle's start X coordinate.
 * @param   {number}  minY  The rectangle's start X coordinate.
 * @param   {number}  maxY  The rectangle's start X coordinate.
 * @return  {boolean}  If `true` the [x,y] point is in the rectangle.
 */
const isWithin = (x, y, minX, maxX, minY, maxY) => (
  x >= minX && x <= maxX &&
  y >= minX && y <= maxY
);

export default isWithin;
