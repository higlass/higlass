import { tileResponseToData } from '../services';

/** @typedef {import('../types').TilesetInfo} TilesetInfo */
/**
 * @template T, B
 * @typedef {import('../types').AbstractDataFetcher<T, B>} AbstractDataFetcher
 */

// TODO: Add type for LocalTile
/** @typedef {{}} LocalTile */

/**
 * @typedef LocalTileDataConfig
 * @property {Record<string, LocalTile>} tiles
 * @property {Record<string, TilesetInfo>} tilesetInfo
 */

/** @implements {AbstractDataFetcher<LocalTile, LocalTileDataConfig>} */
class LocalTileDataFetcher {
  /** @param {LocalTileDataConfig} dataConfig */
  constructor(dataConfig) {
    /** @type {LocalTileDataConfig} */
    this.dataConfig = dataConfig;
    /** @type {TilesetInfo} */
    this.tilesetInfoData = Object.values(this.dataConfig.tilesetInfo)[0];
    /** @type {Record<string, LocalTile>} */
    this.tilesData = {};
    /** @type {boolean} */
    this.tilesetInfoLoading = true;
  }

  /** @param {import('../types').HandleTilesetInfoFinished} callback */
  async tilesetInfo(callback) {
    this.tilesetInfoLoading = false;
    callback(this.tilesetInfoData);
    return this.tilesetInfoData;
  }

  /** We expect there to be a tilesetUid in the provided tilesetInfo
   * and tiles data since tileResponseToData needs it
   *
   * It is also easier for users to paste in request responses for debugging.
   *
   * @param {(tiles: Record<string, LocalTile>) => void} receivedTiles
   * @param {string[]} tileIds
   */
  async fetchTilesDebounced(receivedTiles, tileIds) {
    this.tilesData = {};

    for (const key of Object.keys(this.dataConfig.tiles)) {
      const keyParts = key.split('.');
      const newKey = `localtile.${keyParts.slice(1).join('.')}`;
      this.tilesData[newKey] = this.dataConfig.tiles[key];
    }

    /** @type {Record<string, LocalTile>} */
    const ret = {};

    const newTileIds = tileIds.map((x) => `localtile.${x}`);
    tileResponseToData(this.tilesData, '', newTileIds);

    for (const tileId of tileIds) {
      ret[tileId] = this.tilesData[`localtile.${tileId}`];
    }
    receivedTiles(ret);
    return ret;
  }

  /**
   * @param {number} z
   * @param {number} x
   * @returns {void}
   */
  tile(z, x) {}
}

export default LocalTileDataFetcher;
