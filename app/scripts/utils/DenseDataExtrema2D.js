import ndarray from 'ndarray';
import { NUM_PRECOMP_SUBSETS_PER_2D_TTILE } from '../configs';

/**
 * @typedef View2D
 * @property {(i: number, j: number) => number} get
 * @property {(i: number, j: number, v: number) => void} set
 */

class DenseDataExtrema2D {
  /**
   * This module efficiently computes extrema of subsets of a given data matrix.
   * The matrix is subdivided into 'numSubsets' subsets where extrema are precomputed.
   * These values are used to efficiently approximate extrema given arbitrary subsets.
   * Larger values of 'numSubsets' lead to more accurate approximations (more expensive).
   *
   * @param {ArrayLike<number>} data array of quadratic length
   */
  constructor(data) {
    /** @type {number} */
    this.epsilon = 1e-6;
    /** @type {number} */
    this.tileSize = Math.sqrt(data.length);

    if (!Number.isSafeInteger(this.tileSize)) {
      console.error(
        'The DenseDataExtrema2D module only works for data of quadratic length.',
      );
    }

    // if this.numSubsets == this.tilesize the extrema are computed exactly (expensive).
    /** @type {number} */
    this.numSubsets = Math.min(NUM_PRECOMP_SUBSETS_PER_2D_TTILE, this.tileSize);
    /** @type {number} */
    this.subsetSize = this.tileSize / this.numSubsets;

    // Convert data to 2d array
    /** @type {View2D} */
    const dataMatrix = ndarray(Array.from(data), [
      this.tileSize,
      this.tileSize,
    ]);

    /** @type {View2D} */
    this.subsetMinimums = this.computeSubsetNonZeroMinimums(dataMatrix);
    /** @type {View2D} */
    this.subsetMaximums = this.computeSubsetNonZeroMaximums(dataMatrix);
    /** @type {number} */
    this.minNonZeroInTile = this.getMinNonZeroInTile();
    /** @type {number} */
    this.maxNonZeroInTile = this.getMaxNonZeroInTile();
  }

  /**
   * Computes an approximation of the non-zero minimum in a subset
   *
   * @param {[startX: number, startY: number, endX: number, endY: number]} indexBounds
   * @return {number} Non-zero minium of the subset
   */
  getMinNonZeroInSubset(indexBounds) {
    const startX = indexBounds[0];
    const startY = indexBounds[1];
    const endX = indexBounds[2];
    const endY = indexBounds[3];

    // transform indices to the corresponding entries in the
    // precomputed minimum matrix
    const rowOffsetStart = Math.floor(startY / this.subsetSize);
    const colOffsetStart = Math.floor(startX / this.subsetSize);
    const height = Math.ceil((endY + 1) / this.subsetSize) - rowOffsetStart;
    const width = Math.ceil((endX + 1) / this.subsetSize) - colOffsetStart;

    const min = this.getMinNonZeroInNdarraySubset(
      this.subsetMinimums,
      rowOffsetStart,
      colOffsetStart,
      width,
      height,
    );

    return min;
  }

  /**
   * Computes an approximation of the non-zero maximum in a subset
   *
   * @param {[startX: number, startY: number, endX: number, endY: number]} indexBounds
   * @return {number} Non-zero maxium of the subset
   */
  getMaxNonZeroInSubset(indexBounds) {
    const startX = indexBounds[0];
    const startY = indexBounds[1];
    const endX = indexBounds[2];
    const endY = indexBounds[3];

    // transform indices to the corresponding entries in the
    // precomputed maximum matrix
    const rowOffsetStart = Math.floor(startY / this.subsetSize);
    const colOffsetStart = Math.floor(startX / this.subsetSize);
    const height = Math.ceil((endY + 1) / this.subsetSize) - rowOffsetStart;
    const width = Math.ceil((endX + 1) / this.subsetSize) - colOffsetStart;

    const max = this.getMaxNonZeroInNdarraySubset(
      this.subsetMaximums,
      rowOffsetStart,
      colOffsetStart,
      width,
      height,
    );

    return max;
  }

  /**
   * Precomputes non-zero minimums of subsets of a given matrix
   * @param {View2D} dataMatrix
   * @return {View2D} Matrix containing minimums of the dataMatrix after subdivision using a regular grid
   */
  computeSubsetNonZeroMinimums(dataMatrix) {
    const minimums = ndarray(new Array(this.numSubsets ** 2), [
      this.numSubsets,
      this.numSubsets,
    ]);

    for (let i = 0; i < this.numSubsets; i++) {
      for (let j = 0; j < this.numSubsets; j++) {
        const curMin = this.getMinNonZeroInNdarraySubset(
          dataMatrix,
          i * this.subsetSize,
          j * this.subsetSize,
          this.subsetSize,
          this.subsetSize,
        );
        minimums.set(i, j, curMin);
      }
    }
    return minimums;
  }

  /**
   * Precomputes non-zero maximums of subsets of a given matrix
   *
   * @param {View2D} dataMatrix
   * @return {View2D} Matrix containing maximums of the dataMatrix after subdivision using a regular grid
   */
  computeSubsetNonZeroMaximums(dataMatrix) {
    const maximums = ndarray(new Array(this.numSubsets ** 2), [
      this.numSubsets,
      this.numSubsets,
    ]);

    for (let i = 0; i < this.numSubsets; i++) {
      for (let j = 0; j < this.numSubsets; j++) {
        const curMax = this.getMaxNonZeroInNdarraySubset(
          dataMatrix,
          i * this.subsetSize,
          j * this.subsetSize,
          this.subsetSize,
          this.subsetSize,
        );
        maximums.set(i, j, curMax);
      }
    }
    return maximums;
  }

  /**
   * Computes the non-zero minimum of a subset of a matrix (ndarray)
   * @param {View2D} arr
   * @param {number} rowOffset - Starting row of the subset
   * @param {number} colOffset - Starting column of the subset
   * @param {number} width - Width (num columns) of the subset
   * @param {number} height - Height (num rows) of the subset
   * @return {number} Non-zeros - minimum of the subset
   */
  getMinNonZeroInNdarraySubset(arr, rowOffset, colOffset, width, height) {
    let curMin = Number.MAX_SAFE_INTEGER;

    for (let k = 0; k < width; k++) {
      for (let l = 0; l < height; l++) {
        const x = arr.get(rowOffset + l, colOffset + k);
        if (x < this.epsilon && x > -this.epsilon) {
          continue;
        }
        if (x < curMin) {
          curMin = x;
        }
      }
    }

    return curMin;
  }

  /**
   * Computes the non-zero maximum of a subset of a matrix (ndarray)
   * @param {View2D} arr
   * @param {number} rowOffset - Starting row of the subset
   * @param {number} colOffset - Starting column of the subset
   * @param {number} width - Width (num columns) of the subset
   * @param {number} height - Height (num rows) of the subset
   * @return {number} Non-zeros maximum of the subset
   */
  getMaxNonZeroInNdarraySubset(arr, rowOffset, colOffset, width, height) {
    let curMax = Number.MIN_SAFE_INTEGER;

    for (let k = 0; k < width; k++) {
      for (let l = 0; l < height; l++) {
        const x = arr.get(rowOffset + l, colOffset + k);
        if (x < this.epsilon && x > -this.epsilon) {
          continue;
        }
        if (x > curMax) {
          curMax = x;
        }
      }
    }

    return curMax;
  }

  mirrorPrecomputedExtrema() {
    for (let row = 1; row < this.numSubsets; row++) {
      for (let col = 0; col < row; col++) {
        this.subsetMinimums.set(col, row, this.subsetMinimums.get(row, col));
        this.subsetMaximums.set(col, row, this.subsetMaximums.get(row, col));
      }
    }
  }

  /**
   * Computes the non-zero minimum in the entire data array using precomputed values
   *
   * @return {number} Non-zeros minimum of the data
   */
  getMinNonZeroInTile() {
    return this.getMinNonZeroInNdarraySubset(
      this.subsetMinimums,
      0,
      0,
      this.numSubsets,
      this.numSubsets,
    );
  }

  /**
   * Computes the non-zero maximum in the entire data array using precomputed values
   *
   * @return {number} Non-zeros maximum of the data
   */
  getMaxNonZeroInTile() {
    return this.getMaxNonZeroInNdarraySubset(
      this.subsetMaximums,
      0,
      0,
      this.numSubsets,
      this.numSubsets,
    );
  }
}

export default DenseDataExtrema2D;
