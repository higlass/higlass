import absToChr from './abs-to-chr';

/** @typedef {[startChromName: string, startChromPos: number, endChromName: string, endChromPos: number]} GenomicLoci */

/**
 * Convert a pair of data coordinates to genomic coordinates.
 * @param {number} x0 - The first data coordinate.
 * @param {number} x1 - The second data coordinate.
 * @param {import('../types').ChromInfo} chromInfo - The chromosome info object.
 * @returns {GenomicLoci} The genomic coordinates.
 */
const dataToGenomicLoci = (x0, x1, chromInfo) => {
  const gX0 = absToChr(x0, chromInfo);
  const gX1 = absToChr(x1, chromInfo);
  if (!gX0 || !gX1) {
    throw new Error("Couldn't convert data to genomic coordinates");
  }
  return [gX0[0], Math.round(gX0[1]), gX1[0], Math.round(gX1[1])];
};

export default dataToGenomicLoci;
