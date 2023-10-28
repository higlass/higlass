import chromInfoBisector from './chrom-info-bisector';

/**
 * @template {string} Name
 * @typedef {[name: Name, pos: number, offset: number, insertPoint: number ]} ChromosomePosition
 */

/**
 * Convert an absolute genome position to a chromosome position.
 * @template {string} Name
 * @param {number} absPosition - Absolute genome position.
 * @param {import('../types').ChromInfo<Name>} chromInfo - Chromosome info object.
 * @return {ChromosomePosition<Name> | null} The chromosome position.
 */
const absToChr = (absPosition, chromInfo) => {
  if (!chromInfo || !chromInfo.cumPositions || !chromInfo.cumPositions.length) {
    return null;
  }

  let insertPoint = chromInfoBisector(chromInfo.cumPositions, absPosition);
  const lastChr = chromInfo.cumPositions[chromInfo.cumPositions.length - 1].chr;
  const lastLength = chromInfo.chromLengths[lastChr];

  if (insertPoint > 0) {
    insertPoint -= 1;
  }

  let chrPosition = Math.floor(
    absPosition - chromInfo.cumPositions[insertPoint].pos,
  );
  let offset = 0;

  if (chrPosition < 0) {
    // before the start of the genome
    offset = chrPosition - 1;
    chrPosition = 1;
  }

  if (
    insertPoint === chromInfo.cumPositions.length - 1 &&
    chrPosition > lastLength
  ) {
    // beyond the last chromosome
    offset = chrPosition - lastLength;
    chrPosition = lastLength;
  }

  return [
    chromInfo.cumPositions[insertPoint].chr,
    chrPosition,
    offset,
    insertPoint,
  ];
};

export default absToChr;
