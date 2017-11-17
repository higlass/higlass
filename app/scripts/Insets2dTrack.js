import * as PIXI from 'pixi.js';
import { DropShadowFilter } from 'pixi-filters';

// Components
import { PixiTrack } from './PixiTrack';
import pixiLine from './utils/pixi-line';

class Insets2dTrack extends PixiTrack {
  constructor(
    scene,
    options,
  ) {
    super(scene, options);

    this.graphics = new PIXI.Graphics();
    this.pMain.addChild(this.graphics);
    this.options = options;
    this.lines = [];

    this.dropShadow = new DropShadowFilter(
      90,
      this.options.dropDistance,
      this.options.dropBlur,
      0x000000,
      this.options.dropOpacity,
    );

    this.graphics.alpha = this.options.opacity;
    this.graphics.filters = [this.dropShadow];
  }

  init() {
    this.graphics.clear();
    this.lines.map(
      (line) => { this.pMain.removeChild(line); return line.destroy(); }
    );
    this.lines = [];

    // Fill and line style need to be re-applied after `.clear()`
    this.graphics.lineStyle(
      this.options.strokeWidth, this.options.stroke, this.options.strokeOpacity
    );
    this.graphics.beginFill(this.options.fill, this.options.fillOpacity);
  }

  drawInset(x, y, w, h, sx, sy) {
    this.drawBorder(x, y, w, h, sx, sy);
    this.drawLeaderLine(x, y, sx, sy);
  }

  drawLeaderLine(x1, y1, x2, y2) {
    const line = pixiLine(
      this.position[0] + x1,
      this.position[1] + y1,
      this.position[0] + x2,
      this.position[1] + y2,
      this.options.leaderLineStrokeWidth,
      this.options.leaderLineStroke,
      this.options.leaderLineStrokeOpacity,
    );

    this.pMain.addChild(line);
    this.lines.push(line);
  }

  drawBorder(x, y, w, h) {
    this.graphics.drawRect(
      this.position[0] + x - w,
      this.position[1] + y,
      w,
      h
    );
  }
}

export default Insets2dTrack;
