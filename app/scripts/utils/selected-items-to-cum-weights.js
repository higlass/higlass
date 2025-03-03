import selectedItemsToSize from './selected-items-to-size';

/**
 * Compute the cumulative sum of an array of numbers.
 * @param {Array<number>} values - The array of numbers to sum.
 * @returns {Float64Array} The array of cumulative sums.
 */
function cumsum(values) {
  let sum = 0;
  /** @type {number[]} */
  const result = [];
  values.forEach((v) => {
    sum += +v || 0;
    result.push(sum);
  });
  return Float64Array.from(result);
}

/**
 * Compute the cumulative normalized weights associated with a
 * potentially 2d array of selected item indices.
 *
 * @param {Array<unknown>} selectedItems - The 1d or 2d array of items or groups of items.
 * @param {boolean} withRelativeSize - Does a group of indices count as 1 unit size or is its size relative to the group size?
 * @returns {Float64Array} The array of cumulative weights, one for each item.
 *
 * Sums to 1 before the cumulative sum step (i.e. the final array element will be 1).
 */
const selectedItemsToCumWeights = (selectedItems, withRelativeSize) => {
  const totalLength = selectedItemsToSize(selectedItems, withRelativeSize);
  return cumsum(
    selectedItems.map(
      (d) =>
        (Array.isArray(d) && withRelativeSize ? d.length : 1) / totalLength,
    ),
  );
};

export default selectedItemsToCumWeights;
