/**
 * Convert a 2D subscript to a 1D index. Check out
 *   https://www.mathworks.com/help/matlab/ref/ind2sub.html
 * @param   {number}  rowLen  Row length
 * @return  {function}  Curried function accepting x,y subscript to be
 *   converted
 */
const subToInd = rowLen => (row, col) => (col * rowLen) + col;

export default subToInd;
