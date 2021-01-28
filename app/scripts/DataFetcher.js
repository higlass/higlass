import slugid from 'slugid';
import { scaleLinear } from 'd3-scale';
import {
  trimTrailingSlash as tts,
  dictValues,
  minNonZero,
  maxNonZero,
} from './utils';

import DenseDataExtrema1D from './utils/DenseDataExtrema1D';
import DenseDataExtrema2D from './utils/DenseDataExtrema2D';

// Services
import { tileProxy } from './services';

export default class DataFetcher {
  constructor(dataConfig, pubSub) {
    this.tilesetInfoLoading = true;

    if (!dataConfig) {
      console.error('No dataconfig provided');
      return;
    }

    // copy the dataConfig so that it doesn't dirty so that
    // it doesn't get modified when we make objects of its
    // children below
    this.dataConfig = JSON.parse(JSON.stringify(dataConfig));
    this.uuid = slugid.nice();
    this.pubSub = pubSub;

    if (this.dataConfig.children) {
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
   * @param {string} server The server api location (e.g. 'localhost:8000/api/v1')
   * @param {string} url The location of the data file (e.g. 'encode.org/my.file.bigwig')
   * @param {string} filetype The type of file being served (e.g. 'bigwig')
   * @param {string} coordSystem The coordinate system being served (e.g. 'hg38')
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

  tilesetInfo(finished) {
    // if this track has a url, server and filetype
    // then we need to register those with the server
    if (
      this.dataConfig.server &&
      this.dataConfig.url &&
      this.dataConfig.filetype
    ) {
      return this.registerFileUrl(this.dataConfig)
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
   * Paremeters
   * ----------
   * @param {function} finished A callback that will be called
   *  when all tileset infos are loaded
   */
  tilesetInfoAfterRegister(finished /* , errorCb */) {
    // console.log('dataConfig', this.dataConfig);

    if (!this.dataConfig.children) {
      // this data source has no children so we just need to retrieve one tileset
      // info
      if (!this.dataConfig.server || !this.dataConfig.tilesetUid) {
        console.warn(
          'No dataConfig children, server or tilesetUid:',
          this.dataConfig,
        );
        finished(null);
      } else {
        // pass in the callback
        tileProxy.trackInfo(
          this.dataConfig.server,
          this.dataConfig.tilesetUid,
          (tilesetInfo) => {
            // tileset infos are indxed by by tilesetUids, we can just resolve
            // that here before passing it back to the track
            this.dataConfig.tilesetInfo =
              tilesetInfo[this.dataConfig.tilesetUid];
            finished(
              tilesetInfo[this.dataConfig.tilesetUid],
              this.dataConfig.tilesetUid,
            );
          },
          (error) => {
            this.tilesetInfoLoading = false;
            finished({
              error,
            });
          },
          this.pubSub,
        );
      }
    } else {
      // this data source has children, so we need to wait to get
      // all of their tileset infos in order to return them to the track
      const promises = this.dataConfig.children.map(
        (x) =>
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

  fullTileId(tilesetUid, tileId) {
    /**
     * Convert a tilesetUid and tileId into a full tile
     * identifier
     *
     * Parameters
     * ----------
     *  tilesetUid: string
     *    Uid of the tileset on the server
     *
     *  tileId: string
     *    The tileId of the tile
     *
     *  Returns
     *  -------
     *    fullTileId: string
     *      The full tile id that the server will parse.
     *      E.g. xyxx.0.0.0.default
     */

    return `${tilesetUid}.${tileId}`;
  }

  fetchTilesDebounced(receivedTiles, tileIds) {
    /**
     * Fetch a set of tiles.
     *
     * Because the track shouldn't care about tileset ids, the tile ids
     * should just include positions and any necessary transforms.
     *
     * Parameters
     * ----------
     *  receivedTiles: callback
     *    A function to call once the tiles have been
     *    fetched
     *  tileIds: []
     *    The tile ids to fetch
     */
    if (this.dataConfig.type === 'horizontal-section') {
      this.fetchHorizontalSection(receivedTiles, tileIds);
    } else if (this.dataConfig.type === 'vertical-section') {
      this.fetchHorizontalSection(receivedTiles, tileIds, true);
    } else if (!this.dataConfig.children && this.dataConfig.tilesetUid) {
      // no children, just return the fetched tiles as is
      const promise = new Promise((resolve) =>
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
        ),
      );

      promise.then((returnedTiles) => {
        const tilesetUid = dictValues(returnedTiles)[0].tilesetUid;
        const newTiles = {};

        for (let i = 0; i < tileIds.length; i++) {
          const fullTileId = this.fullTileId(tilesetUid, tileIds[i]);

          returnedTiles[fullTileId].tilePositionId = tileIds[i];
          newTiles[tileIds[i]] = returnedTiles[fullTileId];
        }

        receivedTiles(newTiles);
      });
    } else {
      // multiple child tracks, need to wait for all of them to
      // fetch their data before returning to the parent
      const promises = this.dataConfig.children.map(
        (x) =>
          new Promise(
            (resolve) => {
              x.fetchTilesDebounced(resolve, tileIds);
            },
            this.pubSub,
            true,
          ),
      );

      Promise.all(promises).then((returnedTiles) => {
        // if we're trying to divide two datasets,
        if (this.dataConfig.type === 'divided') {
          const newTiles = this.makeDivided(returnedTiles, tileIds);

          receivedTiles(newTiles);
        } else {
          // assume we're just returning raw tiles
          console.warn(
            'Unimplemented dataConfig type. Returning first data source.',
            this.dataConfig,
          );

          receivedTiles(returnedTiles[0]);
        }
      });
    }
  }

  divideData(numeratorData, denominatorData) {
    /**
     * Return an array consisting of the division of the numerator
     * array by the denominator array
     *
     * Parameters
     * ----------
     *  numeratorData: array
     *    An array of numerical values
     *  denominatorData:
     *    An array of numerical values
     *
     * Returns
     * -------
     *  divided: array
     *    An array consisting of the division of the
     *    numerator by the denominator
     */
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
   * @param {array} inputData: An array containing a matrix stored row-wise
   * @param {array} arrayShape: The shape of the array, should be a
   *  two element array e.g. [256,256].
   * @param {int} sliceIndex: The index across which to take the slice
   * @returns {array} an array corresponding to a slice of this matrix
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

  fetchHorizontalSection(receivedTiles, tileIds, vertical = false) {
    // We want to take a horizontal section of a 2D dataset
    // that means that a 1D track is requesting data from a 2D source
    // because the 1D track only requests 1D tiles, we need to calculate
    // the 2D tile from which to take the slice
    const newTileIds = [];
    const mirrored = [];

    for (const tileId of tileIds) {
      const parts = tileId.split('.');
      const zoomLevel = +parts[0];
      const xTilePos = +parts[1];

      // this is a dummy scale that we'll use to fetch tile positions
      // along the y-axis of the 2D dataset (we already have the x positions
      // from the track that is querying this data)
      const scale = scaleLinear().domain([
        this.dataConfig.slicePos,
        this.dataConfig.slicePos,
      ]);

      // there's two different ways of calculating tile positions
      // this needs to be consolidated into one function eventually
      let yTiles = [];

      if (
        this.dataConfig.tilesetInfo &&
        this.dataConfig.tilesetInfo.resolutions
      ) {
        const sortedResolutions = this.dataConfig.tilesetInfo.resolutions
          .map((x) => +x)
          .sort((a, b) => b - a);

        yTiles = tileProxy.calculateTilesFromResolution(
          sortedResolutions[zoomLevel],
          scale,
          this.dataConfig.tilesetInfo.min_pos[vertical ? 1 : 0],
          this.dataConfig.tilesetInfo.max_pos[vertical ? 1 : 0],
        );
      } else {
        yTiles = tileProxy.calculateTiles(
          zoomLevel,
          scale,
          this.dataConfig.tilesetInfo.min_pos[vertical ? 1 : 0],
          this.dataConfig.tilesetInfo.max_pos[vertical ? 1 : 0],
          this.dataConfig.tilesetInfo.max_zoom,
          this.dataConfig.tilesetInfo.max_width,
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
    const promise = new Promise((resolve) =>
      tileProxy.fetchTilesDebounced(
        {
          id: slugid.nice(),
          server: this.dataConfig.server,
          done: resolve,
          ids: newTileIds.map((x) => `${this.dataConfig.tilesetUid}.${x}`),
        },
        this.pubSub,
        true,
      ),
    );
    promise.then((returnedTiles) => {
      // we've received some new tiles, but they're 2D
      // we need to extract the row corresponding to the data we need

      const tilesetUid = dictValues(returnedTiles)[0].tilesetUid;
      // console.log('tilesetUid:', tilesetUid);
      const newTiles = {};

      for (let i = 0; i < newTileIds.length; i++) {
        const parts = newTileIds[i].split('.');
        const zoomLevel = +parts[0];
        const xTilePos = +parts[1];
        const yTilePos = +parts[2];

        const sliceIndex = tileProxy.calculateTileAndPosInTile(
          this.dataConfig.tilesetInfo,
          this.dataConfig.tilesetInfo.max_width,
          this.dataConfig.tilesetInfo.min_pos[1],
          zoomLevel,
          +this.dataConfig.slicePos,
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
    });
  }

  makeDivided(returnedTiles, tileIds) {
    if (returnedTiles.length < 2) {
      console.warn(
        'Only one tileset specified for a divided datafetcher:',
        this.dataConfig,
      );
    }

    // const numeratorTilesetUid = dictValues(returnedTiles[0])[0].tilesetUid;
    // const denominatorTilesetUid = dictValues(returnedTiles[1])[0].tilesetUid;

    const newTiles = {};

    for (let i = 0; i < tileIds.length; i++) {
      // const numeratorUid = this.fullTileId(numeratorTilesetUid, tileIds[i]);
      // const denominatorUid = this.fullTileId(denominatorTilesetUid, tileIds[i]);
      const zoomLevel = returnedTiles[0][tileIds[i]].zoomLevel;
      const tilePos = returnedTiles[0][tileIds[i]].tilePos;

      let newTile = {
        zoomLevel,
        tilePos,
        tilePositionId: tileIds[i],
      };

      if (
        returnedTiles[0][tileIds[i]].dense &&
        returnedTiles[1][tileIds[i]].dense
      ) {
        const newData = this.divideData(
          returnedTiles[0][tileIds[i]].dense,
          returnedTiles[1][tileIds[i]].dense,
        );

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
