/**
 * Create a dictionary from a list of [key,value] pairs.
 * @param tuples: A list of [key,value] pairs
 * @return: A dictionary
 */
const dictFromTuples = (tuples) => {
  const dict = {};

  tuples.forEach((x) => {
    dict[x[0]] = x[1];
  });

  return dict;
};

export default dictFromTuples;
