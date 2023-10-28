/**
 * Convert a chromosome position to an absolute genome position.
 *
 * @template {string} Name
 * @param {Name} chrom - Chromosome name
 * @param {number} chromPos - Chromosome position
 * @param {import('../types').ChromInfo<Name>} chromInfo - Chromosome info object
 */
const chrToAbs = (chrom, chromPos, chromInfo) =>
  chromInfo.chrPositions[chrom].pos + chromPos;

export default chrToAbs;
