import {scaleLinear} from 'd3-scale';
import {tileProxy} from './TileProxy.js';
import {HorizontalTiled1DPixiTrack} from './HorizontalTiled1DPixiTrack.js';

export class HorizontalGeneAnnotationsTrack extends HorizontalTiled1DPixiTrack {
    constructor(scene, server, uid, handleTilesetInfoReceived) {
        super(scene, server, uid, handleTilesetInfoReceived);

        this.texts = {};
    }

    initTile(tile) {
        /**
         * Create whatever is needed to draw this tile.
         */
        this.drawTile(tile);
    }

    initTile(tile) {
        //create texts

    }

    destroyTile(tile) {
        //remove texts

    }

    drawTile(tile) {

    }

    draw() {
        let graphics = this.pMain;
        graphics.clear();


        for (let fetchedTileId in this.fetchedTiles) {
            let ft = this.fetchedTiles[fetchedTileId];

            ft.tileData.forEach(geneInfo => {

                graphics.lineStyle(1, 0x0000FF, 1);

                let txStart = +geneInfo[1];
                let txEnd = +geneInfo[2];

                let txMiddle = (txStart + txEnd) / 2;
                let width = 10;
                let height = 10;

                let rectX = this._xScale(txMiddle) - width / 2;
                let rectY = this.dimensions[1] / 2 - height / 2;

                //console.log('rectX', rectX, 'rectY', rectY, 'width:', width, 'height:', height);

                graphics.drawRect(rectX, rectY, width, height);

                //console.log('ft:', ft);
            });
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
