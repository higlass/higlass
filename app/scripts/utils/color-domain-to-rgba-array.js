import { range } from 'd3-array';
import { rgb } from 'd3-color';
import { scaleLinear } from 'd3-scale';

/** @typedef {[r: number, g: number, b: number, a: number]} Color */

/**
 * Convert a color domain to a 255 element array of [r,g,b,a]
 * values (all from 0 to 255). The last color (255) will always be
 * transparent
 *
 * @param {readonly [start: string, end: string]} colorRange
 * @param {boolean} noTansparent
 * @returns {Array<Color>}
 */
const colorDomainToRgbaArray = (colorRange, noTansparent = false) => {
  // we should always have at least two values in the color range
  const domain = colorRange.map((x, i) => i * (255 / (colorRange.length - 1)));

  const d3Scale = scaleLinear().domain(domain).range(
    // @ts-expect-error - d3-color types aren't correctly inferred here
    colorRange,
  );

  const fromX = noTansparent ? 255 : 254;

  /** @type {Array<Color>} */
  const rgbaArray = range(fromX, -1, -1)
    .map(d3Scale)
    .map((x) => {
      // @ts-expect-error - d3-color support 0-1 ranges but not in types
      const r = rgb(x);
      return [r.r, r.g, r.b, r.opacity * 255];
    });

  // add a transparent color at the end for missing values and, more
  // importantly, non-existing values such as the empty upper right or lower
  // left triangle of tiles on the diagonal.
  if (rgbaArray.length < 256) rgbaArray.push([255, 255, 255, 0]);

  return rgbaArray;
};

export default colorDomainToRgbaArray;
