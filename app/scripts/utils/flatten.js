import reduce from './reduce';

/**
 * Function for flattening a nested array. It returns a curried reducer.
 * @param   {array}  Nested array
 * @return  {array}  Flatt array
 */
const flatten = reduce((a, b) => a.concat(b), []);

export default flatten;
