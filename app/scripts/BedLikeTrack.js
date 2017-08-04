import {scaleLinear} from 'd3-scale';
import {tileProxy} from './TileProxy.js';
import {HorizontalTiled1DPixiTrack} from './HorizontalTiled1DPixiTrack.js';
import {colorToHex} from './utils.js';
import boxIntersect from 'box-intersect';

let GENE_RECT_WIDTH = 1;
let GENE_RECT_HEIGHT = 6;
let MAX_TEXTS = 20;

export class BedLikeTrack extends HorizontalTiled1DPixiTrack {
    constructor(scene, server, uid, handleTilesetInfoReceived, options, animate) {
        super(scene, server, uid, handleTilesetInfoReceived, options, animate);
        this.textFontSize = '10px';
        this.textFontFamily = 'Arial';
    }

    initTile(tile) {
        //console.log('initTile...', tile.tileId);
        //create texts
        tile.texts = {};

        tile.rectGraphics = new PIXI.Graphics();
        tile.textGraphics = new PIXI.Graphics();

        tile.graphics.addChild(tile.rectGraphics);
        tile.graphics.addChild(tile.textGraphics);

        let MAX_TILE_ENTRIES = 50;

        tile.tileData.sort((a,b) => b.importance - a.importance);
        tile.tileData = tile.tileData.slice(0, MAX_TILE_ENTRIES);

        tile.tileData.forEach((td, i) => {
            let geneInfo = td.fields;
            console.log('td:', td);
            let fill = this.options.plusStrandColor ? this.options.plusStrandColor : 'blue';

            if (geneInfo[5] == '-') {
                fill = this.options.minusStrandColor ? this.options.minusStrandColor : 'red';
            }
            tile.textWidths = {};

            // don't draw texts for the latter entries in the tile
            if (i >= MAX_TEXTS)
                return;
            console.log('fill:', fill);

            // geneInfo[3] is the gene symbol
            let text = new PIXI.Text(geneInfo[3],  {fontSize: this.textFontSize, 
                                                    fontFamily: this.textFontFamily,
                                                    fill: colorToHex(fill)});
            if (this.flipText)
                text.scale.x = -1;

            text.anchor.x = 0.5;
            text.anchor.y = 1;

            tile.texts[geneInfo[3]] = text;  //index by geneName

            tile.textGraphics.addChild(text);
        });

        tile.initialized = true;

        this.renderTile(tile);
        //this.draw();
    }

    destroyTile(tile) {
        //remove texts

    }

    drawTile(tile) {

    }

    renderTile(tile) {
        if (!tile.initialized)
            return;

        tile.allRects = [];

        // store the scale at while the tile was drawn at so that
        // we only resize it when redrawing
        tile.drawnAtScale = this._xScale.copy();
        let fill = {};

        fill['+'] = colorToHex(this.options.plusStrandColor ? this.options.plusStrandColor : 'blue');
        fill['-'] = colorToHex(this.options.minusStrandColor ? this.options.minusStrandColor : 'red');


        tile.tileData.forEach((td, i) => {
            let geneInfo = td.fields;
            // the returned positions are chromosome-based and they need to
            // be converted to genome-based
            let chrOffset = +td.chrOffset;

            let txStart = +geneInfo[1] + chrOffset;
            let txEnd = +geneInfo[2] + chrOffset;
            let exonStarts = geneInfo[12], exonEnds = geneInfo[13];

            let txMiddle = (txStart + txEnd) / 2;

            //console.log('geneInfo:', geneInfo);

            let yMiddle = this.dimensions[1] / 2;
            let textYMiddle = this.dimensions[1] / 2;
            let geneName = geneInfo[3];

            if (geneInfo[5] == '+') {
                // genes on the + strand drawn above and in a user-specified color or the default blue
                yMiddle -= 6;
                textYMiddle -= 10;
                tile.rectGraphics.lineStyle(1, fill['+'], 0.3);
                tile.rectGraphics.beginFill(fill['-'], 0.3);
            } else {
                // genes on the - strand drawn below and in a user-specified color or the default red
                yMiddle += 6;
                textYMiddle += 23;
                tile.rectGraphics.lineStyle(1, fill['-'], 0.3);
                tile.rectGraphics.beginFill(fill['-'], 0.3);
            }

            //let height = valueScale(Math.log(+geneInfo[4]));
            //let width= height;

            let rectX = this._xScale(txMiddle) - GENE_RECT_WIDTH / 2;
            let rectY = yMiddle - GENE_RECT_HEIGHT / 2;

            let xStartPos = this._xScale(txStart);
            let xEndPos = this._xScale(txEnd);

            let MIN_SIZE_FOR_EXONS = 10;

            //graphics.drawRect(rectX, rectY, width, height);
            //console.log('rectY', rectY);
            //this.allRects.push([rectX, rectY, GENE_RECT_WIDTH, GENE_RECT_HEIGHT, geneInfo[5]]);
            //console.log('xStartPos:', xStartPos);

            tile.rectGraphics.drawRect(xStartPos, rectY, xEndPos - xStartPos, GENE_RECT_HEIGHT);

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
                          fill: fill[geneInfo[5]]};

            if (!(geneInfo[3] in tile.textWidths)) {
                text.updateTransform();
                let textWidth = text.getBounds().width;

                tile.textWidths[geneInfo[3]] = textWidth;
            }
        });
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

    draw() {
        super.draw();
        //console.trace('drawing', this, this._xScale.domain(), this._xScale.range());

        //graphics.clear();

        let maxValue = 0;
        this.allTexts = [];
        this.allBoxes = [];

        for (let fetchedTileId in this.fetchedTiles) {
            let tile = this.fetchedTiles[fetchedTileId];

            // scale the rectangles

            let tileK = (tile.drawnAtScale.domain()[1] - tile.drawnAtScale.domain()[0]) / (this._xScale.domain()[1] - this._xScale.domain()[0]);
            let newRange = this._xScale.domain().map(tile.drawnAtScale);

            let posOffset = newRange[0];
            tile.rectGraphics.scale.x = tileK;
            tile.rectGraphics.position.x = - posOffset * tileK;


            // move the texts

            let parentInFetched = this.parentInFetched(tile);

            if (!tile.initialized)
                continue;

            tile.tileData.forEach((td, i) => {
                if (!tile.texts) {
                    // tile probably hasn't been initialized yet
                    return;

                }

                let geneInfo = td.fields;
                let geneName = geneInfo[3];
                let text = tile.texts[geneName];

                if (!text)
                    return;

                let chrOffset = +td.chrOffset;
                let txStart = +geneInfo[1] + chrOffset;
                let txEnd = +geneInfo[2] + chrOffset;
                let txMiddle = (txStart + txEnd) / 2;
                let textYMiddle = this.dimensions[1] / 2;

                if (geneInfo[5] == '+') {
                    // genes on the + strand drawn above and in a user-specified color or the default blue
                    textYMiddle -= 10;
                } else {
                    // genes on the - strand drawn below and in a user-specified color or the default red
                    textYMiddle += 5;
                }

                text.position.x = this._xScale(txMiddle);
                text.position.y = textYMiddle;

                if (!parentInFetched) {
                    //console.log('visible:', text.position, this.dimensions[1], text.text);
                    text.visible = true;

                    let TEXT_MARGIN = 3;
                    this.allBoxes.push([text.position.x - TEXT_MARGIN, textYMiddle - 1, text.position.x + tile.textWidths[geneInfo[3]] + TEXT_MARGIN, textYMiddle+1]);
                    this.allTexts.push({importance: +geneInfo[4], text: text, caption: geneName, strand: geneInfo[5]});
                } else {
                    //console.log('not visible');
                    text.visible = false;
                }

            });

        }


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
                //console.log('hiding1:', allTexts[j].caption)
                allTexts[j].text.visible = false;
            } else {
                //console.log('hiding:', allTexts[i].caption)
                //console.log('hiding2:', allTexts[j].caption)
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
