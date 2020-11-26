import { map } from '.';

/**
 * Convert an object into array which entries are the prop values of the object
 *
 * @param {Object}  obj  Object to be arrayified
 * @return {Array}  Array of the object.
 */
const objVals = (obj) => map((key) => obj[key])(Object.keys(obj));

export default objVals;
