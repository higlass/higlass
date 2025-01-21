/**
 * Return an array of keys that are present in this dictionary
 *
 * @template T
 * @param {T} dictionary
 * @returns {Array<keyof T>}
 */
export default function dictKeys(dictionary) {
  // @ts-expect-error - Typing is correct
  return Object.keys(dictionary);
}
