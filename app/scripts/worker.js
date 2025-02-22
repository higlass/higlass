import { scaleLog, scaleLinear, scaleOrdinal } from 'd3-scale';
import getAggregationFunction from './utils/get-aggregation-function';
import selectedItemsToSize from './utils/selected-items-to-size';
import DenseDataExtrema1D from './utils/DenseDataExtrema1D';
import DenseDataExtrema2D from './utils/DenseDataExtrema2D';

/*
function countTransform(count) {
    return Math.sqrt(Math.sqrt(count + 1));
}

function countTransform(count) {
    return Math.log(count+0.0001);
}
*/
const epsilon = 0.0000001;

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
  let minNonZeroNum = Number.MAX_SAFE_INTEGER;

  for (let i = 0; i < data.length; i++) {
    const x = data[i];

    if (x < epsilon && x > -epsilon) {
      continue;
    }

    if (x < minNonZeroNum) {
      minNonZeroNum = x;
    }
  }

  return minNonZeroNum;
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
  let maxNonZeroNum = Number.MIN_SAFE_INTEGER;

  for (let i = 0; i < data.length; i++) {
    const x = data[i];

    if (x < epsilon && x > -epsilon) {
      continue;
    }

    if (x > maxNonZeroNum) {
      maxNonZeroNum = x;
    }
  }

  return maxNonZeroNum;
}

/**
 * This function takes in tile data and other rendering parameters,
 * and generates an array of pixel data that can be passed to a canvas
 * (and subsequently passed to a PIXI sprite).
 * @param {number} size The length of the `data` parameter. Often set to a tile's
 * `tile.tileData.dense.length` value.
 * @param {array} data The tile data array.
 * @param {string} valueScaleType 'log' or 'linear'.
 * @param {array} valueScaleDomain
 * @param {number} pseudocount The pseudocount is generally the minimum non-zero value and is
 * used so that our log scaling doesn't lead to NaN values.
 * @param {array} colorScale
 * @param {boolean} ignoreUpperRight
 * @param {boolean} ignoreLowerLeft
 * @param {array} shape Array `[numRows, numCols]`, used when iterating over a subset of rows,
 * when one needs to know the width of each column.
 * @param {array} zeroValueColor The color to use for rendering zero data values, [r, g, b, a].
 * @param {number[]} selectedRows Array of row indices, for ordering and filtering rows.
 * Used by the HorizontalMultivecTrack.
 * @param {string} selectedRowsAggregationMode String that specifies the aggregation function to use ("mean", "sum", etc).
 * @param {boolean} selectedRowsAggregationWithRelativeHeight Boolean that determines whether the height of row groups should be relative to the size of the group.
 * @returns {Uint8ClampedArray} A flattened array of pixel values.
 */
export function workerSetPix(
  size,
  data,
  valueScaleType,
  valueScaleDomain,
  pseudocount,
  colorScale,
  ignoreUpperRight = false,
  ignoreLowerLeft = false,
  shape = null,
  zeroValueColor = null,
  selectedRows = null,
  selectedRowsAggregationMode = null,
  selectedRowsAggregationWithRelativeHeight = null,
) {
  let valueScale = null;

  if (valueScaleType === 'log') {
    valueScale = scaleLog()
      .range([254, 0])
      .domain(valueScaleDomain);
  } else if (valueScaleType === 'categorical') {
    valueScale = scaleOrdinal()
      .domain(valueScaleDomain)
      .range(colorScale);
  } else {
    if (valueScaleType !== 'linear') {
      console.warn(
        'Unknown value scale type:',
        valueScaleType,
        ' Defaulting to linear',
      );
    }
    valueScale = scaleLinear()
      .range([254, 0])
      .domain(valueScaleDomain);
  }

  let filteredSize = size;
  if (shape && selectedRows) {
    // If using the `selectedRows` parameter, then the size of the `pixData` array
    // will likely be different than `size` (the total size of the tile data array).
    // The potential for aggregation groups in `selectedRows` also must be taken into account.
    filteredSize =
      selectedItemsToSize(
        selectedRows,
        selectedRowsAggregationWithRelativeHeight,
      ) * shape[1];
  }

  let rgb;
  let rgbIdx = 0;
  const tileWidth = Math.sqrt(size);
  const pixData = new Uint8ClampedArray(filteredSize * 4);

  let dToRgbIdx = x => {
    const v = valueScale(x);
    if (Number.isNaN(v)) return 254;
    return Math.max(0, Math.min(254, Math.floor(v)));
  };

  if (valueScaleType === 'categorical') {
    dToRgbIdx = x => x;
  }

  /**
   * Set the ith element of the pixData array, using value d.
   * (well not really, since i is scaled to make space for each rgb value).
   * @param i Index of the element.
   * @param d The value to be transformed and then inserted.
   */
  const setPixData = (i, d) => {
    // Transparent
    rgbIdx = 255;

    if (
      // ignore the upper right portion of a tile because it's on the diagonal
      // and its mirror will fill in that space
      !(ignoreUpperRight && Math.floor(i / tileWidth) < i % tileWidth) &&
      !(ignoreLowerLeft && Math.floor(i / tileWidth) > i % tileWidth) &&
      // Ignore color if the value is invalid
      !Number.isNaN(+d)
    ) {
      // values less than espilon are considered NaNs and made transparent (rgbIdx 255)
      rgbIdx = dToRgbIdx(d + pseudocount);
    }
    // let rgbIdx = qScale(d); //Math.max(0, Math.min(255, Math.floor(valueScale(ct))))
    if (rgbIdx < 0 || rgbIdx > 255) {
      console.warn(
        'out of bounds rgbIdx:',
        rgbIdx,
        ' (should be 0 <= rgbIdx <= 255)',
      );
    }

    if (zeroValueColor && !Number.isNaN(+d) && +d === 0.0) {
      rgb = zeroValueColor;
    } else {
      rgb = colorScale[rgbIdx];
    }

    pixData[i * 4] = rgb[0];
    pixData[i * 4 + 1] = rgb[1];
    pixData[i * 4 + 2] = rgb[2];
    pixData[i * 4 + 3] = rgb[3];
  };

  let d;
  try {
    if (shape && selectedRows) {
      // We need to set the pixels in the order specified by the `selectedRows` parameter.
      let aggFunc;
      let aggFromDataFunc;
      if (selectedRowsAggregationMode) {
        aggFunc = getAggregationFunction(selectedRowsAggregationMode);
        aggFromDataFunc = (colI, rowIs) =>
          aggFunc(rowIs.map(rowI => data[rowI * shape[1] + colI]));
      }
      let pixRowI;
      let colI;
      let selectedRowI;
      let selectedRowGroupItemI;
      for (colI = 0; colI < shape[1]; colI++) {
        // For this column, aggregate along the row axis.
        pixRowI = 0;
        for (
          selectedRowI = 0;
          selectedRowI < selectedRows.length;
          selectedRowI++
        ) {
          if (Array.isArray(selectedRows[selectedRowI]) && aggFunc) {
            // An aggregation step must be performed for this data point.
            d = aggFromDataFunc(colI, selectedRows[selectedRowI]);
          } else {
            d = data[selectedRows[selectedRowI] * shape[1] + colI];
          }

          if (
            selectedRowsAggregationWithRelativeHeight &&
            Array.isArray(selectedRows[selectedRowI])
          ) {
            // Set a pixel for multiple rows, proportionate to the size of the row aggregation group.
            for (
              selectedRowGroupItemI = 0;
              selectedRowGroupItemI < selectedRows[selectedRowI].length;
              selectedRowGroupItemI++
            ) {
              setPixData(
                pixRowI * shape[1] + colI, // pixData index
                d, // data point
              );
              pixRowI++;
            }
          } else {
            // Set a single pixel, either representing a single row or an entire row group, if the vertical height for each group should be uniform (i.e. should not depend on group size).
            setPixData(
              pixRowI * shape[1] + colI, // pixData index
              d, // data point
            );
            pixRowI++;
          }
        } // end row group for
      } // end col for
    } else {
      // The `selectedRows` array has not been passed, so we want to use all of the tile data values,
      // in their default ordering.
      for (let i = 0; i < data.length; i++) {
        d = data[i];
        setPixData(i, d);
      }
    }
  } catch (err) {
    console.warn('Odd datapoint');
    console.warn('valueScale.domain():', valueScale.domain());
    console.warn('valueScale.range():', valueScale.range());
    console.warn('value:', valueScale(d + pseudocount));
    console.warn('pseudocount:', pseudocount);
    console.warn('rgbIdx:', rgbIdx, 'd:', d, 'ct:', valueScale(d));
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

  let hExp = h & 0x7c00;
  let hSig;
  let fExp;
  let fSig;

  const fSgn = (h & 0x8000) << 16;
  switch (hExp) {
    /* 0 or subnormal */
    case 0x0000:
      hSig = h & 0x03ff;
      /* Signed zero */
      if (hSig === 0) {
        return fSgn;
      }
      /* Subnormal */
      hSig <<= 1;
      while ((hSig & 0x0400) === 0) {
        hSig <<= 1;
        hExp++;
      }
      fExp = (127 - 15 - hExp) << 23;
      fSig = (hSig & 0x03ff) << 13;
      return fSgn + fExp + fSig;

    /* inf or NaN */
    case 0x7c00:
      /* All-ones exponent and a copy of the significand */
      return fSgn + 0x7f800000 + ((h & 0x03ff) << 13);

    default:
      /* normalized */
      /* Just need to adjust the exponent and shift */
      return fSgn + (((h & 0x7fff) + 0x1c000) << 13);
  }
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
    const keyParts = key.split('|')[0].split('.');

    data[key].server = server;
    data[key].tileId = key;
    data[key].zoomLevel = +keyParts[1];

    // slice from position 2 to exclude tileId and zoomLevel
    // filter by NaN to exclude metadata portions of the tile request
    data[key].tilePos = keyParts
      .slice(2, keyParts.length)
      .map(x => +x)
      .filter(x => !Number.isNaN(x));
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

      // multivec data has a shape associated with it that needs to
      // be considered when calculating extrema
      if (data[key].shape) {
        a.shape = data[key].shape;
      } else {
        a.shape = [1, a.length];
      }

      const dde =
        data[key].tilePos.length === 2
          ? new DenseDataExtrema2D(a)
          : new DenseDataExtrema1D(a);

      data[key].dense = a;
      data[key].denseDataExtrema = dde;
      data[key].minNonZero = dde.minNonZeroInTile;
      data[key].maxNonZero = dde.maxNonZeroInTile;
      /*
      if (data[key]['minNonZero'] === Number.MAX_SAFE_INTEGER &&
          data[key]['maxNonZero'] === Number.MIN_SAFE_INTEGER) {
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
    'content-type': 'application/json',
  };

  if (authHeader) headers.Authorization = authHeader;

  fetch(outUrl, {
    credentials: 'same-origin',
    headers,
  })
    .then(response => response.json())
    .then(data => {
      done(tileResponseToData(data, server, theseTileIds));
      /*
      const denses = Object.values(data)
        .filter(x => x.dense)
        .map(x => x.dense);
      */
      // .map(x => x.dense.buffer);

      // done.transfer(data, denses);
    })
    .catch(err => console.error('err:', err));
}
