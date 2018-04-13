/**
 * Get the value at a certain percentile. Check out
 *   scipy.stats.scoreatpercentile if you want to know more
 * @param   {array}  arr  Numerical array
 * @param   {value}  p  Percentile.
 * @return  {value}  Value at `p`.
 */
const scoreAtPercentile = (arr, p) => {
  if (arr.length === 0) return 0;
  if (typeof p !== 'number') throw new TypeError('p must be a number');
  if (p <= 0) return arr[0];
  if (p >= 1) return arr[arr.length - 1];

  const index = (arr.length - 1) * p;
  const lower = Math.floor(index);
  const upper = lower + 1;
  const weight = index % 1;

  if (upper >= arr.length) return arr[lower];
  return (arr[lower] * (1 - weight)) + (arr[upper] * weight);
};

export default scoreAtPercentile;
