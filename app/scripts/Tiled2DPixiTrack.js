import {TiledPixiTrack} from './TiledPixiTrack.js';
import {tileProxy} from './TileProxy.js';

export class Tiled2DPixiTrack extends TiledPixiTrack {
    constructor(scene, server, uid) {
        super(scene, server, uid);
    }

    tileToLocalId(tile) {
        /*
         * The local tile identifier
         */

        // tile contains [zoomLevel, xPos, yPos]
        return this.tilesetUid + '.' + tile.join('.') + '.' + tile.mirrored;
    }

    tileToRemoteId(tile) {
        /**
         * The tile identifier used on the server
         */

        // tile contains [zoomLevel, xPos, yPos]
        return this.tilesetUid + '.' + tile.join('.');
    }

    localToRemoteId(remoteId) {
        let idParts = remoteId.split('.');
        return idParts.slice(0, idParts.length-1).join('.');
    }

    calculateZoomLevel() {
        let xZoomLevel = tileProxy.calculateZoomLevel(this._xScale,
                                                      this.tilesetInfo.min_pos[0],
                                                      this.tilesetInfo.max_pos[0]);
        let yZoomLevel = tileProxy.calculateZoomLevel(this._xScale,
                                                      this.tilesetInfo.min_pos[1],
                                                      this.tilesetInfo.max_pos[1]);

        let zoomLevel = Math.max(xZoomLevel, yZoomLevel);
        zoomLevel = Math.min(zoomLevel, this.maxZoom);

        return zoomLevel
    }

    calculateVisibleTiles() {
        // if we don't know anything about this dataset, no point
        // in trying to get tiles
        if (!this.tilesetInfo)
            return;

        this.zoomLevel = this.calculateZoomLevel();

        this.xTiles =  tileProxy.calculateTiles(this.zoomLevel, this._xScale, 
                                               this.tilesetInfo.min_pos[0],
                                               this.tilesetInfo.max_pos[0],
                                               this.tilesetInfo.max_zoom,
                                               this.tilesetInfo.max_width);

        this.yTiles =  tileProxy.calculateTiles(this.zoomLevel, this._yScale, 
                                               this.tilesetInfo.min_pos[1],
                                               this.tilesetInfo.max_pos[1],
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

        this.setVisibleTiles(tiles);
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


    zoomed(newXScale, newYScale) {
        super.zoomed(newXScale, newYScale);

        let scaleX = (newXScale(1) - newXScale(0))/ (this._refXScale(1) - this._refXScale(0));
        let scaleY = (newYScale(1) - newYScale(0))/ (this._refYScale(1) - this._refYScale(0));

        let translateX = (newXScale(0) + this.position[0]) - this._refXScale(0) * scaleX;
        let translateY = (newYScale(0) + this.position[1]) - this._refYScale(1) * scaleY;

        this.pMain.position.x = translateX;
        this.pMain.position.y = translateY;

        this.pMain.scale.x = scaleX;
        this.pMain.scale.y = scaleY;
    }

    updateTile(tile) {
        // no need to redraw this tile, usually
        
        return;
    }
}
