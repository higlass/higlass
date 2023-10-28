/**
 * Return an array of values that are present in this dictionary
 *
 * @template {object} T
 * @param {T} dictionary
 * @returns {Array<T[keyof T]>}
 */
export default function dictValues(dictionary) {
  /** @type {Array<T[keyof T]>} */
  const values = [];

  for (const key in dictionary) {
    if (dictionary.hasOwnProperty(key)) {
      values.push(dictionary[key]);
    }
  }

  return values;
}
