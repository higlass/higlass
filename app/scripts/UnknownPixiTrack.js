import PixiTrack from './PixiTrack';

class UnknownPixiTrack extends PixiTrack {
  constructor(context, options) {
    super(context, options);
    // so that the tests checking for retrieved tilesetInfo pass
    this.tilesetInfo = {};

    this.errorTextText = `Unknown track type: ${options.type}`;
  }

  zoomed() {
    this.draw();
  }
}

export default UnknownPixiTrack;
