// @ts-nocheck
import { tsvParseRows } from 'd3-dsv';
import { parseChromsizesRows } from '../utils';

const cache = {};

const getFromCache = (url, fallback) =>
  cache[url] ? Promise.resolve(cache[url]) : fallback(url);

const parseChromInfo = (text) => {
  if (text.length === 0) return null;

  const tsv = tsvParseRows(text);
  return parseChromsizesRows(tsv);
};

const getFromRemote = (url) =>
  fetch(url, { credentials: 'same-origin' })
    .then((response) => response.text())
    .then((text) => parseChromInfo(text))
    .catch((error) => {
      console.error('Could not retrieve or parse chrom info.', error);
    });

const cacheResults = (key, getter, fallback) =>
  getter(key, fallback).then((results) => {
    cache[key] = results;
    return cache[key];
  });

const get = (url) => cacheResults(url, getFromCache, getFromRemote);

const api = { get };

export default api;
