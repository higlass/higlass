import PixiTrack from './PixiTrack';

// Utils
import { colorToHex } from './utils';

const drawRectWithPositionedBorder = (
  graphics,
  xPos,
  yPos,
  width,
  height,
  fill,
  stroke,
  outline,
  isVertical = false
) => {
  let finalXPos = xPos;
  let finalYPos = yPos;
  let finalWidth = width;
  let finalHeight = height;

  // The size of an outline is one dimensional so width when the outline
  // is veritcal is the same as the height when the outline is horizontal.
  // The reason I call the size `outline.width` is just to stay close to
  // how the stroke is defined and the stroke definition is aligned to SVG's
  // strokeWidth.
  const outlineWidth = outline.width * 2 > width
    ? width / 2 : outline.width;
  const outlineHeight = outline.width * 2 > height
    ? height / 2 : outline.width;

  if (outline.positions && outline.positions.length) {
    graphics.lineStyle(1, 0x000000, 0);
    graphics.beginFill(outline.color, outline.opacity);

    outline.positions.forEach((pos) => {
      if (
        pos === 'top' && !isVertical || pos === 'left' && isVertical
      ) {
        graphics.drawRect(
          xPos - outlineWidth,
          yPos - outlineHeight,
          width + (outlineWidth * 2),
          outlineHeight
        );
      } else if (
        pos === 'bottom' && !isVertical || pos === 'right' && isVertical
      ) {
        graphics.drawRect(
          xPos - outlineWidth,
          yPos + height,
          width + (outlineWidth * 2),
          outlineHeight
        );
      } else if (
        pos === 'left' && !isVertical || pos === 'top' && isVertical
      ) {
        graphics.drawRect(
          xPos - outlineWidth,
          yPos - outlineHeight,
          outlineWidth,
          height + (outlineHeight * 2)
        );
      } else if (
        pos === 'right' && !isVertical || pos === 'bottom' && isVertical
      ) {
        graphics.drawRect(
          xPos + width,
          yPos - outlineHeight,
          outlineWidth,
          height + (outlineHeight * 2)
        );
      }
    });
  } else {
    graphics.lineStyle(outline.width, outline.color, outline.opacity);
    graphics.beginFill(0x000000, 0);
    graphics.drawRect(
      xPos - outlineWidth,
      yPos - outlineHeight,
      width + (outlineWidth * 2),
      height + (outlineHeight * 2)
    );
  }

  if (stroke.positions && stroke.positions.length) {
    graphics.lineStyle(1, 0x000000, 0);
    graphics.beginFill(stroke.color, stroke.opacity);

    // The size of the stroke is one dimensional so width when the stroke
    // is veritcal is the same as the height when the stroke is horizontal.
    // The stroke definition is aligned to SVG's strokeWidth.
    const strokeWidth = stroke.width * 2 > width
      ? width / 2 : stroke.width;
    const strokeHeight = stroke.width * 2 > height
      ? height / 2 : stroke.width;

    stroke.positions.forEach((pos) => {
      if (
        pos === 'top' && !isVertical || pos === 'left' && isVertical
      ) {
        graphics.drawRect(xPos, yPos, width, strokeHeight);
        finalYPos += strokeHeight;
        finalHeight -= strokeHeight;
      } else if (
        pos === 'bottom' && !isVertical || pos === 'right' && isVertical
      ) {
        graphics.drawRect(
          xPos, yPos + height - strokeHeight, width, strokeHeight
        );
        finalHeight -= strokeHeight;
      } else if (
        pos === 'left' && !isVertical || pos === 'top' && isVertical
      ) {
        graphics.drawRect(xPos, yPos, strokeWidth, height);
        finalXPos += strokeWidth;
        finalWidth -= strokeWidth;
      } else if (
        pos === 'right' && !isVertical || pos === 'bottom' && isVertical
      ) {
        graphics.drawRect(
          xPos + width - strokeWidth, yPos, strokeWidth, height
        );
        finalWidth -= strokeWidth;
      }
    });
  } else {
    graphics.lineStyle(stroke.width, stroke.color, stroke.opacity);
  }

  graphics.beginFill(fill.color, fill.opacity);
  graphics.drawRect(finalXPos, finalYPos, finalWidth, finalHeight);
};

class OverlayTrack extends PixiTrack {
  constructor(context, options) {
    super(context, options);

    this.options = options || {};
    this.drawnRects = {};
  }

  drawHorizontalOverlay(
    graphics, position, extent, minWidth = 0, fill, stroke, outline
  ) {
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

    drawRectWithPositionedBorder(
      graphics, xPos, yPos, width, height, fill, stroke, outline
    );
  }

  drawVerticalOverlay(
    graphics, position, extent, minHeight = 0, fill, stroke, outline
  ) {
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

    drawRectWithPositionedBorder(
      graphics, xPos, yPos, width, height, fill, stroke, outline, true
    );
  }

  draw() {
    super.draw();

    const graphics = this.pMain;
    const fill = {
      color: colorToHex(this.options.fill || this.options.fillColor || 'blue'),
      opacity: Number.isNaN(+this.options.fillOpacity)
        ? 0.3
        : +this.options.fillOpacity
    };
    const stroke = {
      color: colorToHex(this.options.stroke || 'blue'),
      opacity: +this.options.strokeOpacity || 1,
      width: +this.options.strokeWidth || 0,
      positions: !this.options.strokePos || Array.isArray(this.options.strokePos)
        ? this.options.strokePos
        : [this.options.strokePos]
    };
    const outline = {
      color: colorToHex(this.options.outline || 'white'),
      opacity: +this.options.outlineOpacity || 1,
      width: +this.options.outlineWidth || 0,
      positions: !this.options.outlinePos || Array.isArray(this.options.outlinePos)
        ? this.options.outlinePos
        : [this.options.outlinePos]
    };

    graphics.clear();
    graphics.lineStyle(stroke.width, stroke, +!stroke.positions * stroke.opacity);
    graphics.beginFill(fill.color, fill.opacity);

    const minWidth = Math.max(0, +this.options.minWidth || 0);
    const minHeight = Math.max(0, +this.options.minHeight || 0);

    if (Array.isArray(this.options.extent)) {
      this.options.orientationsAndPositions.forEach((op) => {
        if (op.orientation === '1d-horizontal' || op.orientation === '2d') {
          this.options.extent.forEach(extent => this.drawHorizontalOverlay(
            graphics, op.position, extent, minWidth, fill, stroke, outline
          ));
        }

        if (op.orientation === '1d-vertical' || op.orientation === '2d') {
          this.options.extent.forEach(extent => this.drawVerticalOverlay(
            graphics, op.position, extent, minHeight, fill, stroke, outline
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
