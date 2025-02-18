import * as msw from 'msw';
import { setupWorker } from 'msw/browser';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { server } from '@vitest/browser/context';

/** @type {import('./scripts/vitest-browser-commands.mjs').ServerCache} */
const CACHE = /** @type {any} */ (server.commands);

/** @param {URLSearchParams} params */
function searchParamsToKey(params) {
  params.sort();
  /** @type {Array<string>} */
  const out = [];
  for (const key of [...new Set(params.keys())]) {
    const values = params.getAll(key);
    values.sort();
    out.push(...values.map((value) => `${key}_${value}`));
  }
  return out.join('__');
}

/**
 * Create a set of msw handlers for HiGlass server(s).
 *
 * @param {string} host
 * @returns {Array<msw.HttpHandler>}
 */
function higlassServer(host) {
  /** @param {{ request: Request }} ctx */
  const tilesHandler = async ({ request }) => {
    const url = new URL(request.url);
    const ids = url.searchParams.getAll('d');
    /** @param {string} id */
    const key = (id) => {
      return [url.host, ...url.pathname.split('/').filter(Boolean), id];
    };

    const results = await Promise.all(ids.map((id) => CACHE.get(key(id))));

    if (results.every((v) => v !== undefined)) {
      /** @type {Record<string, unknown>} */
      const entries = {};
      results.forEach((text, i) => {
        const data = JSON.parse(text);
        if (data !== null) {
          // omit null keys
          entries[ids[i]] = data;
        }
      });
      return msw.HttpResponse.json(entries);
    }

    // Persist request to our cache for next time.
    const response = await fetch(msw.bypass(request));
    const data = await response.json();
    await Promise.all(
      ids.map((id) => CACHE.set(key(id), JSON.stringify(data[id] ?? null))),
    );
  };
  return [
    msw.http.get(`*${host}/api/v1/tiles`, tilesHandler),
    msw.http.get(`*${host}/api/v1/tiles/`, tilesHandler),
    msw.http.get(`*${host}/api/v1/tileset_info`, tilesHandler),
    msw.http.get(`*${host}/api/v1/tileset_info/`, tilesHandler),
    msw.http.get(`*${host}/api/v1/*`, async ({ request }) => {
      const url = new URL(request.url);
      const key = [url.host, ...url.pathname.split('/').filter(Boolean)];
      url.searchParams.delete('s'); // session ID from higlass client
      if (url.search) {
        key.push(searchParamsToKey(url.searchParams));
      }
      const maybeText = await CACHE.get(key);
      if (maybeText) {
        return new msw.HttpResponse(maybeText);
      }
      const response = await fetch(msw.bypass(request));
      const text = await response.text();
      await CACHE.set(key, text);
    }),
  ];
}

const worker = setupWorker(
  // higlass servers
  ...higlassServer('resgen.io'),
  ...higlassServer('higlass.io'),
  // static assets
  msw.http.get('http://s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv', () =>
    msw.HttpResponse.text(
      `
chr1	249250621
chr2	243199373
chr3	198022430
chr4	191154276
chr5	180915260
chr6	171115067
chr7	159138663
chr8	146364022
chr9	141213431
chr10	135534747
chr11	135006516
chr12	133851895
chr13	115169878
chr14	107349540
chr15	102531392
chr16	90354753
chr17	81195210
chr18	78077248
chr19	59128983
chr20	63025520
chr21	48129895
chr22	51304566
chrX	155270560
chrY	59373566
chrM	16571`.trim(),
    ),
  ),
  msw.http.get(
    'https://s3.amazonaws.com/pkerp/public/gpsb/small.chrom.sizes',
    () =>
      msw.HttpResponse.text(
        `
foo	249250621
bar	243199373`.trim(),
      ),
  ),
);

if (import.meta.env.VITE_USE_MOCKS === '1') {
  beforeAll(() => worker.start());
  afterAll(() => worker.stop());
  afterEach(() => worker.resetHandlers());
}
