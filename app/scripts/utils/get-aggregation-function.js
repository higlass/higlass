import { mean, sum, variance, deviation } from 'd3-array';

/** @typedef {(values: number[]) => number | undefined} Aggregation */

/**
 * Get an aggregation function from a function name.
 * @param {'mean' | 'sum' | 'variance' | 'deviation'} name - The type of aggregation.
 * If an unknown string is passed, the mean function will be used (and a warning will be logged).
 * @returns {Aggregation} The function of interest as determined by the string,
 */
const getAggregationFunction = (name) => {
  /** @type {Aggregation} */
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
