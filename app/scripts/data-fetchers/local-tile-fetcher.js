class LocalTileDataFetcher {
  constructor(dataConfig) {
    this.dataConfig = dataConfig;

    this.removeTilesetUids();
  }

  /** We expect there to be a tilesetUid in the provided tilesetInfo
   * and tiles data. We need to strip it out because it's irrelevant.
   *
   * The reason we expect it to be included is to make it easier for users
   * to paste in request responses for debugging.
   */
  removeTilesetUids() {
    this.tilesetInfoData = Object.values(this.dataConfig.tilesetInfo)[0];
    this.tilesData = {};

    for (const key of Object.keys(this.dataConfig.tiles)) {
      const keyParts = key.split('.');
      const newKey = keyParts.slice(1).join('.');

      this.tilesData[newKey] = this.dataConfig.tiles[key];
    }
  }

  tilesetInfo(callback) {
    this.tilesetInfoLoading = false;

    callback(this.tilesetInfoData);
  }

  fetchTilesDebounced(receivedTiles, tileIds) {
    const ret = {};

    for (const tileId of tileIds) {
      ret[tileId] = this.tilesData[tileId];
    }

    receivedTiles(ret);
  }

  tile(z, x) {}
}

export default LocalTileDataFetcher;
