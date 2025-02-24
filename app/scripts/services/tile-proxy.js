import { range } from 'd3-array';
import slugid from 'slugid';

import { workerFetchTiles, workerSetPix } from './worker';

import sleep from '../utils/timeout';
import tts from '../utils/trim-trailing-slash';
import {
  isLegacyTilesetInfo,
  isResolutionsTilesetInfo,
} from '../utils/type-guards';

// Config
import { TILE_FETCH_DEBOUNCE } from '../configs/primitives';

/** @import { PubSub }  from 'pub-sub-es' */
/** @import { Scale, TilesetInfo, TilesRequest }  from '../types' */
/** @import { CompletedTileData, TileResponse, SelectedRowsOptions } from './worker' */

/** @type {number} */
const MAX_FETCH_TILES = 15;

/** @type {string} */
const sessionId = import.meta.env.DEV ? 'dev' : slugid.nice();
/** @type {number} */
export let requestsInFlight = 0;
/** @type {string | null} */
export let authHeader = null;

/**
 * Iterator helper to chunk an array into smaller arrays of a fixed size.
 *
 * @template T
 * @param {Iterable<T>} iterable
 * @param {number} size
 * @returns {Generator<Array<T>, void, unknown>}
 */
function* chunkIterable(iterable, size) {
  let chunk = [];
  for (const item of iterable) {
    chunk.push(item);
    if (chunk.length === size) {
      yield chunk;
      chunk = [];
    }
  }
  if (chunk.length) {
    yield chunk;
  }
}

/**
 * @template T
 * @template U
 * @typedef {{ value: T, resolve: (value: U) => void, reject: (err: unknown) => void }} WithResolvers
 */

/**
 * Create a function that batches calls at intervals, with a final debounce.
 *
 * The returned function collects individual items and executes `processBatch` at the specified interval.
 * If additional calls occur after the last batch, a final debounce ensures they are included.
 *
 * @template T
 * @template U
 * @template {Array<unknown>} Args
 *
 * @param {Object} options
 * @param {(items: Array<WithResolvers<T, U>>, ...args: Args) => void} options.processBatch
 * @param {number} options.interval
 * @param {number} options.finalWait
 */
function createBatchedExecutor({ processBatch, interval, finalWait }) {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeout = undefined;
  /** @type {Array<WithResolvers<T, U>>} */
  let pending = [];
  /** @type {number} */
  let blockedCalls = 0;

  const reset = () => {
    timeout = undefined;
    pending = [];
  };

  /** @param {Args} args */
  const callFunc = (...args) => {
    // Flush the "bundle" (of collected items) to the processor
    processBatch(pending, ...args);
    reset();
  };

  /** @param {Args} args */
  const debounced = (...args) => {
    const later = () => {
      // Since we throttle and debounce we should check whether there were
      // actually multiple attempts to call this function after the most recent
      // throttled call. If there were no more calls we don't have to call
      // the function again.
      if (blockedCalls > 0) {
        callFunc(...args);
        blockedCalls = 0;
      }
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, finalWait);
  };

  let wait = false;
  /**
   * @param {T} value
   * @param {Args} args
   * @returns {Promise<U>}
   */
  const throttled = (value, ...args) => {
    // Collect items into the current queue any time the caller makes a request
    const { promise, resolve, reject } = Promise.withResolvers();
    pending.push({ value, resolve, reject });

    if (!wait) {
      callFunc(...args);
      debounced(...args);
      wait = true;
      blockedCalls = 0;
      setTimeout(() => {
        wait = false;
      }, interval);
    } else {
      blockedCalls++;
    }

    return promise;
  };

  return throttled;
}

/** @param {string} newHeader */
export const setTileProxyAuthHeader = (newHeader) => {
  authHeader = newHeader;
};

/** @returns {string | null} */
export const getTileProxyAuthHeader = () => authHeader;

/**
 * Merges an array of request objects by combining requests
 * that share the same `id`, reducing the total number of requests.
 *
 * If multiple requests have the same `id`, their `tileIds` arrays are merged
 * into a single request entry in the output array.
 *
 * @example
 * ```js
 * const requests = [
 *   { id: "A", tileIds: ["1", "2"] },
 *   { id: "B", tileIds: ["3"] },
 *   { id: "A", tileids: ["4", "5"] },
 * ];
 *
 * const bundled = bundleRequests(requests);
 * console.log(bundled);
 * // [
 * //   { id: "A", tileIds: ["1", "2", "4", "5"] },
 * //   { id: "B", tileIds: ["3"] },
 * // ]
 * ```
 *
 * @template {{ id: string, tileIds: ReadonlyArray<string> }} T
 * @param {Array<T>} requests - The list of requests to bundle
 * @returns {Array<T>} - A new array with merged requests
 */
export function bundleRequestsById(requests) {
  /** @type {Array<T>} */
  const bundledRequests = [];
  /** @type {Record<string, number>} */
  const mapper = {};

  for (const request of requests) {
    if (mapper[request.id] === undefined) {
      mapper[request.id] = bundledRequests.length;
      bundledRequests.push({ ...request, tileIds: [] });
    }
    const bundle = bundledRequests[mapper[request.id]];
    bundle.tileIds = bundle.tileIds.concat(request.tileIds);
  }

  return bundledRequests;
}

/**
 * Groups request objects by `server`, merging their `tileIds` and structuring tileset-related
 * data into `body`.
 *
 * **Note:** The first request for each `server` sets the `options` for all grouped requests.
 * Each tileset in `body` also inherits these `options`. A tileset is only added to `body`
 * if the request includes `options`.
 *
 * Trevor (2025-02-20): This follows the original "server bundling" logic. It’s unclear if `body` is
 * actually used in practice. Omitting requests without `options` might be an unintended
 * behavior, but we're maintaining it for now.
 *
 * @example
 * ```js
 * const requests = [
 *   { server: "A", tileIds: ["tileset1.1", "tileset2.2"], options: { foo: "bar" } },
 *   { server: "B", tileIds: ["tileset3.3"], options: { baz: "qux" } },
 *   { server: "A", tileIds: ["tileset1.4"] },
 * ];
 *
 * const bundled = bundleRequestsByServer(requests);
 * console.log(bundled);
 * // [
 * //   {
 * //     server: "A",
 * //     tileIds: ["tileset1.1", "tileset2.2", "tileset1.4"],
 * //     options: { foo: "bar" },
 * //     body: [
 * //       { tilesetUid: "tileset1", tileIds: ["1"], options: { foo: "bar" } },
 * //       { tilesetUid: "tileset2", tileIds: ["2"], options: { foo: "bar" } }
 * //     ]
 * //   },
 * //   {
 * //     server: "B",
 * //     tileIds: ["tileset3.3"],
 * //     options: { baz: "qux" },
 * //     body: [
 * //       { tilesetUid: "tileset3", tileIds: ["3"], options: { baz: "qux" } }
 * //     ]
 * //   }
 * // ]
 * ```
 *
 * @template {{ tileIds: ReadonlyArray<string>, server: string, options?: Record<string, any> }} T
 * @param {Array<T>} requests - The list of requests to bundle
 * @returns {Array<T & { body: ReadonlyArray<ServerTilesetBody> }> }>} - A new array with merged requests per server
 */
export function bundleRequestsByServer(requests) {
  /** @typedef {{ tilesetUid: string, tileIds: Array<string>, options: Record<string, any> }} ServerTilesetBody */
  /** @type {Array<T & { body: Array<ServerTilesetBody> }>} */
  const bundle = [];
  /** @type {Record<string, number>} */
  const mapper = {};

  // We're converting the array of IDs into an object in order to filter out duplicated requests.
  // In case different instances request the same data it won't be loaded twice.
  for (const request of requests) {
    if (mapper[request.server] === undefined) {
      mapper[request.server] = bundle.length;
      bundle.push({ ...request, tileIds: [], body: [] });
    }
    const server = bundle[mapper[request.server]];
    server.tileIds = server.tileIds.concat(request.tileIds);
    for (const id of request.tileIds) {
      if (request.options) {
        const firstSepIndex = id.indexOf('.');
        const tilesetUid = id.substring(0, firstSepIndex);
        const tileId = id.substring(firstSepIndex + 1);
        let tilesetObject = server.body.find(
          (t) => t.tilesetUid === tilesetUid,
        );
        if (!tilesetObject) {
          tilesetObject = {
            tilesetUid: tilesetUid,
            tileIds: [],
            options: request.options,
          };
          server.body.push(tilesetObject);
        }
        tilesetObject.tileIds.push(tileId);
      }
    }
  }

  return bundle;
}

/**
 * Consolidates requests into a (potentially) smaller, optimized set
 *
 * Requests are first bundled to merge duplicates, then grouped by `server` to
 * consolidate requests targeting the same endpoint. The resulting set is split
 * into smaller batches based on `maxSize`.
 *
 * @template {TilesRequest} T
 * @param {Array<T>} requests - The list of requests to optimize.
 * @param {{ maxSize?: number }} [options] - Configuration options.
 */
function* optimizeRequests(requests, { maxSize = MAX_FETCH_TILES } = {}) {
  const byRequestId = bundleRequestsById(requests);
  const byServer = bundleRequestsByServer(byRequestId);
  for (const request of byServer) {
    for (const tileIds of chunkIterable(new Set(request.tileIds), maxSize)) {
      yield { ...request, tileIds };
    }
  }
}

/** @typedef {CompletedTileData<TileResponse>} TileData */

/**
 * Collects independent tile responses into a shared index.
 *
 * Allows requests to retrieve associated tiles by server and tile IDs.
 *
 * @param {Array<Record<string, TileData> | void>} responses
 */
function indexTiles(responses) {
  /** @type {Record<string, TileData>} */
  const tileMap = {};
  /** @type {(server: string, tileId: string) => string} */
  const keyFor = (server, tileId) => `${server}/${tileId}`;

  // merge back all the tile requests
  for (const response of responses) {
    if (!response) continue;
    for (const [tileId, tileData] of Object.entries(response)) {
      tileMap[keyFor(tileData.server, tileId)] = response[tileId];
    }
  }

  return {
    /**
     * Retrieve data for a specific request from the shared index.
     *
     * @param {{ server: string, tileIds: Array<string> }} request
     */
    resolveTileDataForRequest(request) {
      /** @type {Record<string, TileData>} */
      const response = {};
      for (const tileId of request.tileIds) {
        const entry = tileMap[keyFor(request.server, tileId)];
        if (entry) response[tileId] = entry;
      }
      return response;
    },
  };
}

/**
 * Retrieve a set of tiles from the server.
 *
 * @type {(request: TilesRequest, pubSub: PubSub) => Promise<Record<string, TileData>>}
 */
export const fetchTilesDebounced = createBatchedExecutor({
  /**
   * Fetch and process a batch of tile requests.
   *
   * @param {Array<WithResolvers<TilesRequest, Record<string, TileData>>>} requests
   * @param {PubSub} pubSub
   */
  processBatch: async (requests, pubSub) => {
    const promises = Array.from(
      optimizeRequests(requests.map((r) => r.value)),
      (request) => workerFetchTiles(request, { authHeader, sessionId, pubSub }),
    );
    const index = indexTiles(await Promise.all(promises));
    for (const request of requests) {
      request.resolve(index.resolveTileDataForRequest(request.value));
    }
  },
  interval: TILE_FETCH_DEBOUNCE,
  finalWait: TILE_FETCH_DEBOUNCE,
});

/**
 * Calculate the zoom level from a list of available resolutions
 *
 * @param {Array<string>} resolutions
 * @param {Scale} scale
 * @returns {number}
 */
export const calculateZoomLevelFromResolutions = (resolutions, scale) => {
  const sortedResolutions = resolutions.map((x) => +x).sort((a, b) => b - a);

  const trackWidth = scale.range()[1] - scale.range()[0];

  const binsDisplayed = sortedResolutions.map(
    (r) => (scale.domain()[1] - scale.domain()[0]) / r,
  );
  const binsPerPixel = binsDisplayed.map((b) => b / trackWidth);

  // we're going to show the highest resolution that requires more than one
  // pixel per bin
  const displayableBinsPerPixel = binsPerPixel.filter((b) => b < 1);

  if (displayableBinsPerPixel.length === 0) return 0;

  return binsPerPixel.indexOf(
    displayableBinsPerPixel[displayableBinsPerPixel.length - 1],
  );
};

/**
 * @param {TilesetInfo} tilesetInfo
 * @param {number} zoomLevel
 * @returns {number}
 */
export const calculateResolution = (tilesetInfo, zoomLevel) => {
  if (isResolutionsTilesetInfo(tilesetInfo)) {
    const sortedResolutions = tilesetInfo.resolutions
      .map((x) => +x)
      .sort((a, b) => b - a);
    const resolution = sortedResolutions[zoomLevel];

    return resolution;
  }

  const maxWidth = tilesetInfo.max_width;
  const binsPerDimension = +(tilesetInfo?.bins_per_dimension ?? 256);
  const resolution = maxWidth / (2 ** zoomLevel * binsPerDimension);

  return resolution;
};

/**
 * Calculate the current zoom level.
 *
 * @param {Scale} scale
 * @param {number} minX
 * @param {number} maxX
 * @param {number} binsPerTile
 * @returns {number}
 */
export const calculateZoomLevel = (scale, minX, maxX, binsPerTile) => {
  const rangeWidth = scale.range()[1] - scale.range()[0];

  const zoomScale = Math.max(
    (maxX - minX) / (scale.domain()[1] - scale.domain()[0]),
    1,
  );

  const viewResolution = 384;
  // const viewResolution = 2048;

  // fun fact: the number 384 is halfway between 256 and 512
  const addedZoom = Math.max(
    0,
    Math.ceil(Math.log(rangeWidth / viewResolution) / Math.LN2),
  );
  let zoomLevel = Math.round(Math.log(zoomScale) / Math.LN2) + addedZoom;

  let binsPerTileCorrection = 0;

  if (binsPerTile) {
    binsPerTileCorrection = Math.floor(
      Math.log(256) / Math.log(2) - Math.log(binsPerTile) / Math.log(2),
    );
  }

  zoomLevel += binsPerTileCorrection;

  return zoomLevel;
};

/**
 * Calculate the element within this tile containing the given
 * position.
 *
 * Returns the tile position and position within the tile for
 * the given element.
 *
 * @param {TilesetInfo} tilesetInfo - The information about this tileset
 * @param {number} maxDim - The maximum width of the dataset (only used for tilesets without resolutions)
 * @param {number} dataStartPos - The position where the data begins
 * @param {number} zoomLevel - The (integer) current zoomLevel
 * @param {number} position -The position (in absolute coordinates) to caculate the tile and position in tile for
 *
 * @returns {Array<number>}
 */
export function calculateTileAndPosInTile(
  tilesetInfo,
  maxDim,
  dataStartPos,
  zoomLevel,
  position,
) {
  let tileWidth = null;

  const pixelsPerTile = isLegacyTilesetInfo(tilesetInfo)
    ? (tilesetInfo.bins_per_dimension ?? 256)
    : 256;

  if (!isLegacyTilesetInfo(tilesetInfo)) {
    tileWidth = tilesetInfo.resolutions[zoomLevel] * pixelsPerTile;
  } else {
    tileWidth = maxDim / 2 ** zoomLevel;
  }

  const tilePos = Math.floor((position - dataStartPos) / tileWidth);
  const posInTile = Math.floor(
    (pixelsPerTile * (position - tilePos * tileWidth)) / tileWidth,
  );

  return [tilePos, posInTile];
}

/**
 * Calculate the tiles that should be visible get a data domain
 * and a tileset info
 *
 * All the parameters except the first should be present in the
 * tileset_info returned by the server.
 *
 * @param {number} zoomLevel - The zoom level at which to find the tiles (can be
 *   calculated using this.calcaulteZoomLevel, but needs to synchronized across
 *   both x and y scales so should be calculated externally)
 * @param {Scale} scale - A d3 scale mapping data domain to visible values
 * @param {number} minX - The minimum possible value in the dataset
 * @param {number} _maxX - The maximum possible value in the dataset
 * @param {number} maxZoom - The maximum zoom value in this dataset
 * @param {number} maxDim - The largest dimension of the tileset (e.g., width or height)
 *   (roughlty equal to 2 ** maxZoom * tileSize * tileResolution)
 * @returns {Array<number>} The indices of the tiles that should be visible
 */
export const calculateTiles = (
  zoomLevel,
  scale,
  minX,
  _maxX,
  maxZoom,
  maxDim,
) => {
  const zoomLevelFinal = Math.min(zoomLevel, maxZoom);

  // the ski areas are positioned according to their
  // cumulative widths, which means the tiles need to also
  // be calculated according to cumulative width

  const tileWidth = maxDim / 2 ** zoomLevelFinal;
  const epsilon = 0.0000001;

  return range(
    Math.max(0, Math.floor((scale.domain()[0] - minX) / tileWidth)),
    Math.min(
      2 ** zoomLevelFinal,
      Math.ceil((scale.domain()[1] - minX - epsilon) / tileWidth),
    ),
  );
};

/**
 * @param {TilesetInfo} tilesetInfo
 * @param {number} zoomLevel
 * @param {number} binsPerTile
 */
export const calculateTileWidth = (tilesetInfo, zoomLevel, binsPerTile) => {
  if (!isLegacyTilesetInfo(tilesetInfo)) {
    const sortedResolutions = tilesetInfo.resolutions
      .map((x) => +x)
      .sort((a, b) => b - a);
    return sortedResolutions[zoomLevel] * binsPerTile;
  }
  return tilesetInfo.max_width / 2 ** zoomLevel;
};

/**
 * Calculate the tiles that sould be visisble given the resolution and
 * the minX and maxX values for the region
 *
 * @param {number} resolution - The number of base pairs per bin
 * @param {Scale} scale - The scale to use to calculate the currently visible tiles
 * @param {number} minX - The minimum x position of the tileset
 * @param {number} maxX - The maximum x position of the tileset
 * @param {number=} pixelsPerTile - The number of pixels per tile
 * @returns {number[]} The indices of the tiles that should be visible
 */
export const calculateTilesFromResolution = (
  resolution,
  scale,
  minX,
  maxX,
  pixelsPerTile,
) => {
  const epsilon = 0.0000001;
  const PIXELS_PER_TILE = pixelsPerTile || 256;
  const tileWidth = resolution * PIXELS_PER_TILE;
  const MAX_TILES = 20;
  // console.log('PIXELS_PER_TILE:', PIXELS_PER_TILE);

  if (!maxX) {
    maxX = Number.MAX_VALUE;
  }

  const lowerBound = Math.max(
    0,
    Math.floor((scale.domain()[0] - minX) / tileWidth),
  );
  const upperBound = Math.ceil(
    Math.min(maxX, scale.domain()[1] - minX - epsilon) / tileWidth,
  );
  let tileRange = range(lowerBound, upperBound);

  if (tileRange.length > MAX_TILES) {
    // too many tiles visible in this range
    console.warn(
      `Too many visible tiles: ${tileRange.length} truncating to ${MAX_TILES}`,
    );
    tileRange = tileRange.slice(0, MAX_TILES);
  }
  // console.log('tileRange:', tileRange);

  return tileRange;
};

/**
 * Render 2D tile data. Convert the raw values to an array of
 * color values
 *
 * @param {{ mirrored?: boolean, isMirrored?: boolean, tileData: { dense: Float32Array, tilePos: readonly [a: number, b?: number], shape: readonly [number, number] }}} tile
 * @param {"log" | "linear"} valueScaleType - Either 'log' or 'linear'
 * @param {[min: number, max: number]} valueScaleDomain - The domain of the scale (the range is always [254,0])
 * @param {number} pseudocount
 * @param {ReadonlyArray<readonly [r: number, g: number, b: number, a: number]>} colorScale - a 255 x 4 rgba array used as a color scale
 * @param {(x: null | { pixData: Uint8ClampedArray }) => void} finished
 * @param {boolean | undefined} ignoreUpperRight - If this is a tile along the diagonal and there will be mirrored tiles present ignore the upper right values
 * @param {boolean | undefined} ignoreLowerLeft - If this is a tile along the diagonal and there will be mirrored tiles present ignore the lower left values
 * @param {[r: number, g:number, b: number, a: number]} zeroValueColor - The color to use for rendering zero data values
 * @param {Partial<SelectedRowsOptions>} selectedRowsOptions Rendering options when using a `selectRows` track option.
 */
export const tileDataToPixData = (
  tile,
  valueScaleType,
  valueScaleDomain,
  pseudocount,
  colorScale,
  finished,
  ignoreUpperRight,
  ignoreLowerLeft,
  zeroValueColor,
  selectedRowsOptions,
) => {
  const { tileData } = tile;

  if (!tileData.dense) {
    // if we didn't get any data from the server, don't do anything
    finished(null);
    return;
  }

  if (
    tile.mirrored &&
    // Data is already copied over
    !tile.isMirrored &&
    tile.tileData.tilePos.length > 0 &&
    tile.tileData.tilePos[0] === tile.tileData.tilePos[1]
  ) {
    // Copy the data before mutating it in case the same data is used elsewhere.
    // During throttling/debouncing tile requests we also merge the requests so
    // the very same tile data might be used by different tracks.
    tile.tileData.dense = tile.tileData.dense.slice();

    // if a center tile is mirrored, we'll just add its transpose
    const tileWidth = Math.floor(Math.sqrt(tile.tileData.dense.length));
    for (let row = 0; row < tileWidth; row++) {
      for (let col = row + 1; col < tileWidth; col++) {
        tile.tileData.dense[row * tileWidth + col] =
          tile.tileData.dense[col * tileWidth + row];
      }
    }
    if (ignoreLowerLeft) {
      for (let row = 0; row < tileWidth; row++) {
        for (let col = 0; col < row; col++) {
          tile.tileData.dense[row * tileWidth + col] = Number.NaN;
        }
      }
    }
    tile.isMirrored = true;
  }

  const pixData = workerSetPix(
    tileData.dense.length,
    tileData.dense,
    valueScaleType,
    valueScaleDomain,
    pseudocount,
    colorScale,
    ignoreUpperRight,
    ignoreLowerLeft,
    tile.tileData.shape,
    zeroValueColor,
    selectedRowsOptions,
  );

  finished({ pixData });
};

/**
 * @template T
 * @overload
 * @param {string | URL} url
 * @param {(err: Error | undefined, value: T | undefined) => void} callback
 * @param {"json"} textOrJson
 * @param {import("pub-sub-es").PubSub} pubSub
 * @returns {Promise<T>}
 */

/**
 * @overload
 * @param {string | URL} url
 * @param {(err: Error | undefined, value: string | undefined) => void} callback
 * @param {"text"} textOrJson
 * @param {import("pub-sub-es").PubSub} pubSub
 * @returns {Promise<string>}
 */

/**
 * @template T
 * @param {string | URL} url
 * @param {(err: Error | undefined, value: T | undefined) => void} callback
 * @param {"text" | "json"} textOrJson
 * @param {import("pub-sub-es").PubSub} pubSub
 * @returns {Promise<T>}
 */
function fetchEither(url, callback, textOrJson, pubSub) {
  requestsInFlight += 1;
  pubSub.publish('requestSent', url);

  let mime = null;
  if (textOrJson === 'text') {
    mime = null;
  } else if (textOrJson === 'json') {
    mime = 'application/json';
  } else {
    throw new Error(`fetch either "text" or "json", not "${textOrJson}"`);
  }
  /** @type {Record<string, string>} */
  const headers = {};

  if (mime) {
    headers['Content-Type'] = mime;
  }
  if (authHeader) {
    headers.Authorization = authHeader;
  }
  return fetch(url, { credentials: 'same-origin', headers })
    .then((rep) => {
      if (!rep.ok) {
        throw Error(rep.statusText);
      }

      return rep[textOrJson]();
    })
    .then((content) => {
      callback(undefined, content);
      return content;
    })
    .catch((error) => {
      console.error(`Could not fetch ${url}`, error);
      callback(error, undefined);
      return error;
    })
    .finally(() => {
      pubSub.publish('requestReceived', url);
      requestsInFlight -= 1;
    });
}

/**
 * Send a text request and mark it so that we can tell how many are in flight
 *
 * @param {string | URL} url
 * @param {(err: Error | undefined, value: string | undefined) => void} callback
 * @param {import("pub-sub-es").PubSub} pubSub
 */
function text(url, callback, pubSub) {
  return fetchEither(url, callback, 'text', pubSub);
}

/**
 * Send a JSON request and mark it so that we can tell how many are in flight
 *
 * @template T
 * @param {string} url
 * @param {(err: Error | undefined, value: T | undefined) => void} callback
 * @param {import("pub-sub-es").PubSub} pubSub
 */
async function json(url, callback, pubSub) {
  // Fritz: What is going on here? Can someone explain?
  if (url.indexOf('hg19') >= 0) {
    await sleep(1);
  }
  return fetchEither(url, callback, 'json', pubSub);
}

/**
 * Request a tilesetInfo for a track
 *
 * @param {string} server: The server where the data resides
 * @param {string} tilesetUid: The identifier for the dataset
 * @param {(info: Record<string, TilesetInfo>) => void} doneCb: A callback that gets called when the data is retrieved
 * @param {(error: string) => void} errorCb: A callback that gets called when there is an error
 * @param {import("pub-sub-es").PubSub} pubSub
 * @returns {void}
 */
export const trackInfo = (server, tilesetUid, doneCb, errorCb, pubSub) => {
  const url = `${tts(server)}/tileset_info/?d=${tilesetUid}&s=${sessionId}`;
  pubSub.publish('requestSent', url);
  // TODO: Is this used?
  json(
    url,
    (error, data) => {
      pubSub.publish('requestReceived', url);
      if (error) {
        if (errorCb) {
          errorCb(`Error retrieving tilesetInfo from: ${server}`);
        } else {
          console.warn('Error retrieving: ', url);
        }
      } else {
        doneCb(data);
      }
    },
    pubSub,
  );
};

const api = {
  calculateResolution,
  calculateTileAndPosInTile,
  calculateTiles,
  calculateTilesFromResolution,
  calculateTileWidth,
  calculateZoomLevel,
  calculateZoomLevelFromResolutions,
  fetchTilesDebounced,
  json,
  text,
  tileDataToPixData,
  trackInfo,
};

export default api;
