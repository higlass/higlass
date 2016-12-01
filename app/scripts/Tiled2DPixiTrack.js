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

    tileToLocalId(tile) {
        /*
         * The local tile identifier
         */
        return this.tilesetUid + '.' + tile.join('.') + '.' + tile.mirrored;
    }

    tileToRemoteId(tile) {
        /**
         * The tile identifier used on the server
         */
        return this.tilesetUid + '.' + tile.join('.');
    }

    localToRemoteId(remoteId) {
        let idParts = remoteId.split('.');
        return idParts.slice(0, idParts.length-1).join('.');
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

        this.visibleTiles = tiles.map(x => {
            return {
                tileId: this.tileToLocalId(x),
                remoteId: this.tileToRemoteId(x),
                mirrored: x.mirrored
            }
        });

        this.visibleTileIds = new Set(this.visibleTiles.map(x => x.tileId));

        // tiles that are fetched
        let fetchedTileIDs = new Set(Object.keys(this.fetchedTiles));

        // fetch the tiles that should be visible but haven't been fetched
        // and aren't in the process of being fetched
        let toFetch = [...this.visibleTiles].filter(x => !this.fetching.has(x.tileId) && !fetchedTileIDs.has(x.tileId))
        //console.log('toFetch:', toFetch);

        // calculate which tiles are obsolete and remove them
        // fetchedTileID are remote ids
        let toRemove = [...fetchedTileIDs].filter(x => !this.visibleTileIds.has(x));

        this.removeTiles(toRemove);
        this.fetchNewTiles(toFetch);

        if (toFetch.length > 0)
            this.fetchNewTiles(toFetch);
    }

    fetchNewTiles(toFetch) {
        tileProxy.fetchTiles(this.tilesetServer, [...(new Set(toFetch.map(x => x.remoteId)))], this.receivedTiles.bind(this));
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

        this.synchronizeTilesAndGraphics();
    }

    getTilePosAndDimensions(zoomLevel, tilePos) {
        /**
         * Get the tile's position in its coordinate system.
         */
        let xTilePos = tilePos[0], yTilePos = tilePos[1];

        let totalWidth = this.tilesetInfo.max_width;
        let totalHeight = this.tilesetInfo.max_width;

        let minX = 0;
        let minY = 0;

        let tileWidth = totalWidth / Math.pow(2, zoomLevel);
        let tileHeight = totalHeight / Math.pow(2, zoomLevel);

        let tileX = minX + xTilePos * tileWidth;
        let tileY = minY + yTilePos * tileHeight;

        return { tileX: tileX,
                 tileY: tileY,
                 tileWidth: tileWidth,
                 tileHeight: tileHeight};
    }

    receivedTiles(loadedTiles) {
        /**
         * We've gotten a bunch of tiles from the server in
         * response to a request from fetchTiles.
         */
        //console.log('received:', loadedTiles);
        for (let i = 0; i < this.visibleTiles.length; i++) {
            let tileId = this.visibleTiles[i].tileId;

            if (this.visibleTiles[i].remoteId in loadedTiles) {
                this.visibleTiles[i].tileData = loadedTiles[this.visibleTiles[i].remoteId];
                this.fetchedTiles[tileId] = this.visibleTiles[i];
            }

            console.log('this.fetchedTiles:', this.fetchedTiles);
        }

        for (let remoteId in loadedTiles) {
            //this.fetchedTiles[remoteId] = loadedTiles[remoteId];

            if (this.fetching.has(remoteId)) {
                // if we've received this tile, we're not fetching it anymore
                this.fetching.delete(remoteId);
            }
        }

        this.synchronizeTilesAndGraphics();
    }
}
