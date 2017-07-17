import {scaleLinear} from 'd3-scale';
import {tileProxy} from './TileProxy.js';
import {HorizontalTiled1DPixiTrack} from './HorizontalTiled1DPixiTrack.js';
import {colorToHex} from './utils.js';
import boxIntersect from 'box-intersect';

let GENE_RECT_WIDTH = 1;
let GENE_RECT_HEIGHT = 6;
let MAX_TEXTS = 20;

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

        let MAX_TILE_ENTRIES = 100;

        tile.tileData.sort((a,b) => b.importance - a.importance);
        tile.tileData = tile.tileData.slice(0, MAX_TILE_ENTRIES);

        tile.tileData.forEach((td, i) => {
            let geneInfo = td.fields;
            let fill = this.options.plusStrandColor ? this.options.plusStrandColor : 'blue';

            if (geneInfo[5] == '-') {
                fill = this.options.minusStrandColor ? this.options.minusStrandColor : 'red';
            }
            tile.textWidths = {};

            // don't draw texts for the latter entries in the tile
            if (i >= MAX_TEXTS)
                return;

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

    calculateZoomLevel() {
        // offset by 2 because 1D tiles are more dense than 2D tiles
        // 1024 points per tile vs 256 for 2D tiles
        let xZoomLevel = tileProxy.calculateZoomLevel(this._xScale,
                                                      this.tilesetInfo.min_pos[0],
                                                      this.tilesetInfo.max_pos[0]);

        let zoomLevel = Math.min(xZoomLevel, this.maxZoom);
        zoomLevel = Math.max(zoomLevel, 0);

        return zoomLevel
    }

    drawExons(graphics, txStart, txEnd, exonStarts, exonEnds, chrOffset, yMiddle) {
        exonStarts = exonStarts.split(',').map(x => +x + chrOffset)
        exonEnds = exonEnds.split(',').map(x => +x + chrOffset)
        let rects = [];

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

            rects.push([this._xScale(exonStart), yExonPos,
                    this._xScale(exonEnd) - this._xScale(exonStart), exonHeight]);

            graphics.drawRect(this._xScale(exonStart), yExonPos,
                    this._xScale(exonEnd) - this._xScale(exonStart), exonHeight);
        }

        return rects;
    }

    draw() {
        super.draw();
        //console.trace('drawing', this, this._xScale.domain(), this._xScale.range());

        let graphics = this.pMain;
        let allVisibleTilesLoaded = this.areAllVisibleTilesLoaded();

        graphics.clear();

        let maxValue = 0;
        this.allTexts = [];
        this.allBoxes = [];
        this.allRects = [];

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

        /*
        let valueScale = scaleLinear()
            .domain([0, Math.log(maxValue+1)])
            .range([0,10]);
        */
        let addedIds = [];

        for (let fetchedTileId in this.fetchedTiles) {
        //let visibleAndFetchedIds = this.visibleAndFetchedIds();
        //console.log('fetchedTileId:', fetchedTileId);

        //for (let i = 0; i < visibleAndFetchedIds.length; i++) {
            //let fetchedTileId = visibleAndFetchedIds[i];
            let tile = this.fetchedTiles[fetchedTileId];
            let parentInFetched = this.parentInFetched(tile);

            if (!tile.initialized)
                continue;

            if (!parentInFetched)
                addedIds.push(tile.tileData.tileId);

            tile.tileData.forEach((td, i) => {
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
                //

                let rectX = this._xScale(txMiddle) - GENE_RECT_WIDTH / 2;
                let rectY = yMiddle - GENE_RECT_HEIGHT / 2;

                let xStartPos = this._xScale(txStart);
                let xEndPos = this._xScale(txEnd);

                if (xEndPos - xStartPos > 2)  {
                    /*
                    this.allRects = this.allRects.concat(
                            this.drawExons(graphics, txStart, txEnd, exonStarts, exonEnds, chrOffset, yMiddle)
                            .map(x => x.concat([geneInfo[5]]))
                            );
                    */
                    this.drawExons(graphics, txStart, txEnd, exonStarts, exonEnds, chrOffset, yMiddle)

                } else {
                    //graphics.drawRect(rectX, rectY, width, height);
                    //console.log('rectY', rectY);
                    //this.allRects.push([rectX, rectY, GENE_RECT_WIDTH, GENE_RECT_HEIGHT, geneInfo[5]]);
                    graphics.drawRect(rectX, rectY, GENE_RECT_WIDTH, GENE_RECT_HEIGHT);
                }

                if (!tile.texts) {
                    // tile probably hasn't been initialized yet
                    return;

                }

                // don't draw texts for the latter entries in the tile
                if (i >= MAX_TEXTS)
                    return;

                let text = tile.texts[geneName];

                text.position.x = this._xScale(txMiddle);
                text.position.y = textYMiddle;
                text.style = {fontSize: this.textFontSize,
                              fontFamily: this.textFontFamily,
                              fill: fill};

                if (!(geneInfo[3] in tile.textWidths)) {
                    text.updateTransform();
                    let textWidth = text.getBounds().width;

                    tile.textWidths[geneInfo[3]] = textWidth;
                }


                if (!parentInFetched) {
                    text.visible = true;

                    this.allBoxes.push([text.position.x, textYMiddle - 1, text.position.x + tile.textWidths[geneInfo[3]], textYMiddle+1]);
                    this.allTexts.push({importance: +geneInfo[4], text: text, caption: geneName, strand: geneInfo[5]});
                } else {
                    text.visible = false;
                }
            });
        }

        ///console.log('addedIds', addedIds);
        if (this.allTexts.length > 0) {
            //console.log('addedIds:', addedIds);
            //console.log('captions:', allTexts.map(x => x.caption));
        }

        //console.trace('draw', allTexts.length);
        this.hideOverlaps(this.allBoxes, this.allTexts);
    }

    hideOverlaps(allBoxes, allTexts) {
        // store the bounding boxes of the text objects so we can
        // calculate overlaps
        //console.log('allTexts.length', allTexts.length);

        /*
        let allBoxes = allTexts.map(val => {
            let text = val.text;
            text.updateTransform();
            let b = text.getBounds();
            let box = [b.x, b.y, b.x + b.width, b.y + b.height];

            return box;
        });
        */

        let result = boxIntersect(allBoxes, function(i, j) {
            if (allTexts[i].importance > allTexts[j].importance) {
                //console.log('hiding:', allTexts[j].caption)
                allTexts[j].text.visible = false;
            } else {
                //console.log('hiding:', allTexts[i].caption)
                allTexts[i].text.visible = false;
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

    exportSVG() {
        let track=null,base=null;

        if (super.exportSVG) {
            [base, track] = super.exportSVG();
        } else {
            base = document.createElement('g');
            track = base;
        }
        let output = document.createElement('g');
        output.setAttribute('transform',
                            `translate(${this.position[0]},${this.position[1]})`);

        track.appendChild(output);

        for (let rect of this.allRects) {
            let r = document.createElement('rect');
            r.setAttribute('x', rect[0]);
            r.setAttribute('y', rect[1]);
            r.setAttribute('width', rect[2]);
            r.setAttribute('height', rect[3]);

            if (rect[4] == '+') {
                r.setAttribute('fill', this.options.plusStrandColor);
            } else {
                r.setAttribute('fill', this.options.minusStrandColor);
            }

            output.appendChild(r);
        }

        for (let text of this.allTexts) {
            if (!text.text.visible)
                continue;

            let g = document.createElement('g');
            let t = document.createElement('text');
            t.setAttribute('text-anchor', 'middle');
            t.setAttribute('font-family', this.textFontFamily);
            t.setAttribute('font-size', this.textFontSize);
            g.setAttribute('transform', `scale(${text.text.scale.x},1)`);
            

            if (text.strand == '+') {
                //t.setAttribute('stroke', this.options.plusStrandColor);
                t.setAttribute('fill', this.options.plusStrandColor);
            } else {
                //t.setAttribute('stroke', this.options.minusStrandColor);
                t.setAttribute('fill', this.options.minusStrandColor);
            }

            t.innerHTML = text.text.text;

            g.appendChild(t);
            g.setAttribute('transform', `translate(${text.text.x},${text.text.y})scale(${text.text.scale.x},1)`);
            output.appendChild(g);
        }

        return [base, base];
    }
}
