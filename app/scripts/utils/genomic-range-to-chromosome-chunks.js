/**
 * Using the [genomicStart, genomicEnd] range, get an array of "chromosome chunks",
 * where each chunk range starts and ends with the same chromosome.
 * Start a new chromosome chunk at each chromosome boundary.
 *
 * @template {string} Name
 * @param {Array<[charName: Name, chrLen: number]>} chromSizes - Array of [chrName, chrLen] tuples.
 * @param {{ chr: Name, pos: number }} genomicStart - A genomic position object returned from abs2genomic { chr, pos }.
 * @param {{ chr: Name, pos: number }} genomicEnd - A genomic position object returned from abs2genomic { chr, pos }.
 * @param {number} binSize - The resolution / bin size.
 * @param {number} tileSize - The tile size (probably 256).
 * @returns {Array<[chrName: Name, zStart: number, zEnd: number]>} Returns array of [chrName, zStart, zEnd] tuples.
 */
function genomicRangeToChromosomeChunks(
  chromSizes,
  genomicStart,
  genomicEnd,
  binSize,
  tileSize,
) {
  const { chr: chrStart, pos: chrStartPos } = genomicStart;
  const { chr: chrEnd, pos: chrEndPos } = genomicEnd;

  /** @type {Array<[chrName: Name, zStart: number, zEnd: number]>} */
  const chrChunks = [];
  if (chrStart === chrEnd) {
    // This tile does _not_ cross a chromosome boundary.
    const chrName = chrStart;
    const zStart = Math.floor(chrStartPos / binSize);
    const zEnd = Math.min(zStart + tileSize, Math.ceil(chrEndPos / binSize));

    chrChunks.push([chrName, zStart, zEnd]);
  } else {
    // This tile does cross a chromosome boundary.
    let zRemaining = tileSize;
    const chrStartIndex = chromSizes.findIndex(
      ([chrName]) => chrName === chrStart,
    );
    const chrEndIndex = chromSizes.findIndex(([chrName]) => chrName === chrEnd);

    // Create a separate chunk for each chromosome that lies within the range.
    for (let chrIndex = chrStartIndex; chrIndex <= chrEndIndex; chrIndex++) {
      /** @type {number} */
      let chrChunkStart;
      /** @type {number} */
      let chrChunkEnd;

      const [currChrName, currChrLen] = chromSizes[chrIndex];

      if (chrIndex < chrEndIndex) {
        // If the current chromosome is before the end chromosome, then we want the chunk to end at the end of the current chromosome.
        if (chrIndex === chrStartIndex) {
          // If this is the start chromosome, we may want to start at somewhere past 0.
          chrChunkStart = chrStartPos;
        } else {
          // If this is not the start chromosome, then it is somewhere in the middle, and we want to start at 0.
          chrChunkStart = 0;
        }
        chrChunkEnd = currChrLen;
      } else {
        // The current chromosome is the end chromosome, so we may want the chunk to end before the end of the chromosome.
        chrChunkStart = 0;
        chrChunkEnd = chrEndPos;
      }

      const zStart = Math.floor(chrChunkStart / binSize);
      const zEnd = Math.min(
        zStart + zRemaining,
        Math.ceil(chrChunkEnd / binSize),
      );

      chrChunks.push([currChrName, zStart, zEnd]);
      zRemaining -= zEnd - zStart;
    }
  }
  return chrChunks;
}

export default genomicRangeToChromosomeChunks;
