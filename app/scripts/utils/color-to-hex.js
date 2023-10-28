import { color } from 'd3-color';

// Configs
import { GLOBALS } from '../configs';

/**
 * Convert a regular color value (e.g. 'red', '#FF0000', 'rgb(255,0,0)') to a
 * hex value which is legible by PIXI
 *
 * @param {string} colorValue - Color value to convert
 * @return {number} Hex value
 */
const colorToHex = (colorValue) => {
  /** @type {import('d3-color').RGBColor} */
  // @ts-expect-error - FIXME: `color` can return many different types
  // depending on the string input. We should probably use a different
  // the more strict `rgb` function instead?
  const c = color(colorValue);
  const hex = GLOBALS.PIXI.utils.rgb2hex([
    c.r / 255.0,
    c.g / 255.0,
    c.b / 255.0,
  ]);

  return hex;
};

export default colorToHex;
