import { tsvParseRows } from 'd3-dsv';
import { tileProxy } from './services';

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
  tileProxy.text(filepath, (error, chrInfoText) => {
    if (error) {
      console.warn("Chromosome info not found at:", filepath);
      success(null);
    } 
    const data = tsvParseRows(chrInfoText);
    const chromInfo = parseChromsizesRows(data);

    success(chromInfo);
  });
}

export default ChromosomeInfo;
