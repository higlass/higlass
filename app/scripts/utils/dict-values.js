/**
 * Return an array of values that are present in this dictionary
 */
export default function dictValues(dictionary) {
  const values = [];

  for (const key in dictionary) {
    // eslint-disable-next-line no-prototype-builtins
    if (dictionary.hasOwnProperty(key)) {
      values.push(dictionary[key]);
    }
  }

  return values;
}
