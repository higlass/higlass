/**
 * Functional version of `Array.forEach`. More flexible and applicable to
 *   other array-like data types like `NodeList`.
 * @param   {function}  f  Modifier function applied on every item of the
 *   array.
 * @return  {*}  Modified array-like variable.
 */
const some = (f) => (x) => Array.prototype.some.call(x, f);

export default some;
