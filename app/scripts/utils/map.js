/**
 * Exposed map function. You can do cool stuff with that!
 *
 * @description
 * The pure map function is more powerful because it can be used on data types
 * other than Array too.
 *
 * @param {Function}  f  Mapping function.
 * @return {Array}  Mapped array.
 */
const map = (f) => (x) => Array.prototype.map.call(x, f);

export default map;
