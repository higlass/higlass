import { bisector } from 'd3-array';

const chromInfoBisector = bisector((d) => d.pos).left;

export default chromInfoBisector;
