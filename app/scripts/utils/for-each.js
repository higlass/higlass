/**
 * Functional version of `Array.forEach`. More flexible and applicable to
 *   other array-like data types.
 * @param   {function}  f  Modifier function applied on every item of the
 *   array.
 * @return  {*}  Modified array-like variable.
 */
const forEach = (f) => (x) => Array.prototype.forEach.call(x, f);

export default forEach;
