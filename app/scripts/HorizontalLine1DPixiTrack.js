import {scaleLinear, scaleLog, scaleQuantile} from 'd3-scale';
import {ticks} from 'd3-array';
import {tileProxy} from './TileProxy.js';
import {HorizontalTiled1DPixiTrack} from './HorizontalTiled1DPixiTrack.js';
import {colorToHex} from './utils.js';

export class HorizontalLine1DPixiTrack extends HorizontalTiled1DPixiTrack {
    constructor(scene, server, uid, handleTilesetInfoReceived, option, animate) {

        super(scene, server, uid, handleTilesetInfoReceived, option, animate);

        this.axisTexts = [];
        this.axisTextFontFamily = "Arial";
        this.axisTextFontSize = 10;
    }

    initTile(tile) {
        /**
         * Create whatever is needed to draw this tile.
         */
        tile.lineXValues = new Array(tile.tileData.dense.length);
        tile.lineYValues = new Array(tile.tileData.dense.length);

        this.drawTile(tile);
    }

    destroyTile(tile) {

    }

    drawAxis(valueScale) {
        if ((!this.options.axisPositionVertical &&
             !this.options.axisPositionHorizontal) ||
            this.options.axisPositionVertical == 'hidden' ||
            this.options.axisPositionHorizontal == 'hidden')
            super.clearAxis();

        if (this.options.axisPositionHorizontal == 'left' 
            || this.options.axisPositionVertical == 'top') {
            // left axis are shown at the beginning of the plot

            this.pAxis.position.x = this.position[0];
            this.pAxis.position.y = this.position[1];

            super.drawAxisLeft(valueScale, this.dimensions[1]);
        } else {
            this.pAxis.position.x = this.position[0] + this.dimensions[0];
            this.pAxis.position.y = this.position[1];
            super.drawAxisRight(valueScale, this.dimensions[1]);
        }
    }

    drawTile(tile) {
        super.drawTile(tile);

        if (!tile.graphics)
            return;

        let graphics = tile.graphics;

        let {tileX, tileWidth} = this.getTilePosAndDimensions(tile.tileData.zoomLevel, tile.tileData.tilePos);
        let tileValues = tile.tileData.dense;

        if (tileValues.length == 0)
            return;

        let minVisibleValue = this.minVisibleValue();
        let maxVisibleValue = this.maxVisibleValue();

        /*
        if (maxVisibleValue < 0)
            return;
        */

        let pseudocount = 0;    // if we use a log scale, then we'll set a pseudocount
                                // equal to the smallest non-zero value
        this.valueScale = null;
        

        if (this.options.valueScaling == 'log') {
            let offsetValue = this.medianVisibleValue;

            if (!this.medianVisibleValue)
                offsetValue = this.minVisibleValue();

            this.valueScale = scaleLog()
                .base(Math.E)
                .domain([offsetValue, maxVisibleValue])
                .range([this.dimensions[1], 0]);
            pseudocount = offsetValue;
        } else {
            // linear scale
            this.valueScale = scaleLinear()
                .domain([minVisibleValue, maxVisibleValue])
                .range([this.dimensions[1], 0]);
        }

        graphics.clear();

        this.drawAxis(this.valueScale);

        if (this.valueScale.domain()[1] < 0) {
            console.log('returning...')
            return;
        }

        let stroke = colorToHex(this.options.lineStrokeColor ? this.options.lineStrokeColor : 'blue');
        // this scale should go from an index in the data array to
        // a position in the genome coordinates
        let tileXScale = scaleLinear().domain([0, this.tilesetInfo.tile_size])
        .range([tileX,tileX + tileWidth]);

        graphics.lineStyle(1, stroke, 1);
       // graphics.beginFill(0xFF700B, 1);
        let j = 0;

        for (let i = 0; i < tileValues.length; i++) {
            let xPos = this._xScale(tileXScale(i));
            let yPos = this.valueScale(tileValues[i] + pseudocount)
                
            tile.lineXValues[i] = xPos;
            tile.lineYValues[i] = yPos;

           if(i == 0){
                graphics.moveTo(xPos, yPos);
                continue;
            }

            if (tileXScale(i) > this.tilesetInfo.max_pos[0])
                // this data is in the last tile and extends beyond the length
                // of the coordinate system
                break;


            graphics.lineTo(xPos, yPos);
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

        this.refreshTiles();

        this.draw();

    }
    exportAxisSVG() {
        let gAxis = document.createElement('g');
        gAxis.setAttribute('id', 'axis');

        if (this.options.axisPositionHorizontal == 'left' ||
            this.options.axisPositionHorizontal == 'right' ||
            this.options.axisPositionVertical == 'top' ||
            this.options.axisPositionVertical == 'bottom') {

            let axisLine = document.createElement('path');
            gAxis.appendChild(axisLine);
            axisLine.setAttribute('stroke', 'black');

            let topTick = document.createElement('path');
            gAxis.appendChild(topTick);
            topTick.setAttribute('stroke', 'black');

            for (let text of this.axisTexts) {
                let g = document.createElement('g');
                let t = document.createElement('text');

                g.appendChild(t);
                t.innerHTML = text.text;
                t.setAttribute('text-anchor', 'middle');
                t.setAttribute('font-family', this.axisTextFontFamily);
                t.setAttribute('font-size', this.axisTextFontSize);
                t.setAttribute('dy', this.axisTextFontSize / 2 - 2);

                g.setAttribute('transform',
                `translate(${text.position.x},${text.position.y})
                 scale(${text.scale.x},${text.scale.y})`)


                let tick = document.createElement('path')
                tick.setAttribute('stroke', 'black');

                if (this.options.axisPositionHorizontal == 'right' ||
                    this.options.axisPositionVertical == 'bottom') {
                    // draw the vertical axis line
                    axisLine.setAttribute('d',
                            `M${this.dimensions[0]},0 L${this.dimensions[0]},${this.dimensions[1]}`)
                    topTick.setAttribute('d',
                            `M${this.dimensions[0] - TICK_MARGIN},0 L${this.dimensions[0] - TICK_MARGIN - TICK_LENGTH},0`)

                    // draw the ticks
                    tick.setAttribute('d', 
                            `M${this.dimensions[0] - TICK_MARGIN - TICK_LENGTH},${text.position.y} 
                             L${this.dimensions[0] - TICK_MARGIN},${text.position.y}`);
                } else {
                    // the vertical axis line will be on the left
                    axisLine.setAttribute('d',
                            `M0,0 L0,${this.dimensions[1]}`)
                    topTick.setAttribute('d',
                            `M${TICK_MARGIN},0 L${TICK_MARGIN + TICK_LENGTH},0`)

                    tick.setAttribute('d', 
                            `M${TICK_MARGIN},${text.position.y} L${TICK_MARGIN + TICK_LENGTH},${text.position.y}`);
                }

                gAxis.append(tick);
                gAxis.appendChild(g);
            }
        }

        return gAxis;
    }

    exportSVG() {
        let track=null, base=null;

        if (super.exportSVG) {
            [base, track] = super.exportSVG();
        } else {
            base = document.createElement('g');
            track = base;
        }
        let output = document.createElement('g');

        track.appendChild(output);
        output.setAttribute('transform',
                            `translate(${this.position[0]},${this.position[1]})`);

        let stroke = this.options.lineStrokeColor ? this.options.lineStrokeColor : 'blue';

        for (let tile of this.visibleAndFetchedTiles()) {
            let g = document.createElement('path');
            g.setAttribute('fill', 'transparent');
            g.setAttribute('stroke', stroke);
            let d = `M${tile.lineXValues[0]} ${tile.lineYValues[0]}`;
            for (let i = 0; i < tile.lineXValues.length; i++) {
                d += `L${tile.lineXValues[i]} ${tile.lineYValues[i]}`;
            }
            g.setAttribute('d', d);
            output.appendChild(g);
        }

        // add the axis to the export
        let gAxis = this.exportAxisSVG();
        output.appendChild(gAxis);

        return [base,track];
    }
}
