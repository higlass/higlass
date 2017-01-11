import {scaleLinear} from 'd3-scale';
import {tileProxy} from './TileProxy.js';
import {HorizontalTiled1DPixiTrack} from './HorizontalTiled1DPixiTrack.js';
import boxIntersect from 'box-intersect';

export class HorizontalGeneAnnotationsTrack extends HorizontalTiled1DPixiTrack {
    constructor(scene, server, uid, handleTilesetInfoReceived) {
        super(scene, server, uid, handleTilesetInfoReceived);

    }

    initTile(tile) {
        //create texts
        tile.texts = {};

        tile.tileData.forEach(geneInfo => {
            let fill = 'blue';
            if (geneInfo[5] == '-') {
                fill = 'red';
            }
            let text = new PIXI.Text(geneInfo[3],  {fontSize:"10px", fontFamily:"Arial", fill:fill});

            text.anchor.x = 0.5;
            text.anchor.y = 1;

            tile.texts[geneInfo[3]] = text;  //index by geneName

            tile.graphics.addChild(text);
        });


        this.draw();
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
        let allTexts = [];

        for (let fetchedTileId in this.fetchedTiles) {
            let ft = this.fetchedTiles[fetchedTileId];

            ft.tileData.forEach(geneInfo => {
                if (+geneInfo[4] > maxValue)
                    maxValue = geneInfo[4];
            });
        }

        //console.log('maxValue:', maxValue);
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
                let textYMiddle = this.dimensions[1] / 2;

                if (geneInfo[5] == '+') {
                    // genes on the + strand drawn above and in blue
                    yMiddle -= 6;
                    textYMiddle -= 10;
                    graphics.lineStyle(1, 0x0000FF, 1);
                } else {
                    // genes on the - strand drawn below and in red
                    yMiddle += 6;
                    textYMiddle += 23;
                    graphics.lineStyle(1, 0xFF0000, 1);
                }

                let height = valueScale(Math.log(+geneInfo[4]));
                let width= height;

                let rectX = this._xScale(txMiddle) - width / 2;
                let rectY = yMiddle - height / 2;

                graphics.drawRect(rectX, rectY, width, height);

                if (!ft.texts) {
                    // tile probably hasn't been initialized yet
                    return;

                }
                let text = ft.texts[geneInfo[3]];

                text.position.x = this._xScale(txMiddle);
                text.position.y = textYMiddle;


                text.alpha = 1;
                allTexts.push({importance: +geneInfo[4], text: text});
            });
        }

        this.hideOverlaps(allTexts);
    }

    hideOverlaps(allTexts) {
        let allBoxes = [];   // store the bounding boxes of the text objects so we can 
                             // calculate overlaps
        allBoxes = allTexts.map(val => {
            let text = val.text;
            text.updateTransform();
            let b = text.getBounds();
            let box = [b.x, b.y, b.x + b.width, b.y + b.height];

            return box;
        });

        let result = boxIntersect(allBoxes, function(i, j) {
            if (allTexts[i].importance > allTexts[j].importance) {
                allTexts[j].text.alpha = 0; 
            } else {
                allTexts[i].text.alpha = 0; 
            }
        });
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
