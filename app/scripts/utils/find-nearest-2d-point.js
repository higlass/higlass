import lDist from './l-dist';

/**
 * Find the nearest point in 2D
 * @param   {array}  source  Source point, i.e., the point for which we are
 *   searching for the nearest neighbor.
 * @param   {array}  targets  List of point to test.
 * @return  {array}  Nearest point to `source`.
 */
const findNearest2dPoint = (source, targets) => {
  let closest = Infinity;
  let point = [0, 0];
  targets.forEach((target) => {
    const dist = lDist(source, target);
    if (dist < closest) {
      closest = dist;
      point = target;
    }
  });
  return point;
};

export default findNearest2dPoint;
