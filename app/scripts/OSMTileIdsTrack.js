// @ts-nocheck
import { initTile, drawTile } from './Id2DTiledPixiTrack';
import OSMTilesTrack from './OSMTilesTrack';

class OSMTileIdsTrack extends OSMTilesTrack {
  initTile(tile) {
    initTile.bind(this)(tile);

    this.drawTile(tile);
  }

  drawTile(tile) {
    drawTile.bind(this)(tile);
  }

  areAllVisibleTilesLoaded() {
    // we don't need to wait for any tiles to load before
    // drawing
    //
    return true;
  }

  fetchNewTiles(toFetch) {
    // no real fetching involved... we just need to display the data
    toFetch.forEach((x) => {
      const key = x.remoteId;
      const keyParts = key.split('.');

      const data = {
        zoomLevel: keyParts[0],
        tilePos: keyParts.slice(1, keyParts.length).map((keyPart) => +keyPart),
      };

      this.fetchedTiles[x.tileId] = x;
      this.fetchedTiles[x.tileId].tileData = data;

      // since we're not actually fetching remote data, we can easily
      // remove these tiles from the fetching list
      if (this.fetching.has(x.remoteId)) {
        this.fetching.delete(x.remoteId);
      }
    });

    this.synchronizeTilesAndGraphics();

    this.draw();
    this.animate();
  }

  draw() {
    super.draw();

    // this.animate();
  }
}

export default OSMTileIdsTrack;
