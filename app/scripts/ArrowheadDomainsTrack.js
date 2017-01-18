import {Tiled2DPixiTrack} from './Tiled2DPixiTrack.js';
import {tileProxy} from './TileProxy.js';

export class ArrowheadDomainsTrack extends Tiled2DPixiTrack {
    constructor(scene, server, uid) {
        super(scene, server, uid);

    }

    areAllVisibleTilesLoaded() {
        
        // we don't need to wait for any tiles to load before 
        // drawing
        //
        return true;
    }

    calculateVisibleTiles() {
        super.calculateVisibleTiles(false);

    }

    initTile(tile) {
        /**
         * Create whatever is needed to draw this tile.
         */
         
        let graphics = tile.graphics;

        this.drawTile(tile, graphics);
    }

    destroyTile(tile, graphics) {

    }

    drawTile(tile) {
        if (!tile.graphics)
            return;

        //console.log('tile:', tile);
        //console.log('Id2DTiled drawTile...');
        let graphics = tile.graphics;
        let {tileX, tileY, tileWidth, tileHeight} = this.getTilePosAndDimensions(tile.tileData.zoomLevel, 
                                                                                 tile.tileData.tilePos);

        // the text needs to be scaled down so that it doesn't become huge
        // when we zoom in 
        let tSX = 1 / ((this._xScale(1) - this._xScale(0)) / (this._refXScale(1) - this._refXScale(0)));
        let tSY = 1 / ((this._yScale(1) - this._yScale(0)) / (this._refYScale(1) - this._refYScale(0)));

        //console.log('tSX:', tSX, 'tSY:',tSY);

        graphics.clear();

        graphics.lineStyle(4 * tSX, 0x0000FF, 1);
        graphics.beginFill(0xFF700B, 0.4);
        graphics.alpha = 0.5;

        // line needs to be scaled down so that it doesn't become huge
        for (let line of tile.tileData) {
            let startX = this._refXScale(+line[1] + line[12]);
            let endX = this._refXScale(+line[2] + line[12]);

            let startY = this._refYScale(+line[4] + line[12]);
            let endY = this._refYScale(+line[5] + line[12]);

            //console.log(startX, endX, startY, endY);
            
            graphics.drawRect(startX, startY, endY - startY, endX - startX);
        }


    }
}
