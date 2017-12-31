import PixiTrack from './PixiTrack.js';

export class UnknownPixiTrack extends PixiTrack {
  constructor(stage, def) {
    super(stage, def);
    // so that the tests checking for retrieved tilesetInfo pass
    this.tilesetInfo = {};
  }
}

export default UnknownPixiTrack;
