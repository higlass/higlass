import { map } from '.';

const objVals = obj => map(key => obj[key])(Object.keys(obj));

export default objVals;
