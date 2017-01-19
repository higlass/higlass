import {TiledPixiTrack} from './TiledPixiTrack.js';
import {tileProxy} from './TileProxy.js';

export class ArrowheadDomainsTrack extends TiledPixiTrack {
    constructor(scene, server, uid, handleTilesetInfoReceived) {
        super(scene, server, uid, handleTilesetInfoReceived);

        this.drawnRects = new Set();
    }

    tileToLocalId(tile) {
        /*
         * The local tile identifier
         */

        // tile contains [zoomLevel, xPos, yPos]
        return this.tilesetUid + '.' + tile.join('.');
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

    setVisibleTiles(tilePositions) {
        /**
         * Set which tiles are visible right now.
         *
         * @param tiles: A set of tiles which will be considered the currently visible
         * tile positions.
         */
        this.visibleTiles = tilePositions.map(x => {
            return {
                tileId: this.tileToLocalId(x),
                remoteId: this.tileToRemoteId(x)
            }
        });

        this.visibleTileIds = new Set(this.visibleTiles.map(x => x.tileId));
    }

    calculateVisibleTiles(mirrorTiles=true) {
        // if we don't know anything about this dataset, no point
        // in trying to get tiles
        if (!this.tilesetInfo)
            return;

        this.zoomLevel = this.calculateZoomLevel();
        //this.zoomLevel = 0;

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
        let tiles = [];

        // calculate the ids of the tiles that should be visible
        for (let i = 0; i < rows.length; i++) {
            for (let j = 0; j < cols.length; j++) {
                    let newTile = [zoomLevel, rows[i], cols[j]];

                    tiles.push(newTile)
                
            }
        }

        //
        this.setVisibleTiles(tiles);
    }


    initTile(tile) {
        /**
         * Create whatever is needed to draw this tile.
         */
         
        //this.drawTile(tile);
    }

    destroyTile(tile, graphics) {

    }

    draw() {
        this.drawnRects.clear();

        super.draw();
    }

    drawTile(tile) {
        if (!tile.graphics)
            return;

        //console.log('tile:', tile);
        //console.log('Id2DTiled drawTile...');
        let graphics = tile.graphics;
                                                                                 
        graphics.clear();

        graphics.lineStyle(1, 0x0000FF, 1);
        graphics.beginFill(0xFF700B, 0.4);
        graphics.alpha = 0.5;

        // line needs to be scaled down so that it doesn't become huge
        for (let td of tile.tileData) {
            let line = td.fields;

            let startX = this._xScale(td.xStart);
            let endX = this._xScale(td.xEnd);

            let startY = this._yScale(td.yStart);
            let endY = this._yScale(td.yEnd);

            let uid = td.uid;

            if (this.drawnRects.has(uid))
                continue; //we've already drawn this rectangle in another tile

            this.drawnRects.add(uid);
            graphics.drawRect(startX, startY, endY - startY, endX - startX);
        }


    }

    setPosition(newPosition) {
        super.setPosition(newPosition);

        this.pMain.position.y = this.position[1];
        this.pMain.position.x = this.position[0];
    }

    zoomed(newXScale, newYScale) {
        this.xScale(newXScale);
        this.yScale(newYScale);

        this.refreshTiles();

        this.draw();

    }
}
