import {scaleLinear} from 'd3-scale';
import {json} from 'd3-request';
import urljoin from 'url-join';
import {format} from 'd3-format';
import {scaleQuantile} from 'd3-scale';
import {range} from 'd3-array';

/*
function countTransform(count) {
    return Math.sqrt(Math.sqrt(count + 1));
}

function countTransform(count) {
    return Math.log(count+0.0001);
}
*/
let epsilon = 0.0000001;
const MAX_FETCH_TILES = 20;

export function workerSetPix(size, data, minVisibleValue, maxVisibleValue, colorScale, passedCountTransform) {
    let epsilon = 0.000001;

    let countTransform = x => {
        return Math.log(x);
    }

    //let qScale = scaleQuantile().domain(data).range(range(255));
    let valueScale = scaleLinear().range([254, 0])
        .domain([countTransform(minVisibleValue), countTransform(maxVisibleValue)])

    let pixData = new Uint8ClampedArray(size * 4);

    let rgbIdx = 0;
    let e = 0;
    try {
        for (let i = 0; i < data.length; i++) {
            let d = data[i];
            e = d; //for debugging

            rgbIdx = 255;

            if (d > epsilon) {
                // values less than espilon are considered NaNs and made transparent (rgbIdx 255)
                let ct = countTransform(d);
                rgbIdx = Math.max(0, Math.min(254, Math.floor(valueScale(ct))))
            }
            //let rgbIdx = qScale(d); //Math.max(0, Math.min(255, Math.floor(valueScale(ct))))
            if (rgbIdx < 0 || rgbIdx > 255) {
                console.log('rgbIdx:', rgbIdx);
            }
            let rgb = colorScale[rgbIdx];

            pixData[i * 4] = rgb[0];
            pixData[i * 4 + 1] = rgb[1];
            pixData[i * 4 + 2] = rgb[2];
            pixData[i * 4 + 3] = rgb[3];
        };
    } catch (err) {
        console.log('valueScale.domain():', valueScale.domain());
        console.log('minVisibleValue:', minVisibleValue, 'maxVisibleValue:', maxVisibleValue);
        console.log('rgbIdx:', rgbIdx, "d:", e, "ct:", countTransform(e));
        console.error('ERROR:', err);
        return pixData;
    }

    return pixData;
}

export function workerGetTilesetInfo(url, done) {
    json(url, (error, data) => {
        if (error) {
            //console.log('error:', error);
            // don't do anything
            // no tileset info just means we can't do anything with this file...
        } else {
            //console.log('got data', data);
            done(data)
        }
    });
}

    function float32(in_uint16) {
        let t1;
        let t2;
        let t3;

        t1 = in_uint16 & 0x7fff;                       // Non-sign bits
        t2 = in_uint16 & 0x8000;                       // Sign bit
        t3 = in_uint16 & 0x7c00;                       // Exponent
        
        t1 <<= 13;                              // Align mantissa on MSB
        t2 <<= 16;                              // Shift sign bit into position

        t1 += 0x38000000;                       // Adjust bias

        t1 = (t3 == 0 ? 0 : t1);                // Denormals-as-zero

        t1 |= t2;                               // Re-insert sign bit

        return t1;
    };

function _base64ToArrayBuffer(base64) {
    var binary_string =  window.atob(base64);
    var len = binary_string.length;

    var bytes = new Uint8Array( len );

    for (var i = 0; i < len; i++)        {
        bytes[i] = binary_string.charCodeAt(i);
    }

    return bytes.buffer;
}

function _uint16ArrayToFloat32Array(uint16array) {
    var bytes = new Uint32Array( uint16array.length );

    for (let i = 0; i < uint16array.length; i++) {
        bytes[i] = float32(uint16array[i]);
    }

    var newBytes = new Float32Array(bytes.buffer);

    return newBytes;
}

export function workerFetchTiles(tilesetServer, tileIds, sessionId, done) {
    let fetchPromises = [];

    // if we request too many tiles, then the URL can get too long and fail
    // so we'll break up the requests into smaller subsets
    for (let i = 0; i < tileIds.length; i += MAX_FETCH_TILES) {
        let theseTileIds = tileIds.slice(i, i+Math.min(tileIds.length - i, MAX_FETCH_TILES))

        let renderParams = theseTileIds.map(x => "d=" + x).join('&');
        let outUrl = tilesetServer + '/tiles/?' + renderParams + '&s=' + sessionId;

        let p = new Promise(function(resolve, reject) {
            json(outUrl, (error, data) => {
                if (error) {
                    resolve({});
                } else {
                    // check if we have array data to convert from base64 to float32
                    for (let key in data) {
                        // let's hope the payload doesn't contain a tileId field
                        let keyParts = key.split('.');

                        data[key].tileId = key;
                        data[key].zoomLevel = +keyParts[1];
                        data[key].tilePos = keyParts.slice(2, keyParts.length).map(x => +x);
                        data[key].tilesetUid = keyParts[0];

                        if ('dense' in data[key]) {
                            //let uint16Array = new Uint16Array(
                            let newShortDense = _base64ToArrayBuffer(data[key].dense);
                            let newDense = _float16ArrayToFloat32Array(newShortDense);

                            let a = new Float32Array(newDense);
                            let minNonZero = Number.MAX_SAFE_INTEGER;
                            let maxNonZero = Number.MIN_SAFE_INTEGER;

                            data[key]['dense'] = a;

                            // find the minimum and maximum non-zero values
                            for (let i = 0; i < a.length; i++) {
                                let x = a[i];

                                if (x < epsilon && x > -epsilon)
                                    continue;

                                if (x < minNonZero)
                                    minNonZero = x;
                                if (x > maxNonZero)
                                    maxNonZero = x;
                            }

                            data[key]['minNonZero'] = minNonZero;
                            data[key]['maxNonZero'] = maxNonZero;


                        }
                    }

                    resolve(data);
                }
            });
        });

        fetchPromises.push(p);
    }

    Promise.all(fetchPromises).then(function(datas) {
        // merge back all the tile requests
        for (let i = 1; i < datas.length; i++) {
            for (let uid in datas[i]) datas[0][uid] = datas[i][uid]
        }

        done(datas[0]);
    });
}

export function workerFetchMultiRequestTiles(req) {

    const sessionId = req.sessionId;
    const requests = req.requests;
    let fetchPromises = [];

    const requestsByServer = {};


    // We're converting the array of IDs into an object in order to filter out duplicated requests.
    // In case different instances request the same data it won't be loaded twice.
    for (let request of requests) {
        if (!requestsByServer[request.server]) {
            requestsByServer[request.server] = {};
        }
        for (let id of request.ids) {
            requestsByServer[request.server][id] = true;
        }
    }

    const servers = Object.keys(requestsByServer);

    for (let server of servers) {
        const ids = Object.keys(requestsByServer[server]);

        // if we request too many tiles, then the URL can get too long and fail
        // so we'll break up the requests into smaller subsets
        for (let i = 0; i < ids.length; i += MAX_FETCH_TILES) {
            let theseTileIds = ids.slice(i, i + Math.min(ids.length - i, MAX_FETCH_TILES));

            let renderParams = theseTileIds.map(x => "d=" + x).join('&');
            let outUrl = server + '/tiles/?' + renderParams + '&s=' + sessionId;

            let p = new Promise(function(resolve, reject) {
                json(outUrl, (error, data) => {
                    if (error) {
                        resolve({});
                    } else {
                        // check if we have array data to convert from base64 to float32
                        for (let key in data) {
                            // let's hope the payload doesn't contain a tileId field
                            let keyParts = key.split('.');

                            data[key].server = server;
                            data[key].tileId = key;
                            data[key].zoomLevel = +keyParts[1];
                            data[key].tilePos = keyParts.slice(2, keyParts.length).map(x => +x);
                            data[key].tilesetUid = keyParts[0];

                            if ('dense' in data[key]) {
                                let arrayBuffer = _base64ToArrayBuffer(data[key].dense);
                                let a;


                                if (data[key].dtype == 'float16') {
                                    // data is encoded as float16s
                                    /* comment out until next empty line for 32 bit arrays */
                                    let uint16Array = new Uint16Array(arrayBuffer);
                                    let newDense = _uint16ArrayToFloat32Array(uint16Array);
                                    a = newDense;

                                } else {
                                    // data is encoded as float32s
                                    a = new Float32Array(arrayBuffer);
                                }
                                
                                let minNonZero = Number.MAX_SAFE_INTEGER;
                                let maxNonZero = Number.MIN_SAFE_INTEGER;

                                data[key]['dense'] = a;

                                // find the minimum and maximum non-zero values
                                for (let i = 0; i < a.length; i++) {
                                    let x = a[i];

                                    if (x < epsilon && x > -epsilon)
                                        continue;

                                    if (x < minNonZero)
                                        minNonZero = x;
                                    if (x > maxNonZero)
                                        maxNonZero = x;
                                }

                                data[key]['minNonZero'] = minNonZero;
                                data[key]['maxNonZero'] = maxNonZero;

                                /*
                                if (data[key]['minNonZero'] == Number.MAX_SAFE_INTEGER &&
                                    data[key]['maxNonZero'] == Number.MIN_SAFE_INTEGER) {
                                    // if there's no values except 0, 
                                    // then do use it as the min value
                                    console.log("here:", key, a);

                                    data[key]['minNonZero'] = null;
                                    data[key]['maxNonZero'] = null;
                                }
                                */
                            }
                        }

                        resolve(data);
                    }
                });
            });

            fetchPromises.push(p);
        }
    }

    Promise.all(fetchPromises).then(function(datas) {
        const tiles = {};

        // merge back all the tile requests
        for (let data of datas) {
            const tileIds = Object.keys(data);

            for (let tileId of tileIds) {
                tiles[`${data[tileId].server}/${tileId}`] = data[tileId];
            }
        }

        // trigger the callback for every request
        for (let request of requests) {
            let reqDate = {};
            let server = request.server;

            // pull together the data per request
            for (let id of request.ids) {
                reqDate[id] = tiles[`${server}/${id}`];
            }

            request.done(reqDate);
        }
    });
}

function workerLoadTileData(tile_value, tile_type) {
    let resolution = 256;

    let t1 = new Date().getTime();
    if (tile_type == 'dense')
        return tile_value;
    else if (tile_type == 'sparse') {
        let values = [];
        for (let i = 0; i < resolution * resolution; i++)
            values.push(0);

        let i = 0;
        while (i < tile_value.length) {
            let value = tile_value[i];
            let num_poss = tile_value[i + 1];
            i += 2;

            let xs = [], ys = [];

            for (let j = 0; j < num_poss; j++)
                xs.push(tile_value[i + j]);

            for (let j = 0; j < num_poss; j++)
                ys.push(tile_value[i + num_poss + j]);

            for (let j = 0; j < num_poss; j++) {
                values[ys[j] * resolution +
                xs[j]] = value;
            }

            i += num_poss *= 2;
        }

        return values;
    } else {
        return [];
    }

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
