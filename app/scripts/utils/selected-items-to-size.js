/**
 * Compute the size associated with a potentially 2d array of selected item indices.
 * For example, this can be used to compute the total height of a `horizontal-multivec` track
 * where rows are selected individually or in aggregation groups.
 * @param {array} selectedItems The 1d or 2d array of items or groups of items.
 * @param {boolean} withRelativeSize Does a group of indices count as 1 unit size
 * or is its size relative to the group size?
 * @returns {number} The computed size value.
 * Between 0 and the total number of items in the (flattened) input array.
 */
const selectedItemsToSize = (selectedItems, withRelativeSize) => selectedItems.reduce(
    (a, h) => a + (Array.isArray(h) && withRelativeSize ? h.length : 1),
    0,
  );

export default selectedItemsToSize;
