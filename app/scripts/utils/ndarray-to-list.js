const ndarrayToList = (arr) => {
  const size = arr.shape.reduce((s, x) => s * x, 1);
  const list = new Array(size);

  if (arr.dimension === 1) {
    let l = 0;
    for (let i = 0; i < arr.shape[0]; ++i) {
      list[l] = arr.get(i);
      l++;
    }
  } else {
    let l = 0;
    for (let i = 0; i < arr.shape[0]; ++i) {
      for (let j = 0; j < arr.shape[1]; ++j) {
        list[l] = arr.get(i, j);
        l++;
      }
    }
  }

  return list;
};

export default ndarrayToList;
