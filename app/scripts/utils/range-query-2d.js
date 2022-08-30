import addArrays from './add-arrays';
import accessorTransposition from './accessor-transposition';

/**
 * Perform a 2D query on a 1D array
 *
 * @param  {Array}  src  Data source array.
 * @param  {Integer}  xDimSrc  X dimension of `src`.
 * @param  {Integer}  xDimOut  X dimension of `outList`.
 * @param  {Array}  xRange  X range array, e.g., `[start, end]`.
 * @param  {Array}  yRange  Y range array, e.g., `[start, end]`.
 * @param  {Integer}  xOff  X offset in regards to `outList`.
 * @param  {Integer}  yOff  Y offset in regards to `outList`.
 * @param  {Boolean}  mirrored  If `true` mirror query.
 * @param  {Array}  outList  Typed array to be set in place.
 *        1D representation of a 2D array (e.g. ass = new Uint8ClampedArray(10);)
 * @return  {Array}  Sub array.
 */
const rangeQuery2d = (
  src,
  xDimSrc,
  xDimOut,
  xRange,
  yRange,
  mirrored,
  /* eslint-disable-next-line default-param-last */
  xOff = 0,
  /* eslint-disable-next-line default-param-last */
  yOff = 0,
  outList,
) => {
  const _xRange = mirrored ? yRange : xRange;
  const _yRange = mirrored ? xRange : yRange;
  const _xOff = mirrored ? yOff : xOff;
  const _yOff = mirrored ? xOff : yOff;

  const xFrom = Math.max(0, +_xRange[0] || 0);
  const xTo = Math.max(0, +_xRange[1] || 0);
  const yFrom = Math.max(0, +_yRange[0] || 0);
  const yTo = Math.max(0, +_yRange[1] || 0);

  let subList = [];

  if (!ArrayBuffer.isView(outList)) {
    console.warn('Not supported yet');
  }

  try {
    const newList = new outList.constructor(outList.length);
    let c = 0 + _yOff;
    for (let i = yFrom; i < yTo; i++) {
      newList.set(
        src.slice(i * xDimSrc + xFrom, i * xDimSrc + xTo),
        _xOff + c * xDimOut,
      );
      c += 1;
    }
    const acc = mirrored ? accessorTransposition(xDimOut, xDimOut) : undefined;
    subList = addArrays(outList, newList, acc);
  } catch (e) {
    // console.warn('Invalid 2D query', e);
  }

  return subList;
};

export default rangeQuery2d;
