import {PixiTrack} from './PixiTrack.js';
import {ChromosomeInfo} from './ChromosomeInfo.js';

export class Chromosome2DAnnotations extends PixiTrack {
    constructor(scene, chromInfoPath, options) {
        super(scene, options);

        this.drawnRects = new Set();

        console.log('chromInfoPath:', chromInfoPath);

        ChromosomeInfo(chromInfoPath, (newChromInfo) => {
            this.chromInfo = newChromInfo;  

            console.log('chromInfo:', this.chromInfo);
        });
    }

    draw() {
        if (!this.chromInfo)
            return;

        this.drawnRects.clear();
        
        let minRectWidth = 5;
        let minRectHeight = 5;

        super.draw();
        let graphics = this.pMain;
        graphics.clear();

        for (let region of this.options.regions) {
            graphics.lineStyle(1, 0x0000FF, 0.3);
            graphics.beginFill(0x0000FF, 0.3);

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
