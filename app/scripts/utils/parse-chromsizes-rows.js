/**
 * Parse an array of chromsizes, for example that result
 * from reading rows of a chromsizes CSV file.
 * @param {array} data Array of [chrName, chrLen] "tuples".
 * @returns {object} Object containing properties
 * { cumPositions, chrPositions, totalLength, chromLengths }.
 */
function parseChromsizesRows(data) {
  const cumValues = [];
  const chromLengths = {};
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
