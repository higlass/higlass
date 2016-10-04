export function load1DTileData(tile_value, tile_type) {
    if (tile_type == 'dense')
        return tile_value;
    else if (tile_type == 'sparse') {
        let resolution = 256;
        let values = Array.apply(null, 
                Array(resolution)).map(Number.prototype.valueOf,0);

        let i = 0;

        while ( i < tile_value.length ) {
            let value = tile_value[i];
            let num_poss = tile_value[i+1];
            i += 1;
            let xs = [];

            for (let j = 0; j < num_poss; j++)
                xs.push(tile_value[i + j]);

            i += num_poss;
        }
        return values;
    } else {
        return [];
    }
}

export function load1DRatioTileData(tile_value, tile_type) {
    let toReturn = null;
    console.log('loading 1D ratio', tile_value);
    if (tile_type == 'dense') {
        toReturn = [];

        for (let i = 0; i < tile_value.length; ) {
            toReturn.push([tile_value[i], tile_value[i+1]]);
            i += 2;
        }
    }
    else if (tile_type == 'sparse') {
        let resolution = 256;
        let values = [];
        console.log('tile_value:', tile_value);

        for (let i = 0; i < resolution; i++)
            values.push([0,0]);

        let i = 0;

        while ( i < tile_value.length ) {
            let value = [tile_value[i], tile_value[i+1]];
            let num_poss = tile_value[i+2];
            console.log('num_poss:', num_poss);
            i += 3;
            let xs = [];

            for (let j = 0; j < num_poss; j++) {
                values[tile_value[i+j]] = value;
                console.log("setting values at pos:", tile_value[i+j], value);
            }

            i += num_poss;
        }
        toReturn = values;
    } else {
        return [];
    }

    let ratios= [];
    console.log('toReturn:', toReturn);
    for (let i = 0; i < toReturn.length; i++) {
        ratios.push(toReturn[i][0] / toReturn[i][1]);
    }

    console.log('ratios:', ratios);
    return ratios;
}
