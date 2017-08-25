import PixiTrack from './PixiTrack.js';
import { load1DTileData } from './TileData.js';

export class TopLineTrack extends PixiTrack {
    constructor(stage, xScale, dims, valueScale = null) {
        /**
         * @param stage: The PIXI stage onto which to draw everything
         * @param xScale: The global xScale
         * @param dims: The dimensions of this track
         * @param valueScale: A scale for rendering the values of this track
         */
        super(stage, xScale, null, dims);

        if (!valueScale)
            this.valueScale = d3.scale.linear();  //assume a linear scale

        this.valueScale.range([0,1])
    }


    drawTile(tile, graphics) {
        /**
         * Draw a single tile
         *
         * @param tile: A data tile containing information about a line. It contains data straight
         *              from the server which needs to be unpacked.
         * @param graphics: A PIXI graphics object to draw the tile to
         */


        // load the tile data (hopefully from cache)
        let loadedTileData = this.loadTileData(tile, load1DTileData);


    }
}

export default TopLineTrack;
