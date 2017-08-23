export default function dictKeys(dictionary) {
    /**
     * Return an array of values that are present in this dictionary
     */
    let keys = [];

    for (let key in dictionary) {
        if (dictionary.hasOwnProperty(key)) {
            keys.push(key);
        }
    }

    return keys;
}
