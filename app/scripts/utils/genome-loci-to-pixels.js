import { chrToAbs } from './chr-to-abs';

const genomeLociToPixels = (genomeLoci, chromInfo) => [
  chrToAbs(genomeLoci[0], genomeLoci[1], chromInfo),
  chrToAbs(genomeLoci[2], genomeLoci[3], chromInfo),
];

export default genomeLociToPixels;
