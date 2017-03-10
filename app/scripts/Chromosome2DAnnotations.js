import {color} from 'd3-color';
import {PixiTrack} from './PixiTrack.js';
import {ChromosomeInfo} from './ChromosomeInfo.js';

export class Chromosome2DAnnotations extends PixiTrack {
    constructor(scene, chromInfoPath, options) {
        super(scene, options);

        this.drawnRects = new Set();

        ChromosomeInfo(chromInfoPath, (newChromInfo) => {
            this.chromInfo = newChromInfo;

        });
    }

    draw() {
        if (!this.chromInfo)
            return;

        this.drawnRects.clear();

        let minRectWidth = this.options.minRectWidth ? this.options.minRectWidth : 10;
        let minRectHeight = this.options.minRectWidth ? this.options.minRectHeight : 10;

        super.draw();
        let graphics = this.pMain;
        graphics.clear();

        // Regions have to follow the following form:
        // chrom1, start1, end1, chrom2, start2, end2, color-fill, color-line
        // If `color-line` is not given, `color-fill` is used
        for (let region of this.options.regions) {
            const colorFill = color(region[6]);
            let colorLine = color(region[7]);

            if (!colorLine) { colorLine = colorFill; }

            const colorFillHex = PIXI.utils.rgb2hex(
                [colorFill.r / 255., colorFill.g / 255., colorFill.b / 255.]
            );
            const colorLineHex = PIXI.utils.rgb2hex(
                [colorLine.r / 255., colorLine.g / 255., colorLine.b / 255.]
            );

            graphics.lineStyle(1, colorLineHex, colorLine.opacity);
            graphics.beginFill(colorFillHex, colorFill.opacity);

            //console.log('region:', region);
            let startX = this._xScale(this.chromInfo.chrPositions[region[0]].pos + +region[1]);
            let endX = this._xScale(this.chromInfo.chrPositions[region[0]].pos + +region[2]);

            let startY = this._yScale(this.chromInfo.chrPositions[region[3]].pos + +region[4]);
            let endY = this._yScale(this.chromInfo.chrPositions[region[3]].pos + +region[5]);

            let width = endX - startX;
            let height = endY - startY;

            if (width < minRectWidth) {
                // this region is too small to draw so center it on the location
                // where it would be drawn
                startX = (startX + endX) / 2 - minRectWidth / 2;
                width = minRectWidth;
            }

            if (height < minRectHeight) {
                startY = (startY + endY) / 2 - minRectHeight / 2;
                height = minRectHeight;
            }

            graphics.drawRect(startX, startY, width, height);
        }
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
