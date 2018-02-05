import lDist from './l-dist';

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
