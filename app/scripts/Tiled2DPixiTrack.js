import {TiledPixiTrack} from './TiledPixiTrack.js';
import {tileProxy} from './TileProxy.js';

export class Tiled2DPixiTrack extends TiledPixiTrack {
    constructor(scene, server, uid) {
        super(scene, server, uid);

        this.visibleTiles = new Set();
        this.fetching = new Set();
    }

    tileToId(tile) {
        return this.tilesetUid + '.' + tile.join('.');
    }

    refreshTiles() {
        // if we don't know anything about this dataset, no point
        // in trying to get tiles
        if (!this.tilesetInfo)
            return;

        super.refreshTiles();
        
        this.zoomLevel = tileProxy.calculateZoomLevel(this._xScale,
                                                      this.tilesetInfo.min_pos[0],
                                                      this.tilesetInfo.max_pos[0]);

        this.xTiles =  tileProxy.calculateTiles(this._xScale, 
                                               this.tilesetInfo.min_pos[0],
                                               this.tilesetInfo.max_pos[0],
                                               this.tilesetInfo.max_zoom,
                                               this.tilesetInfo.max_width);

        this.yTiles =  tileProxy.calculateTiles(this._yScale, 
                                               this.tilesetInfo.min_pos[0],
                                               this.tilesetInfo.max_pos[0],
                                               this.tilesetInfo.max_zoom,
                                               this.tilesetInfo.max_width);

        let rows = this.xTiles;
        let cols = this.yTiles;
        let zoomLevel = this.zoomLevel;

        // if we're mirroring tiles, then we only need tiles along the diagonal
        let mirrorTiles = true;
        let tiles = [];

        // calculate the ids of the tiles that should be visible
        for (let i = 0; i < rows.length; i++) {
            for (let j = 0; j < cols.length; j++) {
                if (mirrorTiles) {
                    if (rows[i] >= cols[j]) {
                        // if we're in the upper triangular part of the matrix, then we need to load
                        // a mirrored tile
                        let newTile = [zoomLevel, cols[j], rows[i]];
                        newTile.mirrored = true;
                        tiles.push(newTile); 
                    } else {
                        // otherwise, load an original tile
                        let newTile = [zoomLevel, rows[i], cols[j]];
                        newTile.mirrored = false;
                        tiles.push(newTile); 

                    }

                    if (rows[i] == cols[j]) {
                        // on the diagonal, load original tiles
                        let newTile = [zoomLevel, rows[i], cols[j]];
                        newTile.mirrored = false;
                        tiles.push(newTile);
                    }

                } else {
                    let newTile = [zoomLevel, rows[i], cols[j]];
                    newTile.mirrored = false;

                    tiles.push(newTile)
                }
            }
        }

        let visible = this.visibleTiles;
        let coming = new Set(tiles.map(this.tileToId.bind(this)));
        let fetching = this.fetching;

        // calculate which tiles are obsolete and remove them
        let toRemove = [...visible].filter(x => !coming.has(x));
        this.removeTiles(toRemove);
         
        // calculate which tiles are missing and fetch and add them
        let toLoad = [...coming].filter(x => !visible.has(x) && !fetching.has(x));

        // everything in toLoad will be sent for fetching so we need to not request it again
        for (let i = 0; i < toLoad.length; i++)
            fetching.add(toLoad[i]);


        if (toLoad.length > 0)
            tileProxy.fetchTiles(this.tilesetServer, toLoad, this.receivedTiles);
    }

    removeTiles(toRemoveIds) {
        /** 
         * Remove obsolete tiles
         */

    }

    receivedTiles(loadedTiles) {
        /**
         * We've gotten a bunch of tiles from the server in
         * response to a request from fetchTiles.
         */
        console.log('received:', loadedTiles);
    }
}
