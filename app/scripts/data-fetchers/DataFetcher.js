import slugid from 'slugid';
import { scaleLinear } from 'd3-scale';
import {
  trimTrailingSlash as tts,
  dictValues,
  minNonZero,
  maxNonZero,
  DenseDataExtrema1D,
  DenseDataExtrema2D,
} from '../utils';

// Services
import { tileProxy } from '../services';

/** @typedef {import('../types').DataConfig} DataConfig */
/** @typedef {import('../types').TilesetInfo} TilesetInfo */
/**
 * @template T, B
 * @typedef {import('../types').AbstractDataFetcher<T, B>} AbstractDataFetcher
 */

/**
 * @typedef Tile
 * @property {number} min_value
 * @property {number} max_value
 * @property {DenseDataExtrema1D | DenseDataExtrema2D} denseDataExtrema
 * @property {number} minNonZero
 * @property {number} maxNonZero
 * @property {Array<number> | Float32Array} dense
 * @property {string} dtype
 * @property {string} server
 * @property {number[]} tilePos
 * @property {string} tilePositionId
 * @property {string} tilesetUid
 * @property {number} zoomLevel
 */

/** @typedef {Pick<Tile, 'zoomLevel' | 'tilePos' | 'tilePositionId'>} DividedTileA */
/** @typedef {Pick<Tile, 'zoomLevel' | 'tilePos' | 'tilePositionId' | 'dense' | 'denseDataExtrema' | 'minNonZero' | 'maxNonZero'>} DividedTileB */
/** @typedef {DividedTileA | DividedTileB} DividedTile */
/** @typedef {Omit<DataConfig, 'children'> & { children?: DataFetcher[], tilesetUid?: string, tilesetInfo: TilesetInfo }} ResolvedDataConfig */

/**
 * @template T
 * @param {Array<T>} x
 * @returns {x is [T, T]}
 */
function isTuple(x) {
  return x.length === 2;
}

/** @implements {AbstractDataFetcher<Tile | DividedTile, ResolvedDataConfig>} */
export default class DataFetcher {
  /**
   * @param {import('../types').DataConfig} dataConfig
   * @param {import('pub-sub-es').PubSub} pubSub
   */
  constructor(dataConfig, pubSub) {
    /** @type {boolean} */
    this.tilesetInfoLoading = true;

    if (!dataConfig) {
      // Trevor: This should probably throw?
      console.error('No dataconfig provided');
      return;
    }

    // copy the dataConfig so that it doesn't dirty so that
    // it doesn't get modified when we make objects of its
    // children below
    /** @type {ResolvedDataConfig} */
    this.dataConfig = JSON.parse(JSON.stringify(dataConfig));
    /** @type {string} */
    this.uuid = slugid.nice();
    /** @type {import('pub-sub-es').PubSub} */
    this.pubSub = pubSub;

    if (dataConfig.children) {
      // convert each child into an object
      this.dataConfig.children = dataConfig.children.map(
        (c) => new DataFetcher(c, pubSub),
      );
    }
  }

  /**
   * We don't a have a tilesetUid for this track. But we do have a url, filetype
   * and server. Using these, we can use the server to fullfill tile requests
   * from this dataset.
   *
   * @param {object} opts
   * @param {string} opts.server - The server api location (e.g. 'localhost:8000/api/v1')
   * @param {string} opts.url - The location of the data file (e.g. 'encode.org/my.file.bigwig')
   * @param {string} opts.filetype - The type of file being served (e.g. 'bigwig')
   * @param {string=} opts.coordSystem - The coordinate system being served (e.g. 'hg38')
   */
  async registerFileUrl({ server, url, filetype, coordSystem }) {
    const serverUrl = `${tts(server)}/register_url/`;

    const payload = {
      fileurl: url,
      filetype,
      coordSystem,
    };

    return fetch(serverUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  }

  /**
   * Obtain tileset infos for all of the tilesets listed
   * @param {import('../types').HandleTilesetInfoFinished} finished - A callback that will be called
   */
  tilesetInfo(finished) {
    // if this track has a url, server and filetype
    // then we need to register those with the server
    const { server, url, filetype, coordSystem } = this.dataConfig;
    if (server && url && filetype) {
      return this.registerFileUrl({ server, url, filetype, coordSystem })
        .then((data) => data.json())
        .then((data) => {
          this.dataConfig.tilesetUid = data.uid;
          this.tilesetInfoAfterRegister(finished);
        })
        .catch((rejected) => {
          console.error('Error registering url', rejected);
        });
    }

    return new Promise(() => {
      this.tilesetInfoAfterRegister(finished);
    });
  }

  /**
   * Obtain tileset infos for all of the tilesets listed
   *
   * If there is more than one tileset info, this function
   * should (not currently implemented) check if the tileset
   * infos have the same dimensions and then return a common
   * one.
   *
   * @param {import('../types').HandleTilesetInfoFinished} finished - A callback that will be called
   *  when all tileset infos are loaded
   */
  tilesetInfoAfterRegister(finished) {
    if (!this.dataConfig.children) {
      // this data source has no children so we
      // just need to retrieve one tileset info
      const { server, tilesetUid } = this.dataConfig;
      if (!server || !tilesetUid) {
        console.warn(
          'No dataConfig children, server or tilesetUid:',
          this.dataConfig,
        );
        finished(null);
      } else {
        // pass in the callback
        tileProxy.trackInfo(
          server,
          tilesetUid,
          (/** @type {Record<string, TilesetInfo>} */ tilesetInfo) => {
            // tileset infos are indxed by by tilesetUids, we can just resolve
            // that here before passing it back to the track
            this.dataConfig.tilesetInfo = tilesetInfo[tilesetUid];
            finished(tilesetInfo[tilesetUid], tilesetUid);
          },
          (/** @type {string} */ error) => {
            this.tilesetInfoLoading = false;
            finished({ error });
          },
          this.pubSub,
        );
      }
    } else {
      // this data source has children, so we need to wait to get
      // all of their tileset infos in order to return them to the track
      const promises = this.dataConfig.children.map(
        (x) =>
          /** @type {Promise<TilesetInfo>} */
          new Promise((resolve) => {
            x.tilesetInfo(resolve);
          }),
      );

      Promise.all(promises).then((values) => {
        // this is where we should check if all the children's tileset
        // infos match
        finished(values[0]);
      });
    }
  }

  /**
   * @param {string} tilesetUid - Uid of the tileset on the server
   * @param {string} tileId - The tileId of the tile
   * @returns {string} The full tile id that the server will parse.
   *
   * @example
   * ```javascript
   * // returns 'xyxx.0.0.0'
   * fullTileId('xyxx', '0.0.0');
   * ```
   */
  fullTileId(tilesetUid, tileId) {
    return `${tilesetUid}.${tileId}`;
  }

  /**
   * Fetch a set of tiles.
   *
   * Because the track shouldn't care about tileset ids, the tile ids
   * should just include positions and any necessary transforms.
   *
   * @param {(tiles: Record<string, DividedTile | Tile>) => void} receivedTiles - A function to call once the tiles have been fetched
   * @param {string[]} tileIds - The tile ids to fetch
   * @returns {Promise<Record<string, DividedTile | Tile>>}
   */
  fetchTilesDebounced(receivedTiles, tileIds) {
    if (this.dataConfig.type === 'horizontal-section') {
      return this.fetchHorizontalSection(receivedTiles, tileIds);
    }
    if (this.dataConfig.type === 'vertical-section') {
      return this.fetchHorizontalSection(receivedTiles, tileIds, true);
    }

    if (!this.dataConfig.children && this.dataConfig.tilesetUid) {
      // no children, just return the fetched tiles as is
      /** @type {Promise<Record<string, Tile>>} */
      const promise = new Promise((resolve) => {
        tileProxy.fetchTilesDebounced(
          {
            id: slugid.nice(),
            server: this.dataConfig.server,
            done: resolve,
            ids: tileIds.map((x) => `${this.dataConfig.tilesetUid}.${x}`),
            options: this.dataConfig.options,
          },
          this.pubSub,
          true,
        );
      });

      return promise.then((returnedTiles) => {
        const tilesetUid = dictValues(returnedTiles)[0].tilesetUid;
        /** @type {Record<string, Tile>} */
        const newTiles = {};

        for (let i = 0; i < tileIds.length; i++) {
          const fullTileId = this.fullTileId(tilesetUid, tileIds[i]);

          returnedTiles[fullTileId].tilePositionId = tileIds[i];
          newTiles[tileIds[i]] = returnedTiles[fullTileId];
        }
        receivedTiles(newTiles);
        return newTiles;
      });
    }

    // multiple child tracks, need to wait for all of them to
    // fetch their data before returning to the parent
    /** @type {Promise<Record<string, DividedTile | Tile>>[]} Tiles */
    const promises =
      this.dataConfig.children?.map(
        (x) =>
          /** @type {Promise<Record<string, Tile | DividedTile>>} */
          new Promise((resolve) => {
            x.fetchTilesDebounced(resolve, tileIds);
          }),
      ) ?? [];

    return Promise.all(promises).then((returnedTiles) => {
      // if we're trying to divide two datasets,
      if (this.dataConfig.type === 'divided' && isTuple(returnedTiles)) {
        const newTiles = this.makeDivided(returnedTiles, tileIds);
        receivedTiles(newTiles);
        return newTiles;
      }
      // assume we're just returning raw tiles
      console.warn(
        'Unimplemented dataConfig type. Returning first data source.',
        this.dataConfig,
      );
      receivedTiles(returnedTiles[0]);
      return returnedTiles[0];
    });
  }

  /**
   * Return an array consisting of the division of the numerator
   * array by the denominator array
   *
   * @param {ArrayLike<number>} numeratorData - An array of numerical values
   * @param {ArrayLike<number>} denominatorData - An array of numerical values
   *
   * @returns {Float32Array} An array consisting of the division of the numerator by the denominator
   */
  divideData(numeratorData, denominatorData) {
    const result = new Float32Array(numeratorData.length);

    for (let i = 0; i < result.length; i++) {
      if (denominatorData[i] === 0.0) result[i] = NaN;
      else result[i] = numeratorData[i] / denominatorData[i];
    }

    return result;
  }

  /*
   * Take a horizontal slice across the returned tiles at the
   * given position.
   *
   * @param {list} returnedTiles: The tiles returned from a fetch request
   * @param {Number} sliceYPos: The y position across which to slice
   */
  horizontalSlice(/* returnedTiles, sliceYPos */) {
    return null;
  }

  /**
   * Extract a slice from a matrix at a given position.
   *
   * @param {Array<number>} inputData - An array containing a matrix stored row-wise
   * @param {Array<number>} arrayShape - The shape of the array, should be a
   *  two element array e.g. [256,256].
   * @param {number} sliceIndex - The index across which to take the slice
   * @param {number=} axis - The axis along which to take the slice
   * @returns {Array<number>} an array corresponding to a slice of this matrix
   */
  extractDataSlice(inputData, arrayShape, sliceIndex, axis) {
    if (!axis) {
      return inputData.slice(
        arrayShape[1] * sliceIndex,
        arrayShape[1] * (sliceIndex + 1),
      );
    }

    const returnArray = new Array(arrayShape[1]);
    for (let i = sliceIndex; i < inputData.length; i += arrayShape[0]) {
      returnArray[Math.floor(i / arrayShape[0])] = inputData[i];
    }
    return returnArray;
  }

  /**
   * Fetch a horizontal section of a 2D dataset
   * @param {(tiles: Record<string, Tile>) => void} receivedTiles - A function to call once the tiles have been fetched
   * @param {string[]} tileIds - The tile ids to fetch
   * @param {boolean=} vertical - Whether to fetch a vertical section
   * @returns {Promise<Record<string, Tile>>}
   */
  fetchHorizontalSection(receivedTiles, tileIds, vertical = false) {
    // We want to take a horizontal section of a 2D dataset
    // that means that a 1D track is requesting data from a 2D source
    // because the 1D track only requests 1D tiles, we need to calculate
    // the 2D tile from which to take the slice
    /** @type {string[]} */
    const newTileIds = [];
    /** @type {boolean[]} */
    const mirrored = [];

    const { slicePos, tilesetInfo } = this.dataConfig;
    if (!slicePos || !tilesetInfo) {
      throw new Error('No slice position or tileset info');
    }

    for (const tileId of tileIds) {
      const parts = tileId.split('.');
      const zoomLevel = +parts[0];
      const xTilePos = +parts[1];

      // this is a dummy scale that we'll use to fetch tile positions
      // along the y-axis of the 2D dataset (we already have the x positions
      // from the track that is querying this data)
      const scale = scaleLinear().domain([slicePos, slicePos]);

      // there's two different ways of calculating tile positions
      // this needs to be consolidated into one function eventually
      let yTiles = [];

      if ('resolutions' in tilesetInfo) {
        const sortedResolutions = tilesetInfo.resolutions
          .map((x) => +x)
          .sort((a, b) => b - a);

        yTiles = tileProxy.calculateTilesFromResolution(
          sortedResolutions[zoomLevel],
          scale,
          tilesetInfo.min_pos[vertical ? 1 : 0],
          tilesetInfo.max_pos[vertical ? 1 : 0],
        );
      } else {
        yTiles = tileProxy.calculateTiles(
          zoomLevel,
          scale,
          tilesetInfo.min_pos[vertical ? 1 : 0],
          tilesetInfo.max_pos[vertical ? 1 : 0],
          tilesetInfo.max_zoom,
          tilesetInfo.max_width,
        );
      }
      const sortedPosition = [xTilePos, yTiles[0]].sort((a, b) => a - b);

      // make note of whether we reversed the x and y tile positions
      if (sortedPosition[0] === xTilePos) {
        mirrored.push(false);
      } else {
        mirrored.push(true);
      }

      const newTileId = `${zoomLevel}.${sortedPosition[0]}.${sortedPosition[1]}`;
      newTileIds.push(newTileId);
      // we may need to add something about the data transform
    }

    // actually fetch the new tileIds
    const promise = new Promise((resolve) => {
      tileProxy.fetchTilesDebounced(
        {
          id: slugid.nice(),
          server: this.dataConfig.server,
          done: resolve,
          ids: newTileIds.map((x) => `${this.dataConfig.tilesetUid}.${x}`),
        },
        this.pubSub,
        true,
      );
    });
    return promise.then((returnedTiles) => {
      // we've received some new tiles, but they're 2D
      // we need to extract the row corresponding to the data we need

      const tilesetUid = dictValues(returnedTiles)[0].tilesetUid;
      // console.log('tilesetUid:', tilesetUid);
      /** @type {Record<string, Tile>} */
      const newTiles = {};

      for (let i = 0; i < newTileIds.length; i++) {
        const parts = newTileIds[i].split('.');
        const zoomLevel = +parts[0];
        const xTilePos = +parts[1];
        const yTilePos = +parts[2];

        const sliceIndex = tileProxy.calculateTileAndPosInTile(
          tilesetInfo,
          // @ts-expect-error - This is undefined for legacy tilesets, but
          // `calculateTileAndPosInTile` ignores this argument with `resolutions`.
          // We should probably refactor `calculateTileAndPosInTile` to just take
          // the `tilesetInfo` object.
          tilesetInfo.max_width,
          tilesetInfo.min_pos[1],
          zoomLevel,
          +slicePos,
        )[1];

        const fullTileId = this.fullTileId(tilesetUid, newTileIds[i]);
        const tile = returnedTiles[fullTileId];

        let dataSlice = null;

        if (xTilePos === yTilePos) {
          // this is tile along the diagonal that we have to mirror
          dataSlice = this.extractDataSlice(tile.dense, [256, 256], sliceIndex);
          const mirroredDataSlice = this.extractDataSlice(
            tile.dense,
            [256, 256],
            sliceIndex,
            1,
          );
          for (let j = 0; j < dataSlice.length; j++) {
            dataSlice[j] += mirroredDataSlice[j];
          }
        } else if (mirrored[i]) {
          // this tile is in the upper right triangle but the data is only available for
          // the lower left so we have to mirror it
          dataSlice = this.extractDataSlice(
            tile.dense,
            [256, 256],
            sliceIndex,
            1,
          );
        } else {
          dataSlice = this.extractDataSlice(tile.dense, [256, 256], sliceIndex);
        }

        const newTile = {
          min_value: Math.min.apply(null, dataSlice),
          max_value: Math.max.apply(null, dataSlice),
          denseDataExtrema: new DenseDataExtrema1D(dataSlice),
          minNonZero: minNonZero(dataSlice),
          maxNonZero: maxNonZero(dataSlice),
          dense: dataSlice,
          dtype: tile.dtype,
          server: tile.server,
          tilePos: mirrored[i] ? [yTilePos] : [xTilePos],
          tilePositionId: tileIds[i],
          tilesetUid,
          zoomLevel: tile.zoomLevel,
        };

        newTiles[tileIds[i]] = newTile;
      }

      receivedTiles(newTiles);
      return newTiles;
    });
  }

  /**
   * @typedef {{ zoomLevel: number, tilePos: number[], dense?: ArrayLike<number> }} Dividable
   * @param {[Record<string, Dividable>, Record<string, Dividable>]} returnedTiles
   * @param {string[]} tileIds
   * @returns {Record<string, DividedTile>}
   */
  makeDivided(returnedTiles, tileIds) {
    if (returnedTiles.length < 2) {
      console.warn(
        'Only one tileset specified for a divided datafetcher:',
        this.dataConfig,
      );
    }

    /** @type {Record<string, DividedTile>} */
    const newTiles = {};

    for (let i = 0; i < tileIds.length; i++) {
      // const numeratorUid = this.fullTileId(numeratorTilesetUid, tileIds[i]);
      // const denominatorUid = this.fullTileId(denominatorTilesetUid, tileIds[i]);
      const zoomLevel = returnedTiles[0][tileIds[i]].zoomLevel;
      const tilePos = returnedTiles[0][tileIds[i]].tilePos;

      /** @type {DividedTile} */
      let newTile = {
        zoomLevel,
        tilePos,
        tilePositionId: tileIds[i],
      };

      const denseA = returnedTiles[0][tileIds[i]].dense;
      const denseB = returnedTiles[1][tileIds[i]].dense;

      if (denseA && denseB) {
        const newData = this.divideData(denseA, denseB);
        const dde =
          tilePos.length === 2
            ? new DenseDataExtrema2D(newData)
            : new DenseDataExtrema1D(newData);

        newTile = {
          dense: newData,
          denseDataExtrema: dde,
          minNonZero: minNonZero(newData),
          maxNonZero: maxNonZero(newData),
          zoomLevel,
          tilePos,
          tilePositionId: tileIds[i],
        };
      }

      // returned ids will be indexed by the tile id and won't include the
      // tileset uid
      newTiles[tileIds[i]] = newTile;
    }

    return newTiles;
  }
}
