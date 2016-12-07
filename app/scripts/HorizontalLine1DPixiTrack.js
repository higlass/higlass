import {scaleLinear} from 'd3-scale';
import {tileProxy} from './TileProxy.js';
import {HorizontalTiled1DPixiTrack} from './HorizontalTiled1DPixiTrack.js';

export class HorizontalLine1DPixiTrack extends HorizontalTiled1DPixiTrack {
    constructor(scene, server, uid) {
        super(scene, server, uid);

    }

    areAllVisibleTilesLoaded() {
        
        // we don't need to wait for any tiles to load before 
        // drawing
        //
        return true;
    }

    initTile(tile) {
        /**
         * Create whatever is needed to draw this tile.
         */
         
        let graphics = tile.graphics;

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

        let valueScale = scaleLinear()
            .domain([0, this.maxVisibleValue()])
            .range([0, this.dimensions[1]]);


        graphics.clear();

        // this scale should go from an index in the data array to
        // a position in the genome coordinates
        let tileXScale = scaleLinear().domain([0, tileValues.length])
        .range([tileX,tileX + tileWidth]);

        console.log('valueScale.domain()', valueScale.domain());


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

    zoomed(newXScale, newYScale) {
        this.xScale(newXScale);
        this.yScale(newYScale);

        this.pMain.position.y = this.position[1];
        this.pMain.position.x = this.position[0];

        this.refreshTiles();

        this.draw();
    }

}
