import indexOf from './index-of';

/**
 * Insert a number into a sorted array of numbers by complying to the sorting.
 * @param   {array}  array  Numerical array.
 * @param   {number}  value  Number ot be inserted.
 * @return  {array}  New array with the inserted number.
 */
const insert = (array, value) => array.splice(indexOf(array, value), 0, value);

export default insert;
