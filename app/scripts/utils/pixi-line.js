import * as PIXI from 'pixi.js';

const pixiLine = (x1, y1, x2, y2, width, color, opacity) => {
  const line = new PIXI.Graphics()
    .lineStyle(width || 1, color || 0x000000, opacity || 1);

  line.moveTo(x1, y1);
  line.lineTo(x2, y2);

  return line;
};

export default pixiLine;
