import reduce from './reduce';

const flatten = reduce((a, b) => a.concat(b), []);

export default flatten;
