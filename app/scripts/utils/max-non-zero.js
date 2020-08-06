const epsilon = 0.0000001;

export default function maxNonZero(data) {
  /**
   * Calculate the minimum non-zero value in the data
   *
   * Parameters
   * ----------
   *  data: Float32Array
   *    An array of values
   *
   * Returns
   * -------
   *  minNonZero: float
   *    The minimum non-zero value in the array
   */
  let maxNonZeroNum = Number.MIN_SAFE_INTEGER;

  for (let i = 0; i < data.length; i++) {
    const x = data[i];

    if (x < epsilon && x > -epsilon) {
      continue;
    }

    if (x > maxNonZeroNum) {
      maxNonZeroNum = x;
    }
  }

  return maxNonZeroNum;
}
