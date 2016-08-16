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
