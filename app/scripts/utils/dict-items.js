/**
 * @template T
 * @typedef {Array<{ [Key in keyof T]: [Key, T[Key]] }[keyof T]>} DictItems
 */

/**
 * Return an array of (key,value) pairs that are present in this
 * dictionary
 *
 * TODO(Trevor): Replace with `Object.entries`?
 *
 * @template {object} T
 * @param {T} dictionary
 *
 * @returns {DictItems<T>}
 */
const dictItems = (dictionary) => {
  /** @type {DictItems<T>} */
  const keyValues = [];

  for (const key in dictionary) {
    if (dictionary.hasOwnProperty(key)) {
      keyValues.push([key, dictionary[key]]);
    }
  }

  return keyValues;
};

export default dictItems;
