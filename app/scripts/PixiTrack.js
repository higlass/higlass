import {Track} from './Track.js';
import {ticks} from 'd3-array';
import {format, formatPrefix, precisionRound, precisionPrefix} from 'd3-format';
import {colorToHex} from './utils.js';
import slugid from 'slugid';
//import {LRUCache} from './lru.js';
//
const TICK_HEIGHT = 40;
const TICK_MARGIN = 0;
const TICK_LENGTH = 5;
const TICK_LABEL_MARGIN = 4;
const MARGIN_TOP = 3;
const MARGIN_BOTTOM = 3;


export class PixiTrack extends Track {
    constructor(scene, options) {
        /**
         * @param scene: A PIXI.js scene to draw everything to.
         * @param options: A set of options that describe how this track is rendered.
         *          - labelPosition: If the label is to be drawn, where should it be drawn?
         *          - labelText: What should be drawn in the label. If either labelPosition
         *                  or labelText are false, no label will be drawn.
         */
        super();

        // the PIXI drawing areas
        // pMain will have transforms applied to it as users scroll to and fro
        this.scene = scene;

        this.pBase = new PIXI.Graphics();

        this.pMasked = new PIXI.Graphics;
        this.pMask = new PIXI.Graphics();
        this.pMain = new PIXI.Graphics();

        // for drawing the track label (often its name)
        this.pLabel = new PIXI.Graphics();
        this.pMobile = new PIXI.Graphics();
        this.pAxis = new PIXI.Graphics();

        this.scene.addChild(this.pBase);

        this.pBase.addChild(this.pMasked);

        this.pMasked.addChild(this.pMain);
        this.pMasked.addChild(this.pMask);
        this.pMasked.addChild(this.pMobile);
        this.pMasked.addChild(this.pLabel);
        this.pBase.addChild(this.pAxis);

        this.pMasked.mask = this.pMask;

        this.prevOptions = '';

        // pMobile will be a graphics object that is moved around
        // tracks that wish to use it will replace this.pMain with it

        this.options = Object.assign(this.options, options);

        let labelTextText = this.options.name ? this.options.name : 
            (this.tilesetInfo ? this.tilesetInfo.name : '');
        this.labelTextFontFamily = 'Arial';
        this.labelTextFontSize = 12;

        this.labelText = new PIXI.Text(labelTextText, {fontSize: this.labelTextFontSize + 'px', 
                                                       fontFamily: this.labelTextFontFamily, 
                                                       fill: "black"});

        this.pLabel.addChild(this.labelText);
    }

    setLabelText() {
        // will be drawn in draw() anyway
    }

    setPosition(newPosition) {
        this.position = newPosition;

        this.setMask(this.position, this.dimensions);
    }

    setDimensions(newDimensions) {
        super.setDimensions(newDimensions);

        this.setMask(this.position, this.dimensions);
    }

    setMask(position, dimensions) {
        this.pMask.clear();
        this.pMask.beginFill();
        this.pMask.drawRect(position[0], position[1], dimensions[0], dimensions[1]);
        this.pMask.endFill();
    }

    remove() {
        /**
         * We're going to destroy this object, so we need to detach its
         * graphics from the scene
         */
        this.pBase.clear();
        this.scene.removeChild(this.pBase);
    }

    calculateAxisTickValues(valueScale, axisHeight) {
        let tickCount = Math.max(axisHeight / TICK_HEIGHT, 1);
        let i = 0; 

        // create scale ticks but not all the way to the top
        let tickValues = ticks(valueScale.invert(MARGIN_BOTTOM), 
                          valueScale.invert(this.dimensions[1] - MARGIN_TOP), 
                          tickCount);

        if (tickValues.length < 1)  {
            tickValues = ticks(valueScale.invert(MARGIN_BOTTOM),
                          valueScale.invert(axisHeight - MARGIN_TOP), 
                          tickCount + 1);

            if (tickValues.length > 1) {
                // sometimes the ticks function will return 0 and then 2
                // if it didn't return enough previously, we probably only want a single
                // tick
                tickValues = [tickValues[0]];
            }
        }

        return tickValues;
    }

    startAxis(axisHeight) {
        let graphics = this.pAxis;

        graphics.clear();
        graphics.lineStyle(1, 0x000000, 1);

        // draw the axis line
        graphics.moveTo(0,0);
        graphics.lineTo(0, axisHeight);

    }

    createAxisTexts(valueScale, axisHeight) {
        this.tickValues = this.calculateAxisTickValues(valueScale, axisHeight);
        let i = 0;

        while (i < this.tickValues.length) {
            let tick = this.tickValues[i];

            while (this.axisTexts.length <= i) {
                let newText = new PIXI.Text(tick, 
                        {fontSize: this.axisTextFontSize + "px", 
                         fontFamily: this.axisTextFontFamily, 
                         fill: "black"});
                this.axisTexts.push(newText);

                this.pAxis.addChild(newText);
            }

            while (this.axisTexts.length > i+1) {
                let lastText = this.axisTexts.pop();
                this.pAxis.removeChild(lastText);
            }

            this.axisTexts[i].text = tick;

            this.axisTexts[i].anchor.y = 0.5;
            this.axisTexts[i].anchor.x = 0.5;
            i++;
        }
    }

    drawAxisLeft(valueScale, axisHeight) {
        // Draw a left-oriented axis (ticks pointing to the right)
        this.startAxis(axisHeight);
        this.createAxisTexts(valueScale, axisHeight);

        let graphics = this.pAxis;

        // draw the top, potentially unlabelled, ticke
        graphics.moveTo(0, 0);
        graphics.lineTo(-(TICK_MARGIN + TICK_LENGTH), 0);

        for (let i = 0; i < this.axisTexts.length; i++) {
            let tick = this.tickValues[i];

            // draw ticks to the left of the axis
            this.axisTexts[i].x = - (TICK_MARGIN + TICK_LENGTH + TICK_LABEL_MARGIN + this.axisTexts[i].width / 2);
            this.axisTexts[i].y = valueScale(tick);

            graphics.moveTo(-TICK_MARGIN, valueScale(tick));
            graphics.lineTo(-(TICK_MARGIN + TICK_LENGTH), valueScale(tick));

            if (this.flipText) {
                this.axisTexts[i].scale.x = -1;
            }
        }
    }

    exportVerticalAxis(axisHeight) {
        let gAxis = document.createElement('g');
        gAxis.setAttribute('class', 'axis-vertical');
        let stroke = this.options.lineStrokeColor ? this.options.lineStrokeColor : 'blue';

        let line = document.createElement('path');

        line.setAttribute('fill', 'transparent');
        line.setAttribute('stroke', 'black');
        line.setAttribute('id', 'axis-line');

        line.setAttribute('d',
                `M0,0 L0,${axisHeight}`);

        gAxis.appendChild(line);

        return gAxis;
    }


    createAxisSVGLine() {
        // factor out the styling for axis lines
        let stroke = this.options.lineStrokeColor ? this.options.lineStrokeColor : 'blue';

        let line = document.createElement('path');
        line.setAttribute('id', 'tick-mark');
        line.setAttribute('fill', 'transparent');
        line.setAttribute('stroke', stroke);

        return line;
    }

    createAxisSVGText(text) {
        // factor out the creation of axis texts
        let t = document.createElement('text');
        
        t.innerHTML = text;
        t.setAttribute('id', 'axis-text');
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('font-family', this.axisTextFontFamily);
        t.setAttribute('font-size', this.axisTextFontSize);
        t.setAttribute('dy', this.axisTextFontSize / 2 - 2);

        return t;
    }

    exportAxisLeftSVG(valueScale, axisHeight) {
        let gAxis = this.exportVerticalAxis(axisHeight);

        let line = this.createAxisSVGLine();
        gAxis.appendChild(line);

        line.setAttribute('d',
                `M0,0 L${-(TICK_MARGIN + TICK_LENGTH)},0`);

        for (let i = 0; i < this.axisTexts.length; i++) {
            let tick = this.tickValues[i];
            let text = this.axisTexts[i];

            let line = this.createAxisSVGLine();

            gAxis.appendChild(line);

            line.setAttribute('d',
                    `M${-TICK_MARGIN},${valueScale(tick)} L${-(TICK_MARGIN + TICK_LENGTH)},${valueScale(tick)}`);

            let g = document.createElement('g');
            gAxis.appendChild(g);
            let t = this.createAxisSVGText(text.text);
            g.appendChild(t);

            g.setAttribute('transform',
            `translate(${text.position.x},${text.position.y})
             scale(${text.scale.x},${text.scale.y})`)
        }

        return gAxis;
    }

    exportAxisRightSVG(valueScale, axisHeight) {
        let gAxis = this.exportVerticalAxis(axisHeight);

        let line = this.createAxisSVGLine();
        gAxis.appendChild(line);

        line.setAttribute('d',
                `M0,0 L${TICK_MARGIN + TICK_LENGTH},0`);

        for (let i = 0; i < this.axisTexts.length; i++) {
            let tick = this.tickValues[i];
            let text = this.axisTexts[i];

            let line = this.createAxisSVGLine();

            gAxis.appendChild(line);

            line.setAttribute('d',
                    `M${TICK_MARGIN},${valueScale(tick)} L${TICK_MARGIN + TICK_LENGTH},${valueScale(tick)}`);

            let g = document.createElement('g');
            gAxis.appendChild(g);
            let t = this.createAxisSVGText(text.text);
            g.appendChild(t);

            g.setAttribute('transform',
            `translate(${text.position.x},${text.position.y})
             scale(${text.scale.x},${text.scale.y})`)
        }

        return gAxis;
    }

    drawAxisRight(valueScale, axisHeight) {
        // Draw a right-oriented axis (ticks pointint to the left)
        this.startAxis(axisHeight);
        this.createAxisTexts(valueScale, axisHeight);

        let graphics = this.pAxis;

        // draw the top, potentially unlabelled, ticke
        graphics.moveTo(0, 0);
        graphics.lineTo((TICK_MARGIN + TICK_LENGTH), 0);

        for (let i = 0; i < this.axisTexts.length; i++) {
            let tick = this.tickValues[i];

            this.axisTexts[i].x = (TICK_MARGIN + TICK_LENGTH + TICK_LABEL_MARGIN + this.axisTexts[i].width / 2);
            this.axisTexts[i].y = valueScale(tick);

            graphics.moveTo(TICK_MARGIN, valueScale(tick));
            graphics.lineTo(TICK_MARGIN + TICK_LENGTH, valueScale(tick));

            if (this.flipText) {
                this.axisTexts[i].scale.x = -1;
            }
        }
    }

    clearAxis() {
        while (this.axisTexts.length) {
            let axisText = this.axisTexts.pop();
            graphics.removeChild(axisText);
        }
    }

    drawLabel() {
        let graphics = this.pLabel;

        if (!this.options || !this.options.labelPosition) {
            // don't display the track label
            this.labelText.opacity = 0;
            return;
        }

        let stroke = colorToHex(this.options.labelColor ? this.options.labelColor : 'black');

        // we can't draw a label if there's no space
        if (this.dimensions[0] < 0)
            return;

        let labelTextText = this.options.name ? this.options.name : 
            (this.tilesetInfo ? this.tilesetInfo.name : '');

        if (this.tilesetInfo && this.tilesetInfo.max_width && this.tilesetInfo.bins_per_dimension) {
            let maxWidth = this.tilesetInfo.max_width;
            let binsPerDimension = this.tilesetInfo.bins_per_dimension;
            let maxZoom = this.tilesetInfo.max_zoom;

            let resolution = maxWidth / (2 ** this.calculateZoomLevel() * binsPerDimension)

            // we can't display a NaN resolution
            if (!isNaN(resolution)) {

                let maxResolutionSize = maxWidth / (2 ** maxZoom * binsPerDimension);
                let minResolution = maxWidth / binsPerDimension;

                let pp = precisionPrefix(maxResolutionSize, resolution);
                let f = formatPrefix('.' + pp, resolution);
                let formattedResolution = f(resolution);

                labelTextText += '\n[Current data resolution: ' + formattedResolution + ']';
            } else {
                console.log('NaN resolution, screen is probably too small. Dimensions:', this.dimensions);
            }
        }

        this.labelText.text = labelTextText;
        this.labelText.style = {fontSize: this.labelTextFontSize + 'px',
                              fontFamily: this.labelTextFontFamily,
                              fill: stroke};

        this.labelText.visible = true;

        if (this.flipText)
            this.labelText.scale.x = -1;

        if (this.options.labelPosition == 'topLeft') {
            this.labelText.x = this.position[0];
            this.labelText.y = this.position[1];

            this.labelText.anchor.x = 0.5;
            this.labelText.anchor.y = 0;

            this.labelText.x += this.labelText.width / 2;
        } else if ((this.options.labelPosition == 'bottomLeft' && !this.flipText ) ||
                   (this.options.labelPosition == 'topRight' && this.flipText)) {
            this.labelText.x = this.position[0];
            this.labelText.y = this.position[1] + this.dimensions[1];
            this.labelText.anchor.x = 0.5;
            this.labelText.anchor.y = 1;

            this.labelText.x += this.labelText.width / 2;
        } else if ((this.options.labelPosition == 'topRight' && !this.flipText) ||
                   (this.options.labelPosition == 'bottomLeft' && this.flipText)) {
            this.labelText.x = this.position[0] + this.dimensions[0];;
            this.labelText.y = this.position[1];
            this.labelText.anchor.x = 0.5;
            this.labelText.anchor.y = 0;

            this.labelText.x -= this.labelText.width / 2;
        } else if (this.options.labelPosition == 'bottomRight') {
            this.labelText.x = this.position[0] + this.dimensions[0];
            this.labelText.y = this.position[1] + this.dimensions[1];
            this.labelText.anchor.x = 0.5;
            this.labelText.anchor.y = 1;

            // we set the anchor to 0.5 so that we can flip the text if the track
            // is rotated but that means we have to adjust its position
            this.labelText.x -= this.labelText.width / 2;
        } else if ((this.options.labelPosition == 'outerLeft' && !this.flipText) ||
                   (this.options.labelPosition == 'outerTop' && this.flipText)) {
            this.labelText.x = this.position[0];
            this.labelText.y = this.position[1] + this.dimensions[1] / 2;

            this.labelText.anchor.x = 0.5;
            this.labelText.anchor.y = 0.5;

            this.labelText.x -= this.labelText.width / 2 + 3;
        } else if ((this.options.labelPosition == 'outerTop' && !this.flipText) ||
                   (this.options.labelPosition == 'outerLeft' && this.flipText) ) {
            this.labelText.x = this.position[0] + this.dimensions[0] / 2;
            this.labelText.y = this.position[1];

            this.labelText.anchor.x = 0.5;
            this.labelText.anchor.y = 0.5;

            this.labelText.y -= this.labelText.height / 2 + 3;
        } else if ((this.options.labelPosition == 'outerBottom' && !this.flipText) ||
                   (this.options.labelPosition == 'outerRight' && this.flipText)) {
            this.labelText.x = this.position[0] + this.dimensions[0] / 2;
            this.labelText.y = this.position[1] + this.dimensions[1];

            this.labelText.anchor.x = 0.5;
            this.labelText.anchor.y = 0.5;

            this.labelText.y += this.labelText.height / 2 + 3;
        } else if ((this.options.labelPosition == 'outerRight' && !this.flipText) ||
                   (this.options.labelPosition == 'outerBottom' && this.flipText)){
            this.labelText.x = this.position[0] + this.dimensions[0];
            this.labelText.y = this.position[1] + this.dimensions[1] / 2;

            this.labelText.anchor.x = 0.5;
            this.labelText.anchor.y = 0.5;

            this.labelText.x += this.labelText.width / 2 + 3;

        } else {
            this.labelText.visible = false;
        }

        if (this.options.labelPosition == 'outerLeft' ||
            this.options.labelPosition == 'outerRight' || 
            this.options.labelPosition == 'outerTop' ||
            this.options.labelPosition == 'outerBottom') {
                this.pLabel.setParent(this.pBase);
            } else {
                this.pLabel.setParent(this.pMasked);

            }

        /*
        graphics.clear();
        graphics.lineStyle(0, 0x0000FF, 1);
        graphics.beginFill(0xFF700B, 0.6);

        console.log('lt:', this.labelText.position.x, this.labelText.position.y);

        graphics.drawRect(this.position[0], this.position[1], 
                        this.dimensions[0], this.dimensions[1]);
        */
    }

    rerender(options) {
        this.options = options;
        this.draw();
    }

    draw() {
        /**
         * Draw all the data associated with this track
         */

        // this rectangle is cleared by functions that override this draw method
        this.drawLabel();

        /*

        let graphics = this.pMain;

        graphics.clear();
        graphics.lineStyle(0, 0x0000FF, 1);
        graphics.beginFill(0xFF700B, 1);

        this.pMain.drawRect(this.position[0], this.position[1], 
                            this.dimensions[0], this.dimensions[1]);
        */
    }


    exportSVG() {
        let gBase = document.createElement('g');

        let gClipped = document.createElement('g');
        gBase.appendChild(gClipped);

        let gTrack = document.createElement('g');
        gClipped.appendChild(gTrack);

        let gLabels = document.createElement('g');
        gClipped.appendChild(gLabels);   // labels should always appear on top of the track

        // define the clipping area as a polygon defined by the track's
        // dimensions on the canvas
        let clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
        gBase.appendChild(clipPath);

        let clipPolygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        clipPath.appendChild(clipPolygon);



        clipPolygon.setAttribute('points', `${this.position[0]},${this.position[1]} ` +
                `${this.position[0] + this.dimensions[0]},${this.position[1]} ` +
                `${this.position[0] + this.dimensions[0]},${this.position[1] + this.dimensions[1]} ` +
                `${this.position[0]},${this.position[1] + this.dimensions[1]} `);

        // the clipping area needs to be a clipPath element
        let clipPathId = slugid.nice();
        clipPath.setAttribute('id', clipPathId);

        gClipped.setAttribute('style', `clip-path:url(#${clipPathId});`);

        let lineParts = this.labelText.text.split("\n");
        let ddy = 0;

        // SVG text alignment is wonky, just adjust the dy values of the tspans
        // instead
        
        let textHeight = 12; 
        let labelTextHeight = textHeight + ((this.labelTextFontSize+2) * (lineParts.length -1));

        if (this.labelText.anchor.y == 0.5) {
            ddy =  labelTextHeight / 2;
        } else if (this.labelText.anchor.y == 1) {
            ddy = -labelTextHeight;
        }


        for (let i = 0; i < lineParts.length; i++) {
            let text = document.createElement('text');

            text.setAttribute('font-family', this.labelTextFontFamily);
            text.setAttribute('font-size', this.labelTextFontSize + 'px');

            // break up newlines into separate tspan elements because SVG text
            // doesn't support line breaks:
            // http://stackoverflow.com/a/16701952/899470

            text.innerText = lineParts[i];
            text.setAttribute('dy', ddy + (i * (this.labelTextFontSize + 2)));
            text.setAttribute('fill', this.options.labelColor);
            
            /*
            // fuck SVG
            if (i == 0) 
                tspan.setAttribute('dy', ddy + "px");
            else
                tspan.setAttribute('dy', (i * this.labelTextFontSize + 2) + "px");

            tspan.setAttribute('x', 0)
                */
            if (this.labelText.anchor.x == 0.5) {
                text.setAttribute('text-anchor', 'middle');
            } else if (this.labelText.anchor.x == 1) {
                text.setAttribute('text-anchor', 'end');
            }

            //text.appendChild(tspan);
            gLabels.appendChild(text);
        }

        //text.setAttribute('x', this.labelText.x);
        //text.setAttribute('y', this.labelText.y);



        gLabels.setAttribute('transform', `translate(${this.labelText.x},${this.labelText.y})scale(${this.labelText.scale.x},1)`);
        gBase.appendChild(gLabels);

        // return the whole SVG and where the specific track should draw its
        // contents
        return [gBase, gTrack];
    }
}
