/**
 * Factory function for a value to RGB color converter
 *
 * @template T
 * @param {(value: number) => number} valueScale - Value scaling function.
 * @param {Array<T>} colorScale - Color scale array.
 * @param {number} pseudoCounts - Pseudo counts used as a pseudocount to prevent taking the log of 0.
 * @param {number} eps - Epsilon.
 * @return {(value: number) => T} RGB color array.
 */
const valueToColor =
  (valueScale, colorScale, pseudoCounts = 0, eps = 0.000001) =>
  (value) => {
    let rgbIdx = 255;

    if (value > eps) {
      // values less than espilon are considered NaNs and made transparent
      // (rgbIdx 255)
      rgbIdx = Math.max(
        0,
        Math.min(255, Math.floor(valueScale(value + pseudoCounts))),
      );
    }

    return colorScale[rgbIdx];
  };

export default valueToColor;
