import {scaleLinear} from 'd3-scale';
import {tileProxy} from './TileProxy.js';
import {HorizontalTiled1DPixiTrack} from './HorizontalTiled1DPixiTrack.js';

export class HorizontalLine1DPixiTrack extends HorizontalTiled1DPixiTrack {
    constructor(scene, server, uid) {
        super(scene, server, uid);

    }

    initTile(tile) {
        /**
         * Create whatever is needed to draw this tile.
         */
        this.drawTile(tile);
    }

    destroyTile(tile) {

    }

    drawTile(tile) {
        super.drawTile(tile);

        if (!tile.graphics)
            return;

        let graphics = tile.graphics;

        let {tileX, tileWidth} = this.getTilePosAndDimensions(tile.tileData.zoomLevel, tile.tileData.tilePos);
        let tileValues = tile.tileData.dense;

        if (tileValues.length == 0)
            return;

        let maxVisibleValue = this.maxVisibleValue();

        if (maxVisibleValue < 0)
            return;

        let valueScale = scaleLinear()
            .domain([0, maxVisibleValue])
            .range([0, this.dimensions[1]]);


        graphics.clear();

        if (valueScale.domain()[1] < 0) {
            console.log('ERR', valueScale.domain()[1]);
            return;
        }

        // this scale should go from an index in the data array to
        // a position in the genome coordinates
        let tileXScale = scaleLinear().domain([0, this.tilesetInfo.tile_size])
        .range([tileX,tileX + tileWidth]);

        graphics.lineStyle(1, 0x0000FF, 1);
       // graphics.beginFill(0xFF700B, 1);
        let j = 0;

        for (let i = 0; i < tileValues.length; i++) {


            let xPos = this._xScale(tileXScale(i));

           if(j == 0){
                graphics.moveTo(this._xScale(tileXScale(i)), valueScale(tileValues[i]));
                j++;
            }
            graphics.lineTo(this._xScale(tileXScale(i)), valueScale(tileValues[i+1]));
        }
    }

    setPosition(newPosition) {
        super.setPosition(newPosition);

        this.pMain.position.y = this.position[1];
        this.pMain.position.x = this.position[0];
    }

    zoomed(newXScale, newYScale) {
        this.refreshTiles();

        this.xScale(newXScale);
        this.yScale(newYScale);


        this.draw();

    }

}
