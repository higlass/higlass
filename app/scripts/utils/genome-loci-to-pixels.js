import chrToAbs from './chr-to-abs';

/**
 * Convert a genome locus to an absolute genome position.
 * @template {string} Name
 * @param {[Name, number, Name, number]} genomeLoci - Genome locus
 * @param {import('../types').ChromInfo<Name>} chromInfo - Chromosome info object
 * @return {[start: number, end: number]} The absolute genome position.
 */
const genomeLociToPixels = (genomeLoci, chromInfo) => [
  chrToAbs(genomeLoci[0], genomeLoci[1], chromInfo),
  chrToAbs(genomeLoci[2], genomeLoci[3], chromInfo),
];

export default genomeLociToPixels;
