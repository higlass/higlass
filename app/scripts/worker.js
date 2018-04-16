import { scaleLog, scaleLinear } from 'd3-scale';

/*
function countTransform(count) {
    return Math.sqrt(Math.sqrt(count + 1));
}

function countTransform(count) {
    return Math.log(count+0.0001);
}
*/
const epsilon = 0.0000001;

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
export function minNonZero(data) {
  let minNonZeroVal = Number.MAX_SAFE_INTEGER;

  for (let i = 0; i < data.length; i++) {
    const x = data[i];

    if (x < epsilon && x > -epsilon) continue;

    if (x < minNonZeroVal) { minNonZeroVal = x; }
  }

  return minNonZeroVal;
}

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
export function maxNonZero(data) {
  let maxNonZeroVal = Number.MIN_SAFE_INTEGER;

  for (let i = 0; i < data.length; i++) {
    const x = data[i];

    if (x < epsilon && x > -epsilon) continue;

    if (x > maxNonZeroVal) { maxNonZeroVal = x; }
  }

  return maxNonZeroVal;
}

export function workerSetPix(
  size, data, valueScaleType, valueScaleDomain, pseudocount, colorScale, transIdx
) {
  /**
   * The pseudocount is generally the minimum non-zero value and is
   * used so that our log scaling doesn't lead to NaN values.
   */
  const epsilon = 0.000001;
  let valueScale = null;

  if (valueScaleType === 'log') {
    valueScale = scaleLog()
      .range([254, 0])
      .domain(valueScaleDomain);
  } else {
    if (valueScaleType !== 'linear') {
      console.warn('Unknown value scale type:', valueScaleType, ' Defaulting to linear');
    }
    valueScale = scaleLinear()
      .range([254, 0])
      .domain(valueScaleDomain);
  }

  const pixData = new Uint8ClampedArray(data.length * 4);

  let rgbIdx = 0;
  let e = 0;
  let k = 0;

  const isTransIdx = !!transIdx.length;
  try {
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      e = d; // for debugging

      rgbIdx = 255; // transparent

      if (Math.abs(d) > epsilon) {
        // values less than espilon are considered NaNs and made transparent (rgbIdx 255)
        rgbIdx = Math.max(0, Math.min(254, Math.floor(valueScale(d + pseudocount))));
      }
      // let rgbIdx = qScale(d); //Math.max(0, Math.min(255, Math.floor(valueScale(ct))))
      if (rgbIdx < 0 || rgbIdx > 255) {
        console.warn('out of bounds rgbIdx:', rgbIdx, ' (should be 0 <= rgbIdx <= 255)');
      }
      const rgb = colorScale[rgbIdx];

      const baseI = i * 4;
      let alphaColor = rgb[3];

      if (isTransIdx && i === transIdx[k]) {
        alphaColor = 0;
        k += 1;
      }

      pixData[baseI] = rgb[0];
      pixData[baseI + 1] = rgb[1];
      pixData[baseI + 2] = rgb[2];
      pixData[baseI + 3] = alphaColor;
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
  const binaryString = atob(base64);
  const len = binaryString.length;

  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
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

/**
 * Convert a response from the tile server to
 * data that can be used by higlass
 */
export function tileResponseToData(data, server, theseTileIds) {
  if (!data) {
    // probably an error
    data = {};
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

    if ('dense' in data[key]) {
      const arrayBuffer = _base64ToArrayBuffer(data[key].dense);
      let a;


      if (data[key].dtype === 'float16') {
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

  return data;
}

export function workerGetTiles(outUrl, server, theseTileIds, authHeader, done) {
  const headers = {
        'content-type': 'application/json'
      };

  if (authHeader)
    headers['Authorization'] = authHeader;

  fetch(outUrl, {
      headers,
    }
    )
    .then(response => {
      return response.json()
    }
    )
    .then(data =>  {
      data = tileResponseToData(data, server, theseTileIds);

      done(data);

      /*
      const denses = Object.values(data)
        .filter(x => x.dense)
        .map(x => x.dense);
      */
      //.map(x => x.dense.buffer);

      //done.transfer(data, denses);
    })
  .catch(err =>
    console.log('err:', err));
}
