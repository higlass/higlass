import { range } from 'd3-array';
import slugid from 'slugid';

import { fetchTiles, workerSetPix } from './worker';

import sleep from '../utils/timeout';
import tts from '../utils/trim-trailing-slash';

/** @import * as types  from '../types' */
/** @import { CompletedTileData, TileResponse, SelectedRowsOptions } from './worker' */

// Config
import { isLegacyTilesetInfo } from '../utils/type-guards';

/** @type {number} */
const MAX_FETCH_TILES = 15;

/** @type {string} */
const sessionId = import.meta.env.DEV ? 'dev' : slugid.nice();
/** @type {number} */
export let requestsInFlight = 0;
/** @type {string | null} */
export let authHeader = null;

/** @param {string} newHeader */
export const setTileProxyAuthHeader = (newHeader) => {
  authHeader = newHeader;
};

/** @returns {string | null} */
export const getTileProxyAuthHeader = () => authHeader;

/**
 * @typedef Request
 * @property {Array<string>} ids
 * @property {string} server
 * @property {Array<{ tilesetUid: string, tileIds: Array<string>, options: Record<string, unknown> }>} [body]
 */

/**
 * Bundle requests by Request ID
 *
 * @param {Array<types.TilesRequest>} requests
 * @params {Array<Omit<types.TilesRequest, "tilesetUid">>} requests
 */
function bundleRequestsByRequestId(requests) {
  /** @type {Array<Omit<types.TilesRequest, "tilesetUid">>} requests */
  const bundle = [];
  /** @type {Record<string, number>} */
  const mapper = {};

  for (const request of requests) {
    if (mapper[request.id] === undefined) {
      mapper[request.id] = bundle.length;
      bundle.push({
        id: request.id,
        tileIds: [],
        server: request.server,
        options: request.options,
      });
    }
    bundle[mapper[request.id]].tileIds.push(...request.tileIds);
  }

  return bundle;
}

/**
 * @template T
 * @template U
 * @typedef {T & { done: (value: U) => void; }} WithResolver
 */

/**
 * @param {Array<Omit<types.TilesRequest, "tilesetUid" | "id">>} requests
 * @returns {Array<Omit<types.TilesRequest, "tilesetUid" | "id"> & { body: unknown }>}
 */
function bundleRequestsByServer(requests) {
  /** @typedef {{ tileIds: Array<string>, options: Record<string, unknown> }} TilesetOptions >} */
  /** @type {Record<string, {ids: Set<string>, optionsByTilesetUids: Record<string, TilesetOptions>}>} */
  const servers = {};

  // We're converting the array of IDs into an object in order to filter out duplicated requests.
  // In case different instances request the same data it won't be loaded twice.
  for (const request of requests) {
    servers[request.server] ??= { ids: new Set(), optionsByTilesetUids: {} };
    const server = servers[request.server];
    for (const id of request.tileIds) {
      server.ids.add(id);
      if (!request.options) {
        continue;
      }
      const { tilesetUid, tileId } = parseTileRequestId(id);
      server.optionsByTilesetUids[tilesetUid] ??= {
        tileIds: [],
        options: request.options,
      };
      server.optionsByTilesetUids[tilesetUid].tileIds.push(tileId);
    }
  }
  return Object.entries(servers).map(
    ([server, { ids, optionsByTilesetUids }]) => ({
      server,
      tileIds: [...ids],
      body: Object.entries(optionsByTilesetUids).map(
        ([tilesetUid, { tileIds, options }]) => ({
          tilesetUid,
          tileIds,
          options,
        }),
      ),
    }),
  );
}

/**
 * @param {Array<types.TilesRequest>} requests
 * @returns {Generator<ReturnType<typeof bundleRequestsByServer>[number], void, void>}
 */
function* bundleRequests(requests) {
  const consolidated = bundleRequestsByRequestId(requests);
  for (const request of bundleRequestsByServer(consolidated)) {
    // if we request too many tiles, then the URL can get too long and fail
    // so we'll break up the requests into smaller subsets
    for (const tileIds of chunkIterable(request.tileIds, MAX_FETCH_TILES)) {
      yield { ...request, tileIds };
    }
  }
}

/** @typedef {CompletedTileData<TileResponse>} Tile */

/**
 * @type {(request: WithResolver<types.TilesRequest, Record<string, Tile>>) => void}
 */
export const fetchTilesDebounced = bufferedBatcher(fetchMultiRequestTiles);

/**
 * @param {Array<WithResolver<types.TilesRequest, Record<string, Tile>>>} requests
 */
async function fetchMultiRequestTiles(requests) {
  const promises = Array.from(bundleRequests(requests), async (request) => {
    requestsInFlight += 1;
    return fetchTiles({ ...request, authHeader, sessionId }).then((data) => {
      if (requestsInFlight > 0) requestsInFlight -= 1;
      return data;
    });
  });
  return Promise.all(promises).then((allTileData) => {
    /** @type {(request: { server: string }, id: string) => string} */
    const keyFor = (request, id) => `${request.server}/${id}`;
    /** @type {Record<string, Tile>} */
    const tiles = {};
    for (const tileDataGroup of allTileData) {
      if (!tileDataGroup) {
        // failed request
        continue;
      }
      for (const [tileId, tileData] of Object.entries(tileDataGroup)) {
        tiles[keyFor(tileData, tileId)] = tileData;
      }
    }
    for (const request of requests) {
      /** @type {Record<string, Tile>} */
      const requestData = {};
      for (const id of request.tileIds) {
        const tileData = tiles[keyFor(request, id)];
        if (!tileData) return;
        requestData[id] = tileData;
      }
      request.done(requestData);
    }
  });
}

/**
 * Calculate the zoom level from a list of available resolutions
 *
 * @param {Array<string>} resolutions
 * @param {types.Scale} scale
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
 * @param {types.TilesetInfo} tilesetInfo
 * @param {number} zoomLevel
 * @returns {number}
 */
export const calculateResolution = (tilesetInfo, zoomLevel) => {
  if ('resolutions' in tilesetInfo) {
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
 * @param {types.Scale} scale
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
 * @param {types.TilesetInfo} tilesetInfo - The information about this tileset
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
 * @param {types.Scale} scale - A d3 scale mapping data domain to visible values
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
 * @param {types.TilesetInfo} tilesetInfo
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
 * @param {types.Scale} scale - The scale to use to calculate the currently visible tiles
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
 * @param {(info: Record<string, types.TilesetInfo>) => void} doneCb: A callback that gets called when the data is retrieved
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

/** @param {string} id */
function parseTileRequestId(id) {
  const firstSepIndex = id.indexOf('.');
  return {
    tilesetUid: id.substring(0, firstSepIndex),
    tileId: id.substring(firstSepIndex + 1),
  };
}

/**
 * Creates a buffered batch processor.
 *
 * Collects items and processes them in batches based on size and delay.
 *
 * @template T
 * @param {(batch: Array<T>) => void} processBatch - A function to process each batch.
 * @param {{ batchSize?: number, delay?: number }} [options] - Batch size and delay settings.
 * @returns {(item: T) => void} - A function to enqueue items.
 */
function bufferedBatcher(processBatch, { batchSize = 5, delay = 10 } = {}) {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;

  /** @type {Array<T>} */
  const queue = [];

  /** @type {() => void} */
  const flush = () => {
    if (!queue.length) return;

    processBatch(queue.splice(0, batchSize));

    timer = queue.length ? setTimeout(flush, delay) : undefined;
  };

  /** @type {(item: T) => void} */
  const enqueue = (item) => {
    queue.push(item);
    if (queue.length >= batchSize) {
      flush();
      return;
    }
    if (!timer) {
      timer = setTimeout(flush, delay);
    }
  };

  return enqueue;
}

/**
 * Iterator helper to chunk an array into smaller arrways of a fixed size.
 *
 * @template T
 * @param {Array<T>} iterable
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
