import {Tiled2DPixiTrack} from './Tiled2DPixiTrack.js';
import {tileProxy} from './TileProxy.js';
import {heatedObjectMap} from './colormaps.js';
import slugid from 'slugid';
import {colorDomainToRgbaArray} from './utils.js';
import {colorToHex} from './utils.js';
import {scaleLinear, scaleLog, scaleQuantile} from 'd3-scale';
import {brush, brushY} from 'd3-brush';
import {AxisPixi} from './AxisPixi.js';
import {select,event} from 'd3-selection';

const COLORBAR_MAX_HEIGHT = 200;
const COLORBAR_WIDTH = 10;
const COLORBAR_LABELS_WIDTH = 40;
const COLORBAR_MARGIN = 10;
const BRUSH_WIDTH = COLORBAR_MARGIN;
const BRUSH_COLORBAR_GAP = 1;
const BRUSH_MARGIN = 3; 

const AXIS_TICK_LENGTH = 5;

export class HeatmapTiledPixiTrack extends Tiled2DPixiTrack {
    constructor(scene, server, uid, handleTilesetInfoReceived, options, animate, svgElement) {
        /**
         * @param scene: A PIXI.js scene to draw everything to.
         * @param server: The server to pull tiles from.
         * @param uid: The data set to get the tiles from the server
         */
        super(scene, server, uid, handleTilesetInfoReceived, options, animate);


        // Graphics for drawing the colorbar
        this.pColorbarArea = new PIXI.Graphics();
        this.pMasked.addChild(this.pColorbarArea);
        

        this.pColorbar = new PIXI.Graphics();
        this.pColorbarArea.addChild(this.pColorbar);

        this.axis = new AxisPixi(this);
        this.pColorbarArea.addChild(this.axis.pAxis);

        // [[255,255,255,0], [237,218,10,4] ...
        // a 256 element array mapping the values 0-255 to rgba values
        // not a d3 color scale for speed
        //this.colorScale = heatedObjectMap;
        this.colorScale = heatedObjectMap;

        if (options && options.colorRange) {
            this.colorScale = colorDomainToRgbaArray(options.colorRange);
        }

        this.gMain = select(svgElement).append('g');
        this.gColorscaleBrush = this.gMain.append('g');

        /*
        */

        this.prevOptions = '';
    }

    setPosition(newPosition) {
        /**
         * Set the position of this track. Normally this is handled by its ancestors,
         * but because we're also drawing on the SVG track, we need the function to
         * adjust the location of this.gSVG
         *
         * Arguments
         * ---------
         *      newPosition: [x,y]
         *          The new position of this track
         */
        //this.gMain.attr('transform', `translate(${newPosition[0]},${newPosition[1]})`);

        super.setPosition(newPosition);
    }

    rerender(options, force) {
        // if force is set, then we force a rerender even if the options
        // haven't changed

        let strOptions = JSON.stringify(options);

        if (!force && strOptions === this.prevOptions)
            return;
        else
            this.prevOptions = strOptions;

        super.rerender(options, force);

        // the normalization method may have changed
        this.calculateVisibleTiles();

        if (options && options.colorRange) {
            this.colorScale = colorDomainToRgbaArray(options.colorRange);
        }

        for (let tile of this.visibleAndFetchedTiles()) {
            this.renderTile(tile);
        }

        // hopefully draw isn't rerendering all the tiles
        this.drawColorbar();
    }

    tileDataToCanvas(pixData) {
        let canvas = document.createElement('canvas');

        canvas.width = 256;
        canvas.height = 256;

        let ctx = canvas.getContext('2d');

        ctx.fillStyle = 'transparent';
        ctx.fillRect(0,0,canvas.width, canvas.height);

        let pix = new ImageData(pixData, canvas.width, canvas.height);

        ctx.putImageData(pix, 0,0);

        return canvas;
    }
    
    exportData() {
    
    }

    setSpriteProperties(sprite, zoomLevel, tilePos, mirrored) {
        let {tileX, tileY, tileWidth, tileHeight} = this.getTilePosAndDimensions(zoomLevel, tilePos);

        let tileEndX = tileX + tileWidth;
        let tileEndY = tileY + tileHeight;

        let spriteWidth = this._refXScale(tileEndX) - this._refXScale(tileX) ;
        let spriteHeight = this._refYScale(tileEndY) - this._refYScale(tileY)

        sprite.width = this._refXScale(tileEndX) - this._refXScale(tileX)
        sprite.height = this._refYScale(tileEndY) - this._refYScale(tileY)

        if (mirrored) {
            // this is a mirrored tile that represents the other half of a
            // triangular matrix
            sprite.x = this._refXScale(tileY);
            sprite.y = this._refYScale(tileX);

            //sprite.pivot = [this._refXScale()[1] / 2, this._refYScale()[1] / 2];

            // I think PIXIv3 used a different method to set the pivot value
            // because the code above no longer works as of v4
            sprite.rotation = -Math.PI / 2;
            sprite.scale.x = Math.abs(sprite.scale.x) * -1;

            sprite.width = spriteHeight;
            sprite.height = spriteWidth;
        } else {
            sprite.x = this._refXScale(tileX);
            sprite.y = this._refYScale(tileY);
        }

    }


    refXScale(_) {
        super.refXScale(_);

        this.draw();
    }

    refYScale(_) {
        super.refYScale(_);

        this.draw();
    }

    draw() {
        //console.trace('drawing', this);
        super.draw();
        
        this.drawColorbar();
    }

    brushMoved() {
        let newOptions = JSON.parse(JSON.stringify(this.options));

        let axisValueScale = this.valueScale.copy().range([this.colorbarHeight, 0]);

        let endDomain = axisValueScale.invert(event.selection[0]);
        let startDomain = axisValueScale.invert(event.selection[1]);

        let startPercent = (startDomain - axisValueScale.domain()[0]) 
            / (axisValueScale.domain()[1] - axisValueScale.domain()[0])
        let endPercent = (endDomain - axisValueScale.domain()[0]) 
            / (axisValueScale.domain()[1] - axisValueScale.domain()[0])

        newOptions.scaleStartPercent = startPercent;
        newOptions.scaleEndPercent = endPercent;

        this.rerender(newOptions);
        this.animate();
    }

    drawColorbar() {
        this.pColorbar.clear(); 
        // draw a colorbar

        if (!this.options.colorbarPosition || this.options.colorbarPosition == 'hidden') {
            this.pColorbarArea.visible = false;
            return;
        } 

        this.pColorbarArea.visible = true;

        if (!this.valueScale)
            return;


        let colorbarAreaHeight = Math.min(this.dimensions[1] / 2, COLORBAR_MAX_HEIGHT);
        this.colorbarHeight = colorbarAreaHeight - 2 * COLORBAR_MARGIN;
        let colorbarAreaWidth = COLORBAR_WIDTH + COLORBAR_LABELS_WIDTH + COLORBAR_MARGIN + BRUSH_COLORBAR_GAP + BRUSH_WIDTH + BRUSH_MARGIN ;

        let axisValueScale = this.valueScale.copy().range([this.colorbarHeight, 0]);

        this.scaleBrush = brushY()
            .extent([[0, 0], [BRUSH_WIDTH, this.colorbarHeight]])
            .on("start brush end", this.brushMoved.bind(this));

        this.gColorscaleBrush.on('.brush', null);
        this.gColorscaleBrush.call(this.scaleBrush);
        /*
        this.gColorscaleBrush.select('rect')
        .style('stroke', 'grey');
        */

        if (this.options.colorbarPosition == 'topLeft') {
            // draw the background for the colorbar
            this.pColorbarArea.x = this.position[0];
            this.pColorbarArea.y = this.position[1];

            this.pColorbar.y = COLORBAR_MARGIN;
            this.axis.pAxis.y = COLORBAR_MARGIN;

            if (this.options.colorbarLabelsPosition == 'outside') {
                this.axis.pAxis.x = COLORBAR_LABELS_WIDTH + COLORBAR_MARGIN;

                this.pColorbar.x = COLORBAR_LABELS_WIDTH + COLORBAR_MARGIN;
            } else {
                this.axis.pAxis.x = BRUSH_MARGIN + BRUSH_WIDTH + BRUSH_COLORBAR_GAP + COLORBAR_WIDTH;
                this.pColorbar.x = BRUSH_MARGIN + BRUSH_WIDTH + BRUSH_COLORBAR_GAP;

                this.gColorscaleBrush.attr('transform', 
                    'translate(' + (this.pColorbarArea.x + BRUSH_MARGIN ) + ',' + (this.pColorbarArea.y + this.pColorbar.y  - 1) + ")");
            }
        }

        if (this.options.colorbarPosition == 'topRight') {
            // draw the background for the colorbar
            this.pColorbarArea.x = this.position[0] + this.dimensions[0] - colorbarAreaWidth;
            this.pColorbarArea.y = this.position[1];

            this.pColorbar.y = COLORBAR_MARGIN;
            this.axis.pAxis.y = COLORBAR_MARGIN;

            if (this.options.colorbarLabelsPosition == 'outside') {
                this.axis.pAxis.x = COLORBAR_WIDTH;

                this.pColorbar.x = 0;

            } else {
                // default to 'inside'
                this.axis.pAxis.x = COLORBAR_LABELS_WIDTH + COLORBAR_MARGIN;

                this.pColorbar.x = COLORBAR_LABELS_WIDTH + COLORBAR_MARGIN;

                this.gColorscaleBrush.attr('transform', 
                    'translate(' + (this.pColorbarArea.x + this.pColorbar.x + COLORBAR_WIDTH + 2) + ',' + (this.pColorbarArea.y + this.pColorbar.y  - 1) + ")");
            }
        }

        if (this.options.colorbarPosition == 'bottomRight') {
            this.pColorbarArea.x = this.position[0] + this.dimensions[0] - colorbarAreaWidth;
            this.pColorbarArea.y = this.position[1] + this.dimensions[1] - colorbarAreaHeight;

            this.pColorbar.y = COLORBAR_MARGIN;
            this.axis.pAxis.y = COLORBAR_MARGIN;

            if (this.options.colorbarLabelsPosition == 'outside') {
                this.axis.pAxis.x = COLORBAR_WIDTH;

                this.pColorbar.x = 0;
            } else {
                // default to "inside"
                this.axis.pAxis.x = COLORBAR_LABELS_WIDTH + COLORBAR_MARGIN;
                this.pColorbar.x = COLORBAR_LABELS_WIDTH + COLORBAR_MARGIN;

                this.gColorscaleBrush.attr('transform', 
                    'translate(' + (this.pColorbarArea.x + this.pColorbar.x + COLORBAR_WIDTH + BRUSH_COLORBAR_GAP) + ',' + (this.pColorbarArea.y + this.pColorbar.y  - 1) + ")");
            }
        }

        if (this.options.colorbarPosition == 'bottomLeft') {
            this.pColorbarArea.x = this.position[0];
            this.pColorbarArea.y = this.position[1] + this.dimensions[1] - colorbarAreaHeight;

            this.pColorbar.y = COLORBAR_MARGIN;
            this.axis.pAxis.y = COLORBAR_MARGIN;

            if (this.options.colorbarLabelsPosition == 'outside') {
                this.axis.pAxis.x = COLORBAR_LABELS_WIDTH + COLORBAR_MARGIN;

                this.pColorbar.x = COLORBAR_LABELS_WIDTH + COLORBAR_MARGIN;
            } else {
                // default to "inside"
                this.axis.pAxis.x = BRUSH_MARGIN + BRUSH_WIDTH + BRUSH_COLORBAR_GAP + COLORBAR_WIDTH;
                this.pColorbar.x = BRUSH_MARGIN + BRUSH_WIDTH + BRUSH_COLORBAR_GAP;

                this.gColorscaleBrush.attr('transform', 
                    'translate(' + (this.pColorbarArea.x + 2 ) + ',' + (this.pColorbarArea.y + this.pColorbar.y  - 1) + ")");
            } 
        }

        this.pColorbarArea.clear();
        this.pColorbarArea.beginFill(colorToHex('white'), 0.6);
        this.pColorbarArea.drawRect(0, 0, colorbarAreaWidth, colorbarAreaHeight);

        if (!this.options)
            this.options = {};
        if (!this.options.scaleStartPercent)
            this.options.scaleStartPercent = 0;
        if (!this.options.scaleEndPercent)
            this.options.scaleEndPercent = 1;

        let domainWidth = axisValueScale.domain()[1] - axisValueScale.domain()[0];

        let startBrush = axisValueScale(this.options.scaleStartPercent * domainWidth + axisValueScale.domain()[0])
        let endBrush = axisValueScale(this.options.scaleEndPercent * domainWidth + axisValueScale.domain()[0])

        // endBrush and startBrush are reversed because lower values come first
        this.gColorscaleBrush.call(this.scaleBrush.move, 
            [endBrush, startBrush]);

        //let centerY = this.position[1] + this.dimensions[1] / 2;
        let centerY = this.colorbarHeight / 2;

        let posScale = scaleLinear()
            .domain([0,255])
            .range([0,this.colorbarHeight])

        // draw a small rectangle for each color of the colorbar
        for (let i = 0; i < this.colorbarHeight; i++) {
            let value = this.limitedValueScale(axisValueScale.invert(i));

            let rgbIdx = Math.max(0, Math.min(254, Math.floor(value)))
            this.pColorbar.beginFill(colorToHex(`rgb(${this.colorScale[rgbIdx][0]},
                                                  ${this.colorScale[rgbIdx][1]},
                                                  ${this.colorScale[rgbIdx][2]})`));

            // each rectangle in the colorbar will be one pixel high
            this.pColorbar.drawRect(0, i, COLORBAR_WIDTH, 1);
        }
        
        // draw an axis on the right side of the colorbar
        this.pAxis.position.x = COLORBAR_WIDTH;
        this.pAxis.position.y = posScale(0);


        if (this.options.colorbarPosition == 'topLeft'
            || this.options.colorbarPosition == 'bottomLeft') {
            if (this.options.colorbarLabelsPosition == 'outside') {
                this.axis.drawAxisLeft(axisValueScale, this.colorbarHeight);
            } else {
                this.axis.drawAxisRight(axisValueScale, this.colorbarHeight);
            }
        } else if (this.options.colorbarPosition == 'topRight'
                   || this.options.colorbarPosition == 'bottomRight') {
            if (this.options.colorbarLabelsPosition == 'outside') {
                this.axis.drawAxisRight(axisValueScale, this.colorbarHeight);
            } else {
                this.axis.drawAxisLeft(axisValueScale, this.colorbarHeight);
            }
        } 
    }

    exportColorBarSVG() {
        let gColorbarArea = document.createElement('g');

        if (!this.valueScale)
            // no value scale, no colorbar
            return gColorbarArea;

        gColorbarArea.setAttribute('transform',
                `translate(${this.pColorbarArea.x}, ${this.pColorbarArea.y})`);


        gColorbarArea.setAttribute('transform',
                `translate(${this.pColorbarArea.x}, ${this.pColorbarArea.y})`);

        let rectColorbarArea = document.createElement('rect');
        gColorbarArea.appendChild(rectColorbarArea);

        let gColorbar = document.createElement('g');
        gColorbarArea.appendChild(gColorbar);

        gColorbar.setAttribute('transform',
                `translate(${this.pColorbar.x}, ${this.pColorbar.y})`);

        let colorbarAreaHeight = Math.min(this.dimensions[1], COLORBAR_MAX_HEIGHT);
        this.colorbarHeight = colorbarAreaHeight - 2 * COLORBAR_MARGIN;
        let colorbarAreaWidth = COLORBAR_WIDTH + COLORBAR_LABELS_WIDTH + 2 * COLORBAR_MARGIN;

        rectColorbarArea.setAttribute('x', 0);
        rectColorbarArea.setAttribute('y', 0);
        rectColorbarArea.setAttribute('width', colorbarAreaWidth);
        rectColorbarArea.setAttribute('height', colorbarAreaHeight);
        rectColorbarArea.setAttribute('style', 'fill: white; stroke-width: 0; opacity: 0.7');

        let posScale = scaleLinear()
            .domain([0,255])
            .range([0,this.colorbarHeight])
        let colorHeight = (this.colorbarHeight) / 256.;

        for (let i = 0; i < 256; i++) {
            let rectColor = document.createElement('rect');
            gColorbar.appendChild(rectColor);

            rectColor.setAttribute('x', 0);
            rectColor.setAttribute('y', posScale(i));
            rectColor.setAttribute('width', COLORBAR_WIDTH);
            rectColor.setAttribute('height', colorHeight);
            rectColor.setAttribute('class', 'color-rect');

            rectColor.setAttribute('style', `fill: rgb(${this.colorScale[i][0]}, ${this.colorScale[i][1]}, ${this.colorScale[i][2]})`);
        }

        let gAxisHolder = document.createElement('g');
        gColorbarArea.appendChild(gAxisHolder);
        gAxisHolder.setAttribute('transform',
                `translate(${this.axis.pAxis.position.x},${this.axis.pAxis.position.y})`);

        let gAxis = null;
        let axisValueScale = this.valueScale.copy().range([this.colorbarHeight, 0]);

        if (this.options.colorbarPosition == 'topLeft'
            || this.options.colorbarPosition == 'bottomLeft') {
            if (this.options.colorbarLabelsPosition == 'inside') {
                gAxis = this.axis.exportAxisRightSVG(axisValueScale, this.colorbarHeight);
            } else {
                gAxis = this.axis.exportAxisLeftSVG(axisValueScale, this.colorbarHeight);
            }
        } else if (this.options.colorbarPosition == 'topRight'
                   || this.options.colorbarPosition == 'bottomRight') {
            if (this.options.colorbarLabelsPosition == 'inside') {
                gAxis = this.axis.exportAxisLeftSVG(axisValueScale, this.colorbarHeight);
            } else {
                gAxis = this.axis.exportAxisRightSVG(axisValueScale, this.colorbarHeight);
            }
        } 

        gAxisHolder.appendChild(gAxis);

        return gColorbarArea;
    }

    initTile(tile) {
        /**
         * Convert the raw tile data to a rendered array of values which can be represented as a sprite.
         *
         * @param tile: The data structure containing all the tile information. Relevant to
         *              this function are tile.tileData = {'dense': [...], ...}
         *              and tile.graphics
         */
        super.initTile(tile);
        /*
        this.scale.minRawValue = this.minVisibleValue();
        this.scale.maxRawValue = this.maxVisibleValue();

        this.scale.minValue = this.scale.minRawValue;
        this.scale.maxValue = this.scale.maxRawValue;
        */

        this.valueScale = scaleLog().range([254,0])
            .domain([this.scale.minValue, this.scale.minValue + this.scale.maxValue])

        this.renderTile(tile);
    }

    renderTile(tile) {

        if (this.options.heatmapValueScaling == 'log') {
            this.valueScale = scaleLog().range([254, 0])
            .domain([this.scale.minValue, this.scale.minValue + this.scale.maxValue]);
        } else if (this.options.heatmapValueScaling == 'linear') {
            this.valueScale = scaleLinear().range([254, 0])
            .domain([this.scale.minValue, this.scale.minValue + this.scale.maxValue]);
        } /*
        else if (this.options.heatmapValueScaling == 'quantile') {
            this.valueScale = scaleQuantile().range([254, 0])
            .domain([this.scale.minValue, this.scale.minValue + this.scale.maxValue]);
        }
        */

        this.limitedValueScale = this.valueScale.copy();
        if (this.options 
            && typeof(this.options.scaleStartPercent) != 'undefined' 
            && typeof(this.options.scaleEndPercent) != 'undefined') {
            this.limitedValueScale.domain(
                [this.valueScale.domain()[0] + (this.valueScale.domain()[1] - this.valueScale.domain()[0]) * ( this.options.scaleStartPercent),
                this.valueScale.domain()[0] + (this.valueScale.domain()[1] - this.valueScale.domain()[0]) * ( this.options.scaleEndPercent)])
        }

        tileProxy.tileDataToPixData(tile,
                                    this.limitedValueScale,
                                    this.valueScale.domain()[0], //used as a pseudocount to prevent taking the log of 0
                                    this.colorScale,
                                    function(pixData) {
            // the tileData has been converted to pixData by the worker script and needs to be loaded
            // as a sprite
            let graphics = tile.graphics;
            let canvas = this.tileDataToCanvas(pixData);

            let sprite = null;

            sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(canvas, PIXI.SCALE_MODES.NEAREST));
            /*
            if (tile.tileData.zoomLevel == this.maxZoom)
                sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(canvas, PIXI.SCALE_MODES.NEAREST));
            else
                sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(canvas));
                */

            tile.sprite = sprite;

            // store the pixData so that we can export it
            tile.canvas = canvas;
            this.setSpriteProperties(tile.sprite, tile.tileData.zoomLevel, tile.tileData.tilePos, tile.mirrored);

            graphics.removeChildren();
            graphics.addChild(tile.sprite);
        }.bind(this));

    }

    remove() {
        /**
         * Remove this track from the view
         */
        this.gMain.remove();
        this.gMain = null;

        super.remove();
    }

    refScalesChanged(refXScale, refYScale) {
        super.refScalesChanged(refXScale, refYScale);

        for (let uid in this.fetchedTiles) {
            let tile = this.fetchedTiles[uid];

            if (tile.sprite) {
                this.setSpriteProperties(tile.sprite, tile.tileData.zoomLevel, tile.tileData.tilePos, tile.mirrored);
            } else {
                // console.log('skipping...', tile.tileId);
            }
        }
    }

    /*
    exportSVG() {
        let svg = `<g transform="translate(${this.pMain.position.x},${this.pMain.position.y})
                                 scale(${this.pMain.scale.x},${this.pMain.scale.y})">`
        for (let tile of this.visibleAndFetchedTiles()) {
            let rotation = tile.sprite.rotation * 180 / Math.PI;

            svg += `<g
                    transform="translate(${tile.sprite.x}, ${tile.sprite.y})
                               rotate(${rotation})
                               scale(${tile.sprite.scale.x},${tile.sprite.scale.y})"
                >`;
            svg += '<image xlink:href="' + tile.canvas.toDataURL() + '"/>';
            svg += "</g>";
        }

        svg += '</g>';
        return svg;
    }
    */

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
                            `translate(${this.pMain.position.x},${this.pMain.position.y})
                             scale(${this.pMain.scale.x},${this.pMain.scale.y})`)

        for (let tile of this.visibleAndFetchedTiles()) {
            //console.log('sprite:', tile.canvas.toDataURL());
            let rotation = tile.sprite.rotation * 180 / Math.PI;
            let g = document.createElement('g');
            g.setAttribute('transform', 
                            `translate(${tile.sprite.x}, ${tile.sprite.y})
                               rotate(${rotation})
                               scale(${tile.sprite.scale.x},${tile.sprite.scale.y})`);


            let image = document.createElement('image');
            image.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', tile.canvas.toDataURL());
            image.setAttribute('width', 256);
            image.setAttribute('height', 256);


            g.appendChild(image);
            output.appendChild(g);
        }

        let gColorbar = this.exportColorBarSVG();
        track.appendChild(gColorbar);

        return [base, base];
    }
}
