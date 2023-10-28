// @ts-nocheck
import { range } from 'd3-array';
import slugid from 'slugid';

import { workerGetTiles, workerSetPix } from './worker';

import { trimTrailingSlash as tts, timeout as sleep } from '../utils';

// Config
import { TILE_FETCH_DEBOUNCE } from '../configs';

const MAX_FETCH_TILES = 15;

/*
const str = document.currentScript.src
const pathName = str.substring(0, str.lastIndexOf("/"));
const workerPath = `${pathName}/worker.js`;

const setPixPool = new Pool(1);

setPixPool.run(function(params, done) {
  try {
    const array = new Float32Array(params.data);
    const pixData = worker.workerSetPix(
      params.size,
      array,
      params.valueScaleType,
      params.valueScaleDomain,
      params.pseudocount,
      params.colorScale,
    );

    done.transfer({
      pixData: pixData
    }, [pixData.buffer]);
  } catch (err) {
    console.log('err:', err);
  }
}, [workerPath]);


const fetchTilesPool = new Pool(10);
fetchTilesPool.run(function(params, done) {
  try {
    worker.workerGetTiles(params.outUrl, params.server, params.theseTileIds,
    params.authHeader, done);
    // done.transfer({
    // pixData: pixData
    // }, [pixData.buffer]);
  } catch (err) {
    console.log('err:', err);
  }
}, [workerPath]);
*/

const sessionId = import.meta.env.DEV ? 'dev' : slugid.nice();
export let requestsInFlight = 0; // eslint-disable-line import/no-mutable-exports
export let authHeader = null; // eslint-disable-line import/no-mutable-exports

const throttleAndDebounce = (func, interval, finalWait) => {
  let timeout;
  let bundledRequest = [];
  let requestMapper = {};
  let blockedCalls = 0;

  const bundleRequests = (request) => {
    const requestId = requestMapper[request.id];

    if (requestId && bundledRequest[requestId]) {
      bundledRequest[requestId].ids = bundledRequest[requestId].ids.concat(
        request.ids,
      );
    } else {
      requestMapper[request.id] = bundledRequest.length;
      bundledRequest.push(request);
    }
  };

  const reset = () => {
    timeout = null;
    bundledRequest = [];
    requestMapper = {};
  };

  // In a normal situation we would just call `func(...args)` but since we
  // modify the first argument and always trigger `reset()` afterwards I created
  // this helper function to avoid code duplication. Think of this function
  // as the actual function call that is being throttled and debounced.
  const callFunc = (request, ...args) => {
    func(
      {
        sessionId,
        requests: bundledRequest,
      },
      ...args,
    );
    reset();
  };

  const debounced = (request, ...args) => {
    const later = () => {
      // Since we throttle and debounce we should check whether there were
      // actually multiple attempts to call this function after the most recent
      // throttled call. If there were no more calls we don't have to call
      // the function again.
      if (blockedCalls > 0) {
        callFunc(request, ...args);
        blockedCalls = 0;
      }
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, finalWait);
  };

  debounced.cancel = () => {
    clearTimeout(timeout);
    reset();
  };

  debounced.immediate = () => {
    func({
      sessionId,
      requests: bundledRequest,
    });
  };

  let wait = false;
  const throttled = (request, ...args) => {
    bundleRequests(request);

    if (!wait) {
      callFunc(request, ...args);
      debounced(request, ...args);
      wait = true;
      blockedCalls = 0;
      setTimeout(() => {
        wait = false;
      }, interval);
    } else {
      blockedCalls++;
    }
  };

  return throttled;
};

export const setTileProxyAuthHeader = (newHeader) => {
  authHeader = newHeader;
};

export const getTileProxyAuthHeader = () => authHeader;

// Fritz: is this function used anywhere?
export function fetchMultiRequestTiles(req, pubSub) {
  const requests = req.requests;

  const fetchPromises = [];

  const requestsByServer = {};
  const requestBodyByServer = {};

  // We're converting the array of IDs into an object in order to filter out duplicated requests.
  // In case different instances request the same data it won't be loaded twice.
  for (const request of requests) {
    if (!requestsByServer[request.server]) {
      requestsByServer[request.server] = {};
      requestBodyByServer[request.server] = [];
    }
    for (const id of request.ids) {
      requestsByServer[request.server][id] = true;

      if (request.options) {
        const firstSepIndex = id.indexOf('.');
        const tilesetUuid = id.substring(0, firstSepIndex);
        const tileId = id.substring(firstSepIndex + 1);
        const tilesetObject = requestBodyByServer[request.server].find(
          (t) => t.tilesetUid === tilesetUuid,
        );
        if (tilesetObject) {
          tilesetObject.tileIds.push(tileId);
        } else {
          requestBodyByServer[request.server].push({
            tilesetUid: tilesetUuid,
            tileIds: [tileId],
            options: request.options,
          });
        }
      }
    }
  }

  const servers = Object.keys(requestsByServer);

  for (const server of servers) {
    const ids = Object.keys(requestsByServer[server]);
    // console.log('ids:', ids);

    const requestBody = requestBodyByServer[server];

    // if we request too many tiles, then the URL can get too long and fail
    // so we'll break up the requests into smaller subsets
    for (let i = 0; i < ids.length; i += MAX_FETCH_TILES) {
      const theseTileIds = ids.slice(
        i,
        i + Math.min(ids.length - i, MAX_FETCH_TILES),
      );

      const renderParams = theseTileIds.map((x) => `d=${x}`).join('&');
      const outUrl = `${server}/tiles/?${renderParams}&s=${sessionId}`;

      /* eslint-disable no-loop-func */
      /* eslint-disable no-unused-vars */
      const p = new Promise((resolve, reject) => {
        pubSub.publish('requestSent', outUrl);
        const params = {};

        params.outUrl = outUrl;
        params.server = server;
        params.theseTileIds = theseTileIds;
        params.authHeader = authHeader;

        workerGetTiles(
          params.outUrl,
          params.server,
          params.theseTileIds,
          params.authHeader,
          resolve,
          requestBody,
        );

        /*
        fetchTilesPool.send(params)
          .promise()
          .then(ret => {
            resolve(ret);
          });
        */
        pubSub.publish('requestReceived', outUrl);
      });

      fetchPromises.push(p);
    }
  }

  Promise.all(fetchPromises).then((datas) => {
    const tiles = {};

    // merge back all the tile requests
    for (const data of datas) {
      const tileIds = Object.keys(data);

      for (const tileId of tileIds) {
        tiles[`${data[tileId].server}/${tileId}`] = data[tileId];
      }
    }

    // trigger the callback for every request
    for (const request of requests) {
      const reqDate = {};
      const { server } = request;

      // pull together the data per request
      for (const id of request.ids) {
        reqDate[id] = tiles[`${server}/${id}`];
      }

      request.done(reqDate);
    }
  });
}

/**
 * Retrieve a set of tiles from the server
 *
 * Plenty of room for optimization and caching here.
 *
 * @param server: A string with the server's url (e.g. "http://127.0.0.1")
 * @param tileIds: The ids of the tiles to fetch (e.g. asdf-sdfs-sdfs.0.0.0)
 */
export const fetchTilesDebounced = throttleAndDebounce(
  fetchMultiRequestTiles,
  TILE_FETCH_DEBOUNCE,
  TILE_FETCH_DEBOUNCE,
);

/**
 * Calculate the zoom level from a list of available resolutions
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

export const calculateResolution = (tilesetInfo, zoomLevel) => {
  if (tilesetInfo.resolutions) {
    const sortedResolutions = tilesetInfo.resolutions
      .map((x) => +x)
      .sort((a, b) => b - a);
    const resolution = sortedResolutions[zoomLevel];

    return resolution;
  }

  const maxWidth = tilesetInfo.max_width;
  const binsPerDimension = +tilesetInfo.bins_per_dimension;
  const resolution = maxWidth / (2 ** zoomLevel * binsPerDimension);

  return resolution;
};

/**
 * Calculate the current zoom level.
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
 * @param {object} tilesetInfo: The information about this tileset
 * @param {Number} maxDim: The maximum width of the dataset (only used for
 *        tilesets without resolutions)
 * @param {Number} dataStartPos: The position where the data begins
 * @param {int} zoomLevel: The current zoomLevel
 * @param {Number} position: The position (in absolute coordinates) to caculate
 *                 the tile and position in tile for
 */
export function calculateTileAndPosInTile(
  tilesetInfo,
  maxDim,
  dataStartPos,
  zoomLevel,
  position,
) {
  let tileWidth = null;
  const PIXELS_PER_TILE = tilesetInfo.bins_per_dimension || 256;

  if (tilesetInfo.resolutions) {
    tileWidth = tilesetInfo.resolutions[zoomLevel] * PIXELS_PER_TILE;
  } else {
    tileWidth = maxDim / 2 ** zoomLevel;
  }

  const tilePos = Math.floor((position - dataStartPos) / tileWidth);
  const posInTile = Math.floor(
    (PIXELS_PER_TILE * (position - tilePos * tileWidth)) / tileWidth,
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
 * @param {import('../type').Scale} scale - A d3 scale mapping data domain to visible values
 * @param {number} minX - The minimum possible value in the dataset
 * @param {number} maxX - The maximum possible value in the dataset
 * @param {number} maxZoom - The maximum zoom value in this dataset
 * @param {number} maxDim - The largest dimension of the tileset (e.g., width or height)
 *   (roughlty equal to 2 ** maxZoom * tileSize * tileResolution)
 * @returns {number[]} The indices of the tiles that should be visible
 */
export const calculateTiles = (
  zoomLevel,
  scale,
  minX,
  maxX,
  maxZoom,
  maxDim,
) => {
  const zoomLevelFinal = Math.min(zoomLevel, maxZoom);

  // the ski areas are positioned according to their
  // cumulative widths, which means the tiles need to also
  // be calculated according to cumulative width

  const tileWidth = maxDim / 2 ** zoomLevelFinal;
  // console.log('maxDim:', maxDim);

  const epsilon = 0.0000001;

  /*
  console.log('minX:', minX, 'zoomLevel:', zoomLevel);
  console.log('domain:', scale.domain(), scale.domain()[0] - minX,
  ((scale.domain()[0] - minX) / tileWidth))
  */

  return range(
    Math.max(0, Math.floor((scale.domain()[0] - minX) / tileWidth)),
    Math.min(
      2 ** zoomLevelFinal,
      Math.ceil((scale.domain()[1] - minX - epsilon) / tileWidth),
    ),
  );
};

export const calculateTileWidth = (tilesetInfo, zoomLevel, binsPerTile) => {
  if (tilesetInfo.resolutions) {
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
 * @param {import('../type').Scale} scale - The scale to use to calculate the currently visible tiles
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
    maxX = Number.MAX_VALUE; // eslint-disable-line no-param-reassign
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
 * @param finished: A callback to let the caller know that the worker thread
 *   has converted tileData to pixData
 * @param minVisibleValue: The minimum visible value (used for setting the color
 *   scale)
 * @param maxVisibleValue: The maximum visible value
 * @param valueScaleType: Either 'log' or 'linear'
 * @param valueScaleDomain: The domain of the scale (the range is always [254,0])
 * @param colorScale: a 255 x 4 rgba array used as a color scale
 * @param synchronous: Render this tile synchronously or pass it on to the threadpool (which doesn't exist yet).
 * @param ignoreUpperRight: If this is a tile along the diagonal and there will
 * be mirrored tiles present ignore the upper right values
 * @param ignoreLowerLeft: If this is a tile along the diagonal and there will be
 * mirrored tiles present ignore the lower left values
 * @param {array} zeroValueColor: The color to use for rendering zero data values, [r, g, b, a].
 * @param {object} selectedRowsOptions Rendering options when using a `selectRows` track option.
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
          tile.tileData.dense[row * tileWidth + col] = NaN;
        }
      }
    }
    tile.isMirrored = true;
  }

  // console.log('tile', tile);
  // clone the tileData so that the original array doesn't get neutered
  // when being passed to the worker script
  // const newTileData = tileData.dense;

  // comment this and uncomment the code afterwards to enable threading
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

  // const newTileData = new Float32Array(tileData.dense.length);
  // newTileData.set(tileData.dense);
  /*
  var params = {
    size: newTileData.length,
    data: newTileData,
    valueScaleType: valueScaleType,
    valueScaleDomain: valueScaleDomain,
    pseudocount: pseudocount,
    colorScale: colorScale
  };

  setPixPool.send(params, [ newTileData.buffer ])
    .promise()
    .then(returned => {
      finished(returned);
    })
    .catch(reason => {
      finished(null);
    });
  ;
  */
};

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
 * @param url: URL to fetch
 * @param callback: Callback to execute with content from fetch
 */
function text(url, callback, pubSub) {
  return fetchEither(url, callback, 'text', pubSub);
}

/**
 * Send a JSON request and mark it so that we can tell how many are in flight
 *
 * @param url: URL to fetch
 * @param callback: Callback to execute with content from fetch
 */
async function json(url, callback, pubSub) {
  // Fritz: What is going on here? Can someone explain?
  if (url.indexOf('hg19') >= 0) {
    await sleep(1);
  }
  // console.log('url:', url);
  return fetchEither(url, callback, 'json', pubSub);
}

/**
 * Request a tilesetInfo for a track
 *
 * @param {string} server: The server where the data resides
 * @param {string} tilesetUid: The identifier for the dataset
 * @param {func} doneCb: A callback that gets called when the data is retrieved
 * @param {func} errorCb: A callback that gets called when there is an error
 */
export const trackInfo = (server, tilesetUid, doneCb, errorCb, pubSub) => {
  const url = `${tts(server)}/tileset_info/?d=${tilesetUid}&s=${sessionId}`;
  pubSub.publish('requestSent', url);
  // TODO: Is this used?
  json(
    url,
    (error, data) => {
      // eslint-disable-line
      pubSub.publish('requestReceived', url);
      if (error) {
        // console.log('error:', error);
        // don't do anything
        // no tileset info just means we can't do anything with this file...
        if (errorCb) {
          errorCb(`Error retrieving tilesetInfo from: ${server}`);
        } else {
          console.warn('Error retrieving: ', url);
        }
      } else {
        // console.log('got data', data);
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
