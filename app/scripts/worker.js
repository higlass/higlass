import {heatedObjectMap} from './colormaps.js';
import d3 from 'd3';

function countTransform(count) {
    return Math.sqrt(Math.sqrt(count + 1));
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
    let valueScale = d3.scale.linear().range([255, 0])
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
