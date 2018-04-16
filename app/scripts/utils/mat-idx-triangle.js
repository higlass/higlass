const cache = {};

/**
 * Compute the indicies for the upper right or lower left bins of a matrix
 * @param   {number}  dim  Dimension of the matrix. Currently only squared
 *   matrices are supported.
 * @param   {string}  orient  Orientation. Either `upper-right` or
 *   `lower-left`.
 * @return  {array}  Array if the corresponding indices.
 */
const matIdxTriangle = (dim, orient = 'upper-right') => {
  const cached = cache[`${dim}.${orient}`];
  if (cached) return cached;

  const idx = [];

  for (let i = 0; i < dim; i++) {
    for (let j = i + 1; j < dim; j++) {
      if (orient === 'upper-right') {
        idx.push((i * dim) + j);
      } else {
        idx.push((j * dim) + i);
      }
    }
  }

  cache[`${dim}.${orient}`] = idx;

  return idx;
};

export default matIdxTriangle;
