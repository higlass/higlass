import {TiledPixiTrack} from './TiledPixiTrack';
import {tileProxy} from './services';
import {colorToHex} from './utils';

export class Horizontal2DDomainsTrack extends TiledPixiTrack {
    constructor(scene, server, uid, handleTilesetInfoReceived, option, animate) {
        super(scene, server, uid, handleTilesetInfoReceived, option, animate);

        this.drawnRects = new Set();
        this.pMain = this.pMobile;
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

        if (this.options && this.options.maxZoom) {
            if (this.options.maxZoom >= 0)
                zoomLevel = Math.min(this.options.maxZoom, zoomLevel);
            else
                console.error("Invalid maxZoom on track:", this);
        }

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

    calculateVisibleTiles() {
        /**
         * Taken from HorizontalHeatmapTrack.js
         */

        // if we don't know anything about this dataset, no point
        // in trying to get tiles
        if (!this.tilesetInfo)
            return;

        this.zoomLevel = this.calculateZoomLevel();


        //this.zoomLevel = 0;
        let expandedXScale = this._xScale.copy();

        let xDomainWidth = this._xScale.domain()[1] - this._xScale.domain()[0];
        let xRangeWidth = this._xScale.range()[1] - this._xScale.range()[0];

        // we need to expand the domain of the X-scale because we are showing diagonal tiles.
        // to make sure the view is covered up the entire height, we need to expand by viewHeight * sqrt(2)
        // on each side
        expandedXScale.domain([this._xScale.invert(this._xScale.range()[0] - this.dimensions[1] * Math.sqrt(2)),
                               this._xScale.invert(this._xScale.range()[1] + this.dimensions[1] * Math.sqrt(2))]);

        this.xTiles =  tileProxy.calculateTiles(this.zoomLevel, expandedXScale,
                                               this.tilesetInfo.min_pos[0],
                                               this.tilesetInfo.max_pos[0],
                                               this.tilesetInfo.max_zoom,
                                               this.tilesetInfo.max_width);

        this.yTiles =  tileProxy.calculateTiles(this.zoomLevel, expandedXScale,
                                               this.tilesetInfo.min_pos[0],
                                               this.tilesetInfo.max_pos[0],
                                               this.tilesetInfo.max_zoom,
                                               this.tilesetInfo.max_width);

        let rows = this.xTiles;
        let cols = this.yTiles;
        let zoomLevel = this.zoomLevel;

        let maxWidth = this.tilesetInfo.max_width;
        let tileWidth = maxWidth /  Math.pow(2, zoomLevel);

        // if we're mirroring tiles, then we only need tiles along the diagonal
        let tiles = [];

        // calculate the ids of the tiles that should be visible
        for (let i = 0; i < rows.length; i++) {
            for (let j = i; j < cols.length; j++) {
                    // the length between the bottom of the track and the bottom corner of the tile
                    // draw it out to understand better!
                    let tileBottomPosition = ((j - i) - 2) * (this._xScale(tileWidth) - this._xScale(0)) * Math.sqrt(2) / 2;

                    if (tileBottomPosition > this.dimensions[1]) {
                        // this tile won't be visible so we don't need to fetch it
                        continue;
                    }

                    let newTile = [zoomLevel, rows[i], cols[j]];
                    newTile.mirrored = false;

                    tiles.push(newTile)
            }
        }

        this.setVisibleTiles(tiles);
    }


    initTile(tile) {
        /**
         * Create whatever is needed to draw this tile.
         */
        super.initTile(tile);

        //this.drawTile(tile);
        this.drawTile(tile);
    }

    destroyTile(tile, graphics) {

    }

    draw() {
        //console.log('delayDrawing:', this.delayDrawing, this.dimensions[1]);
        if (!this.delayDrawing)
            this.drawnRects.clear();

        super.draw();
    }

    drawTile(tile) {
        if (!tile.graphics)
            return;

        //console.log('Id2DTiled drawTile...');
        let graphics = tile.graphics;

        graphics.clear();

        let stroke = colorToHex(this.options.rectangleDomainStrokeColor ? this.options.rectangleDomainStrokeColor : 'black');
        let fill = colorToHex(this.options.rectangleDomainFillColor ? this.options.rectangleDomainFillColor : 'grey');

        graphics.lineStyle(1 / this.pMain.scale.x, stroke, 1);
        graphics.beginFill(fill, 0.4);
        graphics.alpha = this.options.rectangleDomainOpacity ? this.options.rectangleDomainOpacity : 0.5;

        // line needs to be scaled down so that it doesn't become huge
        for (let td of tile.tileData) {
            let line = td.fields;

            let startX = this._refXScale(td.xStart);
            let endX = this._refXScale(td.xEnd);

            let startY = this._refYScale(td.yStart);
            let endY = this._refYScale(td.yEnd);

            let uid = td.uid;

            if (this.drawnRects.has(uid))
                continue; //we've already drawn this rectangle in another tile

            this.drawnRects.add(uid);
            graphics.drawRect(startX, startY, endX - startX, endY - startY);

            graphics.pivot.x = this._refXScale(0);
            graphics.pivot.y = this._refYScale(0);
            graphics.scale.x = -1 / Math.sqrt(2);
            graphics.rotation = -3 * Math.PI / 4;
            graphics.scale.y = 1 / Math.sqrt(2);

            graphics.position.x = this._refXScale(0);
            graphics.position.y = 0;
        }
    }

    setPosition(newPosition) {
        super.setPosition(newPosition);

        this.pMain.position.y = this.position[1];
        this.pMain.position.x = this.position[0];
    }

    refScalesChanged(refXScale, refYScale) {
        super.refScalesChanged(refXScale, refYScale);

        for (let uid in this.fetchedTiles) {
            let tile = this.fetchedTiles[uid];

            if (tile.sprite) {
                let graphics = tile.graphics;

                graphics.pivot.x = this._refXScale(0);
                graphics.pivot.y = this._refYScale(0);
                graphics.scale.x = -1 / Math.sqrt(2);
                graphics.rotation = -3 * Math.PI / 4;
                graphics.scale.y = 1 / Math.sqrt(2);

                graphics.position.x = this._refXScale(0);
                graphics.position.y = 0;
            } else {
                // console.log('skipping...', tile.tileId);
            }
        }
    }

    zoomed(newXScale, newYScale, k, tx, ty) {
        super.zoomed(newXScale, newYScale, k, tx, ty);
        //console.log('zoomed this.pMain.position:', this.pMain.position.x, this.pMain.position.y, this.pMain.scale.x, this.pMain.scale.y);

        this.pMain.position.x = tx;
        this.pMain.position.y = this.position[1] + this.dimensions[1]; //translateY;

        this.pMain.scale.x = k; //scaleX;
        this.pMain.scale.y = k; //scaleY;

        if (this.options.oneDHeatmapFlipped) {
            this.pMain.scale.y = -k;
            this.pMain.position.y = this.position[1];
        }

        this.draw();
    }
}

export default Horizontal2DDomainsTrack;
