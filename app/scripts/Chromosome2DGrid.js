import {PixiTrack} from './PixiTrack.js';
import {tileProxy} from './TileProxy.js';
import {ChromosomeInfo} from './ChromosomeInfo.js';
import {SearchField} from './search_field.js';
import boxIntersect from 'box-intersect';

export class Chromosome2DGrid extends PixiTrack {
    constructor(scene, chromInfoPath) {
        super(scene);

        this.searchField = null;
        this.chromInfo = null;

        console.log('chromInfoPath:', chromInfoPath);

        ChromosomeInfo(chromInfoPath, (newChromInfo) => {
            this.chromInfo = newChromInfo;  
            console.log('chromInfo:', this.chromInfo);

            console.log('chromInfo:', this.chromInfo);
            //

            this.searchField = new SearchField(this.chromInfo); 
            this.draw();

            this.texts = [];
            this.lineGraphics = new PIXI.Graphics();

            this.pMain.addChild(this.lineGraphics);
            
            for (let i = 0; i < this.chromInfo.cumPositions.length; i++) {
                let thisTexts = [];

                for (let j = 0; j < this.chromInfo.cumPositions.length; j++) {
                    let textStr = this.chromInfo.cumPositions[i].chr + "/" + this.chromInfo.cumPositions[j].chr;
                    let text = new PIXI.Text(textStr, 
                                {fontSize: "14px", fontFamily: "Arial", fill: "red"}
                                );

                    text.anchor.x = 0.5;
                    text.anchor.y = 0.5;
                    text.visible = false;

                    //give each string a random hash so that some get hidden 
                    // when there's overlaps
                    text.hashValue = Math.random();

                    thisTexts.push(text);

                    this.pMain.addChild(text);
                }

                this.texts.push(thisTexts);
            }
        });

    }

    drawLines() {
        let graphics = this.lineGraphics;
        graphics.clear();
        graphics.lineStyle(1, 'red', 0.3);

        graphics.moveTo(this._xScale(0), 0);
        graphics.lineTo(this._xScale(0), this.dimensions[1]);

        graphics.moveTo(0, this._yScale(0));
        graphics.lineTo(this.dimensions[0],  this._yScale(0));

        for (let i = 0; i < this.chromInfo.cumPositions.length; i++) {
            let chrPos = this.chromInfo.cumPositions[i];
            let chrEnd = chrPos.pos + +this.chromInfo.chromLengths[chrPos.chr];



            graphics.moveTo(0, this._yScale(chrEnd));
            graphics.lineTo(this.dimensions[0], this._yScale(chrEnd));

            graphics.moveTo(this._xScale(chrEnd), 0);
            graphics.lineTo(this._xScale(chrEnd), this.dimensions[1]);
        }
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

        this.drawLines();

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
