/**
 * Converts a decimal number to a hex string.
 *
 * @param {number} dec - Decimal number
 * @return {string} Hex string
 */
const decToHexStr = (dec) => (dec + 16 ** 6).toString(16).substr(-6);

export default decToHexStr;
