import { bisector } from 'd3-array';

const chromInfoBisector = bisector(
  (/** @type {{ pos: number }} */ d) => d.pos,
).left;

export default chromInfoBisector;
