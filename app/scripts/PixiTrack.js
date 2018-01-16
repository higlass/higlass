import { formatPrefix, precisionPrefix } from 'd3-format';
import * as PIXI from 'pixi.js';
import slugid from 'slugid';

import { Track } from './Track.js';

import { colorToHex } from './utils';

/**
 * Format a resolution relative to the highest possible resolution.
 *
 * The highest possible resolution determines the granularity of the
 * formatting (e.g. 20K vs 20000)
 * @param {int} resolution The resolution to format (e.g. 30000)
 * @param {int} maxResolutionSize The maximum possible resolution (e.g. 1000)
 *
 * @returns {string} A formatted resolution string (e.g. "30K")
 */
function formatResolutionText(resolution, maxResolutionSize) {
  const pp = precisionPrefix(maxResolutionSize, resolution);
  const f = formatPrefix(`.${pp}`, resolution);
  const formattedResolution = f(resolution);

  return formattedResolution;
}

/**
 * Get a text description of a resolution based on a zoom level
 * and a list of resolutions
 *
 * @param {list} resolutions: A list of resolutions (e.g. [1000,2000,3000])
 * @param {int} zoomLevel: The current zoom level (e.g. 4)
 *
 * @returns {string} A formatted string representation of the zoom level (e.g. "30K")
 * 
 */
function getResolutionBasedResolutionText(resolutions, zoomLevel) {
  const sortedResolutions = resolutions.map(x => +x).sort((a,b) => b-a)
  const resolution = sortedResolutions[zoomLevel];
  const maxResolutionSize = sortedResolutions[sortedResolutions.length-1];

  return formatResolutionText(resolution, maxResolutionSize);
}

/**
 * Get a text description of the resolution based on the zoom level
 * max width of the dataset, the bins per dimension and the maximum
 * zoom.
 *
 * @param {int} zoomLevel The current zoomLevel (e.g. 0)
 * @param {int} max_width The max width (e.g. 2 ** maxZoom * highestResolution * binsPerDimension)
 * @param {int} bins_per_dimension The number of bins per tile dimension (e.g. 256)
 * @param {int} maxZoom The maximum zoom level for this tileset
 *
 * @returns {string} A formatted string representation of the zoom level (e.g. "30K")
 */
function getWidthBasedResolutionText(zoomLevel, maxWidth, binsPerDimension, maxZoom) {
  const resolution = maxWidth / ((2 ** zoomLevel) * binsPerDimension);

  // we can't display a NaN resolution
  if (!isNaN(resolution)) {
    // what is the maximum possible resolution?
    // this will determine how we format the lower resolutions
    const maxResolutionSize = maxWidth / (2 ** maxZoom * binsPerDimension);

    const pp = precisionPrefix(maxResolutionSize, resolution);
    const f = formatPrefix(`.${pp}`, resolution);
    const formattedResolution = f(resolution);

    return formattedResolution;
  } else {
    console.warn(
      'NaN resolution, screen is probably too small. Dimensions:',
      this.dimensions,
    );

    return '';
  }
}

export class PixiTrack extends Track {
  /**
   * @param scene: A PIXI.js scene to draw everything to.
   * @param options: A set of options that describe how this track is rendered.
    this.pMain.position.x = this.position[0];
   *          - labelPosition: If the label is to be drawn, where should it be drawn?
   *          - labelText: What should be drawn in the label. If either labelPosition
   *                  or labelText are false, no label will be drawn.
   */
  constructor(scene, options) {
    super();

    // the PIXI drawing areas
    // pMain will have transforms applied to it as users scroll to and fro
    this.scene = scene;

    // this option is used to temporarily prevent drawing so that
    // updates can be batched (e.g. zoomed and options changed)
    this.delayDrawing = false;

    this.pBase = new PIXI.Graphics();

    this.pMasked = new PIXI.Graphics();
    this.pMask = new PIXI.Graphics();
    this.pMain = new PIXI.Graphics();

    // for drawing the track label (often its name)
    this.pBorder = new PIXI.Graphics();
    this.pLabel = new PIXI.Graphics();
    this.pMobile = new PIXI.Graphics();
    this.pAxis = new PIXI.Graphics();

    this.scene.addChild(this.pBase);

    this.pBase.addChild(this.pMasked);

    this.pMasked.addChild(this.pMain);
    this.pMasked.addChild(this.pMask);
    this.pMasked.addChild(this.pMobile);
    this.pMasked.addChild(this.pBorder);
    this.pMasked.addChild(this.pLabel);
    this.pBase.addChild(this.pAxis);

    this.pMasked.mask = this.pMask;

    this.prevOptions = '';

    // pMobile will be a graphics object that is moved around
    // tracks that wish to use it will replace this.pMain with it

    this.options = Object.assign(this.options, options);

    const labelTextText = this.options.name ? this.options.name :
      (this.tilesetInfo ? this.tilesetInfo.name : '');
    this.labelTextFontFamily = 'Arial';
    this.labelTextFontSize = 12;

    this.labelText = new PIXI.Text(labelTextText, { fontSize: `${this.labelTextFontSize}px`,
      fontFamily: this.labelTextFontFamily,
      fill: 'black' });

    this.errorText = new PIXI.Text('',
      { fontSize: '12px', fontFamily: 'Arial', fill: 'red' });
    this.errorText.anchor.x = 0.5;
    this.errorText.anchor.y = 0.5;
    this.pLabel.addChild(this.errorText);

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

  /**
   * We're going to destroy this object, so we need to detach its
   * graphics from the scene
   */
  remove() {
    //console.trace('removing track');
    // the entire PIXI stage was probably removed
    this.pBase.clear();
    this.scene.removeChild(this.pBase);
  }

  /**
   * Draw a border around each track.
   */
  drawBorder() {
    const graphics = this.pBorder;

    graphics.clear();

    // don't display the track label
    if (!this.options || !this.options.trackBorderWidth) return;

    const stroke = colorToHex(
      this.options.trackBorderColor ? this.options.trackBorderColor : 'white',
    );

    graphics.lineStyle(this.options.trackBorderWidth, stroke);

    graphics.drawRect(
      this.position[0],
      this.position[1],
      this.dimensions[0],
      this.dimensions[1],
    );
  }

  drawError() {
    this.errorText.x = this.position[0] + this.dimensions[0] / 2;
    this.errorText.y = this.position[1] + this.dimensions[1] / 2;

    this.errorText.text = this.errorTextText;

    if (this.errorTextText && this.errorTextText.length) {
      // draw a red border around the track to bring attention to its
      // error
      const graphics = this.pBorder;

      graphics.clear();
      graphics.lineStyle(1, colorToHex('red'));

      graphics.drawRect(
        this.position[0],
        this.position[1],
        this.dimensions[0],
        this.dimensions[1],
      );
    }
  }

  drawLabel() {
    const graphics = this.pLabel;

    if (!this.options || !this.options.labelPosition) {
      // don't display the track label
      this.labelText.opacity = 0;
      return;
    }

    graphics.clear();

    if (this.options.labelBackgroundOpacity) {
      graphics.beginFill(0xFFFFFF, +this.options.labelBackgroundOpacity);
    } else {
      graphics.beginFill(0xFFFFFF, 0);
    }

    const stroke = colorToHex(
      this.options.labelColor ? this.options.labelColor : 'black',
    );
    const labelBackgroundMargin = 2;

    // we can't draw a label if there's no space
    if (this.dimensions[0] < 0) { return; }

    let labelTextText = this.tilesetInfo && this.tilesetInfo.coordSystem
      ? `${this.tilesetInfo.coordSystem} | `
      : '';

    labelTextText += this.options.name
      ? this.options.name
      : (this.tilesetInfo ? this.tilesetInfo.name : '');

    if (
      this.tilesetInfo &&
      this.tilesetInfo.max_width &&
      this.tilesetInfo.bins_per_dimension
    ) {
      const formattedResolution = getWidthBasedResolutionText(
        this.calculateZoomLevel(),
        this.tilesetInfo.max_width,
        this.tilesetInfo.bins_per_dimension,
        this.tilesetInfo.max_zoom);


      labelTextText += `\n[Current data resolution: ${formattedResolution}]`;
    } else if (
      this.tilesetInfo && 
      this.tilesetInfo.resolutions) {

      const formattedResolution = getResolutionBasedResolutionText(
        this.tilesetInfo.resolutions,
        this.calculateZoomLevel());

      labelTextText += `\n[Current data resolution: ${formattedResolution}]`;
    }

    if (this.options && this.options.dataTransform) {
      let chosenTransform = null;

      if (this.tilesetInfo && this.tilesetInfo.transforms) {
        for (const transform of this.tilesetInfo.transforms) {
          if (transform.value === this.options.dataTransform) {
            chosenTransform = transform;
          }
        }
      }

      if (chosenTransform) {
        labelTextText += `\n[Transform: ${chosenTransform.name}]`;
      } else if (this.options.dataTransform === 'None') {
        labelTextText += '\n[Transform: None ]';
      } else {
        labelTextText += '\n[Transform: Default ]';
      }
    }

    this.labelText.text = labelTextText;
    this.labelText.style = {
      fontSize: `${this.labelTextFontSize}px`,
      fontFamily: this.labelTextFontFamily,
      fill: stroke,
    };
    this.labelText.alpha = typeof this.options.labelTextOpacity !== 'undefined'
      ? this.options.labelTextOpacity
      : 1;

    this.labelText.visible = true;

    if (this.flipText) { this.labelText.scale.x = -1; }

    if (this.options.labelPosition === 'topLeft') {
      this.labelText.x = this.position[0];
      this.labelText.y = this.position[1];

      this.labelText.anchor.x = 0.5;
      this.labelText.anchor.y = 0;

      this.labelText.x += this.labelText.width / 2;

      graphics.drawRect(this.position[0],
        this.position[1],
        this.labelText.width + labelBackgroundMargin,
        this.labelText.height + labelBackgroundMargin);
    } else if ((this.options.labelPosition === 'bottomLeft' && !this.flipText) ||
                   (this.options.labelPosition === 'topRight' && this.flipText)) {
      this.labelText.x = this.position[0];
      this.labelText.y = this.position[1] + this.dimensions[1];
      this.labelText.anchor.x = 0.5;
      this.labelText.anchor.y = 1;

      this.labelText.x += this.labelText.width / 2;
      graphics.drawRect(this.position[0],
        this.position[1] + this.dimensions[1] - this.labelText.height - labelBackgroundMargin,
        this.labelText.width + labelBackgroundMargin,
        this.labelText.height + labelBackgroundMargin);
    } else if ((this.options.labelPosition === 'topRight' && !this.flipText) ||
                   (this.options.labelPosition === 'bottomLeft' && this.flipText)) {
      this.labelText.x = this.position[0] + this.dimensions[0];
      this.labelText.y = this.position[1];
      this.labelText.anchor.x = 0.5;
      this.labelText.anchor.y = 0;

      this.labelText.x -= this.labelText.width / 2;

      graphics.drawRect(this.position[0] + this.dimensions[0] - this.labelText.width - labelBackgroundMargin,
        this.position[1],
        this.labelText.width + labelBackgroundMargin,
        this.labelText.height + labelBackgroundMargin);
    } else if (this.options.labelPosition === 'bottomRight') {
      this.labelText.x = this.position[0] + this.dimensions[0];
      this.labelText.y = this.position[1] + this.dimensions[1];
      this.labelText.anchor.x = 0.5;
      this.labelText.anchor.y = 1;

      // we set the anchor to 0.5 so that we can flip the text if the track
      // is rotated but that means we have to adjust its position
      this.labelText.x -= this.labelText.width / 2;

      graphics.drawRect(
        this.position[0] + this.dimensions[0] - this.labelText.width - labelBackgroundMargin,
        this.position[1] + this.dimensions[1] - this.labelText.height - labelBackgroundMargin,
        this.labelText.width + labelBackgroundMargin,
        this.labelText.height + labelBackgroundMargin,
      );
    } else if ((this.options.labelPosition === 'outerLeft' && !this.flipText) ||
                   (this.options.labelPosition === 'outerTop' && this.flipText)) {
      this.labelText.x = this.position[0];
      this.labelText.y = this.position[1] + this.dimensions[1] / 2;

      this.labelText.anchor.x = 0.5;
      this.labelText.anchor.y = 0.5;

      this.labelText.x -= this.labelText.width / 2 + 3;
    } else if ((this.options.labelPosition === 'outerTop' && !this.flipText) ||
                   (this.options.labelPosition === 'outerLeft' && this.flipText)) {
      this.labelText.x = this.position[0] + this.dimensions[0] / 2;
      this.labelText.y = this.position[1];

      this.labelText.anchor.x = 0.5;
      this.labelText.anchor.y = 0.5;

      this.labelText.y -= this.labelText.height / 2 + 3;
    } else if ((this.options.labelPosition === 'outerBottom' && !this.flipText) ||
                   (this.options.labelPosition === 'outerRight' && this.flipText)) {
      this.labelText.x = this.position[0] + this.dimensions[0] / 2;
      this.labelText.y = this.position[1] + this.dimensions[1];

      this.labelText.anchor.x = 0.5;
      this.labelText.anchor.y = 0.5;

      this.labelText.y += this.labelText.height / 2 + 3;
    } else if ((this.options.labelPosition == 'outerRight' && !this.flipText) ||
                   (this.options.labelPosition == 'outerBottom' && this.flipText)) {
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
  }

  rerender(options) {
    this.options = options;
    this.draw();
  }

  /**
   * Draw all the data associated with this track
   */
  draw() {
    // this rectangle is cleared by functions that override this draw method
    this.drawBorder();
    this.drawLabel();
    this.drawError();
  }

  /**
   * Export an SVG representation of this track
   *
   * @returns {[DOMNode,DOMNode]} The two returned DOM nodes are both SVG
   * elements [base,track]. Base is a parent which contains track as a
   * child. Track is clipped with a clipping rectangle contained in base.
   *
   */
  exportSVG() {
    const gBase = document.createElement('g');

    const gClipped = document.createElement('g');
    gClipped.setAttribute('class', 'g-clipped');
    gBase.appendChild(gClipped);

    const gTrack = document.createElement('g');
    gClipped.setAttribute('class', 'g-track');
    gClipped.appendChild(gTrack);

    const gLabels = document.createElement('g');
    gClipped.setAttribute('class', 'g-labels');
    gClipped.appendChild(gLabels); // labels should always appear on top of the track

    // define the clipping area as a polygon defined by the track's
    // dimensions on the canvas
    const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    gBase.appendChild(clipPath);

    const clipPolygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    clipPath.appendChild(clipPolygon);


    clipPolygon.setAttribute('points', `${this.position[0]},${this.position[1]} ` +
                `${this.position[0] + this.dimensions[0]},${this.position[1]} ` +
                `${this.position[0] + this.dimensions[0]},${this.position[1] + this.dimensions[1]} ` +
                `${this.position[0]},${this.position[1] + this.dimensions[1]} `);

    // the clipping area needs to be a clipPath element
    const clipPathId = slugid.nice();
    clipPath.setAttribute('id', clipPathId);

    gClipped.setAttribute('style', `clip-path:url(#${clipPathId});`);

    const lineParts = this.labelText.text.split('\n');
    let ddy = 0;

    // SVG text alignment is wonky, just adjust the dy values of the tspans
    // instead

    const paddingBottom = 3;
    const labelTextHeight = (this.labelTextFontSize+2) * (lineParts.length) + paddingBottom;

    if (this.labelText.anchor.y == 0.5) {
      ddy = labelTextHeight / 2;
    } else if (this.labelText.anchor.y == 1) {
      ddy = -labelTextHeight;
    }


    for (let i = 0; i < lineParts.length; i++) {
      const text = document.createElement('text');

      text.setAttribute('font-family', this.labelTextFontFamily);
      text.setAttribute('font-size', `${this.labelTextFontSize}px`);

      // break up newlines into separate tspan elements because SVG text
      // doesn't support line breaks:
      // http://stackoverflow.com/a/16701952/899470

      text.innerText = lineParts[i];
      if (this.options.labelPosition === 'topLeft' ||
        this.options.labelPosition === 'topRight') {
        let dy = ddy + ((i + 1) * (this.labelTextFontSize + 2)) ;
        text.setAttribute('dy', dy);
      }
      else if (
        this.options.labelPosition === 'bottomLeft' ||
        this.options.labelPosition === 'bottomRight'
      ) {
        text.setAttribute('dy', ddy + (i * (this.labelTextFontSize + 2)) );
      }

      text.setAttribute('fill', this.options.labelColor);

      if (this.labelText.anchor.x == 0.5) {
        text.setAttribute('text-anchor', 'middle');
      } else if (this.labelText.anchor.x == 1) {
        text.setAttribute('text-anchor', 'end');
      }

      gLabels.appendChild(text);
    }

    gLabels.setAttribute('transform', `translate(${this.labelText.x},${this.labelText.y})scale(${this.labelText.scale.x},1)`);

    // return the whole SVG and where the specific track should draw its
    // contents
    return [gBase, gTrack];
  }
}

export default PixiTrack;
