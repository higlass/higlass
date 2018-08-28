const ndarrayFlatten = (arr) => {
  const Y = arr.shape[0];
  const X = arr.shape[1];
  const size = Y * X;
  const flattened = new Array(size);

  for (let i = 0; i < Y; ++i) {
    for (let j = 0; j < X; ++j) {
      flattened[(i * X) + j] = arr.get(i, j);
    }
  }

  return flattened;
};

export default ndarrayFlatten;
