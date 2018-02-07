import slugid from 'slugid';
import { scaleLinear } from 'd3-scale';
import { dictValues } from './utils';

// Services
import { tileProxy } from './services';
import {
  minNonZero,
  maxNonZero,
} from './worker';

export default class DataFetcher {
  constructor(dataConfig) {
    this.tilesetInfoLoading = true;

    // copy the dataConfig so that it doesn't dirty so that
    // it doesn't get modified when we make objects of its
    // children below
    this.dataConfig = JSON.parse(JSON.stringify(dataConfig));
    this.uuid = slugid.nice();

    if (this.dataConfig.children) {
      // convert each child into an object
      this.dataConfig.children = dataConfig.children.map(c => new DataFetcher(c));
    }
  }

  tilesetInfo(finished, errorCb) {
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
     *  finished: function
     *    A callback that will be called when all tileset infos are loaded
     */
    console.log('requesting tilesetInfo');

    if (!this.dataConfig.children) {
      // this data source has no children so we just need to retrieve one tileset 
      // info
      if (!this.dataConfig.server && !this.dataConfig.tilesetUid) {
        console.warn(
          'No dataConfig children, server or tilesetUid:', this.dataConfig
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
            this.dataConfig.tilesetInfo = tilesetInfo[this.dataConfig.tilesetUid];
            finished(tilesetInfo[this.dataConfig.tilesetUid]);
          },
          (error) => {
            finished({'error': error});
          }
        );
      }
    } else {
      // this data source has children, so we need to wait to get
      // all of their tileset infos in order to return them to the track
      const promises = this.dataConfig.children
        .map(x => new Promise((resolve) => {
          x.tilesetInfo(resolve);
        }));

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
    console.log('this.dataConfig', this.dataConfig);
    console.log('this:', this.dataConfig.tilesetUid);
    console.log('tileIds:', tileIds);

    if (this.dataConfig.type == 'horizontal-section') {
      this.fetchHorizontalSection(receivedTiles, tileIds);
    } else if (!this.dataConfig.children) {
      // no children, just return the fetched tiles as is
      const promise = new Promise(resolve =>
        tileProxy.fetchTilesDebounced({
          id: slugid.nice(),
          server: this.dataConfig.server,
          done: resolve,
          ids: tileIds.map(x => `${this.dataConfig.tilesetUid}.${x}`),
        }));
      promise.then((returnedTiles) => {
        // console.log('tileIds:', tileIds);
        const tilesetUid = dictValues(returnedTiles)[0].tilesetUid;
        // console.log('tilesetUid:', tilesetUid);
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
      const promises = this.dataConfig.children
        .map(x => new Promise((resolve) => {
          x.fetchTilesDebounced(resolve, tileIds);
        }));


      Promise.all(promises).then((returnedTiles) => {
        // if we're trying to divide two datasets,
        if (this.dataConfig.type === 'divided') {
          const newTiles = this.makeDivided(returnedTiles);

          receivedTiles(newTiles);
        } else if (this.dataConfig.type == 'horizontal-slice') {
          const newTiles = this.horizontalSlice(returnedTiles);

          receivedTiles(newTiles);
        } else {
          // assume we're just returning raw tiles
          console.warn(
            'Unimplemented dataConfig type. Returning first data source.',
            this.dataConfig
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
      if (denominatorData[i] === 0.) result[i] = NaN;
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
  horizontalSlice(returnedTiles, sliceYPos) {
    return null;
  }

  fetchHorizontalSection(receivedTiles, tileIds) {
    // We want to take a horizontal section of a 2D dataset
    // that means that a 1D track is requesting data from a 2D source
    // because the 1D track only requests 1D tiles, we need to calculate
    // the 2D tile from which to take the slice
    const newTileIds = [];

    for (let tileId of tileIds) {
      const parts = tileId.split('.');
      const zoomLevel = +parts[0];
      const xTilePos = +parts[1];
      let otherPos = null;

      // this is a dummy scale that we'll use to fetch tile positions
      // along the y-axis of the 2D dataset (we already have the x positions
      // from the track that is querying this data)
      const scale = scaleLinear().domain([this.dataConfig.ySlicePos, this.dataConfig.ySlicePos]);

      // there's two different ways of calculating tile positions
      // this needs to be consolidated into one function eventually
      let yTiles = [];

      if (this.dataConfig.tilesetInfo && this.dataConfig.tilesetInfo.resolutions)  {
        const sortedResolutions = this.tilesetInfo.resolutions
          .map(x => +x)
          .sort((a, b) => b - a);

        yTiles = tileProxy.calculateTilesFromResolution(
          scale,
          sortedResolutions[zoomLevel],
          this.dataConfig.tilesetInfo.min_pos[1], this.dataConfig.tilesetInfo.max_pos[1]
        )
      } else {
        yTiles = tileProxy.calculateTiles(zoomLevel, 
          scale,
          this.dataConfig.tilesetInfo.min_pos[0],
          this.dataConfig.tilesetInfo.max_pos[0],
          this.dataConfig.tilesetInfo.max_zoom,
          this.dataConfig.tilesetInfo.max_width);

      }

      const newTileId = `${zoomLevel}.${xTilePos}.${yTiles[0]}`
      console.log('yTiles:', yTiles);
      console.log('zoomLevel', zoomLevel, 'xTilePos:', xTilePos)
      console.log('newTileId:', newTileId);

      newTileIds.push(newTileId);
      // we may need to add something about the data transform
    }

    console.log('newTileIds', newTileIds);

    // actually fetch the new tileIds
    const promise = new Promise(resolve =>
      tileProxy.fetchTilesDebounced({
        id: slugid.nice(),
        server: this.dataConfig.server,
        done: resolve,
        ids: newTileIds.map(x => `${this.dataConfig.tilesetUid}.${x}`),
      }));
    promise.then((returnedTiles) => {
      // we've received some new tiles, but they're 2D
      // we need to extract the row corresponding to the data we need
      console.log('fetched tileIds:', returnedTiles);

      const tilesetUid = dictValues(returnedTiles)[0].tilesetUid;
      // console.log('tilesetUid:', tilesetUid);
      const newTiles = {};

      for (let i = 0; i < newTileIds.length; i++) {
        const parts = newTileIds[i].split('.');
        const zoomLevel = +parts[0];
        const xTilePos = +parts[1];

        tileProxy.calculateTileAndPosInTile(this.dataConfig.tilesetInfo,
          this.dataConfig.tilesetInfo.max_width,
          this.dataConfig.tilesetInfo.min_pos[1],
          zoomLevel,
          +this.dataConfig.ySlicePos);

        const fullTileId = this.fullTileId(tilesetUid, tileIds[i]);

        returnedTiles[fullTileId].tilePositionId = tileIds[i];
        newTiles[tileIds[i]] = returnedTiles[fullTileId];
      }

      receivedTiles(newTiles);
    });
  }

  makeDivided(returnedTiles) {
      if (returnedTiles.length < 2) {
        console.warn(
          'Only one tileset specified for a divided datafetcher:',
          this.dataConfig
        );
      }

      // const numeratorTilesetUid = dictValues(returnedTiles[0])[0].tilesetUid;
      // const denominatorTilesetUid = dictValues(returnedTiles[1])[0].tilesetUid;

      const newTiles = {};

      for (let i = 0; i < tileIds.length; i++) {
        // const numeratorUid = this.fullTileId(numeratorTilesetUid, tileIds[i]);
        // const denominatorUid = this.fullTileId(denominatorTilesetUid, tileIds[i]);

        const newData = this.divideData(returnedTiles[0][tileIds[i]].dense,
          returnedTiles[1][tileIds[i]].dense);

        const zoomLevel = returnedTiles[0][tileIds[i]].zoomLevel;
        const tilePos = returnedTiles[0][tileIds[i]].tilePos;

        const newTile = {
          dense: newData,
          minNonZero: minNonZero(newData),
          maxNonZero: maxNonZero(newData),
          zoomLevel,
          tilePos,
          tilePositionId: tileIds[i],
        };

        // returned ids will be indexed by the tile id and won't include the
        // tileset uid
        newTiles[tileIds[i]] = newTile;
      }

    return newTiles;
  }
}
