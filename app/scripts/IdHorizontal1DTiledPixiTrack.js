import HorizontalTiled1DPixiTrack from './HorizontalTiled1DPixiTrack';

export class IdHorizontal1DTiledPixiTrack extends HorizontalTiled1DPixiTrack {
    constructor(scene, server, uid, handleTilesetInfoReceived, options, animate) {
        super(scene, server, uid, handleTilesetInfoReceived, options, animate);

        this.pMain = this.pMobile;
    }

    areAllVisibleTilesLoaded() {

        // we don't need to wait for any tiles to load before
        // drawing
        //
        return true;
    }

    initTile(tile) {
        /**
         * Create whatever is needed to draw this tile.
         */

        let graphics = tile.graphics;
        tile.textGraphics = new PIXI.Graphics();
        //tile.text = new PIXI.Text(tile.tileData.zoomLevel + "/" + tile.tileData.tilePos.join('/') + '/' + tile.mirrored,

        tile.text = new PIXI.Text(tile.tileData.zoomLevel + "/" + tile.tileData.tilePos.join('/'),
                              {fontFamily : 'Arial', fontSize: 32, fill : 0xff1010, align : 'center'});

        //tile.text.y = 100;
        tile.textGraphics.addChild(tile.text);

        tile.text.anchor.x = 0.5;
        tile.text.anchor.y = 0.5;


        graphics.addChild(tile.textGraphics);

        this.drawTile(tile);
    }

    destroyTile(tile) {

    }

    drawTile(tile) {
        super.drawTile(tile);

        if (!tile.graphics)
            return;

        let graphics = tile.graphics;

        let {tileX, tileY, tileWidth, tileHeight} = this.getTilePosAndDimensions(tile.tileData.zoomLevel,
                                                                                 tile.tileData.tilePos);

        // the text needs to be scaled down so that it doesn't become huge
        // when we zoom in
        let tSX = 1 / ((this._xScale(1) - this._xScale(0)) / (this._refXScale(1) - this._refXScale(0)));
        //let tSY = 1 / ((this._yScale(1) - this._yScale(0)) / (this._refYScale(1) - this._refYScale(0)));

        tile.text.scale.x = tSX;
        //tile.text.scale.y = tSY;

        //console.log('tSX:', tSX, 'tSY:',tSY);

        graphics.clear();


        // line needs to be scaled down so that it doesn't become huge

        let tileScaledHeight = this.dimensions[1];
        // fun tile positioning when it's mirrored, except this is just a rectangle
        // that doesn't need to be rotated so it's easy
            let tileScaledWidth = this._refXScale(tileX + tileWidth) - this._refXScale(tileX);

        // add tileScaledHeight / 2 and tileScaledWidth / 2 to center the text on the tile
        tile.textGraphics.position.x = this._refXScale(tileX) + tileScaledWidth / 2;
        tile.textGraphics.position.y = tileScaledHeight / 2;;

        let rectX = this._refXScale(tileX)
        let rectY = 0;

        //console.log('rectX:', rectX, 'rectY:', rectY);
        // position the graphics
        //graphics.drawRect(rectX, 0, tileScaledWidth, tileScaledHeight);
        graphics.lineStyle(4 * tSX, 0x0000FF, 1);
        graphics.beginFill(0xFF700B, 0.4);
        graphics.alpha = 0.5;

        graphics.moveTo(rectX, 0);
        graphics.lineTo(rectX, tileScaledHeight);

        graphics.moveTo(rectX + tileScaledWidth, 0);
        graphics.lineTo(rectX + tileScaledWidth, tileScaledHeight);

        graphics.lineStyle(0, 0x0000FF, 1);
        graphics.drawRect(rectX, 0, tileScaledWidth, tileScaledHeight);
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

export default IdHorizontal1DTiledPixiTrack;
