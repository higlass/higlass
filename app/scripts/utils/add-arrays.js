const STD_ACC = (i) => i;

/**
 * Add two 1D arrays
 *
 * @description
 * `a2` is added onto `a1`, hence `a2` needs to be at least as long as `a1`.
 *
 * @example
 * ```
 * addArrays([1,2,3], [2,3,4,5]) === [3,5,7]
 * ```
 *
 * @param  {Array}  a1  First array of numbers
 * @param  {Array}  a2  Second array of numbers
 * @param  {Function}  accessor  Allows to use custom accessors. This can be
 *   useful when a2 represents a transformed (e.g., transposed matrix).
 * @return  {Array}  Combination of both arrays.
 */
const addArrays = (a1, a2, accessor = STD_ACC) =>
  a1.map((val, i) => val + a2[accessor(i)]);

export default addArrays;
