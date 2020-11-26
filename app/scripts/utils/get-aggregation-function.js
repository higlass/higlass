import { mean, sum, variance, deviation } from 'd3-array';

/**
 * Get an aggregation function from a function name.
 * @param {string} name The name of an aggregation function
 * ('mean', 'sum', 'variance', 'deviation'). If an unknown string is passed,
 * the mean function will be used, and a console warning will be thrown.
 * @returns {function} The function of interest as determined by the string,
 */
const getAggregationFunction = (name) => {
  let aggFunc;
  const lowerCaseName = name ? name.toLowerCase() : name;
  switch (lowerCaseName) {
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
      aggFunc = mean;
      console.warn(
        'Encountered an unsupported selectedRowsAggregationMode option.',
      );
  }
  return aggFunc;
};

export default getAggregationFunction;
