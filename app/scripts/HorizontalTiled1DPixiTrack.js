import {Tiled1DPixiTrack} from './Tiled1DPixiTrack.js';
import {tileProxy} from './TileProxy.js';

export class HorizontalTiled1DPixiTrack extends Tiled1DPixiTrack {
    constructor(scene, server, uid) {
        super(scene, server, uid);

    }

    calculateZoomLevel() {
        let xZoomLevel = tileProxy.calculateZoomLevel(this._xScale,
                                                      this.tilesetInfo.min_pos[0],
                                                      this.tilesetInfo.max_pos[0]);

        let zoomLevel = Math.min(xZoomLevel, this.maxZoom);

        return zoomLevel
    }

    relevantScale() {
        /**
         * Which scale should we use for calculating tile positions?
         *
         * Horizontal tracks should use the xScale and vertical tracks
         * should use the yScale
         *
         * This function should be overwritten by HorizontalTiled1DPixiTrack.js
         * and VerticalTiled1DPixiTrack.js
         */
        return this._xScale;
    }

    fetchNewTiles(toFetch) {
        // no real fetching involved... we just need to display the data
        toFetch.map(x => {
            let key = x.remoteId;
            let keyParts = key.split('.');

            let data = {
                zoomLevel: keyParts[1],
                tilePos: keyParts.slice(2, keyParts.length).map(x => +x)
            }

            this.fetchedTiles[x.tileId] = x;
            this.fetchedTiles[x.tileId].tileData = data;

            // since we're not actually fetching remote data, we can easily 
            // remove these tiles from the fetching list
            if (this.fetching.has(x.remoteId))
                this.fetching.delete(x.remoteId);
        });

        this.synchronizeTilesAndGraphics();
    }

}
