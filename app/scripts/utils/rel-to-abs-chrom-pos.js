/**
 * @template {string} Name
 * @param {Name} chrom
 * @param {number} x
 * @param {number} y
 * @param {import('../types').ChromInfo<Name>} chromInfo
 * @returns {[number, number]}
 */
const relToAbsChromPos = (chrom, x, y, chromInfo) => [
  chromInfo.chrPositions[chrom].pos + +x,
  chromInfo.chrPositions[chrom].pos + +y,
];

export default relToAbsChromPos;
