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
  size, data, valueScaleType, valueScaleDomain, pseudocount, colorScale, ignoreUpperRight=false
) {
  /**
   * The pseudocount is generally the minimum non-zero value and is
   * used so that our log scaling doesn't lead to NaN values.
   */
  const epsilon = 0.000001;
  let valueScale = null;

  if (valueScaleType == 'log') {
    valueScale = scaleLog()
      .range([254,0])
      .domain(valueScaleDomain)
  } else {
    if (valueScaleType != 'linear') {
      console.warn('Unknown value scale type:', valueScaleType, ' Defaulting to linear');
    }
    valueScale = scaleLinear()
      .range([254,0])
      .domain(valueScaleDomain)
  }

  const pixData = new Uint8ClampedArray(size * 4);

  let rgbIdx = 0;
  let e = 0;
  const tileWidth = Math.sqrt(size);

  try {
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      e = d; // for debugging


      rgbIdx = 255;

      // ignore the upper right portion of a tile because it's on the diagonal
      // and its mirror will fill in that space
      if (ignoreUpperRight && Math.floor(i / tileWidth) < i % tileWidth) {
        rgbIdx = 255;        
      } else if (isNaN(d)) {
        rgbIdx = 255;
      } else {
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

function float32(h) {
  /**
   * Yanked from https://github.com/numpy/numpy/blob/master/numpy/core/src/npymath/halffloat.c#L466
   *
   * Does not support infinities or NaN. All requests with such
   * values should be encoded as float32
   */

  let h_exp, h_sig;
  let f_sgn, f_exp, f_sig;

  h_exp = (h&0x7c00);
  f_sgn = (h&0x8000) << 16;
  switch (h_exp) {
      case 0x0000: /* 0 or subnormal */
          h_sig = (h&0x03ff);
          /* Signed zero */
          if (h_sig == 0) {
              return f_sgn;
          }
          /* Subnormal */
          h_sig <<= 1;
          while ((h_sig&0x0400) == 0) {
              h_sig <<= 1;
              h_exp++;
          }
          f_exp = ((127 - 15 - h_exp)) << 23;
          f_sig = ((h_sig&0x03ff)) << 13;
          return f_sgn + f_exp + f_sig;
      case 0x7c00: /* inf or NaN */
          /* All-ones exponent and a copy of the significand */
          return f_sgn + 0x7f800000 + (((h&0x03ff)) << 13);
      default: /* normalized */
          /* Just need to adjust the exponent and shift */
          return f_sgn + (((h&0x7fff) + 0x1c000) << 13);
  }
}

function _base64ToArrayBuffer(base64) {
  const binary_string = atob(base64);
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

/**
 * Convert a response from the tile server to
 * data that can be used by higlass
 */
export function tileResponseToData(data, server, theseTileIds) {
  if (!data)  {
    // probably an error
    data = {}
  }

  for (const thisId of theseTileIds) {
    if (!(thisId in data)) {
      // the server didn't return any data for this tile
      data[thisId] = {};
    }
    const key = thisId;
    // let's hope the payload doesn't contain a tileId field
    const keyParts = key.split('|')[0].split('.');

    data[key].server = server;
    data[key].tileId = key;
    data[key].zoomLevel = +keyParts[1];
    data[key].tilePos = keyParts.slice(2, keyParts.length).map(x => +x);
    data[key].tilesetUid = keyParts[0];

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
