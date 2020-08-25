/**
 * Pure functional reducer. Can be used for currying stuff. Check out
 *   `flatten.js`.
 * @param   {function}  f  Reducer function.
 * @return  {array}  Curried function that accepts an array to be reduced.
 */
const reduce = (f) => (x) => Array.prototype.reduce.call(x, f);

export default reduce;
