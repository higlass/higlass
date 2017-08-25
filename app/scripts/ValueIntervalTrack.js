import {scaleLog} from 'd3-scale';

import HorizontalLine1DPixiTrack from './HorizontalLine1DPixiTrack';
import AxisPixi from './AxisPixi';

import {colorToHex} from './utils';

export class ValueIntervalTrack extends HorizontalLine1DPixiTrack {
    constructor(scene, server, uid, handleTilesetInfoReceived, options, animate) {
        super(scene, server, uid, handleTilesetInfoReceived, options, animate);

        this.axis = new AxisPixi(this);
        this.pBase.addChild(this.axis.pAxis);
    }

    initTile(tile) {
        // create the tile
        // should be overwritten by child classes
        this.scale.minRawValue = this.minVisibleValue();
        this.scale.maxRawValue = this.maxVisibleValue();

        this.scale.minValue = this.scale.minRawValue;
        this.scale.maxValue = this.scale.maxRawValue;

        this.drawTile(tile);
    }

    drawTile(tile) {
        if (!tile.graphics)
            return;

        let graphics = tile.graphics;
        let RECT_HEIGHT = 6;
        let MIN_RECT_WIDTH = 4;

        graphics.clear();

        this.valueScale = scaleLog()
            .domain([this.minValue() + 0.01, this.maxValue()])
            .range([this.dimensions[1] - RECT_HEIGHT / 2 , RECT_HEIGHT / 2 ]);

        let fill = colorToHex('black');

        graphics.lineStyle(1, fill, 0.3);
        graphics.beginFill(fill, 0.3);

        this.drawAxis(this.valueScale);

        tile.tileData.forEach(td => {
            let fields = td.fields;

            let chrOffset = +td.chrOffset;


            let genomeStart = +fields[1] + chrOffset;
            let genomeEnd = +fields[2] + chrOffset;
            let value = +fields[3];

            let startPos = this._xScale(genomeStart);
            let endPos = this._xScale(genomeEnd);

            let width = Math.max(endPos - startPos, MIN_RECT_WIDTH);
            let midY = this.valueScale(value);
            let midX = (endPos + startPos) / 2;

            graphics.drawRect(midX - width / 2, midY - RECT_HEIGHT / 2, width, RECT_HEIGHT);
        });
    }

    minVisibleValue() {
         let visibleAndFetchedIds = this.visibleAndFetchedIds();

         if (visibleAndFetchedIds.length == 0) {
             visibleAndFetchedIds = Object.keys(this.fetchedTiles);
         }

         let min = Math.min.apply(null, visibleAndFetchedIds.map(x =>
                     +Math.min(...(this.fetchedTiles[x].tileData
                             .filter(y => !isNaN(y.fields[3]))
                             .map(y => {
                                 return +y.fields[3]
                     })))));

         return min;
    }

    maxVisibleValue() {
         let visibleAndFetchedIds = this.visibleAndFetchedIds();

         if (visibleAndFetchedIds.length == 0) {
             visibleAndFetchedIds = Object.keys(this.fetchedTiles);
         }


         let max = Math.max.apply(null, visibleAndFetchedIds.map(x =>
                     +Math.max(...(this.fetchedTiles[x].tileData
                             .filter(y => !isNaN(y.fields[3]))
                             .map(y => {
                                 return +y.fields[3]
                     })))));

         return max;
    }

}

export default ValueIntervalTrack;
