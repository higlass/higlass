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

        let maxValue = 0;

        for (let fetchedTileId in this.fetchedTiles) {
            let ft = this.fetchedTiles[fetchedTileId];

            ft.tileData.forEach(geneInfo => {
                if (+geneInfo[4] > maxValue)
                    maxValue = geneInfo[4];
            });
        }

        console.log('maxValue:', maxValue);
        let valueScale = scaleLinear()
            .domain([0, Math.log(maxValue+1)])
            .range([0,10]);

        for (let fetchedTileId in this.fetchedTiles) {
            let ft = this.fetchedTiles[fetchedTileId];

            ft.tileData.forEach(geneInfo => {


                // the returned positions are chromosome-based and they need to
                // be converted to genome-based
                let chrOffset = +geneInfo[geneInfo.length-1];
                let txStart = +geneInfo[1] + chrOffset;
                let txEnd = +geneInfo[2] + chrOffset;

                let txMiddle = (txStart + txEnd) / 2;
                let yMiddle = this.dimensions[1] / 2;

                if (geneInfo[5] == '+') {
                    // genes on the + strand drawn above and in blue
                    yMiddle -= 6;
                    graphics.lineStyle(1, 0x0000FF, 1);
                } else {
                    // genes on the - strand drawn below and in red
                    yMiddle += 6;
                    graphics.lineStyle(1, 0xFF0000, 1);
                }

                let height = valueScale(Math.log(+geneInfo[4]));
                let width= height;

                let rectX = this._xScale(txMiddle) - width / 2;
                let rectY = yMiddle - height / 2;

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
