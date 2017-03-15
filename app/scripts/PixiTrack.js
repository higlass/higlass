import {Track} from './Track.js';
import {format, formatPrefix, precisionRound, precisionPrefix} from 'd3-format';
//import {LRUCache} from './lru.js';

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

        this.scene.addChild(this.pBase);

        this.pBase.addChild(this.pMasked);

        this.pMasked.addChild(this.pMain);
        this.pMasked.addChild(this.pMask);
        this.pMasked.addChild(this.pMobile);
        this.pMasked.addChild(this.pLabel);

        this.pMasked.mask = this.pMask;

        this.prevOptions = '';

        // pMobile will be a graphics object that is moved around
        // tracks that wish to use it will replace this.pMain with it

        this.options = Object.assign(this.options, options);


        let labelTextText = this.options.name ? this.options.name : 
            (this.tilesetInfo ? this.tilesetInfo.name : '');

        this.labelText = new PIXI.Text(labelTextText, {fontSize: "12px", fontFamily: "Arial", fill: "black"});

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

                //console.log('maxResolutionSize:', maxResolutionSize);

                labelTextText += '\n[Current data resolution: ' + formattedResolution + ']';
            } else {
                console.log('NaN resolution, screen is probably too small. Dimensions:', this.dimensions);
            }
        }

        this.labelText.text = labelTextText;

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
        //console.log('rerendering...', options)
        this.options = options;
        this.draw();
    }

    draw() {
        /**
         * Draw all the data associated with this track
         */

        // this rectangle is cleared by functions that override this draw method
        this.drawLabel();

        //console.log('this.options:', this.options);
        /*

        let graphics = this.pMain;

        graphics.clear();
        graphics.lineStyle(0, 0x0000FF, 1);
        graphics.beginFill(0xFF700B, 1);

        this.pMain.drawRect(this.position[0], this.position[1], 
                            this.dimensions[0], this.dimensions[1]);
        */
    }
}
