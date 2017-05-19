import {Track} from './Track.js';
import {ticks} from 'd3-array';
import {format, formatPrefix, precisionRound, precisionPrefix} from 'd3-format';
import {colorToHex} from './utils.js';
import slugid from 'slugid';
//import {LRUCache} from './lru.js';
//


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



    drawLabel() {
        let graphics = this.pLabel;

        if (!this.options || !this.options.labelPosition) {
            // don't display the track label
            this.labelText.opacity = 0;
            return;
        }

        graphics.clear();
        
        if (!this.options.labelBackgroundOpacity)
            graphics.beginFill(0xFFFFFF, 0);
        else
            graphics.beginFill(0xFFFFFF, +this.options.labelBackgroundOpacity);

        let stroke = colorToHex(this.options.labelColor ? this.options.labelColor : 'black');
        let labelBackgroundMargin = 2;

        // we can't draw a label if there's no space
        if (this.dimensions[0] < 0)
            return;

        let labelTextText = ''
        if (this.tilesetInfo)
            labelTextText += this.tilesetInfo.coordSystem ? this.tilesetInfo.coordSystem + " | " : '';

        labelTextText += this.options.name ? this.options.name : 
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
                console.warn('NaN resolution, screen is probably too small. Dimensions:', this.dimensions);
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

            graphics.drawRect(this.position[0],
                              this.position[1],
                              this.labelText.width + labelBackgroundMargin, 
                              this.labelText.height + labelBackgroundMargin)
        } else if ((this.options.labelPosition == 'bottomLeft' && !this.flipText ) ||
                   (this.options.labelPosition == 'topRight' && this.flipText)) {
            this.labelText.x = this.position[0];
            this.labelText.y = this.position[1] + this.dimensions[1];
            this.labelText.anchor.x = 0.5;
            this.labelText.anchor.y = 1;

            this.labelText.x += this.labelText.width / 2;
            graphics.drawRect(this.position[0],
                              this.position[1] + this.dimensions[1] - this.labelText.height - labelBackgroundMargin,
                              this.labelText.width + labelBackgroundMargin, 
                              this.labelText.height + labelBackgroundMargin)
        } else if ((this.options.labelPosition == 'topRight' && !this.flipText) ||
                   (this.options.labelPosition == 'bottomLeft' && this.flipText)) {
            this.labelText.x = this.position[0] + this.dimensions[0];;
            this.labelText.y = this.position[1];
            this.labelText.anchor.x = 0.5;
            this.labelText.anchor.y = 0;

            this.labelText.x -= this.labelText.width / 2;

            graphics.drawRect(this.position[0] + this.dimensions[0] - this.labelText.width - labelBackgroundMargin,
                              this.position[1],
                              this.labelText.width + labelBackgroundMargin, 
                              this.labelText.height + labelBackgroundMargin)
        } else if (this.options.labelPosition == 'bottomRight') {

            this.labelText.x = this.position[0] + this.dimensions[0];
            this.labelText.y = this.position[1] + this.dimensions[1];
            this.labelText.anchor.x = 0.5;
            this.labelText.anchor.y = 1;

            // we set the anchor to 0.5 so that we can flip the text if the track
            // is rotated but that means we have to adjust its position
            this.labelText.x -= this.labelText.width / 2;

            graphics.drawRect(this.position[0] + this.dimensions[0] - this.labelText.width - labelBackgroundMargin,
                              this.position[1] + this.dimensions[1] - this.labelText.height - labelBackgroundMargin,
                              this.labelText.width + labelBackgroundMargin, 
                              this.labelText.height + labelBackgroundMargin)
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
