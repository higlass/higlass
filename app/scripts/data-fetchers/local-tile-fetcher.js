import { tileResponseToData } from '../worker';

class LocalTileDataFetcher {
  constructor(dataConfig) {
    this.dataConfig = dataConfig;

    this.tilesetInfoData = Object.values(this.dataConfig.tilesetInfo)[0];
  }

  tilesetInfo(callback) {
    this.tilesetInfoLoading = false;

    callback(this.tilesetInfoData);
  }

  /** We expect there to be a tilesetUid in the provided tilesetInfo
   * and tiles data since tileResponseToData needs it
   *
   * It is also easier for users to paste in request responses for debugging.
   */
  fetchTilesDebounced(receivedTiles, tileIds) {
    this.tilesData = {};

    for (const key of Object.keys(this.dataConfig.tiles)) {
      const keyParts = key.split('.');
      const newKey = `localtile.${keyParts.slice(1).join('.')}`;
      this.tilesData[newKey] = this.dataConfig.tiles[key];
    }

    const ret = {};

    const newTileIds = tileIds.map((x) => `localtile.${x}`);
    tileResponseToData(this.tilesData, '', newTileIds);

    for (const tileId of tileIds) {
      ret[tileId] = this.tilesData[`localtile.${tileId}`];
    }
    receivedTiles(ret);
  }

  tile(z, x) {}
}

export default LocalTileDataFetcher;
