import PixiTrack from './PixiTrack.js';

export class UnknownPixiTrack extends PixiTrack {
  constructor(stage, def, animate) {
    super(stage, def);
    // so that the tests checking for retrieved tilesetInfo pass
    this.tilesetInfo = {};

    this.errorTextText = `Unknown track type: ${def.type}`;
  }

  zoomed(newXScale, newYScale) {
    this.draw();
  }
}

export default UnknownPixiTrack;
