import {scaleLinear, scaleLog, scaleQuantile} from 'd3-scale';
import {ticks} from 'd3-array';
import {tileProxy} from './TileProxy.js';
import {HorizontalTiled1DPixiTrack} from './HorizontalTiled1DPixiTrack.js';
import {colorToHex} from './utils.js';
import {AxisPixi} from './AxisPixi.js';

export class HorizontalLine1DPixiTrack extends HorizontalTiled1DPixiTrack {
    constructor(scene, server, uid, handleTilesetInfoReceived, option, animate) {

        super(scene, server, uid, handleTilesetInfoReceived, option, animate);

        this.axis = new AxisPixi(this);
        this.pBase.addChild(this.axis.pAxis);
    }

    initTile(tile) {
        /**
         * Create whatever is needed to draw this tile.
         */
        super.initTile(tile);

        tile.lineXValues = new Array(tile.tileData.dense.length);
        tile.lineYValues = new Array(tile.tileData.dense.length);

        this.drawTile(tile);
    }

    destroyTile(tile) {

    }

    /*
     * defined in HorizontalTiled1DPixiTrack
    calculateZoomLevel() {
        let xZoomLevel = tileProxy.calculateZoomLevel(this._xScale,
                                                      this.tilesetInfo.min_pos[0],
                                                      this.tilesetInfo.max_pos[0]) - 3;

        let zoomLevel = Math.min(xZoomLevel, this.maxZoom);

        //console.log('zoom level:', zoomLevel);

        return zoomLevel
    }
    */

    rerender(options, force) {
        this.options = options;

        super.draw();

        //console.log('rerendering');
        for (let tile of this.visibleAndFetchedTiles()) {
            this.renderTile(tile);
        }
    }

    drawAxis(valueScale) {
        // either no axis position is specified
        if (!this.options.axisPositionVertical && !this.options.axisPositionHorizontal) {
            this.axis.clearAxis();
            return;
        }

        if (this.options.axisPositionVertical && this.options.axisPositionVertical == 'hidden') {
            this.axis.clearAxis();
            return;
        }

        if (this.options.axisPositionHorizontal && this.options.axisPositionHorizontal == 'hidden') {
            this.axis.clearAxis();
            return;
        }


        if (this.options.axisPositionHorizontal == 'left' 
            || this.options.axisPositionVertical == 'top') {
            // left axis are shown at the beginning of the plot

            this.axis.pAxis.position.x = this.position[0];
            this.axis.pAxis.position.y = this.position[1];

            this.axis.drawAxisRight(valueScale, this.dimensions[1]);
        } else if (this.options.axisPositionHorizontal == 'outsideLeft' 
            || this.options.axisPositionVertical == 'outsideTop') {
            // left axis are shown at the beginning of the plot

            this.axis.pAxis.position.x = this.position[0];
            this.axis.pAxis.position.y = this.position[1];

            this.axis.drawAxisLeft(valueScale, this.dimensions[1]);
        } else if (this.options.axisPositionHorizontal == 'right' 
            || this.options.axisPositionVertical == 'bottom') {
            this.axis.pAxis.position.x = this.position[0] + this.dimensions[0];
            this.axis.pAxis.position.y = this.position[1];
            this.axis.drawAxisLeft(valueScale, this.dimensions[1]);
        } else if (this.options.axisPositionHorizontal == 'outsideRight' 
            || this.options.axisPositionVertical == 'outsideBottom') {
            this.axis.pAxis.position.x = this.position[0] + this.dimensions[0];
            this.axis.pAxis.position.y = this.position[1];
            this.axis.drawAxisRight(valueScale, this.dimensions[1]);
        }
    }

    renderTile(tile) {
        // this function is just so that we follow the same pattern as 
        // HeatmapTiledPixiTrack.js
        this.drawTile(tile);
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

        /*
        if (maxVisibleValue < 0)
            return;
        */

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
                .domain([offsetValue, this.maxValue()])
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

        if (this.valueScale.domain()[1] < 0) {
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


            //console.log('xPos:', xPos, 'yPos:', yPos);
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

        let gAxis = document.createElement('g');
        gAxis.setAttribute('id', 'axis');

        // append the axis to base so that it's not clipped
        base.appendChild(gAxis);
        gAxis.setAttribute('transform',
            `translate(${this.axis.pAxis.position.x}, ${this.axis.pAxis.position.y})`);

        // add the axis to the export
        if (this.options.axisPositionHorizontal == 'left' 
            || this.options.axisPositionVertical == 'top') {
            // left axis are shown at the beginning of the plot
            let gDrawnAxis = this.axis.exportAxisLeftSVG(this.valueScale, this.dimensions[1]);
            gAxis.appendChild(gDrawnAxis);
        } else if (this.options.axisPositionHorizontal == 'right' 
            || this.options.axisPositionVertical == 'bottom') {

            let gDrawnAxis = this.axis.exportAxisRightSVG(this.valueScale, this.dimensions[1]);
            gAxis.appendChild(gDrawnAxis);
        }

        return [base,track];
    }
}
