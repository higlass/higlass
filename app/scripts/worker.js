import {heatedObjectMap} from './colormaps.js';
import d3 from 'd3';

function countTransform(count) {
    return Math.sqrt(Math.sqrt(count + 1));
}

function workerLoadTileData(tile_value) {
    let resolution = 256;

    let t1 = new Date().getTime();
    if ('dense' in tile_value)
        return tile_value['dense'];
    else if ('sparse' in tile_value) {
        let values = []
        for (let i = 0; i < resolution * resolution; i++)
            values.push(0);

        for (let i = 0; i < tile_value.sparse.length; i++) {

            if ('pos' in tile_value.sparse[i]) {
                values[tile_value.sparse[i].pos[1] * resolution +
                    tile_value.sparse[i].pos[0]] = tile_value.sparse[i].value;
            } else {
                let x = tile_value.sparse[i][0];
                values[tile_value.sparse[i][0][1] * resolution +
                    tile_value.sparse[i][0][0]] = tile_value.sparse[i][1];

            }
        }

        return values;


    } else {
        return [];
    }

}

function workerSetPix(size, data, minVisibleValue, maxVisibleValue) {
        let valueScale = d3.scale.linear().range([0,255])
        .domain([countTransform(minVisibleValue), countTransform(maxVisibleValue)])

        let t1 = new Date().getTime();
        let pixData = new Uint8ClampedArray(size * 4);

        try {
            let t1 = new Date().getTime();
            for (let i = 0; i < data.length; i++) {
                let d = data[i];
                let ct = countTransform(d);

                let rgbIdx = Math.max(0, Math.min(255, Math.floor(valueScale(ct))))
                let rgb = heatedObjectMap[rgbIdx];


                pixData[i*4] = rgb[0];
                pixData[i*4+1] = rgb[1];
                pixData[i*4+2] = rgb[2];
                pixData[i*4+3] = rgb[3];
            };
        } catch (err) {
            console.log('ERROR:', err);
            return pixData;
        }

        return pixData;
}

self.addEventListener('message', function(e) {
    //should only be called when workerSetPix needs to be called
    let passedData = JSON.parse(e.data)
        //console.log('tile:', passedData.tile);
    //console.log('passedData:', passedData);
    let tileData = workerLoadTileData(passedData.tile.data)
    let pixOutput = workerSetPix(256 * 256, tileData, passedData.minVisibleValue, passedData.maxVisibleValue);

    self.postMessage({tile: passedData.tile, pixData: pixOutput});
}, false);
