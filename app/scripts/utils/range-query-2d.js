import { addArrays, accessorTransposition } from '.';

/**
 * Perform a 2D query on a 1D array
 *
 * @param  {Array}  source  Source array
 * @param  {Integer}  xDim  X dimension
 * @param  {Array}  xRange  X range array, e.g., `[start, end]`.
 * @param  {Array}  yRange  Y range array, e.g., `[start, end]`.
 * @param  {Boolean}  mirrored  If `true` mirror query.
 * @param  {Array}  outList  Typed array to be set in place.
 * @return  {Array}  Sub array.
 */
const rangeQuery2d = (source, xDim, xRange, yRange, mirrored, outList) => {
  const _xRange = mirrored ? yRange : xRange;
  const _yRange = mirrored ? xRange : yRange;

  const xFrom = Math.max(0, +_xRange[0] || 0);
  const xTo = Math.max(0, +_xRange[1] || 0);
  const yFrom = Math.max(0, +_yRange[0] || 0);
  const yTo = Math.max(0, +_yRange[1] || 0);
  const xLen = xTo - xFrom;

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
    const acc = mirrored
      ? accessorTransposition(xLen, xLen) : undefined;
    subList = addArrays(outList, newList, acc);
  } else {
    for (let i = yFrom; i < yTo; i++) {
      subList.push(...source.slice((i * xDim) + xFrom, (i * xDim) + xTo));
    }
  }

  return subList;
};

export default rangeQuery2d;
