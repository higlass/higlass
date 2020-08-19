import { color } from 'd3-color';

/**
 * Convert a regular color value (e.g. 'red', '#FF0000', 'rgb(255,0,0)') to a
 * RGBA array, with support for the value "transparent".
 */
const colorToRgba = (colorValue) => {
  if (colorValue === 'transparent') {
    return [255, 255, 255, 0];
  }
  const c = color(colorValue);
  return [c.r, c.g, c.b, 255];
};

export default colorToRgba;
