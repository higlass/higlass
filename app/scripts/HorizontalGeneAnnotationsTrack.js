import {scaleLinear} from 'd3-scale';
import {tileProxy} from './TileProxy.js';
import {HorizontalTiled1DPixiTrack} from './HorizontalTiled1DPixiTrack.js';
import {colorToHex} from './utils.js';
import boxIntersect from 'box-intersect';

let GENE_RECT_WIDTH = 1;
let GENE_RECT_HEIGHT = 6;

export class HorizontalGeneAnnotationsTrack extends HorizontalTiled1DPixiTrack {
    constructor(scene, server, uid, handleTilesetInfoReceived, options, animate) {
        super(scene, server, uid, handleTilesetInfoReceived, options, animate);
        this.textFontSize = '10px';
        this.textFontFamily = 'Arial';

    }

    initTile(tile) {
        //console.log('initTile...', tile.tileId);
        //create texts
        tile.texts = {};

        let MAX_TILE_ENTRIES = 60;

        tile.tileData.sort((a,b) => b.importance - a.importance);
        tile.tileData = tile.tileData.slice(0, MAX_TILE_ENTRIES);

        tile.tileData.forEach(td => {
            let geneInfo = td.fields;
            let fill = this.options.plusStrandColor ? this.options.plusStrandColor : 'blue';

            if (geneInfo[5] == '-') {
                fill = this.options.minusStrandColor ? this.options.minusStrandColor : 'red';
            }
            let text = new PIXI.Text(geneInfo[3],  {fontSize: this.textFontSize, 
                                                    fontFamily: this.textFontFamily,
                                                    fill: colorToHex(fill)});
            if (this.flipText)
                text.scale.x = -1;

            text.anchor.x = 0.5;
            text.anchor.y = 1;

            tile.texts[geneInfo[3]] = text;  //index by geneName

            tile.graphics.addChild(text);
        });
        tile.initialized = true;

        //this.draw();
    }

    destroyTile(tile) {
        //remove texts

    }

    drawTile(tile) {

    }

    drawExons(graphics, txStart, txEnd, exonStarts, exonEnds, chrOffset, yMiddle) {
        exonStarts = exonStarts.split(',').map(x => +x + chrOffset)
        exonEnds = exonEnds.split(',').map(x => +x + chrOffset)

        let xStartPos = this._xScale(txStart);
        let xEndPos = this._xScale(txEnd);

        let lineHeight = 1.5;
        let exonHeight = GENE_RECT_HEIGHT;
        let yPos = yMiddle - lineHeight / 2;
        //let yPos = (d.height - lineHeight) / 2 + 5 ; //-(d.height - yScale(tileData[i]));
        let width = xEndPos - xStartPos;

        let yExonPos = yMiddle - exonHeight / 2;

        graphics.drawRect(xStartPos, yPos, width, lineHeight);

        for (let j = 0; j < exonStarts.length; j++) {
            let exonStart = exonStarts[j];
            let exonEnd = exonEnds[j];

            graphics.drawRect(this._xScale(exonStart), yExonPos,
                    this._xScale(exonEnd) - this._xScale(exonStart), exonHeight);
        }
    }

    draw() {
        super.draw();
        //console.trace('drawing', this, this._xScale.domain(), this._xScale.range());

        let graphics = this.pMain;
        let allVisibleTilesLoaded = this.areAllVisibleTilesLoaded();

        graphics.clear();

        let maxValue = 0;
        let allTexts = [];

        /*
        for (let fetchedTileId in this.fetchedTiles) {
            let ft = this.fetchedTiles[fetchedTileId];

            ft.tileData.forEach(td => {
                let geneInfo = td.fields;
                if (+geneInfo[4] > maxValue)
                    maxValue = geneInfo[4];
            });
        }
        */

        //console.log('maxValue:', maxValue);
        /*
        let valueScale = scaleLinear()
            .domain([0, Math.log(maxValue+1)])
            .range([0,10]);
        */
        let addedIds = [];

        //console.log('this.fetchedTiles:', this.fetchedTiles);
        for (let fetchedTileId in this.fetchedTiles) {
        //let visibleAndFetchedIds = this.visibleAndFetchedIds();

        //for (let i = 0; i < visibleAndFetchedIds.length; i++) {
            //let fetchedTileId = visibleAndFetchedIds[i];
            let ft = this.fetchedTiles[fetchedTileId];
            let parentInFetched = this.parentInFetched(ft);

            if (!ft.initialized)
                continue;

            //console.log('drawTile:', ft.tileId, ft.tileData.length);

            if (!parentInFetched)
                addedIds.push(ft.tileData.tileId);

            ft.tileData.forEach(td => {
                let geneInfo = td.fields;
                // the returned positions are chromosome-based and they need to
                // be converted to genome-based
                let chrOffset = +td.chrOffset;

                let txStart = +geneInfo[1] + chrOffset;
                let txEnd = +geneInfo[2] + chrOffset;
                let exonStarts = geneInfo[12], exonEnds = geneInfo[13];

                let txMiddle = (txStart + txEnd) / 2;

                let yMiddle = this.dimensions[1] / 2;
                let textYMiddle = this.dimensions[1] / 2;
                let geneName = geneInfo[3];
                let fill = null;


                if (geneInfo[5] == '+') {
                    // genes on the + strand drawn above and in a user-specified color or the default blue
                    fill = colorToHex(this.options.plusStrandColor ? this.options.plusStrandColor : 'blue');
                    yMiddle -= 6;
                    textYMiddle -= 10;
                    graphics.lineStyle(1, fill, 0.3);
                    graphics.beginFill(fill, 0.3);
                } else {
                    // genes on the - strand drawn below and in a user-specified color or the default red
                    fill = colorToHex(this.options.minusStrandColor ? this.options.minusStrandColor : 'red');
                    yMiddle += 6;
                    textYMiddle += 23;
                    graphics.lineStyle(1, fill, 0.3);
                    graphics.beginFill(fill, 0.3);
                }

                //let height = valueScale(Math.log(+geneInfo[4]));
                //let width= height;

                let rectX = this._xScale(txMiddle) - GENE_RECT_WIDTH / 2;
                let rectY = yMiddle - GENE_RECT_HEIGHT / 2;

                let xStartPos = this._xScale(txStart);
                let xEndPos = this._xScale(txEnd);


                if (xEndPos - xStartPos > 2)  {
                    this.drawExons(graphics, txStart, txEnd, exonStarts, exonEnds, chrOffset, yMiddle);
                } else {
                    //graphics.drawRect(rectX, rectY, width, height);
                    //console.log('rectY', rectY);
                    graphics.drawRect(rectX, rectY, GENE_RECT_WIDTH, GENE_RECT_HEIGHT);
                }

                if (!ft.texts) {
                    // tile probably hasn't been initialized yet
                    return;

                }
                let text = ft.texts[geneName];

                text.position.x = this._xScale(txMiddle);
                text.position.y = textYMiddle;
                text.style = {fontSize: this.textFontSize,
                              fontFamily: this.textFontFamily,
                              fill: fill};


                if (!parentInFetched) {
                    text.alpha = 1;

                    allTexts.push({importance: +geneInfo[4], text: text, caption: geneName});
                } else {
                    text.alpha = 0;
                }
            });
        }

        ///console.log('addedIds', addedIds);
        if (allTexts.length > 0) {
            //console.log('addedIds:', addedIds);
            //console.log('captions:', allTexts.map(x => x.caption));
        }

        //console.trace('draw', allTexts.length);
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
                //console.log('hiding:', allTexts[j].caption)
                allTexts[j].text.alpha = 0;
            } else {
                //console.log('hiding:', allTexts[i].caption)
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
        this.xScale(newXScale);
        this.yScale(newYScale);

        this.refreshTiles();

        this.draw();
    }
}
