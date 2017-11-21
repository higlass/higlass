import slugid from 'slugid';

// Services
import { tileProxy } from './services';

export default class DataFetcher {
  constructor(dataConfig) {
    console.log('data fetcher config:',  dataConfig);
    this.tilesetInfoLoading = true;
    this.dataConfig = dataConfig;
    this.uuid = slugid.nice();

    if (this.dataConfig.children) {
      // convert each child into an object
      this.dataConfig.children = dataConfig.children.map(c => new DataFetcher(c));
    }
  }

  tilesetInfo(finished) {
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

    if (!this.dataConfig.children) {
      if (!this.dataConfig.server && !this.dataConfig.tilesetUid) {
        console.warn('No dataConfig children, server or tilesetUid:', dataConfig);
        finished(null);
      } else {
        // pass in the callback
        tileProxy.trackInfo(this.dataConfig.server, this.dataConfig.tilesetUid, 
          (tilesetInfo) => {
            // tileset infos are indxed by by tilesetUids, we can just resolve
            // that here before passing it back to the track
            finished(tilesetInfo[this.dataConfig.tilesetUid]);
          });
      }
    } else {
      // this data source has children, so we need to wait to get
      // all of their tileset infos in order to return them to the track
      let promises = this.dataConfig.children.map((x) => {
        return new Promise((resolve, reject) => {
          x.tilesetInfo(resolve);
        });
      });

      Promise.all(promises).then(values => {
        // this is where we should check if all the children's tileset
        // infos match
        finished(values[0]);
      });
    }
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

    if (!this.dataConfig.children) {
      // no children, just return the fetched tiles as is
      tileProxy.fetchTilesDebounced({
        id: this.uuid,
        server: this.dataConfig.server,
        done: receivedTiles,
        ids: tileIds.map(x => `${this.dataConfig.tilesetUid}.${x}`),
      });
    } else {
       // multiple child tracks, need to wait for all of them to
       // fetch their data before returning to the parent
      let promises = this.dataConfig.children.map((x) => {
        return new Promise((resolve, reject) => {
          x.fetchTilesDebounced(resolve, tileIds);
        });
      });


      Promise.all(promises).then(returnedTiles => {
        console.log('returnedTiles:', returnedTiles);
      });
    }
  }
}
