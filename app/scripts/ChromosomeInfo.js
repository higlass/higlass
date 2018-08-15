import { tsvParseRows } from 'd3-dsv';
import { tileProxy } from './services';
import { absToChr, chrToAbs } from './utils';

export function parseChromsizesRows(data) {
  const cumValues = [];
  const chromLengths = {};
  const chrPositions = {};

  let totalLength = 0;

  for (let i = 0; i < data.length; i++) {
    const length = Number(data[i][1]);
    totalLength += length;

    const newValue = {
      id: i,
      chr: data[i][0],
      pos: totalLength - length,
    };

    cumValues.push(newValue);
    chrPositions[newValue.chr] = newValue;
    chromLengths[data[i][0]] = length;
  }

  return {
    cumPositions: cumValues,
    chrPositions,
    totalLength,
    chromLengths,
  };
}

function ChromosomeInfo(filepath, success) {
  let ret = {}

  ret.absToChr = absPos => (this.chromInfo
    ? absToChr(absPos, this.chromInfo)
    : null
  );

  ret.chrToAbs = chrPos => (this.chromInfo
    ? chrToAbs(...chrPos, this.chromInfo)
    : null
  );

  return tileProxy.text(filepath, (error, chrInfoText) => {
    if (error) {
      console.warn('Chromosome info not found at:', filepath);
      if (success) success(null);
    }
    const data = tsvParseRows(chrInfoText);
    const chromInfo = parseChromsizesRows(data);

    ret.chromInfo = chromInfo;
    if (success) success(chromInfo);
  }).then(() => ret);
}

export default ChromosomeInfo;
