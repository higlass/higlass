import {PixiTrack} from './PixiTrack.js';
import {tileProxy} from './TileProxy.js';
import {ChromosomeInfo} from './ChromosomeInfo.js';
import {SearchField} from './search_field.js';
import boxIntersect from 'box-intersect';
import {colorToHex} from './utils.js';

export class Chromosome2DGrid extends PixiTrack {
    constructor(scene, chromInfoPath, animate) {
        super(scene);

        this.searchField = null;
        this.chromInfo = null;
        console.log('2d grid animate:', animate);
        this.animate = animate;

        ChromosomeInfo(chromInfoPath, (newChromInfo) => {
            this.chromInfo = newChromInfo;  

            this.searchField = new SearchField(this.chromInfo); 

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

            this.draw();
            this.animate();
        });

    }

    drawLines() {
        let graphics = this.lineGraphics;
        let strokeColor = colorToHex(this.options.gridStrokeColor ? this.options.gridStrokeColor : 'blue');

        graphics.clear();
        graphics.lineStyle(this.options.gridStrokeWidth, 
                strokeColor, 1.);

        graphics.moveTo(this._xScale(0), 0);
        graphics.lineTo(this._xScale(0), this.dimensions[1]);

        graphics.moveTo(0, this._yScale(0));
        graphics.lineTo(this.dimensions[0],  this._yScale(0));

        for (let i = 0; i < this.chromInfo.cumPositions.length; i++) {
            let chrPos = this.chromInfo.cumPositions[i];
            let chrEnd = chrPos.pos + +this.chromInfo.chromLengths[chrPos.chr] + 1;



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

    exportSVG() {
        let track=null,base=null;

        if (super.exportSVG) {
            [base, track] = super.exportSVG();
        } else {
            base = document.createElement('g');
            track = base;
        }
        let output = document.createElement('g');
        track.appendChild(output);

        base.setAttribute('id', 'Chromosome2DGrid');

        output.setAttribute('transform',
                            `translate(${this.position[0]},${this.position[1]})`);

        if (!this.chromInfo)
            // we haven't received the chromosome info yet
            return [base,track];

        let strokeColor = this.options.gridStrokeColor ? this.options.gridStrokeColor : 'blue';
        let strokeWidth = this.options.gridStrokeWidth;

        for (let i = 0; i < this.chromInfo.cumPositions.length; i++) {
            let chrPos = this.chromInfo.cumPositions[i];
            let chrEnd = chrPos.pos + +this.chromInfo.chromLengths[chrPos.chr] + 1;

            let line = document.createElement('line');

            // draw horizontal lines (all start at x=0)
            line.setAttribute('x1', 0);
            line.setAttribute('x2', this.dimensions[0]);

            line.setAttribute('y1', this._yScale(chrEnd));
            line.setAttribute('y2', this._yScale(chrEnd));

            line.setAttribute('stroke', strokeColor);
            line.setAttribute('stroke-width', strokeWidth);

            output.appendChild(line);

            // draw vertical lines (all start at y=0)
            line = document.createElement('line');

            // draw horizontal lines (all start at x=0)
            line.setAttribute('x1', this._xScale(chrEnd));
            line.setAttribute('x2', this._xScale(chrEnd));

            line.setAttribute('y1', 0)
            line.setAttribute('y1', this.dimensions[1]);

            line.setAttribute('stroke', strokeColor);
            line.setAttribute('stroke-width', strokeWidth);

            output.appendChild(line);
        }

        return [base,track];
    }
}
