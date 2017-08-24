import {PixiTrack} from './PixiTrack';
import {ChromosomeInfo} from './ChromosomeInfo';
import {SearchField} from './search_field';
import boxIntersect from 'box-intersect';
import {absToChr} from './utils';

export class Chromosome2DLabels extends PixiTrack {
    constructor(scene, server, uid, handleTilesetInfoReceived, options, animate) {
        super(scene, server, uid, handleTilesetInfoReceived, options, animate);

        this.searchField = null;
        this.chromInfo = null;
        this.animate = animate;

        let chromSizesPath = server + "/chrom-sizes/?id=" + uid;

        ChromosomeInfo(chromSizesPath, (newChromInfo) => {
            this.chromInfo = newChromInfo;
            //

            this.searchField = new SearchField(this.chromInfo);
            this.draw();

            this.texts = [];

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

        let x1 = absToChr(this._xScale.domain()[0], this.chromInfo);
        let x2 = absToChr(this._xScale.domain()[1], this.chromInfo);

        let y1 = absToChr(this._yScale.domain()[0], this.chromInfo);
        let y2 = absToChr(this._yScale.domain()[1], this.chromInfo);

        for (let i = 0; i < this.texts.length; i++) {
            for (let j = 0; j < this.texts.length; j++) {
                this.texts[i][j].visible = false;
            }
        }

        for (let i = x1[3]; i <= x2[3]; i++) {
            for (let j = y1[3]; j <= y2[3]; j++) {
                let xCumPos = this.chromInfo.cumPositions[i];
                let yCumPos = this.chromInfo.cumPositions[j];

                let midX = xCumPos.pos + this.chromInfo.chromLengths[xCumPos.chr] / 2;
                let midY = yCumPos.pos + this.chromInfo.chromLengths[yCumPos.chr] / 2;

                let viewportMidX = this._xScale(midX);
                let viewportMidY = this._yScale(midY);

                let text = this.texts[i][j];

                text.x = viewportMidX;
                text.y = viewportMidY;
                text.updateTransform();

                let bbox = text.getBounds();

                // make sure the chrosome label fits in the x range
                if (viewportMidX + bbox.width / 2  > this.dimensions[0]) {
                    text.x -= (viewportMidX + bbox.width / 2) - this.dimensions[0];
                } else if (viewportMidX - bbox.width / 2 < 0) {
                    //
                    text.x -= (viewportMidX - bbox.width / 2);
                }

                // make sure the chro
                if (viewportMidY + bbox.height / 2 > this.dimensions[1]) {
                    text.y -= (viewportMidY + bbox.height / 2) - this.dimensions[1];
                } else if (viewportMidY - bbox.height / 2 < 0) {
                    text.y -= (viewportMidY - bbox.height / 2);
                }

                text.visible = true;

                allTexts.push({importance: this.texts[i][j].hashValue, text: this.texts[i][j], caption: null});
            }
        }

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
                allTexts[j].text.visible = 0;
            } else {
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
