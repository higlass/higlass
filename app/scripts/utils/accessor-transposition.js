/**
 * Factory function for a transposition accessor for a 2D matrix in form of a 1D
 * array.
 *
 * @description
 * i^T = column * i + row
 * where column: `Math.floor(i / x)` and row: `Math.floor(i / x)`
 *
 * @param {number} x - X dimension of the 2D matrix
 * @param {number} y - Y dimension of the 2D matrix
 * @return {(index: number) => number} Accessor function converting the orignal 1D index into the transposed index
 */
const accessorTransposition = (x, y) => (i) => (i % x) * y + Math.floor(i / x);

export default accessorTransposition;
