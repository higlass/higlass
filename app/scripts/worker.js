import { json } from 'd3-request';
import pubSub from './services/pub-sub';

/*
function countTransform(count) {
    return Math.sqrt(Math.sqrt(count + 1));
}

function countTransform(count) {
    return Math.log(count+0.0001);
}
*/
const epsilon = 0.0000001;

const MAX_FETCH_TILES = 20;

export function minNonZero(data) {
  /**
   * Calculate the minimum non-zero value in the data
   *
   * Parameters
   * ----------
   *  data: Float32Array
   *    An array of values
   *
   * Returns
   * -------
   *  minNonZero: float
   *    The minimum non-zero value in the array
   */
   let minNonZero = Number.MAX_SAFE_INTEGER;

  for (let i = 0; i < data.length; i++) {
    const x = data[i];

    if (x < epsilon && x > -epsilon) { continue; }

    if (x < minNonZero) { minNonZero = x; }
  }

  return  minNonZero;
}

export function maxNonZero(data) {
  /**
   * Calculate the minimum non-zero value in the data
   *
   * Parameters
   * ----------
   *  data: Float32Array
   *    An array of values
   *
   * Returns
   * -------
   *  minNonZero: float
   *    The minimum non-zero value in the array
   */
  let maxNonZero = Number.MIN_SAFE_INTEGER;

  for (let i = 0; i < data.length; i++) {
    const x = data[i];

    if (x < epsilon && x > -epsilon) { continue; }

    if (x > maxNonZero) { maxNonZero = x; }
  }

  return maxNonZero;
}

export function workerSetPix(
  size, data, valueScale, pseudocount, colorScale, passedCountTransform
) {
  /**
   * The pseudocount is generally the minimum non-zero value and is
   * used so that our log scaling doesn't lead to NaN values.
   */
  const epsilon = 0.000001;

  const pixData = new Uint8ClampedArray(size * 4);

  let rgbIdx = 0;
  let e = 0;

  try {
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      e = d; // for debugging

      rgbIdx = 255;

      if (d > epsilon) {
        // values less than espilon are considered NaNs and made transparent (rgbIdx 255)
        rgbIdx = Math.max(0, Math.min(254, Math.floor(valueScale(d + pseudocount))));
      }
      // let rgbIdx = qScale(d); //Math.max(0, Math.min(255, Math.floor(valueScale(ct))))
      if (rgbIdx < 0 || rgbIdx > 255) {
        console.warn('out of bounds rgbIdx:', rgbIdx, ' (should be 0 <= rgbIdx <= 255)');
      }
      const rgb = colorScale[rgbIdx];

      pixData[i * 4] = rgb[0];
      pixData[i * 4 + 1] = rgb[1];
      pixData[i * 4 + 2] = rgb[2];
      pixData[i * 4 + 3] = rgb[3];
    }
  } catch (err) {
    console.warn('Odd datapoint');
    console.warn('valueScale.domain():', valueScale.domain());
    console.warn('valueScale.range():', valueScale.range());
    console.warn('value:', valueScale(e + pseudocount));
    console.warn('pseudocount:', pseudocount);
    console.warn('rgbIdx:', rgbIdx, 'd:', e, 'ct:', valueScale(e));
    console.error('ERROR:', err);
    return pixData;
  }

  return pixData;
}

export function workerGetTilesetInfo(url, done) {
  pubSub.publish('requestSent', url);
  json(url, (error, data) => {
    pubSub.publish('requestReceived', url);
    if (error) {
      // console.log('error:', error);
      // don't do anything
      // no tileset info just means we can't do anything with this file...
    } else {
      // console.log('got data', data);
      done(data);
    }
  });
}

function float32(inUint16) {
  /**
   * Yanked from https://gist.github.com/martinkallman/5049614
   *
   * Does not support infinities or NaN. All requests with such
   * values should be encoded as float32
   */
  let t1;
  let t2;
  let t3;

  t1 = inUint16 & 0x7fff; // Non-sign bits
  t2 = inUint16 & 0x8000; // Sign bit
  t3 = inUint16 & 0x7c00; // Exponent

  t1 <<= 13; // Align mantissa on MSB
  t2 <<= 16; // Shift sign bit into position

  t1 += 0x38000000; // Adjust bias

  t1 = (t3 === 0 ? 0 : t1); // Denormals-as-zero

  t1 |= t2; // Re-insert sign bit

  return t1;
}

function _base64ToArrayBuffer(base64) {
  const binary_string = window.atob(base64);
  const len = binary_string.length;

  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }

  return bytes.buffer;
}

function _uint16ArrayToFloat32Array(uint16array) {
  const bytes = new Uint32Array(uint16array.length);

  for (let i = 0; i < uint16array.length; i++) {
    bytes[i] = float32(uint16array[i]);
  }

  const newBytes = new Float32Array(bytes.buffer);

  return newBytes;
}

export function workerFetchTiles(tilesetServer, tileIds, sessionId, done) {
  const fetchPromises = [];

  // if we request too many tiles, then the URL can get too long and fail
  // so we'll break up the requests into smaller subsets
  for (let i = 0; i < tileIds.length; i += MAX_FETCH_TILES) {
    const theseTileIds = tileIds.slice(i, i + Math.min(tileIds.length - i, MAX_FETCH_TILES));

    const renderParams = theseTileIds.map(x => `d=${x}`).join('&');
    const outUrl = `${tilesetServer}/tiles/?${renderParams}&s=${sessionId}`;

    const p = new Promise(((resolve, reject) => {
      pubSub.publish('requestSent', outUrl);
      json(outUrl, (error, data) => {
        pubSub.publish('requestReceived', outUrl);
        if (error) {
          resolve({});
        } else {
          // check if we have array data to convert from base64 to float32
          for (const key in data) {
            // let's hope the payload doesn't contain a tileId field
            const keyParts = key.split('.');

            data[key].tileId = key;
            data[key].zoomLevel = +keyParts[1];
            data[key].tilePos = keyParts.slice(2, keyParts.length).map(x => +x);
            data[key].tilesetUid = keyParts[0];

            if ('dense' in data[key]) {
              // let uint16Array = new Uint16Array(
              const newShortDense = _base64ToArrayBuffer(data[key].dense);
              const newDense = _float16ArrayToFloat32Array(newShortDense);

              const a = new Float32Array(newDense);
              let minNonZero = Number.MAX_SAFE_INTEGER;
              let maxNonZero = Number.MIN_SAFE_INTEGER;

              data[key].dense = a;

              // find the minimum and maximum non-zero values
              for (let i = 0; i < a.length; i++) {
                const x = a[i];

                if (x < epsilon && x > -epsilon) { continue; }

                if (x < minNonZero) { minNonZero = x; }
                if (x > maxNonZero) { maxNonZero = x; }
              }

              data[key].minNonZero = minNonZero;
              data[key].maxNonZero = maxNonZero;
            }
          }

          resolve(data);
        }
      });
    }));

    fetchPromises.push(p);
  }

  Promise.all(fetchPromises).then((datas) => {
    // merge back all the tile requests
    for (let i = 1; i < datas.length; i++) {
      for (const uid in datas[i]) datas[0][uid] = datas[i][uid];
    }

    done(datas[0]);
  });
}

export function workerFetchMultiRequestTiles(req) {
  const sessionId = req.sessionId;
  const requests = req.requests;
  const fetchPromises = [];

  const requestsByServer = {};

  // We're converting the array of IDs into an object in order to filter out duplicated requests.
  // In case different instances request the same data it won't be loaded twice.
  for (const request of requests) {
    if (!requestsByServer[request.server]) {
      requestsByServer[request.server] = {};
    }
    for (const id of request.ids) {
      requestsByServer[request.server][id] = true;
    }
  }

  const servers = Object.keys(requestsByServer);

  for (const server of servers) {
    const ids = Object.keys(requestsByServer[server]);
    // console.log('ids:', ids);

    // if we request too many tiles, then the URL can get too long and fail
    // so we'll break up the requests into smaller subsets
    for (let i = 0; i < ids.length; i += MAX_FETCH_TILES) {
      const theseTileIds = ids.slice(i, i + Math.min(ids.length - i, MAX_FETCH_TILES));

      const renderParams = theseTileIds.map(x => `d=${x}`).join('&');
      const outUrl = `${server}/tiles/?${renderParams}&s=${sessionId}`;

      const p = new Promise(((resolve, reject) => {
        pubSub.publish('requestSent', outUrl);
        json(outUrl, (error, data) => {
          pubSub.publish('requestReceived', outUrl);
          if (!data)  {
            // probably an error
            data = {}
          }

          if (error) {
            console.warn('Error fetching data:', error);
          }

          for (const thisId of theseTileIds) {
            if (!(thisId in data)) {
              // the server didn't return any data for this tile
              data[thisId] = {};
            }
            const key = thisId;
            // let's hope the payload doesn't contain a tileId field
            const keyParts = key.split('.');

            data[key].server = server;
            data[key].tileId = key;
            data[key].zoomLevel = +keyParts[1];
            data[key].tilePos = keyParts.slice(2, keyParts.length).map(x => +x);
            data[key].tilesetUid = keyParts[0];

            if (error) {
              // if there's an error, we have no data to fill in
              data[key].error = error;
              continue;
            }

            if ('dense' in data[key]) {
              const arrayBuffer = _base64ToArrayBuffer(data[key].dense);
              let a;


              if (data[key].dtype == 'float16') {
                // data is encoded as float16s
                /* comment out until next empty line for 32 bit arrays */
                const uint16Array = new Uint16Array(arrayBuffer);
                const newDense = _uint16ArrayToFloat32Array(uint16Array);
                a = newDense;
              } else {
                // data is encoded as float32s
                a = new Float32Array(arrayBuffer);
              }


              data[key].dense = a;

              data[key].minNonZero = minNonZero(a);
              data[key].maxNonZero = maxNonZero(a);

              /*
                              if (data[key]['minNonZero'] == Number.MAX_SAFE_INTEGER &&
                                  data[key]['maxNonZero'] == Number.MIN_SAFE_INTEGER) {
                                  // if there's no values except 0,
                                  // then do use it as the min value

                                  data[key]['minNonZero'] = 0;
                                  data[key]['maxNonZero'] = 1;
                              }
                              */
            }
          }

          resolve(data);
        });
      }));

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
      const server = request.server;

      // pull together the data per request
      for (const id of request.ids) {
        reqDate[id] = tiles[`${server}/${id}`];
      }

      request.done(reqDate);
    }
  });
}

function workerLoadTileData(tile_value, tile_type) {
  const resolution = 256;

  const t1 = new Date().getTime();
  if (tile_type == 'dense') { return tile_value; } else if (tile_type == 'sparse') {
    const values = [];
    for (let i = 0; i < resolution * resolution; i++) { values.push(0); }

    let i = 0;
    while (i < tile_value.length) {
      const value = tile_value[i];
      let num_poss = tile_value[i + 1];
      i += 2;

      let xs = [],
        ys = [];

      for (let j = 0; j < num_poss; j++) { xs.push(tile_value[i + j]); }

      for (let j = 0; j < num_poss; j++) { ys.push(tile_value[i + num_poss + j]); }

      for (let j = 0; j < num_poss; j++) {
        values[ys[j] * resolution +
                xs[j]] = value;
      }

      i += num_poss *= 2;
    }

    return values;
  }
  return [];
}

/*
self.addEventListener('message', function (e) {
    //should only be called when workerSetPix needs to be called
    let passedData = e.data;
    let inputTileData = new Float32Array(passedData.tile.data, 0, passedData.tile.dataLength);

    let tileData = workerLoadTileData(inputTileData, passedData.tile.type)
    let pixOutput = workerSetPix(256 * 256, tileData, passedData.minVisibleValue,
            passedData.maxVisibleValue,
            passedData.tile.colorScale );

    let returnObj = {
        shownTileId: passedData.shownTileId,
        tile: {
            tilePos: passedData.tile.tilePos,
            maxZoom: passedData.tile.maxZoom,
            xOrigDomain: passedData.tile.xOrigDomain,
            yOrigDomain: passedData.tile.yOrigDomain,
            xOrigRange: passedData.tile.xOrigRange,
            yOrigRange: passedData.tile.yOrigRange,
            xRange: passedData.tile.xRange,
            yRange: passedData.tile.yRange,
            mirrored: passedData.tile.mirrored
        }, pixData: pixOutput
    };
    self.postMessage(returnObj, [returnObj.pixData.buffer]);
}, false);
*/

/*
module.exports = function (passedData, done) {
    let inputTileData = new Float32Array(passedData.tile.data, 0, passedData.tile.dataLength);

    let tileData = workerLoadTileData(inputTileData, passedData.tile.type);
    let pixOutput = workerSetPix(256 * 256, tileData,
            passedData.minVisibleValue,
            passedData.maxVisibleValue,
            colorScale = passedData.colorScale);

    let returnObj = {
        shownTileId: passedData.shownTileId,
        tile: {
            tilePos: passedData.tile.tilePos,
            maxZoom: passedData.tile.maxZoom,
            xOrigDomain: passedData.tile.xOrigDomain,
            yOrigDomain: passedData.tile.yOrigDomain,
            xOrigRange: passedData.tile.xOrigRange,
            yOrigRange: passedData.tile.yOrigRange,
            xRange: passedData.tile.xRange,
            yRange: passedData.tile.yRange,
            mirrored: passedData.tile.mirrored
        }, pixData: pixOutput
    };

    done(returnObj, [returnObj.pixData.buffer]);
};
*/
