/**
 * Return an array of values that are present in this dictionary
 */
export default function dictValues(dictionary) {
  let values = [];

  for (let key in dictionary) {
    if (dictionary.hasOwnProperty(key)) {
      values.push(dictionary[key]);
    }
  }

  return values;
}
