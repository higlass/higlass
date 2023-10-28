// @ts-nocheck
import ndarray from 'ndarray';
import ndarrayToList from './ndarray-to-list';

const ndarrayFlatten = (arr) => {
  if (arr.shape.length === 1) return arr;

  return ndarray(ndarrayToList(arr));
};

export default ndarrayFlatten;
