// @ts-nocheck
import reduce from './reduce';

/**
 * Function for flattening a nested array. It returns a curried reducer.
 *
 * @template T
 * @param {Array<Array<T>>} Nested array
 * @return {Array<T>} Flat array
 */
const flatten = reduce((a, b) => a.concat(b), []);

// TODO(Trevor): Not referenced anywhere. Remove?
export default flatten;
