import cwise from 'cwise';

const ndarrayToList = (arr) => {
  const size = arr.shape.reduce((s, x) => s * x, 1);
  const list = new Array(size);

  cwise({
    args: ['array', 'scalar', 'scalar'],
    body: (a, l, i) => {
      l[i] = a; // eslint-disable-line
      i++; // eslint-disable-line
    },
  })(arr, list, 0);

  return list;
};

export default ndarrayToList;
