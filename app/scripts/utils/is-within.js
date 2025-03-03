/**
 * Check if a 2D or 1D point is within a rectangle or range
 * @param {number} x - The point's X coordinate.
 * @param {number} y - The point's Y coordinate.
 * @param {number} minX - The rectangle's start X coordinate.
 * @param {number} maxX - The rectangle's start X coordinate.
 * @param {number} minY - The rectangle's start X coordinate.
 * @param {number} maxY - The rectangle's start X coordinate.
 * @return {boolean} If `true` the [x,y] point is in the rectangle.
 */
const isWithin = (x, y, minX, maxX, minY, maxY, is1d = false) =>
  is1d
    ? (x >= minX && x <= maxX) || (y >= minY && y <= maxY)
    : x >= minX && x <= maxX && y >= minY && y <= maxY;

export default isWithin;
