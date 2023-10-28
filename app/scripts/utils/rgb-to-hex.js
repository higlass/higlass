/** @param {number} c */
const componentToHex = (c) => {
  const hex = c.toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
};

/**
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {string}
 */
const rgbToHex = (r, g, b) =>
  `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;

export default rgbToHex;
