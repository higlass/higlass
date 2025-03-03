/**
 * Functional version of `Array.forEach`. More flexible and applicable to other array-like data types.
 *
 * @template T
 * @param {<T>(item: T) => void} f - Modifier function applied on every item of the array.
 * @return {(arr: ArrayLike<T>) => void} Modified array-like variable.
 */
const forEach = (f) => (x) => Array.prototype.forEach.call(x, f);

// TODO(Trevor): Not referenced anywhere. Remove?
export default forEach;
