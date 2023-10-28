/**
 * Convert a HEX string into a HEX integer.
 *
 * @example
 * ```js
 * // returns 16711680
 * hexStrToInt("#FF0000");
 * ```
 *
 * @param {string} str - HEX string
 * @return {number} An (integer) HEX number
 */
const hexStrToInt = (str) => parseInt(str.replace(/^#/, ''), 16);

export default hexStrToInt;
