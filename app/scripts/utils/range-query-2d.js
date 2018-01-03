import { addArrays } from '.';

/**
 * Perform a 2D query on a 1D array
 *
 * @param  {Array}  source  Source array
 * @param  {Integer}  xDim  X dimension
 * @param  {Array}  xRange  X range array, e.g., `[start, end]`.
 * @param  {Array}  yRange  Y range array, e.g., `[start, end]`.
 * @param  {Array}  outList  Typed array to be set in place.
 * @return  {Array}  Sub array.
 */
const rangeQuery2d = (source, xDim, xRange, yRange, outList) => {
  const xFrom = Math.max(0, +xRange[0] || 0);
  const xTo = Math.max(0, +xRange[1] || 0);
  const xLen = xTo - xFrom;
  const yFrom = Math.max(0, +yRange[0] || 0);
  const yTo = Math.max(0, +yRange[1] || 0);

  let subList = [];

  if (ArrayBuffer.isView(outList)) {
    const newList = new outList.constructor(outList.length);
    let c = 0;
    for (let i = yFrom; i < yTo; i++) {
      newList.set(
        source.slice((i * xDim) + xFrom, (i * xDim) + xTo),
        c * xLen
      );
      c += 1;
    }
    subList = addArrays(outList, newList);
  } else {
    for (let i = yFrom; i < yTo; i++) {
      subList.push(...source.slice((i * xDim) + xFrom, (i * xDim) + xTo));
    }
  }

  return subList;
};

export default rangeQuery2d;
