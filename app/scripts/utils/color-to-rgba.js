import { color } from 'd3-color';

/**
 * Convert a regular color value (e.g. 'red', '#FF0000', 'rgb(255,0,0)') to a
 * RGBA array, with support for the value "transparent".
 *
 * @param {string} colorValue - An RGB(A) color value to convert.
 * @return {[r: number, g: number, b: number, a: number]} An RGBA array.
 */
const colorToRgba = (colorValue) => {
  if (colorValue === 'transparent') {
    return [255, 255, 255, 0];
  }
  /** @type {import('d3-color').RGBColor} */
  // @ts-expect-error - FIXME: `color` can return many different types
  // depending on the string input. We should probably use a different
  // the more strict `rgb` function instead?
  const c = color(colorValue);
  return [c.r, c.g, c.b, 255];
};

export default colorToRgba;
