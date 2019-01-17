import * as PIXI from 'pixi.js';

import Tiled1DPixiTrack from './Tiled1DPixiTrack';
import AxisPixi from './AxisPixi';

import { tileProxy } from './services';
import { colorToHex, showMousePosition } from './utils';

class HorizontalTiled1DPixiTrack extends Tiled1DPixiTrack {
  constructor(context, options) {
    super(context, options);
    const { animate } = context;

    this.constIndicator = new PIXI.Graphics();
    this.pMain.addChild(this.constIndicator);

    this.axis = new AxisPixi(this);
    this.pBase.addChild(this.axis.pAxis);

    this.animate = animate;
    this.options = options;

    this.pubSubs = [];

    if (this.options.showMousePosition && !this.hideMousePosition) {
      this.hideMousePosition = showMousePosition(this, this.is2d);
    }
  }

  rerender(options, force) {
    const strOptions = JSON.stringify(options);

    if (!force && strOptions === this.prevOptions) return;

    super.rerender(options, force);

    this.prevOptions = strOptions;
    this.options = options;

    if (this.options.showMousePosition && !this.hideMousePosition) {
      this.hideMousePosition = showMousePosition(this);
    }

    if (!this.options.showMousePosition && this.hideMousePosition) {
      this.hideMousePosition();
      this.hideMousePosition = undefined;
    }
  }

  calculateZoomLevel() {
    // offset by 2 because 1D tiles are more dense than 2D tiles
    // 1024 points per tile vs 256 for 2D tiles
    if (this.tilesetInfo.resolutions) {
      const zoomIndexX = tileProxy.calculateZoomLevelFromResolutions(
        this.tilesetInfo.resolutions, this._xScale,
        this.tilesetInfo.min_pos[0], this.tilesetInfo.max_pos[0] - 2
      );

      return zoomIndexX;
    }

    // the tileProxy calculateZoomLevel function only cares about the
    // difference between the minimum and maximum position
    const xZoomLevel = tileProxy.calculateZoomLevel(this._xScale,
      this.tilesetInfo.min_pos[0],
      this.tilesetInfo.max_pos[0],
      this.tilesetInfo.bins_per_dimension || this.tilesetInfo.tile_size);

    let zoomLevel = Math.min(xZoomLevel, this.maxZoom);
    zoomLevel = Math.max(zoomLevel, 0);
    // console.log('xScale', this._xScale.domain(), this.maxZoom);
    // console.log('zoomLevel:', zoomLevel, this.tilesetInfo.min_pos[0],
    //   this.tilesetInfo.max_pos[0]);

    return zoomLevel;
  }

  /**
   * Which scale should we use for calculating tile positions?
   *
   * Horizontal tracks should use the xScale and vertical tracks
   * should use the yScale
   *
   * This function should be overwritten by HorizontalTiled1DPixiTrack.js
   * and VerticalTiled1DPixiTrack.js
   */
  relevantScale() {
    return this._xScale;
  }

  draw() {
    super.draw();
    this.drawConstIndicator();
  }

  drawAxis(valueScale) {
    // either no axis position is specified
    if (!this.options.axisPositionVertical && !this.options.axisPositionHorizontal) {
      this.axis.clearAxis();
      return;
    }

    if (this.options.axisPositionVertical && this.options.axisPositionVertical === 'hidden') {
      this.axis.clearAxis();
      return;
    }

    if (this.options.axisPositionHorizontal && this.options.axisPositionHorizontal === 'hidden') {
      this.axis.clearAxis();
      return;
    }


    if (this.options.axisPositionHorizontal === 'left'
            || this.options.axisPositionVertical === 'top') {
      // left axis are shown at the beginning of the plot

      this.axis.pAxis.position.x = this.position[0];
      this.axis.pAxis.position.y = this.position[1];

      this.axis.drawAxisRight(valueScale, this.dimensions[1]);
    } else if (this.options.axisPositionHorizontal === 'outsideLeft'
            || this.options.axisPositionVertical === 'outsideTop') {
      // left axis are shown at the beginning of the plot

      this.axis.pAxis.position.x = this.position[0];
      this.axis.pAxis.position.y = this.position[1];

      this.axis.drawAxisLeft(valueScale, this.dimensions[1]);
    } else if (this.options.axisPositionHorizontal === 'right'
            || this.options.axisPositionVertical === 'bottom') {
      this.axis.pAxis.position.x = this.position[0] + this.dimensions[0];
      this.axis.pAxis.position.y = this.position[1];
      this.axis.drawAxisLeft(valueScale, this.dimensions[1]);
    } else if (this.options.axisPositionHorizontal === 'outsideRight'
            || this.options.axisPositionVertical === 'outsideBottom') {
      this.axis.pAxis.position.x = this.position[0] + this.dimensions[0];
      this.axis.pAxis.position.y = this.position[1];
      this.axis.drawAxisRight(valueScale, this.dimensions[1]);
    }
  }

  drawConstIndicator() {
    this.constIndicator.clear();
    while (this.constIndicator.children[0]) {
      this.constIndicator.removeChild(this.constIndicator.children[0]);
    }

    if (!this.options.constIndicators || !this.valueScale) return;

    this.options.constIndicators.forEach(({
      color = 'black',
      opacity = 1.0,
      label = 'Unknown',
      labelColor = 'black',
      labelOpacity = 1.0,
      labelPosition = 'leftTop',
      labelSize = 12,
      value = 0,

    } = {}) => {
      const colorHex = colorToHex(color);
      const labelColorHex = colorToHex(labelColor);

      this.constIndicator.beginFill(colorHex, opacity);

      const y = this.valueScale(value);
      let xOffset = 0;
      let widthOffset = 0;

      const labelG = new PIXI.Text(
        label,
        {
          fontFamily: 'Arial',
          fontSize: labelSize,
          fill: labelColorHex,
        }
      );
      labelG.alpha = labelOpacity;

      switch (labelPosition) {
        case 'right':
          labelG.anchor.x = 1;
          labelG.anchor.y = 0.5;
          labelG.x = this.position[0] + this.dimensions[0] - 6;
          labelG.y = y;
          widthOffset = labelG.width + 8;
          break;

        case 'rightBottom':
          labelG.anchor.x = 1;
          labelG.anchor.y = 0;
          labelG.x = this.position[0] + this.dimensions[0] - 6;
          labelG.y = y;
          break;

        case 'rightTop':
          labelG.anchor.x = 1;
          labelG.anchor.y = 1;
          labelG.x = this.position[0] + this.dimensions[0] - 6;
          labelG.y = y;
          break;

        case 'left':
          labelG.anchor.x = 0;
          labelG.anchor.y = 0.5;
          labelG.x = this.position[0] + 2;
          labelG.y = y;
          xOffset = labelG.width + 4;
          break;

        case 'leftBottom':
          labelG.anchor.x = 0;
          labelG.anchor.y = 0;
          labelG.x = this.position[0] + 2;
          labelG.y = y;
          break;

        case 'leftTop':
        default:
          labelG.anchor.x = 0;
          labelG.anchor.y = 1;
          labelG.x = this.position[0] + 2;
          labelG.y = y;
          break;
      }

      this.constIndicator.drawRect(
        this.position[0] + xOffset, y, this.dimensions[0] - widthOffset, 1
      );

      this.constIndicator.addChild(labelG);
    });
  }
}

export default HorizontalTiled1DPixiTrack;
