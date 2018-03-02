// Based on https://jsperf.com/math-min-max-vs-ternary-vs-if/24 `Math.min`
// is not very fast

const min = (a, b) => (a < b ? a : b);

export default min;
