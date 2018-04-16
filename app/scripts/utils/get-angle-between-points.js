/**
 * Angle between two 2d points in radians.
 * @param   {array}  p1  First point as tuple in form `[x, y]`.
 * @param   {array}  p2  Second point as tuple in form `[x, y]`.
 * @return  {number}  Angle between `p1` and `p2` in radians.
 */
const getAngleBetweenPoints = (p1, p2) => Math.atan2(
  p2[1] - p1[1], p2[0] - p1[0]
);

export default getAngleBetweenPoints;
