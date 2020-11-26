/**
 * Factory function for a transposition accessor for a 2D matrix in form of a 1D
 * array.
 *
 * @description
 * i^T = column * i + row
 * where column: `Math.floor(i / x)` and row: `Math.floor(i / x)`
 *
 * @param  {Integer}  x  X dimension of the 2D matrix
 * @param  {Integer}  y  Y dimension of the 2D matrix
 * @return  {Function}   Acessor function converting the orignal 1D index into
 *   the transposed index
 */
const accessorTransposition = (x, y) => (i) => (i % x) * y + Math.floor(i / x);

export default accessorTransposition;
