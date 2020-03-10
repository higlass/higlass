import { mean, sum, variance, deviation } from 'd3-array';

/**
 * Get an aggregation function from a function name.
 * @param {string} name The name of an aggregation function
 * ('mean', 'sum', 'variance', 'deviation').
 * @returns {function} The function of interest as determined by the string,
 * or undefined if the string is unknown.
 */
const getAggregationFunction = name => {
  let aggFunc;
  switch (name.toLowerCase()) {
    case 'mean':
      aggFunc = mean;
      break;
    case 'sum':
      aggFunc = sum;
      break;
    case 'variance':
      aggFunc = variance;
      break;
    case 'deviation':
      aggFunc = deviation;
      break;
    default:
      console.warn(
        'Encountered an unsupported selectedRowsAggregationMode option.'
      );
  }
  return aggFunc;
};

export default getAggregationFunction;
