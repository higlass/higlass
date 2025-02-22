/**
 * Return an array of values that are present in this dictionary
 */
export default function dictValues(dictionary) {
  const values = [];

  for (const key in dictionary) {
    if (dictionary.hasOwnProperty(key)) {
      // eslint-disable-line no-prototype-builtins
      values.push(dictionary[key]);
    }
  }

  return values;
}
