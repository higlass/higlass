import {Tiled2DPixiTrack} from './Tiled2DPixiTrack.js';
import {tileProxy} from './TileProxy.js';

export class Id2DTiledPixiTrack extends Tiled2DPixiTrack {
    constructor(scene, server, uid) {
        super(scene, server, uid);

    }

    drawTile(tile, graphics) {
        let {tileX, tileY, tileWidth, tileHeight} = this.getTilePosAndDimensions(tile.tileData.zoomLevel, 
                                                                                 tile.tileData.tilePos);

        let t = new PIXI.Text(tile.tileData.zoomLevel + "/" + tile.tileData.tilePos.join('/'), 
                              {fontFamily : 'Arial', fontSize: 32, fill : 0xff1010, align : 'center'});


        let tSX = 1 / ((this._xScale(1) - this._xScale(0)) / (this._refXScale(1) - this._refXScale(0)));
        let tSY = 1 / ((this._yScale(1) - this._yScale(0)) / (this._refYScale(1) - this._refYScale(0)));

        console.log('tSX:', tSX);
        console.log('tSY:', tSY);
            
        t.scale.x = tSX;
        t.scale.y = tSY;

        graphics.removeChildren();

        let textGraphics = new PIXI.Graphics();
        textGraphics.position.x = this._refXScale(tileX) + 5;
        textGraphics.position.y = this._refYScale(tileY) + 5;

        textGraphics.addChild(t);
        
        graphics.clear();
        graphics.lineStyle(0, 0x0000FF, 1);
        graphics.beginFill(0xFF700B, 1);
        graphics.alpha = 0.5;

        graphics.addChild(textGraphics);


        graphics.drawRect(this._refXScale(tileX), this._refYScale(tileY),
                          this._refXScale(tileX + tileWidth) - this._refXScale(tileX),
                          this._refYScale(tileY + tileWidth) - this._refYScale(tileY))
    }

    fetchNewTiles(toFetch) {
        toFetch.map(x => {
            let key = x.remoteId;
            let keyParts = key.split('.');

            let data = {
                zoomLevel: keyParts[1],
                tilePos: keyParts.slice(2, keyParts.length).map(x => +x)
            }

            this.fetchedTiles[x.tileId] = x;
            this.fetchedTiles[x.tileId].tileData = data;
        });

        this.synchronizeTilesAndGraphics();
    }
}
