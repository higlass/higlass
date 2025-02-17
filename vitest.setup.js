import { server } from '@vitest/browser/context';
import { http, HttpResponse, bypass } from 'msw';
import { setupWorker } from 'msw/browser';
import { afterAll, afterEach, beforeAll } from 'vitest';

/** @type {import('./scripts/vitest-browser-commands.mjs').Commands} */
const commands = /** @type {any} */ (server.commands);

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
    ids.map((id) => commands.getCache([origin, route, id])),
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
 */
function createTilesOrTilesetInfoHandler(origin, route) {
  /** @param {{ request: Request }} ctx */
  return async ({ request }) => {
    const url = new URL(request.url);
    const ids = url.searchParams.getAll('d');
    const cached = await tryFetchCached(ids, {
      origin,
      route,
      transform: JSON.parse,
    });

    if (cached) {
      return HttpResponse.json(cached);
    }

    // Persist request to our cache for next time.
    // TODO: Have an enviroment variable to control this behavior?
    const response = await fetch(bypass(request));
    const data = await response.json();
    await Promise.all(
      Object.entries(data).map(([k, v]) =>
        commands.setCache([origin, route, k], JSON.stringify(v)),
      ),
    );
  };
}

/**
 * @param {string} origin
 * @param {"chrom-sizes"} route
 */
function createChromsizesHandler(origin, route) {
  /** @param {{ request: Request }} ctx */
  return async ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return;
    const maybeTsv = await commands.getCache([origin, route, id]);
    if (maybeTsv) {
      return HttpResponse.text(maybeTsv);
    }
    const response = await fetch(bypass(request));
    const tsv = await response.text();
    await commands.setCache([origin, route, id], tsv);
  };
}

/**
 * @param {string} origin
 * @param {"available-chrom-sizes"} route
 */
function createAvailableChromsizesHandler(origin, route) {
  /** @param {{ request: Request }} ctx */
  return async ({ request }) => {
    const maybeJson = await commands.getCache([origin, route]);
    if (maybeJson) {
      return new HttpResponse(maybeJson);
    }
    const response = await fetch(bypass(request));
    const json = await response.text();
    await commands.setCache([origin, route], json);
  };
}

/**
 * @param {string} origin
 * @param {"tilesets"} route
 */
function createTilesetsHandler(origin, route) {
  /** @param {{ request: Request }} ctx */
  return async ({ request }) => {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    const dt = url.searchParams.get('dt');
    if (!limit || !dt) {
      return;
    }
    const maybeJson = await commands.getCache([
      origin,
      route,
      `dt_${dt}`,
      `limit_${limit}`,
    ]);
    if (maybeJson) {
      return new HttpResponse(maybeJson);
    }
    const response = await fetch(bypass(request));
    const json = await response.text();
    await commands.setCache(
      [origin, route, `limit_${limit}`, `dt_${dt}`],
      json,
    );
  };
}

/**
 * @param {string} origin
 * @param {"suggest"} route
 */
function createSuggestHandler(origin, route) {
  /** @param {{ request: Request }} ctx */
  return async ({ request }) => {
    const url = new URL(request.url);
    const d = url.searchParams.get('d');
    const ac = url.searchParams.get('ac');
    if (!d || !ac) {
      return;
    }
    const maybeJson = await commands.getCache([
      origin,
      route,
      `d_${d}`,
      `ac_${ac}`,
    ]);
    if (maybeJson) {
      return new HttpResponse(maybeJson);
    }
    const response = await fetch(bypass(request));
    const json = await response.text();
    await commands.setCache([origin, route, `d_${d}`, `ac_${ac}`], json);
  };
}

/**
 * @param {string} origin
 * @param {"viewconfs"} route
 */
function createViewconfHandler(origin, route) {
  /** @param {{ request: Request }} ctx */
  return async ({ request }) => {
    const url = new URL(request.url);
    const d = url.searchParams.get('d');
    if (!d) {
      return;
    }
    const maybeJson = await commands.getCache([origin, route, d]);
    if (maybeJson) {
      return new HttpResponse(maybeJson);
    }
    const response = await fetch(bypass(request));
    const json = await response.text();
    await commands.setCache([origin, route, d], json);
  };
}

/** @param {string} origin */
function createHiGlassServerHandlers(origin) {
  const tiles = createTilesOrTilesetInfoHandler(origin, 'tiles');
  const tilesetInfo = createTilesOrTilesetInfoHandler(origin, 'tileset_info');
  const chromsizes = createChromsizesHandler(origin, 'chrom-sizes');
  const tilesets = createTilesetsHandler(origin, 'tilesets');
  const suggest = createSuggestHandler(origin, 'suggest');
  const viewconfs = createViewconfHandler(origin, 'viewconfs');
  const availableChromsizes = createAvailableChromsizesHandler(
    origin,
    'available-chrom-sizes',
  );
  return [
    // HTTP
    http.get(`http://${origin}/tiles`, tiles),
    http.get(`http://${origin}/tileset_info`, tilesetInfo),
    http.get(`http://${origin}/chrom-sizes`, chromsizes),
    http.get(`http://${origin}/tilesets`, tilesets),
    http.get(`http://${origin}/suggest`, suggest),
    http.get(`http://${origin}/viewconfs`, viewconfs),
    http.get(`http://${origin}/available-chrom-sizes`, availableChromsizes),
    // HTTPS
    http.get(`https://${origin}/tiles`, tiles),
    http.get(`https://${origin}/tileset_info`, tilesetInfo),
    http.get(`https://${origin}/chrom-sizes`, chromsizes),
    http.get(`https://${origin}/tilesets`, tilesets),
    http.get(`https://${origin}/suggest`, suggest),
    http.get(`https://${origin}/viewconfs`, viewconfs),
    http.get(`https://${origin}/available-chrom-sizes`, availableChromsizes),
  ];
}

if (import.meta.env.VITE_USE_MOCKS === '1') {
  const worker = setupWorker(
    ...createHiGlassServerHandlers('higlass.io/api/v1'),
    ...createHiGlassServerHandlers('resgen.io/api/v1'),
    ...createHiGlassServerHandlers('resgen.io/api/v1/gt/paper-data'),
    http.get('http://s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv', () =>
      HttpResponse.text(
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
    http.get(
      'https://s3.amazonaws.com/pkerp/public/gpsb/small.chrom.sizes',
      () =>
        HttpResponse.text(
          `
foo	249250621
bar	243199373`.trim(),
        ),
    ),
  );

  beforeAll(() => worker.start());
  afterAll(() => worker.stop());
  afterEach(() => worker.resetHandlers());
}
