/**
 * Return an array of values that are present in this dictionary
 *
 * @template {object} T
 * @param {T} dictionary
 * @returns {Array<T[keyof T]>}
 */
export default function dictValues(dictionary) {
  return Object.values(dictionary);
}
