import HorizontalTiled1DPixiTrack from './HorizontalTiled1DPixiTrack';

// Configs
import { GLOBALS } from './configs';

class IdHorizontal1DTiledPixiTrack extends HorizontalTiled1DPixiTrack {
  constructor(context, options) {
    super(context, options);

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

    const graphics = tile.graphics;
    tile.textGraphics = new GLOBALS.PIXI.Graphics();

    tile.text = new GLOBALS.PIXI.Text(
      `${tile.tileData.zoomLevel}/${tile.tileData.tilePos.join('/')}`,
      {
        fontFamily: 'Arial',
        fontSize: 32,
        fill: 0xff1010,
        align: 'center',
      },
    );

    // tile.text.y = 100;
    tile.textGraphics.addChild(tile.text);

    tile.text.anchor.x = 0.5;
    tile.text.anchor.y = 0.5;

    graphics.addChild(tile.textGraphics);

    this.drawTile(tile);
  }

  destroyTile(tile) {}

  drawTile(tile) {
    super.drawTile(tile);

    if (!tile.graphics) {
      return;
    }

    const graphics = tile.graphics;

    const { tileX, tileWidth } = this.getTilePosAndDimensions(
      tile.tileData.zoomLevel,
      tile.tileData.tilePos,
    );

    // the text needs to be scaled down so that it doesn't become huge
    // when we zoom in
    const tSX =
      1 /
      ((this._xScale(1) - this._xScale(0)) /
        (this._refXScale(1) - this._refXScale(0)));
    // let tSY = 1 / (
    //   (this._yScale(1) - this._yScale(0))
    //   / (this._refYScale(1) - this._refYScale(0))
    // );

    tile.text.scale.x = tSX;
    // tile.text.scale.y = tSY;

    graphics.clear();

    // line needs to be scaled down so that it doesn't become huge

    const tileScaledHeight = this.dimensions[1];
    // fun tile positioning when it's mirrored, except this is just a rectangle
    // that doesn't need to be rotated so it's easy
    const tileScaledWidth =
      this._refXScale(tileX + tileWidth) - this._refXScale(tileX);

    // add tileScaledHeight / 2 and tileScaledWidth / 2 to center the text on the tile
    tile.textGraphics.position.x = this._refXScale(tileX) + tileScaledWidth / 2;
    tile.textGraphics.position.y = tileScaledHeight / 2;

    const rectX = this._refXScale(tileX);

    // position the graphics
    // graphics.drawRect(rectX, 0, tileScaledWidth, tileScaledHeight);
    graphics.lineStyle(4 * tSX, 0x0000ff, 1);
    graphics.beginFill(0xff700b, 0.4);
    graphics.alpha = 0.5;

    graphics.moveTo(rectX, 0);
    graphics.lineTo(rectX, tileScaledHeight);

    graphics.moveTo(rectX + tileScaledWidth, 0);
    graphics.lineTo(rectX + tileScaledWidth, tileScaledHeight);

    graphics.lineStyle(0, 0x0000ff, 1);
    graphics.drawRect(rectX, 0, tileScaledWidth, tileScaledHeight);
  }
}

export default IdHorizontal1DTiledPixiTrack;
