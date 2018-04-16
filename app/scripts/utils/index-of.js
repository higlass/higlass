/**
 * Binary search version of `Array.indexOf` for numerical arrays. Returns the
 *   first index at which the searched number could be inserted without
 *   destroying the sortedness. E.g.:
 *   ```
 *   indexOf([1,1,2,3,5,8], 3) ==> 3
 *   indexOf([1,1,2,3,5,8], 4) ==> 4
 *   indexOf([1,1,2,3,5,8], 9) ==> 6
 *   indexOf([1,1,2,3,5,8], 0) ==> 0
 *   ```
 * @param   {array}  array  Numerical and sorted array, e.g., `[1,1,2,3,5,8]`.
 * @param   {number}  value  A number to be searched, e.g., `4`.
 * @return  {number}  first index at which the searched number could be
 *   inserted without destroying the sortedness.
 */
const indexOf = (array, value) => {
  let low = 0;
  let high = array.length;
  let mid;

  while (low < high) {
    mid = (low + high) >>> 1;
    if (array[mid] < value) low = mid + 1;
    else high = mid;
  }
  return low;
};

export default indexOf;
