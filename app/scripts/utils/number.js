import { format } from 'd3-format';

export function convertNumberNotation(numStr) {
  // Convert K or M notations
  // e.g. "1.5M" to "1500000"
  // or "0.05M" to "50000"
  // or even "00.05M" or "00.050M" to "50000"
  let newNumStr = numStr;

  if (
    !newNumStr.includes('M', newNumStr.length - 1) &&
    !newNumStr.includes('K', newNumStr.length - 1)
  ) {
    // Nothing to convert
    return newNumStr;
  }

  let numZerosToAdd = 0;
  let decPointPosFromEnd = 0;

  // Handle 'M' or 'N' notations
  if (newNumStr.includes('M', newNumStr.length - 1)) {
    numZerosToAdd = 6;
    newNumStr = newNumStr.replace('M', '');
  } else {
    numZerosToAdd = 3;
    newNumStr = newNumStr.replace('K', '');
  }

  if (Number.isNaN(+newNumStr)) {
    // Without 'K' or 'M' notation, the string should be converted to a valid number.
    return numStr;
  }

  // Drop the needless characters for the simplicity (e.g., "00.5" to "0.5" or "1,000" to "1000").
  newNumStr = (+newNumStr).toString();

  // Handle a decimal point
  if (newNumStr.includes('.')) {
    decPointPosFromEnd = newNumStr.length - 1 - newNumStr.indexOf('.');
    newNumStr = (+newNumStr.replace('.', '')).toString();
  }

  const totalZerosToAdd = numZerosToAdd - decPointPosFromEnd;
  if (totalZerosToAdd < 0) {
    // The value is smaller than 1 (e.g. "0.00005K")
    return numStr;
  }

  // Finally, add zeros at the end.
  newNumStr += '0'.repeat(totalZerosToAdd);

  return newNumStr;
}

export function chrPosToPositionString(x1, x2, y1, y2, twoD) {
  let positionString = null;
  const stringFormat = format(',d');

  if (x1[0] !== x2[0]) {
    // different chromosomes

    positionString = `${x1[0]}:${stringFormat(Math.floor(x1[1]))}-${
      x2[0]
    }:${stringFormat(Math.ceil(x2[1]))}`;
  } else {
    // same chromosome

    positionString = `${x1[0]}:${stringFormat(
      Math.floor(x1[1]),
    )}-${stringFormat(Math.ceil(x2[1]))}`;
  }

  if (twoD) {
    if (y1[0] !== y2[0]) {
      // different chromosomes
      positionString += ` & ${y1[0]}:${stringFormat(Math.floor(y1[1]))}-${
        y2[0]
      }:${stringFormat(Math.ceil(y2[1]))}`;
    } else {
      // same chromosome
      positionString += ` & ${y1[0]}:${stringFormat(
        Math.floor(y1[1]),
      )}-${stringFormat(Math.ceil(y2[1]))}`;
    }
  }

  return positionString;
}
