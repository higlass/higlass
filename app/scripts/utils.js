export function dictValues(dictionary) {
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

export function dictItems(dictionary) {
    /**
     * Return an array of (key,value) pairs that are present in this
     * dictionary
     */
    let keyValues = [];

    for (let key in dictionary) {
        if (dictionary.hasOwnProperty(key)) {
            keyValues.push([key, dictionary[key]]);
        }
    }

    return keyValues;
}

export function dictFromTuples(tuples) {
    /**
     * Create a dictionary from a list of [key,value] pairs.
     * @param tuples: A list of [key,value] pairs
     * @return: A dictionary
     */
    let dict = {};

    tuples.forEach(x => {
        dict[x[0]] = x[1];
    });

    return dict;
}

export function scalesCenterAndK(xScale, yScale) {
    /**
     * Calculate the center of the scale as well as its scale
     * factor 
     *
     * Assumes the two scales have the same k
     *
     * @param xScale: A d3 scale.
     * @param yScale: A d3 scale.
     * @return: [domainCenter, k]
     */
    let xCenter = xScale.invert((xScale.range()[0] + xScale.range()[1]) / 2);
    let yCenter = yScale.invert((yScale.range()[0] + yScale.range()[1]) / 2);
    let k = xScale.invert(1) - xScale.invert(0);
    
    return [xCenter, yCenter, k];
}
