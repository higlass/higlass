import { tsvParseRows } from 'd3-dsv';
import parseChromsizesRows from '../utils/parse-chromsizes-rows';

/** @import { ParsedChromsizes } from '../utils/parse-chromsizes-rows' */

/** @type {Record<string, ParsedChromsizes>} */
const cache = {};

/**
 * @param {string} url
 * @param {(url: string) => Promise<ParsedChromsizes | null>} fallback
 * @returns {Promise<ParsedChromsizes | null>}
 */
const getFromCache = (url, fallback) =>
  cache[url] ? Promise.resolve(cache[url]) : fallback(url);

/**
 * @param {string} text
 * @returns {ParsedChromsizes | null}
 */
const parseChromInfo = (text) => {
  if (text.length === 0) return null;

  /** @type {Array<[string, number]>} */
  // @ts-expect-error - We don't know this for sure but preserving prior behavior
  const tsv = tsvParseRows(text);

  return parseChromsizesRows(tsv);
};

/**
 * @param {string} url
 * @returns {Promise<ParsedChromsizes | null>}
 */
const getFromRemote = (url) =>
  fetch(url, { credentials: 'same-origin' })
    .then((response) => response.text())
    .then((text) => parseChromInfo(text))
    .catch((error) => {
      console.error('Could not retrieve or parse chrom info.', error);
      return null;
    });

/**
 * @param {string} key
 * @param {typeof getFromCache} getter
 * @param {(url: string) => Promise<ParsedChromsizes | null>} fallback
 */
const cacheResults = (key, getter, fallback) =>
  getter(key, fallback).then((results) => {
    if (results) cache[key] = results;
    return results;
  });

/**
 * @param {string} url
 * @returns {Promise<ParsedChromsizes | null>}
 */
const get = (url) => cacheResults(url, getFromCache, getFromRemote);

const api = { get };

export default api;
