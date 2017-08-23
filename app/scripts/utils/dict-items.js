/**
 * Return an array of (key,value) pairs that are present in this
 * dictionary
 */
const dictItems = (dictionary) => {
  let keyValues = [];

  for (let key in dictionary) {
    if (dictionary.hasOwnProperty(key)) {
      keyValues.push([key, dictionary[key]]);
    }
  }

  return keyValues;
}

export default dictItems;
