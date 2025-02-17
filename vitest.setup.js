import * as msw from 'msw';
import { setupWorker } from 'msw/browser';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { server } from '@vitest/browser/context';

/** @type {import('./scripts/vitest-browser-commands.mjs').ServerCache} */
const CACHE = /** @type {any} */ (server.commands);

/** @param {URL} input */
function normalizeURL(input) {
  if (input.search) {
    input.searchParams.sort();
    input.search = `?${input.searchParams}`;
  }
  if (input.pathname === '/') {
    return input.toString().replace(/\/$/, '');
  }
  return input.toString();
}

/**
 * Create a set of msw handlers for a given HiGlass server.
 *
 * @param {string} origin
 * @returns {Array<msw.HttpHandler>}
 */
function cachedHiglassServer(origin) {
  /** @param {{ request: Request }} ctx */
  const handler = async ({ request }) => {
    const url = new URL(request.url);
    const key = normalizeURL(url);
    const cached = await CACHE.get(key);
    if (cached) {
      return new msw.HttpResponse(cached);
    }
    const data = await fetch(msw.bypass(request));
    const text = await data.text();
    CACHE.set(key, text);
  };
  return [
    msw.http.get(`http://${origin}/*`, handler),
    msw.http.get(`https://${origin}/*`, handler),
  ];
}

/**
 * Create a set of msw handlers for various static assets relied on by the test suite.
 * @returns {Array<msw.HttpHandler>}
 */
function staticAssets() {
  return [
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
  ];
}

if (import.meta.env.VITE_USE_MOCKS === '1') {
  const worker = setupWorker(
    ...cachedHiglassServer('higlass.io/api/v1'),
    ...cachedHiglassServer('resgen.io/api/v1'),
    ...staticAssets(),
  );
  beforeAll(() => worker.start());
  afterAll(() => worker.stop());
  afterEach(() => worker.resetHandlers());
}
