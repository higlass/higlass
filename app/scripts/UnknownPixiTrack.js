import PixiTrack from './PixiTrack';

class UnknownPixiTrack extends PixiTrack {
  constructor(stage, def) {
    super(stage, def);
    // so that the tests checking for retrieved tilesetInfo pass
    this.tilesetInfo = {};

    this.errorTextText = `Unknown track type: ${def.type}`;
  }

  zoomed() {
    this.draw();
  }
}

export default UnknownPixiTrack;
