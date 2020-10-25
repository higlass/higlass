import PixiTrack from './PixiTrack';

// Utils
import { colorToHex, decToHexStr } from './utils';

const drawRectOnGraphics = (x, y, width, height, graphics) => {
  graphics.drawRect(x, y, width, height);
};

const drawRectOnSvg = (
  x,
  y,
  width,
  height,
  svg,
  {
    fill = 0x000000,
    fillOpacity = 0,
    stroke = 0x000000,
    strokeWidth = 0,
    strokeOpacity = 0,
  } = {},
) => {
  const r = document.createElement('rect');

  r.setAttribute('x', x);
  r.setAttribute('y', y);
  r.setAttribute('width', width);
  r.setAttribute('height', height);

  r.setAttribute('fill', `#${decToHexStr(fill)}`);
  r.setAttribute('fill-opacity', fillOpacity);
  r.setAttribute('stroke', `#${decToHexStr(stroke)}`);
  r.setAttribute('stroke-opacity', strokeOpacity);
  r.setAttribute('stroke-width', strokeWidth);

  svg.appendChild(r);
};

const drawRect = (x, y, width, height, target, options) => {
  if (target instanceof HTMLElement)
    drawRectOnSvg(x, y, width, height, target, options);
  else drawRectOnGraphics(x, y, width, height, target);
};

const drawRectWithPositionedBorder = (
  graphics,
  xPos,
  yPos,
  width,
  height,
  fill,
  stroke,
  outline,
  { isVertical = false, svg = null } = {},
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
  const outlineWidth = outline.width * 2 > width ? width / 2 : outline.width;
  const outlineHeight = outline.width * 2 > height ? height / 2 : outline.width;

  const target = svg || graphics;
  const colors = {
    fill: 0x000000,
    fillOpacity: 0,
    stroke: 0x000000,
    strokeOpacity: 0,
    strokeWidth: 1,
  };

  if (outline.positions && outline.positions.length) {
    graphics.lineStyle(1, 0x000000, 0);
    graphics.beginFill(outline.color, outline.opacity);

    colors.fill = outline.color;
    colors.fillOpacity = outline.opacity;
    colors.stroke = 0x000000;
    colors.strokeOpacity = 0;
    colors.strokeWidth = 1;

    outline.positions.forEach((pos) => {
      if ((pos === 'top' && !isVertical) || (pos === 'left' && isVertical)) {
        drawRect(
          xPos - outlineWidth,
          yPos - outlineHeight,
          width + outlineWidth * 2,
          outlineHeight,
          target,
          colors,
        );
      } else if (
        (pos === 'bottom' && !isVertical) ||
        (pos === 'right' && isVertical)
      ) {
        drawRect(
          xPos - outlineWidth,
          yPos + height,
          width + outlineWidth * 2,
          outlineHeight,
          target,
          colors,
        );
      } else if (
        (pos === 'left' && !isVertical) ||
        (pos === 'top' && isVertical)
      ) {
        drawRect(
          xPos - outlineWidth,
          yPos - outlineHeight,
          outlineWidth,
          height + outlineHeight * 2,
          target,
          colors,
        );
      } else if (
        (pos === 'right' && !isVertical) ||
        (pos === 'bottom' && isVertical)
      ) {
        drawRect(
          xPos + width,
          yPos - outlineHeight,
          outlineWidth,
          height + outlineHeight * 2,
          target,
          colors,
        );
      }
    });
  } else if (outline.width > 0 && outline.opacity > 0) {
    graphics.lineStyle(outline.width, outline.color, outline.opacity);
    graphics.beginFill(0x000000, 0);
    colors.fill = 0x000000;
    colors.fillOpacity = 0;
    colors.stroke = outline.color;
    colors.strokeOpacity = outline.opacity;
    colors.strokeWidth = outline.width;
    drawRect(
      xPos - outlineWidth,
      yPos - outlineHeight,
      width + outlineWidth * 2,
      height + outlineHeight * 2,
      target,
      colors,
    );
  }

  if (stroke.positions && stroke.positions.length) {
    graphics.lineStyle(1, 0x000000, 0);
    graphics.beginFill(stroke.color, stroke.opacity);

    // The size of the stroke is one dimensional so width when the stroke
    // is veritcal is the same as the height when the stroke is horizontal.
    // The stroke definition is aligned to SVG's strokeWidth.
    const strokeWidth = stroke.width * 2 > width ? width / 2 : stroke.width;
    const strokeHeight = stroke.width * 2 > height ? height / 2 : stroke.width;

    colors.fill = stroke.color;
    colors.fillOpacity = stroke.opacity;
    colors.stroke = 0x000000;
    colors.strokeOpacity = 0;
    colors.strokeWidth = 1;

    stroke.positions.forEach((pos) => {
      if ((pos === 'top' && !isVertical) || (pos === 'left' && isVertical)) {
        drawRect(xPos, yPos, width, strokeHeight, target, colors);
        finalYPos += strokeHeight;
        finalHeight -= strokeHeight;
      } else if (
        (pos === 'bottom' && !isVertical) ||
        (pos === 'right' && isVertical)
      ) {
        drawRect(
          xPos,
          yPos + height - strokeHeight,
          width,
          strokeHeight,
          target,
          colors,
        );
        finalHeight -= strokeHeight;
      } else if (
        (pos === 'left' && !isVertical) ||
        (pos === 'top' && isVertical)
      ) {
        drawRect(xPos, yPos, strokeWidth, height, target, colors);
        finalXPos += strokeWidth;
        finalWidth -= strokeWidth;
      } else if (
        (pos === 'right' && !isVertical) ||
        (pos === 'bottom' && isVertical)
      ) {
        drawRect(
          xPos + width - strokeWidth,
          yPos,
          strokeWidth,
          height,
          target,
          colors,
        );
        finalWidth -= strokeWidth;
      }
    });
  } else {
    graphics.lineStyle(stroke.width, stroke.color, stroke.opacity);
    colors.stroke = stroke.color;
    colors.strokeOpacity = stroke.opacity;
    colors.strokeWidth = stroke.width;
  }

  graphics.beginFill(fill.color, fill.opacity);
  colors.fill = fill.color;
  colors.fillOpacity = fill.opacity;
  drawRect(finalXPos, finalYPos, finalWidth, finalHeight, target, colors);
};

class OverlayTrack extends PixiTrack {
  constructor(context, options) {
    super(context, options);

    this.options = options || {};
    this.drawnRects = {};
  }

  drawHorizontalOverlay(
    graphics,
    position,
    extent,
    minWidth = 0,
    fill,
    stroke,
    outline,
    options,
  ) {
    if (!extent || extent.length < 2) return;

    let xPos = this.position[0] + position.left + this._xScale(extent[0]);

    const yPos = this.position[1] + position.top;
    const height = position.height;
    let width = this._xScale(extent[1]) - this._xScale(extent[0]);

    if (width < minWidth) {
      // To center the overlay
      xPos -= (minWidth - width) / 2;
      width = minWidth;
    }

    drawRectWithPositionedBorder(
      graphics,
      xPos,
      yPos,
      width,
      height,
      fill,
      stroke,
      outline,
      options,
    );
  }

  drawVerticalOverlay(
    graphics,
    position,
    extent,
    minHeight = 0,
    fill,
    stroke,
    outline,
    options = {},
  ) {
    if (!extent || extent.length < 2) return;

    const xPos = this.position[0] + position.left;
    let yPos =
      this.position[1] +
      position.top +
      this._yScale(extent.length >= 4 ? extent[2] : extent[0]);

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
    let height =
      this._yScale(extent.length >= 4 ? extent[3] : extent[1]) -
      yPos +
      position.top +
      this.position[1];

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

    options.isVertical = true;

    drawRectWithPositionedBorder(
      graphics,
      xPos,
      yPos,
      width,
      height,
      fill,
      stroke,
      outline,
      options,
    );
  }

  draw(options) {
    super.draw();

    const graphics = this.pMain;
    const fill = {
      color: colorToHex(this.options.fill || this.options.fillColor || 'blue'),
      opacity: Number.isNaN(+this.options.fillOpacity)
        ? 0.3
        : +this.options.fillOpacity,
    };
    const stroke = {
      color: colorToHex(this.options.stroke || 'blue'),
      opacity: +this.options.strokeOpacity || 1,
      width: +this.options.strokeWidth || 0,
      positions:
        !this.options.strokePos || Array.isArray(this.options.strokePos)
          ? this.options.strokePos
          : [this.options.strokePos],
    };
    const outline = {
      color: colorToHex(this.options.outline || 'white'),
      opacity: +this.options.outlineOpacity || 1,
      width: +this.options.outlineWidth || 0,
      positions:
        !this.options.outlinePos || Array.isArray(this.options.outlinePos)
          ? this.options.outlinePos
          : [this.options.outlinePos],
    };

    if (!options || !options.svg) graphics.clear();
    graphics.lineStyle(
      stroke.width,
      stroke,
      +!stroke.positions * stroke.opacity,
    );
    graphics.beginFill(fill.color, fill.opacity);

    const minWidth = Math.max(0, +this.options.minWidth || 0);
    const minHeight = Math.max(0, +this.options.minHeight || 0);

    if (Array.isArray(this.options.extent)) {
      this.options.orientationsAndPositions.forEach((op) => {
        if (op.orientation === '1d-horizontal' || op.orientation === '2d') {
          this.options.extent.forEach((extent) =>
            this.drawHorizontalOverlay(
              graphics,
              op.position,
              extent,
              minWidth,
              fill,
              stroke,
              outline,
              options,
            ),
          );
        }

        if (op.orientation === '1d-vertical' || op.orientation === '2d') {
          this.options.extent.forEach((extent) =>
            this.drawVerticalOverlay(
              graphics,
              op.position,
              extent,
              minHeight,
              fill,
              stroke,
              outline,
              options,
            ),
          );
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
    let track = null;
    let base = null;

    if (super.exportSVG) {
      [base, track] = super.exportSVG();
    } else {
      base = document.createElement('g');
      track = base;
    }

    const output = document.createElement('g');
    track.appendChild(output);

    this.draw({ svg: output });

    return [base, track];
  }
}

export default OverlayTrack;
