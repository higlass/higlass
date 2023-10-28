/**
 * Return an array of keys that are present in this dictionary
 *
 * TODO(Trevor): Replace with `Object.keys`?
 *
 * @template T
 * @param {T} dictionary
 * @returns {Array<keyof T>}
 */
export default function dictKeys(dictionary) {
  /** @type {Array<keyof T>} */
  const keys = [];

  for (const key in dictionary) {
    // @ts-expect-error - TS inference not good enough to infer the correct type
    if (dictionary.hasOwnProperty(key)) {
      keys.push(key);
    }
  }

  return keys;
}
