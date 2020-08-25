import { NUM_PRECOMP_SUBSETS_PER_1D_TTILE } from '../configs/dense-data-extrema-config';

class DenseDataExtrema1D {
  /**
   * This module efficiently computes extrema of arbitrary subsets of a given data array.
   * The array is subdivided into 'numSubsets' subsets where extrema are precomputed.
   * These values are used to compute extrema given arbitrary start and end indices via
   * the getMinNonZeroInSubset and getMaxNonZeroInSubset methods.
   * @param   {array}  data
   */
  constructor(data) {
    this.epsilon = 1e-6;
    this.data = data;

    this.tileSize = this.data.length; // might not be a power of 2
    this.paddedTileSize = 2 ** Math.ceil(Math.log2(this.tileSize));

    // This controls how many subsets are created and precomputed.
    // Setting numSubsets to 1, is equivalent to no precomputation in
    // most cases
    this.numSubsets = Math.min(
      NUM_PRECOMP_SUBSETS_PER_1D_TTILE,
      this.paddedTileSize,
    );
    this.subsetSize = this.paddedTileSize / this.numSubsets;

    this.subsetMinimums = this.computeSubsetNonZeroMinimums();
    this.subsetMaximums = this.computeSubsetNonZeroMaximums();
    this.minNonZeroInTile = this.getMinNonZeroInTile();
    this.maxNonZeroInTile = this.getMaxNonZeroInTile();
  }

  /**
   * Computes the non-zero minimum in a subset using precomputed values,
   * if possible. data[end] is not considered.
   * @param   {array}  indexBounds  [start, end]
   * @return  {number}  non-zero minium of the subset
   */
  getMinNonZeroInSubset(indexBounds) {
    const start = indexBounds[0];
    const end = indexBounds[1];
    let curMin = Number.MAX_SAFE_INTEGER;

    if (start === 0 && end === this.tileSize) {
      return this.minNonZeroInTile;
    }

    const firstSubsetIndex = Math.ceil(start / this.subsetSize);
    const lastSubsetIndex = Math.floor((end - 1) / this.subsetSize);

    if (firstSubsetIndex >= lastSubsetIndex) {
      // No precomputation was found.
      return this.minNonZero(this.data, start, end);
    }

    // Compute from original data if the beginning is not covered by precomputations
    if (start < firstSubsetIndex * this.subsetSize) {
      curMin = Math.min(
        curMin,
        this.minNonZero(this.data, start, firstSubsetIndex * this.subsetSize),
      );
    }

    // Use the precomputed values
    curMin = Math.min(
      curMin,
      this.minNonZero(this.subsetMinimums, firstSubsetIndex, lastSubsetIndex),
    );

    // Compute from original data if the end is not covered by precomputations
    if (end > lastSubsetIndex * this.subsetSize) {
      curMin = Math.min(
        curMin,
        this.minNonZero(this.data, lastSubsetIndex * this.subsetSize, end),
      );
    }

    return curMin;
  }

  /**
   * Computes the non-zero maximum in a subset using precomputed values,
   * if possible
   * @param   {array}  indexBounds  [start, end]
   * @return  {number}  non-zero maxium of the subset
   */
  getMaxNonZeroInSubset(indexBounds) {
    const start = indexBounds[0];
    const end = indexBounds[1];
    let curMax = Number.MIN_SAFE_INTEGER;

    if (start === 0 && end === this.tileSize) {
      return this.maxNonZeroInTile;
    }

    const firstSubsetIndex = Math.ceil(start / this.subsetSize);
    const lastSubsetIndex = Math.floor((end - 1) / this.subsetSize);

    if (firstSubsetIndex >= lastSubsetIndex) {
      // No precomputation was found.
      return this.maxNonZero(this.data, start, end);
    }

    // Compute from original data if the beginning is not covered by precomputations
    if (start < firstSubsetIndex * this.subsetSize) {
      curMax = Math.max(
        curMax,
        this.maxNonZero(this.data, start, firstSubsetIndex * this.subsetSize),
      );
    }

    // Use the precomputed values
    curMax = Math.max(
      curMax,
      this.maxNonZero(this.subsetMaximums, firstSubsetIndex, lastSubsetIndex),
    );

    // Compute from original data if the end is not covered by precomputations
    if (end > lastSubsetIndex * this.subsetSize) {
      curMax = Math.max(
        curMax,
        this.maxNonZero(this.data, lastSubsetIndex * this.subsetSize, end),
      );
    }

    return curMax;
  }

  /**
   * Precomputes non-zero minimums of subsets of the given data vector
   * @return  {array}  array containing minimums of the regularly subdivided
   *                   data vector
   */
  computeSubsetNonZeroMinimums() {
    const minimums = [];

    for (let i = 0; i < this.numSubsets; i++) {
      let curMin = Number.MAX_SAFE_INTEGER;

      for (let j = 0; j < this.subsetSize; j++) {
        const x = this.data[i * this.subsetSize + j];
        // if the tilesize is not a power of 2 we might access
        // a value that is not there
        if (x === undefined) {
          continue;
        }

        if (x < this.epsilon && x > -this.epsilon) {
          continue;
        }
        if (x < curMin) {
          curMin = x;
        }
      }
      minimums.push(curMin);
    }
    return minimums;
  }

  /**
   * Precomputes non-zero maximums of subsets of the given data vector
   * @return  {array}  array containing maximums of the regularly subdivided
   *                   data vector
   */
  computeSubsetNonZeroMaximums() {
    const maximums = [];

    for (let i = 0; i < this.numSubsets; i++) {
      let curMax = Number.MIN_SAFE_INTEGER;

      for (let j = 0; j < this.subsetSize; j++) {
        const x = this.data[i * this.subsetSize + j];
        // if the tilesize is not a power of 2 we might access
        // a value that is not there
        if (x === undefined) {
          continue;
        }

        if (x < this.epsilon && x > -this.epsilon) {
          continue;
        }
        if (x > curMax) {
          curMax = x;
        }
      }
      maximums.push(curMax);
    }
    return maximums;
  }

  /**
   * Computes the non-zero minimum in the entire data array using precomputed values
   * @return  {number}  non-zeros maximum of the data
   */
  getMinNonZeroInTile() {
    return Math.min(...this.subsetMinimums);
  }

  /**
   * Computes the non-zero maximum in the entire data array using precomputed values
   * @return  {number}  non-zeros maximum of the data
   */
  getMaxNonZeroInTile() {
    return Math.max(...this.subsetMaximums);
  }

  /**
   * Calculate the minimum non-zero value in the data from start
   * to end. No precomputations are used to compute the min.
   *
   * @param {Float32Array} data
   * @param {int} start
   * @param {int} end
   * @return {number} non-zero min in subset
   */
  minNonZero(data, start, end) {
    let minNonZeroNum = Number.MAX_SAFE_INTEGER;

    for (let i = start; i < end; i++) {
      const x = data[i];

      if (x < this.epsilon && x > -this.epsilon) {
        continue;
      }

      if (x < minNonZeroNum) {
        minNonZeroNum = x;
      }
    }

    return minNonZeroNum;
  }

  /**
   * Calculate the maximum non-zero value in the data from start
   * to end. No precomputations are used to compute the max.
   *
   * @param {Float32Array} data
 ` * @param {int} start
   * @param {int} end
   * @return {number} non-zero max in subset
   */
  maxNonZero(data, start, end) {
    let maxNonZeroNum = Number.MIN_SAFE_INTEGER;

    for (let i = start; i < end; i++) {
      const x = data[i];

      if (x < this.epsilon && x > -this.epsilon) {
        continue;
      }

      if (x > maxNonZeroNum) {
        maxNonZeroNum = x;
      }
    }

    return maxNonZeroNum;
  }
}

export default DenseDataExtrema1D;
