/**
 * Add two 1D arrays
 *
 * @description
 * `a2` is added onto `a1`, hence `a2` needs to be at least as long as `a1`.
 *
 * @example
 * ```
 * addArrays([1,2,3], [2,3,4,5]) == [3,5,7]
 * ```
 *
 * @param  {Array}  a1  First array of numbers
 * @param  {Array}  a2  Second array of numbers
 * @return  {Array}  Combination of both arrays.
 */
const addArrays = (a1, a2) => a1.map((val, i) => val + a2[i]);

export default addArrays;
