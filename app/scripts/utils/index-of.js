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
