import * as PIXI from 'pixi.js';

/**
 * Generate a PIXI line
 * @param   {number}  x1  Start X
 * @param   {number}  y1  Start Y
 * @param   {number}  x2  End X
 * @param   {number}  y2  End Y
 * @param   {number}  width  Line width
 * @param   {number}  color  HEX number, e.g., 0xFF0000 for red.
 * @param   {number}  opacity  Alpha value.
 * @return  {PIXI.Graphics}  PIXI line/
 */
const pixiLine = (x1, y1, x2, y2, width, color, opacity) => {
  const line = new PIXI.Graphics()
    .lineStyle(width || 1, color || 0x000000, opacity || 1);

  line.moveTo(x1, y1);
  line.lineTo(x2, y2);

  return line;
};

export default pixiLine;
