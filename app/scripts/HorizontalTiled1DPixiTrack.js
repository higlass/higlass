import Tiled1DPixiTrack from './Tiled1DPixiTrack';
import AxisPixi from './AxisPixi';

import { tileProxy } from './services';
import { colorToHex, showMousePosition } from './utils';

// Configs
import { GLOBALS } from './configs';

class HorizontalTiled1DPixiTrack extends Tiled1DPixiTrack {
  constructor(context, options) {
    super(context, options);
    const { animate, isShowGlobalMousePosition } = context;

    this.constIndicator = new GLOBALS.PIXI.Graphics();
    this.pMain.addChild(this.constIndicator);

    this.axis = new AxisPixi(this);
    this.pBase.addChild(this.axis.pAxis);

    this.animate = animate;
    this.options = options;
    this.isShowGlobalMousePosition = isShowGlobalMousePosition;

    this.pubSubs = [];

    if (this.options.showMousePosition && !this.hideMousePosition) {
      this.hideMousePosition = showMousePosition(
        this,
        this.is2d,
        this.isShowGlobalMousePosition(),
      );
    }
  }

  rerender(options, force) {
    const strOptions = JSON.stringify(options);

    if (!force && strOptions === this.prevOptions) return;

    super.rerender(options, force);

    this.prevOptions = strOptions;
    this.options = options;

    if (this.options.showMousePosition && !this.hideMousePosition) {
      this.hideMousePosition = showMousePosition(
        this,
        this.is2d,
        this.isShowGlobalMousePosition(),
      );
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
        this.tilesetInfo.resolutions,
        this._xScale,
        this.tilesetInfo.min_pos[0],
        this.tilesetInfo.max_pos[0] - 2,
      );

      return zoomIndexX;
    }

    // the tileProxy calculateZoomLevel function only cares about the
    // difference between the minimum and maximum position
    const xZoomLevel = tileProxy.calculateZoomLevel(
      this._xScale,
      this.tilesetInfo.min_pos[0],
      this.tilesetInfo.max_pos[0],
      this.tilesetInfo.bins_per_dimension || this.tilesetInfo.tile_size,
    );

    let zoomLevel = Math.min(xZoomLevel, this.maxZoom);
    zoomLevel = Math.max(zoomLevel, 0);

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
    if (
      !this.options.axisPositionVertical &&
      !this.options.axisPositionHorizontal
    ) {
      this.axis.clearAxis();
      return;
    }

    if (
      this.options.axisPositionVertical &&
      this.options.axisPositionVertical === 'hidden'
    ) {
      this.axis.clearAxis();
      return;
    }

    if (
      this.options.axisPositionHorizontal &&
      this.options.axisPositionHorizontal === 'hidden'
    ) {
      this.axis.clearAxis();
      return;
    }

    const margin = this.options.axisMargin || 0;

    if (
      this.options.axisPositionHorizontal === 'left' ||
      this.options.axisPositionVertical === 'top'
    ) {
      // left axis are shown at the beginning of the plot
      this.axis.pAxis.position.x = this.position[0] + margin;
      this.axis.pAxis.position.y = this.position[1];

      this.axis.drawAxisRight(valueScale, this.dimensions[1]);
    } else if (
      this.options.axisPositionHorizontal === 'outsideLeft' ||
      this.options.axisPositionVertical === 'outsideTop'
    ) {
      // left axis are shown at the beginning of the plot
      this.axis.pAxis.position.x = this.position[0] + margin;
      this.axis.pAxis.position.y = this.position[1];

      this.axis.drawAxisLeft(valueScale, this.dimensions[1]);
    } else if (
      this.options.axisPositionHorizontal === 'right' ||
      this.options.axisPositionVertical === 'bottom'
    ) {
      this.axis.pAxis.position.x =
        this.position[0] + this.dimensions[0] - margin;
      this.axis.pAxis.position.y = this.position[1];
      this.axis.drawAxisLeft(valueScale, this.dimensions[1]);
    } else if (
      this.options.axisPositionHorizontal === 'outsideRight' ||
      this.options.axisPositionVertical === 'outsideBottom'
    ) {
      this.axis.pAxis.position.x =
        this.position[0] + this.dimensions[0] - margin;
      this.axis.pAxis.position.y = this.position[1];
      this.axis.drawAxisRight(valueScale, this.dimensions[1]);
    }
  }

  mouseMoveZoomHandler(absX = this.mouseX, absY = this.mouseY) {
    if (
      typeof absX === 'undefined' ||
      !this.areAllVisibleTilesLoaded() ||
      !this.tilesetInfo
    )
      return;

    let dataPosX = 0;
    let dataPosY = 0;
    let orientation = '1d-horizontal';

    if (this.isLeftModified) {
      dataPosX = absY - this.position[1];
      dataPosY = absX - this.position[0];
      orientation = '1d-vertical';
    } else {
      dataPosX = absX - this.position[0];
      dataPosY = absY - this.position[1];
    }

    const relX = absX - this.position[0];
    const relY = absY - this.position[1];
    const dataX = this._xScale.invert(dataPosX);
    const dataY = this._yScale.invert(dataPosY);

    const data = this.getDataAtPos(dataPosX);
    if (!data) return;

    this.onMouseMoveZoom({
      trackId: this.id,
      data,
      absX,
      absY,
      relX,
      relY,
      dataX,
      dataY,
      orientation,
    });
  }

  drawConstIndicator() {
    if (!this.constIndicator) {
      // this can happen if we receive a tilesetInfo in the TiledPixiTrack
      // constructor before we get a chance to initialize this object
      return;
    }

    this.constIndicator.clear();
    while (this.constIndicator.children[0]) {
      this.constIndicator.removeChild(this.constIndicator.children[0]);
    }

    if (!this.options.constIndicators || !this.valueScale) return;

    this.options.constIndicators.forEach(
      ({
        color = 'black',
        opacity = 1.0,
        label = null,
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

        if (label) {
          const labelG = new GLOBALS.PIXI.Text(label, {
            fontFamily: 'Arial',
            fontSize: labelSize,
            fill: labelColorHex,
          });
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
          this.constIndicator.addChild(labelG);
        }

        this.constIndicator.drawRect(
          this.position[0] + xOffset,
          y,
          this.dimensions[0] - widthOffset,
          1,
        );
      },
    );
  }

  exportSVG() {
    let track = null;
    let base = null;

    if (super.exportSVG) {
      [base, track] = super.exportSVG();
    } else {
      base = document.createElement('g');
      track = base;
    }

    base.setAttribute('class', 'horizontal-tiled-1d-track');
    const output = document.createElement('g');

    track.appendChild(output);

    if (this.options.constIndicators) {
      this.options.constIndicators.forEach(
        ({
          color = 'black',
          opacity = 1.0,
          label = null,
          labelColor = 'black',
          labelOpacity = 1.0,
          labelPosition = 'leftTop',
          labelSize = 12,
          value = 0,
        } = {}) => {
          const y = this.valueScale(value);

          if (label) {
            const labelEl = document.createElement('text');
            labelEl.textContent = label;

            labelEl.setAttribute('x', this.position[0]);
            labelEl.setAttribute('y', y);
            labelEl.setAttribute(
              'style',
              `font-family: 'Arial'; font-size: ${labelSize}px; fill: ${labelColor}; fill-opacity: ${labelOpacity};`,
            );

            switch (labelPosition) {
              case 'rightBottom':
                labelEl.setAttribute(
                  'x',
                  this.position[0] + this.dimensions[0] - 6,
                );
                labelEl.setAttribute('y', y + labelSize + 2);
                labelEl.setAttribute('text-anchor', 'end');
                break;

              case 'right':
              case 'rightTop':
                labelEl.setAttribute(
                  'x',
                  this.position[0] + this.dimensions[0] - 6,
                );
                labelEl.setAttribute('y', y - 2);
                labelEl.setAttribute('text-anchor', 'end');
                break;

              case 'leftBottom':
                labelEl.setAttribute('x', this.position[0] + 2);
                labelEl.setAttribute('y', y + labelSize + 2);
                break;

              case 'left':
              case 'leftTop':
              default:
                labelEl.setAttribute('x', this.position[0] + 2);
                labelEl.setAttribute('y', y - 2);
                break;
            }

            output.appendChild(labelEl);
          }

          const line = document.createElement('line');
          line.setAttribute('x1', this.position[0]);
          line.setAttribute('y1', y);
          line.setAttribute('x2', this.dimensions[0]);
          line.setAttribute('y2', y);
          line.setAttribute('stroke', color);
          line.setAttribute('stroke-opacity', opacity);

          output.appendChild(line);
        },
      );
    }

    return [base, track];
  }
}

export default HorizontalTiled1DPixiTrack;
