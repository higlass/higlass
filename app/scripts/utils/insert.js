import indexOf from './index-of';

const insert = (array, value) => array.splice(indexOf(array, value), 0, value);

export default insert;
