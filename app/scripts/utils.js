export function dictValues(dictiontary) {
    /**
     * Return an array of values that are present in this dictionary
     */
    let values = [];

    for (let key in dictionary) {
        if (dictionary.hasOwnProperty(key)) {
            values.push(dictionary[key]);
        }
    }

    return values;
}

export function dictKeys(dictionary) {
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

export function scaleCenterAndK(vScale) {
    /**
     * Calculate the center of the scale as well as its scale
     * factor 
     * @param scale: A d3 scale.
     * @return: [domainCenter, k]
     */
    let center = vScale.invert((vScale.range()[0] + vScale.range()[1]) / 2);
    let k = vScale.invert(1) - vScale.invert(0);
    
    return [center, k];
}
