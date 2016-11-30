import {heatedObjectMap} from './colormaps.js';
import {scaleLinear} from 'd3-scale';
import {json} from 'd3-request';
import urljoin from 'url-join';

function countTransform(count) {
    return Math.sqrt(Math.sqrt(count + 1));
}

export function workerGetTilesetInfo(url, done) {
    json(url, (error, data) => {
        if (error) {
            console.log('error:', error);
            // don't do anything
            // no tileset info just means we can't do anything with this file... 
        } else {
            console.log('got data', data);
            done(data)
        }
    });
}

function _base64ToArrayBuffer(base64) {
    var binary_string =  window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array( len );
    for (var i = 0; i < len; i++)        {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

export function workerFetchTiles(tilesetServer, tileIds, done) {
    let MAX_FETCH_TILES=10;
    let fetchPromises = [];

    // if we request too many tiles, then the URL can get too long and fail
    // so we'll break up the requests into smaller subsets
    for (let i = 0; i < tileIds.length; i += MAX_FETCH_TILES) {
        let theseTileIds = tileIds.slice(i, i+Math.min(tileIds.length - i, MAX_FETCH_TILES))

        let renderParams = theseTileIds.map(x => "d=" + x).join('&');
        let outUrl = urljoin(tilesetServer, 'tilesets/x/render/?' + renderParams);
        console.log('outUrl');

        let p = new Promise(function(resolve, reject) {
            json(outUrl, (error, data) => {
                if (error) { 
                    resolve({});
                } else {
                    // check if we have array data to convert from base64 to float32
                    for (let key in data) {
                        if ('dense' in data[key]) {
                            let newDense = _base64ToArrayBuffer(data[key].dense);
                            data[key]['dense'] = new Float32Array(newDense);
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

function workerSetPix(size, data, minVisibleValue, maxVisibleValue, colorScale = null) {
    let valueScale = scaleLinear().range([255, 0])
        .domain([countTransform(0), countTransform(maxVisibleValue)])

    let pixData = new Uint8ClampedArray(size * 4);

    if (colorScale == null)
        colorScale = heatedObjectMap;

    try {
        for (let i = 0; i < data.length; i++) {
            let d = data[i];
            let ct = countTransform(d);

            let rgbIdx = Math.max(0, Math.min(255, Math.floor(valueScale(ct))))
            let rgb = colorScale[rgbIdx];

            pixData[i * 4] = rgb[0];
            pixData[i * 4 + 1] = rgb[1];
            pixData[i * 4 + 2] = rgb[2];
            pixData[i * 4 + 3] = rgb[3];
        }
        ;
    } catch (err) {
        console.log('ERROR:', err);
        return pixData;
    }

    return pixData;
}

self.addEventListener('message', function (e) {
    //should only be called when workerSetPix needs to be called
    let passedData = e.data;
    let inputTileData = new Float32Array(passedData.tile.data, 0, passedData.tile.dataLength);

    let tileData = workerLoadTileData(inputTileData, passedData.tile.type)
    let pixOutput = workerSetPix(256 * 256, tileData, passedData.minVisibleValue, 
            passedData.maxVisibleValue,
            passedData.tile.colorScale );
    //console.log('passedData:', passedData);
    //console.log('colorScale:', passedData.tile.colorScale);

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
