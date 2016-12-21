import {HorizontalTiled1DPixiTrack} from './HorizontalTiled1DPixiTrack.js';

export class CNVIntervalTrack extends HorizontalTiled1DPixiTrack {
    constructor(scene, server, uid) {
        super(scene, server, uid);

        //console.log('CNVInterval:', this);
    }

    drawTile(tile) {
        let {tileX, tileWidth} = this.getTilePosAndDimensions(tile.tileData.zoomLevel, tile.tileData.tilePos);

        console.log('tileX:', tileX, 'tile:', tile);
    }
}
