import * as msw from 'msw';
import { setupWorker } from 'msw/browser';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { server } from '@vitest/browser/context';

/** @type {import('./scripts/vitest-browser-commands.mjs').ServerCache} */
const CACHE = /** @type {any} */ (server.commands);

/**
 * @template {unknown} T
 *
 * @param {ReadonlyArray<string>} ids
 * @param {{ origin: string, route: string, transform: (x: string) => T }} options
 *
 * @returns {Promise<undefined | Record<string, T>>}
 */
async function tryFetchCached(ids, { origin, route, transform }) {
  const results = await Promise.all(
    ids.map((id) => CACHE.get([origin, route, id])),
  );
  if (results.some((i) => i === undefined)) {
    return undefined;
  }
  return Object.fromEntries(
    results.map((text, i) => [ids[i], transform(/** @type {string} */ (text))]),
  );
}

/**
 * @param {string} origin
 * @param {"tiles" | "tileset_info"} route
 * @returns {msw.ResponseResolver}
 */
function tilesOrTilesetInfo(origin, route) {
  return async ({ request }) => {
    const url = new URL(request.url);
    const ids = url.searchParams.getAll('d');
    const cached = await tryFetchCached(ids, {
      origin,
      route,
      transform: JSON.parse,
    });

    if (cached) {
      return msw.HttpResponse.json(cached);
    }

    // Persist request to our cache for next time.
    const response = await fetch(msw.bypass(request));
    const data = await response.json();
    await Promise.all(
      Object.entries(data).map(([k, v]) =>
        CACHE.set([origin, route, k], JSON.stringify(v)),
      ),
    );
  };
}

/**
 * @param {string} origin
 * @param {"chrom-sizes"} route
 * @returns {msw.ResponseResolver}
 */
function chromsizes(origin, route) {
  return async ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return;
    const maybeTsv = await CACHE.get([origin, route, id]);
    if (maybeTsv) {
      return msw.HttpResponse.text(maybeTsv);
    }
    const response = await fetch(msw.bypass(request));
    const tsv = await response.text();
    await CACHE.set([origin, route, id], tsv);
  };
}

/**
 * @param {string} origin
 * @param {"tilesets"} route
 * @returns {msw.ResponseResolver}
 */
function tilesets(origin, route) {
  return async ({ request }) => {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    const dt = url.searchParams.get('dt');
    if (!limit || !dt) {
      return;
    }
    const maybeJson = await CACHE.get([
      origin,
      route,
      `dt_${dt}`,
      `limit_${limit}`,
    ]);
    if (maybeJson) {
      return new msw.HttpResponse(maybeJson);
    }
    const response = await fetch(msw.bypass(request));
    const json = await response.text();
    await CACHE.set([origin, route, `dt_${dt}`, `limit_${limit}`], json);
  };
}

/**
 * @param {string} origin
 * @param {"suggest"} route
 * @returns {msw.ResponseResolver}
 */
function suggest(origin, route) {
  return async ({ request }) => {
    const url = new URL(request.url);
    const d = url.searchParams.get('d');
    const ac = url.searchParams.get('ac');
    if (!d || !ac) {
      return;
    }
    const maybeJson = await CACHE.get([origin, route, `d_${d}`, `ac_${ac}`]);
    if (maybeJson) {
      return new msw.HttpResponse(maybeJson);
    }
    const response = await fetch(msw.bypass(request));
    const json = await response.text();
    await CACHE.set([origin, route, `d_${d}`, `ac_${ac}`], json);
  };
}

/**
 * @param {string} origin
 * @param {"viewconfs"} route
 * @returns {msw.ResponseResolver}
 */
function viewconfs(origin, route) {
  /** @param {{ request: Request }} ctx */
  return async ({ request }) => {
    const url = new URL(request.url);
    const d = url.searchParams.get('d');
    if (!d) {
      return;
    }
    const maybeJson = await CACHE.get([origin, route, d]);
    if (maybeJson) {
      return new msw.HttpResponse(maybeJson);
    }
    const response = await fetch(msw.bypass(request));
    const json = await response.text();
    await CACHE.set([origin, route, d], json);
  };
}

/**
 * @param {string} origin
 * @param {"available-chrom-sizes"} route
 * @returns {msw.ResponseResolver}
 */
function availableChromsizes(origin, route) {
  return async ({ request }) => {
    const maybeJson = await CACHE.get([origin, route]);
    if (maybeJson) {
      return new msw.HttpResponse(maybeJson);
    }
    const response = await fetch(msw.bypass(request));
    const json = await response.text();
    await CACHE.set([origin, route], json);
  };
}

/**
 * Create a set of msw handlers for a given HiGlass server.
 *
 * @param {string} origin
 * @returns {Array<msw.HttpHandler>}
 */
function higlassServer(origin) {
  /**
   * Create a pair of HTTP/HTTPS resolvers for a given higlass origin and route.
   *
   * @template {string} R
   * @param {string} origin
   * @param {R} route
   * @param {(base: string, route: R) => msw.ResponseResolver} resolver
   * @returns {Array<msw.HttpHandler>}
   */
  function get(origin, route, resolver) {
    return [
      msw.http.get(`http://${origin}/${route}`, resolver(origin, route)),
      msw.http.get(`https://${origin}/${route}`, resolver(origin, route)),
    ];
  }
  return [
    ...get(origin, 'tiles', tilesOrTilesetInfo),
    ...get(origin, 'tileset_info', tilesOrTilesetInfo),
    ...get(origin, 'chrom-sizes', chromsizes),
    ...get(origin, 'tilesets', tilesets),
    ...get(origin, 'suggest', suggest),
    ...get(origin, 'viewconfs', viewconfs),
    ...get(origin, 'available-chrom-sizes', availableChromsizes),
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
    ...higlassServer('higlass.io/api/v1'),
    ...higlassServer('resgen.io/api/v1'),
    ...higlassServer('resgen.io/api/v1/gt/paper-data'),
    ...staticAssets(),
  );

  beforeAll(() => worker.start());
  afterAll(() => worker.stop());
  afterEach(() => worker.resetHandlers());
}
