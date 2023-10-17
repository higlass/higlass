/**
 * Return an array of (key,value) pairs that are present in this
 * dictionary
 *
 * @template T
 * @param {T} dictionary
 *
 * @returns {{ [Key in keyof T]: [Key, T[Key]] }[keyof T][]}
 */
const dictItems = (dictionary) => {
  const keyValues = [];

  for (const key in dictionary) {
    if (dictionary.hasOwnProperty(key)) {
      keyValues.push([key, dictionary[key]]);
    }
  }

  return keyValues;
};

export default dictItems;
