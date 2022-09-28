/**
 * Return an array of values that are present in this dictionary
 */
export default function dictKeys(dictionary) {
  const keys = [];

  for (const key in dictionary) {
    if (dictionary.hasOwnProperty(key)) {
      keys.push(key);
    }
  }

  return keys;
}
