import {HorizontalTiled1DPixiTrack} from './HorizontalTiled1DPixiTrack.js';

export class CNVIntervalTrack extends HorizontalTiled1DPixiTrack {
    constructor(scene, server, uid) {
        super(scene, server, uid);

    }

    drawTile(tile) {
        console.log('tile:', tile);

    }
}
