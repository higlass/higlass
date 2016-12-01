import {Tiled2DPixiTrack} from './Tiled2DPixiTrack.js';
import {tileProxy} from './TileProxy.js';
import {workerSetPix} from './worker.js';
//import {LRUCache} from './lru.js';

export class HeatmapTiledPixiTrack extends Tiled2DPixiTrack {
    constructor(scene, server, uid) {
        /**
         * @param scene: A PIXI.js scene to draw everything to.
         * @param server: The server to pull tiles from.
         * @param uid: The data set to get the tiles from the server
         */
        super(scene, server, uid);
    }


    refreshTiles() {
        super.refreshTiles();

    }

    tileDataToCanvas(pixData, minVisibleValue, maxVisibleValue) {
        let canvas = document.createElement('canvas');

        canvas.width = 256;
        canvas.height = 256;

        let ctx = canvas.getContext('2d');

        ctx.fillStyle = 'transparent';
        ctx.fillRect(0,0,canvas.width, canvas.height);

        let pix = new ImageData(pixData, canvas.width, canvas.height);

        ctx.putImageData(pix, 0,0);

        return canvas;
    }

    setSpriteProperties(sprite, zoomLevel, tilePos, mirrored) {
        let xTilePos = tilePos[0], yTilePos = tilePos[1];

        let totalWidth = this.tilesetInfo.max_width;
        let totalHeight = this.tilesetInfo.max_width;

        let minX = 0;
        let minY = 0;

        let tileWidth = totalWidth / Math.pow(2, zoomLevel);
        let tileHeight = totalHeight / Math.pow(2, zoomLevel);

        let tileX = minX + xTilePos * tileWidth;
        let tileY = minY + yTilePos * tileHeight;

        let tileEndX = minX + (xTilePos+1) * tileWidth;
        let tileEndY = minY + (yTilePos+1) * tileHeight;

        let spriteWidth = this._refXScale(tileEndX) - this._refXScale(tileX) ;
        let spriteHeight = this._refYScale(tileEndY) - this._refYScale(tileY)

            sprite.width = this._refXScale(tileEndX) - this._refXScale(tileX)
            sprite.height = this._refYScale(tileEndY) - this._refYScale(tileY)

            if (mirrored) {
                // this is a mirrored tile that represents the other half of a 
                // triangular matrix
                sprite.x = this._refXScale(tileY);
                sprite.y = this._refYScale(tileX);

                sprite.pivot = [this._refXScale()[1] / 2, this._refYScale()[1] / 2];
                sprite.rotation = -Math.PI / 2;
                sprite.scale.x *= -1;

                sprite.width = spriteHeight;
                sprite.height = spriteWidth;
            } else {
                sprite.x = this._refXScale(tileX);
                sprite.y = this._refYScale(tileY);
            }

        console.log('sprite.x:', sprite.x);
        console.log('sprite.y:', sprite.y);
        console.log('sprite.scale:', sprite.scale);
    }

    minVisibleValue() {
         let min = Math.min.apply(null, Object.keys(this.fetchedTiles).map(x => this.fetchedTiles[x].tileData.min_value));
         //console.log('min', min);
         return min;
    }

    maxVisibleValue() {
         let max = Math.max.apply(null, Object.keys(this.fetchedTiles).map(x => this.fetchedTiles[x].tileData.max_value));
         //console.log('max:', max);
         return max;
    }

    zoomed(newXScale, newYScale, scale, translate) {
        super.zoomed(newXScale, newYScale);

        let scaleX = (newXScale(1) - newXScale(0))/ (this._refXScale(1) - this._refXScale(0));
        let scaleY = (newYScale(1) - newYScale(0))/ (this._refYScale(1) - this._refYScale(0));

        let translateX = newXScale(0) - this._refXScale(0)
        let translateY = newYScale(0) - this._refYScale(0)

        console.log('refXScale.domain()[0]', this._refXScale.domain()[0]);
        console.log('newXScale.domain()[0]', newXScale.domain()[0]);

        /*
        this.pMain.x = -translateX;
        this.pMain.y = -translateY;
        */
        console.log('translate:', translate);
        console.log('sdfssdsdd:', [translateX, translateY]);
        this.pMain.position.x = translate[0];
        this.pMain.position.y = translate[1];

        console.log('this.pMain.position.x', this.pMain.position.x);
        console.log('this.pMain.position.y', this.pMain.position.y);
        console.log('this._refXScale(0)', this._refXScale(0));
        console.log('this._refYScale(0)', this._refYScale(0));
        console.log('this.position:', this.position);

        this.pMain.scale.x = scaleX;
        this.pMain.scale.y = scaleY;

        /*
        this.pMain.beginFill(0xFF700B, 1);
        this.pMain.drawRect(0,0,
                            this.dimensions[0], this.dimensions[1]);
        */
    }

    draw() {

    }


    refXScale(_) {
        super.refXScale(_);

        this.draw();
    }

    refYScale(_) {
        super.refYScale(_);

        this.draw();
    }

    drawTile(tile, graphics) {
        console.log('drawTile...');
        let tileData = tile.tileData;
        let pixData = workerSetPix(tileData.dense.length, tileData.dense, this.minVisibleValue(), this.maxVisibleValue());
        let canvas = this.tileDataToCanvas(pixData,  this.minVisibleValue(), this.maxVisibleValue());

        let sprite = null;

        if (tileData.tilePos[0] == this.maxZoom)
            sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(canvas, PIXI.SCALE_MODES.NEAREST));
        else
            sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(canvas));

        this.setSpriteProperties(sprite, tile.tileData.zoomLevel, tile.tileData.tilePos, tile.mirrored);

        graphics.removeChildren();
        graphics.addChild(sprite);
        //console.log('pixData:', pixData);
    }
}
