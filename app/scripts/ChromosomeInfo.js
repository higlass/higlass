import { tsvParseRows } from 'd3-dsv';
import { tileProxy } from './services';

function ChromosomeInfo(filepath, success) {
  tileProxy.text(filepath, (error, chrInfoText) => {
    const data = tsvParseRows(chrInfoText);
    const cumValues = [];
    const chromLengths = {};
    const chrPositions = {};
    let totalLength = 0;

    for (let i = 0; i < data.length; i++) {
      totalLength += +data[i][1];

      const newValue = { id: i, chr: data[i][0], pos: totalLength - +data[i][1] };

      cumValues.push(newValue);
      chrPositions[newValue.chr] = newValue;
      chromLengths[data[i][0]] = data[i][1];
    }

    const chromInfo = {
      cumPositions: cumValues,
      chrPositions,
      totalLength,
      chromLengths,
    };

    success(chromInfo);
  });
}

export default ChromosomeInfo;
