/**
 * @template T
 * @typedef {Array<{ [Key in keyof T]: [Key, T[Key]] }[keyof T]>} DictItems
 */

/**
 * Return an array of (key,value) pairs that are present in this
 * dictionary
 *
 * @template {object} T
 * @param {T} dictionary
 *
 * @returns {DictItems<T>}
 */
const dictItems = (dictionary) => {
  // @ts-expect-error - Correct types for simple objects
  return Object.entries(dictionary);
};

export default dictItems;
