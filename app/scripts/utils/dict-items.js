/**
 * Return an array of (key,value) pairs that are present in this
 * dictionary
 */
const dictItems = (dictionary) => {
  const keyValues = [];

  for (const key in dictionary) {
    if (dictionary.hasOwnProperty(key)) {
      // eslint-disable-line no-prototype-builtins
      keyValues.push([key, dictionary[key]]);
    }
  }

  return keyValues;
};

export default dictItems;
