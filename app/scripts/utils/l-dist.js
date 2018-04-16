/**
 * Distance of two vectors. The Eucledian distance is used by default.
 * @param   {array}  X  Vector of po
 * @param   {number}  l  Norm of the distance. E.g., Eucledian when `l=2`.
 * @return  {number}  Distance between the 2 vectors.
 */
const lDist = (X, Y, l = 2) => {
  if (X.length !== Y.length) return -1;

  return X.reduce((sum, x, i) => sum + ((x - Y[i]) ** l), 0) ** (1 / l);
};

export default lDist;
