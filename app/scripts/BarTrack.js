import {scaleLinear, scaleLog, scaleQuantile} from 'd3-scale';
import {ticks} from 'd3-array';
import {tileProxy} from './TileProxy.js';
import {HorizontalLine1DPixiTrack} from './HorizontalLine1DPixiTrack.js';
import {colorToHex} from './utils.js';
import {AxisPixi} from './AxisPixi.js';
import {dictValues} from './utils.js';

export class BarTrack extends HorizontalLine1DPixiTrack {
    constructor(scene, server, uid, handleTilesetInfoReceived, option, animate) {

        super(scene, server, uid, handleTilesetInfoReceived, option, animate);

    }

    initTile(tile) {
        /**
         * Create whatever is needed to draw this tile.
         */
        super.initTile(tile);

        //console.log('initializing tile');

        //this.drawTile(tile);
        this.renderTile(tile);
    }

    drawTile(tile) {

    }

    renderTile(tile) {
        super.drawTile(tile);

        if (!tile.graphics)
            return;

        //console.log('renderTile:');

        let graphics = tile.graphics;

        let {tileX, tileWidth} = this.getTilePosAndDimensions(tile.tileData.zoomLevel, tile.tileData.tilePos);
        let tileValues = tile.tileData.dense;

        if (tileValues.length == 0)
            return;

        let pseudocount = 0;    // if we use a log scale, then we'll set a pseudocount
                                // equal to the smallest non-zero value
        this.valueScale = null;

        //console.log('valueScaling:', this.options.valueScaling);
        if (this.options.valueScaling == 'log') {
            let offsetValue = this.medianVisibleValue;

            if (!this.medianVisibleValue)
                offsetValue = this.minVisibleValue();

            this.valueScale = scaleLog()
                //.base(Math.E)
                .domain([offsetValue, this.maxValue() + offsetValue])
                .range([this.dimensions[1], 0]);
            pseudocount = offsetValue;
        } else {
            // linear scale
            this.valueScale = scaleLinear()
                .domain([this.minValue(), this.maxValue()])
                .range([this.dimensions[1], 0]);
        }

        graphics.clear();

        this.drawAxis(this.valueScale);

        if (this.options.valueScaling == 'log' && this.valueScale.domain()[1] < 0) {
            console.warn("Negative values present when using a log scale", this.valueScale.domain());
            return;
        }

        let stroke = colorToHex(this.options.lineStrokeColor ? this.options.lineStrokeColor : 'blue');
        // this scale should go from an index in the data array to
        // a position in the genome coordinates
        let tileXScale = scaleLinear().domain([0, this.tilesetInfo.tile_size])
        .range([tileX,tileX + tileWidth]);

        //let strokeWidth = this.options.lineStrokeWidth ? this.options.lineStrokeWidth : 1;

        let strokeWidth = 0;
        graphics.lineStyle(strokeWidth, stroke, 1);

        let color = colorToHex(this.options.barFillColor ? this.options.barFillColor : 'grey');
        let opacity = 'barOpacity' in this.options ? this.options.barOpacity : 1;

        graphics.beginFill(color, opacity);

        let j = 0;
        tile.drawnAtScale = this._xScale.copy();

        for (let i = 0; i < tileValues.length; i++) {
            let xPos = this._xScale(tileXScale(i));
            let yPos = this.valueScale(tileValues[i] + pseudocount)
                
            tile.lineXValues[i] = xPos;
            tile.lineYValues[i] = yPos;

            let width = this._xScale(tileXScale(i+1)) - xPos;
            let height = this.dimensions[1] - yPos;

            if (tileXScale(i) > this.tilesetInfo.max_pos[0])
                // this data is in the last tile and extends beyond the length
                // of the coordinate system
                break;


            //console.log('drawRect');
            //console.log('xPos:', xPos)

            graphics.drawRect(xPos,
                              yPos,
                width,
                height);
        }
    }

    draw() {
        super.draw();

        for (let tile of dictValues(this.fetchedTiles)) {
            // scaling between tiles
            let tileK = (tile.drawnAtScale.domain()[1] - tile.drawnAtScale.domain()[0]) / (this._xScale.domain()[1] - this._xScale.domain()[0]);
                    
            //let posOffset = newRange[0];

            let newRange = this._xScale.domain().map(tile.drawnAtScale);

            let posOffset = newRange[0];
            tile.graphics.scale.x = tileK;
            tile.graphics.position.x = - posOffset * tileK;
        }
    }

    zoomed(newXScale, newYScale, k, tx, ty) {
        super.zoomed(newXScale, newYScale);
    }
}
