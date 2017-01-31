import {PixiTrack} from './PixiTrack.js';
import {tileProxy} from './TileProxy.js';
import {ChromosomeInfo} from './ChromosomeInfo.js';
import {SearchField} from './search_field.js';
import boxIntersect from 'box-intersect';
import {scaleLinear} from 'd3-scale';

let TICK_WIDTH = 150;
let TICK_HEIGHT = 4;
let TICK_TEXT_SEPARATION = 2;

export class HorizontalChromosomeLabels extends PixiTrack {
    constructor(scene, chromInfoPath) {
        super(scene);

        this.searchField = null;
        this.chromInfo = null;

        console.log('chromInfoPath:', chromInfoPath);

        this.gTicks = {};
        this.tickTexts = {};

        ChromosomeInfo(chromInfoPath, (newChromInfo) => {
            this.chromInfo = newChromInfo;  
            console.log('chromInfo:', this.chromInfo);

            console.log('chromInfo:', this.chromInfo);
            //

            this.searchField = new SearchField(this.chromInfo); 
            this.draw();

            this.texts = [];

            for (let i = 0; i < this.chromInfo.cumPositions.length; i++) {
                let textStr = this.chromInfo.cumPositions[i].chr;
                this.gTicks[textStr] = new PIXI.Graphics();

                // create the array that will store tick TEXT objects
                if (!this.tickTexts[textStr])
                    this.tickTexts[textStr] = [];

                let text = new PIXI.Text(textStr, 
                            {fontSize: "14px", fontFamily: "Arial", fill: "black"}
                            );

                text.anchor.x = 0.5;
                text.anchor.y = 0.5;
                text.visible = false;

                //give each string a random hash so that some get hidden 
                // when there's overlaps
                text.hashValue = Math.random();

                console.log('text:', text);

                this.pMain.addChild(text);
                this.pMain.addChild(this.gTicks[textStr]);

                this.texts.push(text);
            }
        });

    }

    drawTicks(cumPos) {
        let graphics = this.gTicks[cumPos.chr];

        this.gTicks[cumPos.chr].visible = true;
        this.gTicks[cumPos.chr].clear();

        let chromLen = +this.chromInfo.chromLengths[cumPos.chr];

        let vpLeft = Math.max(this._xScale(cumPos.pos), 0);
        let vpRight = Math.min(this._xScale(cumPos.pos + chromLen), this.dimensions[0]);

        let numTicks = (vpRight - vpLeft) / TICK_WIDTH;

        // what is the domain of this chromosome that is visible?
        let xScale = scaleLinear().domain([
                Math.max(1, this._xScale.invert(0) - cumPos.pos),
                Math.min(chromLen, this._xScale.invert(this.dimensions[0]) - cumPos.pos)])
            .range(vpLeft, vpRight);


        // calculate a certain number of ticks
        let ticks = xScale.ticks(numTicks);
        let tickTexts = this.tickTexts[cumPos.chr];


        while (tickTexts.length <= ticks.length) {
            let newText = new PIXI.Text('', 
                        {fontSize: "12px", fontFamily: "Helvetica Neue", fill: "black"});
            tickTexts.push(newText);
            this.gTicks[cumPos.chr].addChild(newText);
        }

        let i = 0; 
        while (i < ticks.length) {
            tickTexts[i].visible = true;

            tickTexts[i].anchor.x = 0.5;
            tickTexts[i].anchor.y = 1;

            // draw the tick labels
            tickTexts[i].x = this._xScale(cumPos.pos + ticks[i]);
            tickTexts[i].text = ticks[i];
            tickTexts[i].y = this.dimensions[1] - (TICK_HEIGHT + TICK_TEXT_SEPARATION);

            graphics.lineStyle(1, 0x000000, 1);

            // draw the tick lines
            graphics.moveTo(this._xScale(cumPos.pos + ticks[i]), this.dimensions[1]);
            graphics.lineTo(this._xScale(cumPos.pos + ticks[i]), this.dimensions[1] - TICK_HEIGHT);


            i += 1;
        }

        while (i < tickTexts.length) {
            // we don't need this text so we'll turn it off for now
            tickTexts[i].visible = false;

            i += 1;
        }
        /*
        console.log('xScale.domain()', xScale.domain());
        console.log('cumPos.chr', cumPos.chr, 'ticks:', xScale.ticks(numTicks));
        */
    }

    draw() {
        let leftChrom = null;
        let rightChrom = null;
        let topChrom = null;
        let bottomChrom = null;

        let allTexts = [];

        if (!this.texts)
            return;

        if (!this.searchField)
            return;

        let x1 = this.searchField.absoluteToChr(this._xScale.domain()[0]);
        let x2 = this.searchField.absoluteToChr(this._xScale.domain()[1]);

        for (let i = 0; i < this.texts.length; i++) {
            this.texts[i].visible = false;
            this.gTicks[this.chromInfo.cumPositions[i].chr].visible = false;
        }

        for (let i = x1[3]; i <= x2[3]; i++) {
            let xCumPos = this.chromInfo.cumPositions[i];

            let midX = xCumPos.pos + this.chromInfo.chromLengths[xCumPos.chr] / 2;

            let viewportMidX = this._xScale(midX);

            let text = this.texts[i];

            text.anchor.y = 1;
            text.x = viewportMidX;
            text.y = this.dimensions[1] - 2 * TICK_TEXT_SEPARATION - TICK_HEIGHT;
            text.updateTransform();

            let bbox = text.getBounds();
            console.log('bbox:', bbox);
            text.y -= bbox.height; 

            // make sure the chrosome label fits in the x range
            if (viewportMidX + bbox.width / 2  > this.dimensions[0]) {
                text.x -= (viewportMidX + bbox.width / 2) - this.dimensions[0];
            } else if (viewportMidX - bbox.width / 2 < 0) {
                //
                text.x -= (viewportMidX - bbox.width / 2);
            } 


            text.visible = true;

            allTexts.push({importance: this.texts[i].hashValue, text: this.texts[i], caption: null});
            this.drawTicks(xCumPos);
        }

        /*
        console.log('x1:', x1);
        console.log('x2:', x2);

        console.log('y1:', y1);
        console.log('y2:', y2);
        */


        // define the edge chromosome which are visible
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
                allTexts[j].text.visible = 0; 
            } else {
                //console.log('hiding:', allTexts[i].caption)
                allTexts[i].text.visible = 0; 
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
        
        this.draw();
    }

}
