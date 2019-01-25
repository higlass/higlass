import PixiTrack from './PixiTrack';

// Utils
import { colorToHex } from './utils';

class OverlayTrack extends PixiTrack {
  constructor(context, options) {
    super(context, options);

    this.options = options || {};
    this.drawnRects = {};
  }

  drawHorizontalOverlay(graphics, position, extent) {
    const xPos = this.position[0]
      + position.left
      + this._xScale(extent[0]);
    const yPos = this.position[1] + position.top;
    const height = position.height;
    const width = this._xScale(extent[1])
      - xPos
      + position.left
      + this.position[0];

    graphics.drawRect(xPos, yPos, width, height);
  }

  drawVerticalOverlay(graphics, position, extent) {
    const xPos = this.position[0] + position.left;
    const yPos = this.position[1]
      + position.top
      + this._yScale(extent.length === 4 ? extent[2] : extent[0]);
    const width = position.width;
    const height = this._yScale(extent.length === 4 ? extent[3] : extent[1])
      - yPos
      + position.top
      + this.position[1];

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

    this.options.orientationsAndPositions.forEach((op) => {
      if (op.orientation === '1d-horizontal' || op.orientation === '2d') {
        this.options.extent.forEach(extent => this.drawHorizontalOverlay(
          graphics, op.position, extent
        ));
      }

      if (op.orientation === '1d-vertical' || op.orientation === '2d') {
        this.options.extent.forEach(extent => this.drawVerticalOverlay(
          graphics, op.position, extent
        ));
      }
    });
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
