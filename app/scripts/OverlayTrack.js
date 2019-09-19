import PixiTrack from './PixiTrack';

// Utils
import { colorToHex } from './utils';

class OverlayTrack extends PixiTrack {
  constructor(context, options) {
    super(context, options);

    this.options = options || {};
    this.drawnRects = {};
  }

  drawHorizontalOverlay(graphics, position, extent, minWidth = 0) {
    if (!extent || extent.length < 2) return;

    let xPos = this.position[0]
      + position.left
      + this._xScale(extent[0]);

    const yPos = this.position[1] + position.top;
    const height = position.height;
    let width = this._xScale(extent[1]) - this._xScale(extent[0]);

    if (width < minWidth) {
      // To center the overlay
      xPos -= (minWidth - width) / 2;
      width = minWidth;
    }

    graphics.drawRect(xPos, yPos, width, height);
  }

  drawVerticalOverlay(graphics, position, extent, minHeight = 0) {
    if (!extent || extent.length < 2) return;

    const xPos = this.position[0] + position.left;
    let yPos = this.position[1]
      + position.top
      + this._yScale(extent.length >= 4 ? extent[2] : extent[0]);

    // the position of the left bounary of this track
    const topPosition = this.position[1] + position.top;
    const bottomPosition = this.position[1] + position.top + position.height;

    if (yPos > bottomPosition) {
      // this annotation is off the bottom
      return;
    }

    if (yPos < topPosition) {
      // this overlay is partially off the top side of the
      // track and needs to be truncated
      yPos = topPosition;
    }

    const width = position.width;
    let height = this._yScale(extent.length >= 4 ? extent[3] : extent[1])
      - yPos
      + position.top
      + this.position[1];

    if (height < 0) {
      // this overlay is off the top end of the track and
      // doesn't need to be drawn
      return;
    }

    if (yPos + height > bottomPosition) {
      height += bottomPosition - (yPos + height);
    }

    if (height < minHeight) {
      // To center the overlay
      yPos -= (minHeight - height) / 2;
      height = minHeight;
    }

    graphics.drawRect(xPos, yPos, width, height);
  }

  draw() {
    super.draw();

    const graphics = this.pMain;
    const fill = colorToHex(
      this.options.fillColor ? this.options.fillColor : 'blue'
    );

    graphics.clear();
    graphics.beginFill(fill, this.options.fillOpacity || 0.3);

    const minWidth = Math.max(0, +this.options.minWidth || 0);
    const minHeight = Math.max(0, +this.options.minHeight || 0);

    if (Array.isArray(this.options.extent)) {
      this.options.orientationsAndPositions.forEach((op) => {
        if (op.orientation === '1d-horizontal' || op.orientation === '2d') {
          this.options.extent.forEach(extent => this.drawHorizontalOverlay(
            graphics, op.position, extent, minWidth
          ));
        }

        if (op.orientation === '1d-vertical' || op.orientation === '2d') {
          this.options.extent.forEach(extent => this.drawVerticalOverlay(
            graphics, op.position, extent, minHeight
          ));
        }
      });
    }
  }

  zoomed(newXScale, newYScale) {
    this.xScale(newXScale);
    this.yScale(newYScale);

    this.draw();
  }

  setPosition(newPosition) {
    super.setPosition(newPosition);

    this.draw();
  }

  setDimensions(newDimensions) {
    super.setDimensions(newDimensions);

    this.draw();
  }

  exportSVG() {
    // TODO: implement me
    console.warn('Overlay tracks cannot be exported as SVG yet.');
  }
}

export default OverlayTrack;
