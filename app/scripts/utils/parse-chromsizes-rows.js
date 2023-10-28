/** @typedef {[string, number]} ChromsizeRow */

/**
 * @typedef CumulativeChromsizeEntry
 * @property {number} id
 * @property {string} chr
 * @property {number} pos
 */

/**
 * @typedef ParsedChromsizes
 * @property {CumulativeChromsizeEntry[]} cumPositions
 * @property {Record<string, CumulativeChromsizeEntry>} chrPositions
 * @property {number} totalLength
 * @property {Record<string, number>} chromLengths
 */

/**
 * Parse an array of chromsizes, for example that result from reading rows of a chromsizes CSV file.
 *
 * @param {ArrayLike<ChromsizeRow>} data - Array of [chrName, chrLen] "tuples".
 * @returns {ParsedChromsizes}
 */
function parseChromsizesRows(data) {
  /** @type {Array<CumulativeChromsizeEntry>} */
  const cumValues = [];
  /** @type {Record<string, number>} */
  const chromLengths = {};
  /** @type {Record<string, CumulativeChromsizeEntry>} */
  const chrPositions = {};

  let totalLength = 0;

  for (let i = 0; i < data.length; i++) {
    const length = Number(data[i][1]);
    totalLength += length;

    const newValue = {
      id: i,
      chr: data[i][0],
      pos: totalLength - length,
    };

    cumValues.push(newValue);
    chrPositions[newValue.chr] = newValue;
    chromLengths[data[i][0]] = length;
  }

  return {
    cumPositions: cumValues,
    chrPositions,
    totalLength,
    chromLengths,
  };
}

export default parseChromsizesRows;
