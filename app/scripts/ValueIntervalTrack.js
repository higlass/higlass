import {scaleBand} from 'd3-scale';
import {range} from 'd3-array';
import {HorizontalTiled1DPixiTrack} from './HorizontalTiled1DPixiTrack.js';
import IntervalTree from './interval-tree.js';

export class ValueIntervalTrack extends HorizontalTiled1DPixiTrack {
    constructor(scene, server, uid, handleTilesetInfoReceived, options, animate) {
        super(scene, server, uid, handleTilesetInfoReceived, options, animate);

        this.pMain = this.pMobile;
    }

    drawAll(allTileData) {

    }

    draw() {

    }

    allTilesLoaded() {
    }



    initTile(tile) {

    }

    maxRows() {
    }

    updateTile(tile) {
    }

    destroyTile(tile) {
    }

    drawTile(tile) {

    }
}
