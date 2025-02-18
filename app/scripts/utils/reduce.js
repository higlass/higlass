/**
 * Pure functional reducer. Can be used for currying stuff.
 *
 * @see {@link ./flatten.js}
 *
 * @template T
 * @template U
 *
 * @param {(previousValue: U, currentValue: T, currentIndex: number, array: Array<T>) => U} callbackfn
 * @param {U} initialValue
 * @return {(x: Array<T>) => U}  Curried function that accepts an array to be reduced.
 */
const reduce = (callbackfn, initialValue) => (x) =>
  x.reduce(callbackfn, initialValue);

// TODO(Trevor): Not referenced anywhere. Remove?
export default reduce;
