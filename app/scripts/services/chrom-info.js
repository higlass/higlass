import { tsvParseRows } from 'd3-dsv';

const cache = {};

const getFromCache = (url, fallback) =>
  (cache[url] ? Promise.resolve(cache[url]) : fallback(url));

const parseChromInfo = (text) => {
  if (text.length == 0)
    return null;

  const tsv = tsvParseRows(text);
  const cumValues = [];
  const chromLengths = {};
  const chrPositions = {};

  let totalLength = 0;

  for (let i = 0; i < tsv.length; i++) {
    const length = Number(tsv[i][1]);
    totalLength += length;

    const newValue = {
      id: i,
      chr: tsv[i][0],
      pos: totalLength - length,
    };

    cumValues.push(newValue);
    chrPositions[newValue.chr] = newValue;
    chromLengths[tsv[i][0]] = length;
  }

  return {
    cumPositions: cumValues,
    chrPositions,
    totalLength,
    chromLengths,
  };
};

const getFromRemote = url => fetch(url)
  .then(response => response.text())
  .then(text => parseChromInfo(text))
  .catch((error) => {
    console.error('Could not retrieve or parse chrom info.', error);
  });

const cacheResults = (key, getter, fallback) => getter(key, fallback).then((results) => {
  cache[key] = results;
  return cache[key];
});

const get = url => cacheResults(url, getFromCache, getFromRemote);

const api = { get };

export default api;
