import {TiledPixiTrack} from './TiledPixiTrack.js';
import {tileProxy} from './TileProxy.js';

export class Tiled2DPixiTrack extends TiledPixiTrack {
    constructor(scene, server, uid) {
        super(scene, server, uid);

        // the tiles which should be visible (although they're not necessarily fetched)
        this.visibleTiles = new Set();
        
        // the tiles we already have requests out for
        this.fetching = new Set();

        // tiles we have fetched and ready to be rendered
        this.fetchedTiles = {};
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

        // tiles that should be visible
        this.visibleTiles = new Set(tiles.map(this.tileToId.bind(this)));

        // tiles that are fetched
        let fetchedTileIDs = new Set(Object.keys(this.fetchedTiles));

        // fetch the tiles that should be visible but haven't been fetched
        // and aren't in the process of being fetched
        let toFetch = [...this.visibleTiles].filter(x => !this.fetching.has(x) && !fetchedTileIDs.has(x));

        // calculate which tiles are obsolete and remove them
        let toRemove = [...fetchedTileIDs].filter(x => !this.visibleTiles.has(x));
        this.removeTiles(toRemove);
         

        // everything in toLoad will be sent for fetching so we need to not request it again
        for (let i = 0; i < toFetch.length; i++)
            this.fetching.add(toFetch[i]);


        if (toFetch.length > 0)
            tileProxy.fetchTiles(this.tilesetServer, toFetch, this.receivedTiles.bind(this));
    }

    removeTiles(toRemoveIds) {
        /** 
         * Remove obsolete tiles
         *
         * @param toRemoveIds: An array of tile ids to remove from the list of fetched tiles.
         */
        toRemoveIds.forEach(x => {
            delete this.fetchedTiles[x];
        })
    }

    receivedTiles(loadedTiles) {
        /**
         * We've gotten a bunch of tiles from the server in
         * response to a request from fetchTiles.
         */
        console.log('received:', loadedTiles);

        for (let uid in loadedTiles) {
            this.fetchedTiles[uid] = loadedTiles[uid];

            if (this.fetching.has(uid)) {
                // if we've received this tile, we're not fetching it anymore
                this.fetching.delete(uid);
            }
        }

        this.synchronizeTilesAndGraphics();
    }
}
