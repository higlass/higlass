import HeatmapTiledPixiTrack from './HeatmapTiledPixiTrack';

// Services
import { tileProxy } from './services';

// Utils
import { colorDomainToRgbaArray } from './utils';

// Configs
import { GLOBALS, HEATED_OBJECT_MAP } from './configs';

class HorizontalHeatmapTrack extends HeatmapTiledPixiTrack {
  /**
   * @param scene: A PIXI.js scene to draw everything to.
   * @param dataConfig: An object defining where the data should be pulled from
   */
  constructor(context, options) {
    super(context, options);
    const { animate } = context;

    this.pMain = this.pMobile;

    // [[255,255,255,0], [237,218,10,4] ...
    // a 256 element array mapping the values 0-255 to rgba values
    // not a d3 color scale for speed
    // this.colorScale = HEATED_OBJECT_MAP;
    this.colorScale = HEATED_OBJECT_MAP;

    // Continuous scaling is currently not supported
    this.continuousScaling = false;

    if (options && options.colorRange) {
      this.colorScale = colorDomainToRgbaArray(options.colorRange);
    }

    this.animate = animate;
    this.options = options;

    this.pubSubs = [];
  }

  rerender(options, force) {
    super.rerender(options, force);

    // zoom so that if the heatmap is flipped, the scale of this.pMain changes
    this.zoomed(
      this.xScale(),
      this.yScale(),
      this.pMain.scale.x,
      this.pMain.position.x,
      this.pMain.position.y,
    );
  }

  calculateZoomLevel() {
    let zoomLevel = null;

    if (this.tilesetInfo.resolutions) {
      const zoomIndexX = tileProxy.calculateZoomLevelFromResolutions(
        this.tilesetInfo.resolutions,
        this._xScale,
        this.tilesetInfo.min_pos[0],
        this.tilesetInfo.max_pos[0],
      );

      const zoomIndexY = tileProxy.calculateZoomLevelFromResolutions(
        this.tilesetInfo.resolutions,
        this._xScale,
        this.tilesetInfo.min_pos[1],
        this.tilesetInfo.max_pos[1],
      );

      zoomLevel = Math.min(zoomIndexX, zoomIndexY);
    } else {
      const xZoomLevel = tileProxy.calculateZoomLevel(
        this._xScale,
        this.tilesetInfo.min_pos[0],
        this.tilesetInfo.max_pos[0],
      );

      const yZoomLevel = tileProxy.calculateZoomLevel(
        this._xScale,
        this.tilesetInfo.min_pos[1],
        this.tilesetInfo.max_pos[1],
      );

      zoomLevel = Math.max(xZoomLevel, yZoomLevel);
      zoomLevel = Math.min(zoomLevel, this.maxZoom);
    }

    if (this.options && this.options.maxZoom) {
      if (this.options.maxZoom >= 0) {
        zoomLevel = Math.min(this.options.maxZoom, zoomLevel);
      } else {
        console.error('Invalid maxZoom on track:', this);
      }
    }

    return zoomLevel;
  }

  calculateVisibleTiles() {
    // if we don't know anything about this dataset, no point
    // in trying to get tiles
    if (!this.tilesetInfo) {
      return;
    }

    this.zoomLevel = this.calculateZoomLevel();

    // this.zoomLevel = 0;
    const expandedXScale = this._xScale.copy();

    // we need to expand the domain of the X-scale because we are showing diagonal tiles.
    // to make sure the view is covered up the entire height, we need to expand by
    // viewHeight * sqrt(2)
    // on each side
    expandedXScale.domain([
      this._xScale.invert(
        this._xScale.range()[0] - this.dimensions[1] * Math.sqrt(2),
      ),
      this._xScale.invert(
        this._xScale.range()[1] + this.dimensions[1] * Math.sqrt(2),
      ),
    ]);

    if (this.tilesetInfo.resolutions) {
      const sortedResolutions = this.tilesetInfo.resolutions
        .map((x) => +x)
        .sort((a, b) => b - a);

      this.xTiles = tileProxy.calculateTilesFromResolution(
        sortedResolutions[this.zoomLevel],
        expandedXScale,
        this.tilesetInfo.min_pos[0],
        this.tilesetInfo.max_pos[0],
      );
      this.yTiles = tileProxy.calculateTilesFromResolution(
        sortedResolutions[this.zoomLevel],
        expandedXScale,
        this.tilesetInfo.min_pos[0],
        this.tilesetInfo.max_pos[0],
      );
    } else {
      this.xTiles = tileProxy.calculateTiles(
        this.zoomLevel,
        expandedXScale,
        this.tilesetInfo.min_pos[0],
        this.tilesetInfo.max_pos[0],
        this.tilesetInfo.max_zoom,
        this.tilesetInfo.max_width,
      );

      this.yTiles = tileProxy.calculateTiles(
        this.zoomLevel,
        expandedXScale,
        this.tilesetInfo.min_pos[0],
        this.tilesetInfo.max_pos[0],
        this.tilesetInfo.max_zoom,
        this.tilesetInfo.max_width,
      );
    }

    const rows = this.xTiles;
    const cols = this.yTiles;
    const zoomLevel = this.zoomLevel;

    const maxWidth = this.tilesetInfo.max_width;
    const tileWidth = maxWidth / 2 ** zoomLevel;

    // if we're mirroring tiles, then we only need tiles along the diagonal
    const tiles = [];

    // calculate the ids of the tiles that should be visible
    for (let i = 0; i < rows.length; i++) {
      for (let j = i; j < cols.length; j++) {
        // the length between the bottom of the track and the bottom corner of the tile
        // draw it out to understand better!
        const tileBottomPosition =
          ((j - i - 2) *
            (this._xScale(tileWidth) - this._xScale(0)) *
            Math.sqrt(2)) /
          2;

        if (tileBottomPosition > this.dimensions[1]) {
          // this tile won't be visible so we don't need to fetch it
          continue;
        }

        const newTile = [zoomLevel, rows[i], cols[j]];
        newTile.mirrored = false;
        newTile.dataTransform = this.options.dataTransform
          ? this.options.dataTransform
          : 'default';

        tiles.push(newTile);
      }
    }

    this.setVisibleTiles(tiles);
  }

  tileDataToCanvas(pixData) {
    const canvas = document.createElement('canvas');

    canvas.width = 256;
    canvas.height = 256;
    //

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pix = new ImageData(pixData, canvas.width, canvas.height);

    ctx.putImageData(pix, 0, 0);

    return canvas;
  }

  setSpriteProperties(sprite, zoomLevel, tilePos, mirrored) {
    const {
      tileX,
      tileY,
      tileWidth,
      tileHeight,
    } = this.getTilePosAndDimensions(zoomLevel, tilePos);

    const tileEndX = tileX + tileWidth;
    const tileEndY = tileY + tileHeight;

    sprite.width = this._refXScale(tileEndX) - this._refXScale(tileX);
    sprite.height = this._refYScale(tileEndY) - this._refYScale(tileY);

    sprite.x = this._refXScale(tileX);
    sprite.y = this._refYScale(tileY);
  }

  pixDataFunction(tile, pixData) {
    // the tileData has been converted to pixData by the worker script and needs to be loaded
    // as a sprite
    if (pixData) {
      const graphics = tile.graphics;

      const canvas = this.tileDataToCanvas(pixData.pixData);

      const texture =
        GLOBALS.PIXI.VERSION[0] === '4'
          ? GLOBALS.PIXI.Texture.fromCanvas(
              canvas,
              GLOBALS.PIXI.SCALE_MODES.NEAREST,
            )
          : GLOBALS.PIXI.Texture.from(canvas, {
              scaleMode: GLOBALS.PIXI.SCALE_MODES.NEAREST,
            });

      tile.sprite = new GLOBALS.PIXI.Sprite(texture);
      tile.canvas = canvas;

      this.setSpriteProperties(
        tile.sprite,
        tile.tileData.zoomLevel,
        tile.tileData.tilePos,
        tile.mirrored,
      );

      graphics.pivot.x = this._refXScale(0);
      graphics.pivot.y = this._refYScale(0);
      graphics.scale.x = -1 / Math.sqrt(2);
      graphics.rotation = (-3 * Math.PI) / 4;
      graphics.scale.y = 1 / Math.sqrt(2);

      graphics.position.x = this._refXScale(0);
      graphics.position.y = 0;

      graphics.removeChildren();
      graphics.addChild(tile.sprite);
    }

    this.renderingTiles.delete(tile.tileId);
    /*
        this.animate();
        this.refreshTiles();
        */
  }

  refScalesChanged(refXScale, refYScale) {
    super.refScalesChanged(refXScale, refYScale);

    for (const uid in this.fetchedTiles) {
      const tile = this.fetchedTiles[uid];

      if (tile.sprite) {
        this.setSpriteProperties(
          tile.sprite,
          tile.tileData.zoomLevel,
          tile.tileData.tilePos,
          tile.mirrored,
        );

        const graphics = tile.graphics;

        graphics.pivot.x = this._refXScale(0);
        graphics.pivot.y = this._refYScale(0);
        graphics.scale.x = -1 / Math.sqrt(2);
        graphics.rotation = (-3 * Math.PI) / 4;
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
    super.draw();

    this.pMain.position.x = tx;
    this.pMain.position.y = this.position[1] + this.dimensions[1]; // translateY;

    this.pMain.scale.x = k; // scaleX;
    this.pMain.scale.y = k; // scaleY;

    if (this.options.oneDHeatmapFlipped) {
      this.pMain.scale.y = -k;
      this.pMain.position.y = this.position[1];
    }
  }

  leftTrackDraw() {
    this.draw();
  }

  exportSVG() {
    let track = null;
    let base = null;

    [base, track] = super.superSVG();

    const output = document.createElement('g');
    track.appendChild(output);

    output.setAttribute(
      'transform',
      `translate(${this.pMain.position.x},${this.pMain.position.y}) scale(${this.pMain.scale.x},${this.pMain.scale.y})`,
    );

    for (const tile of this.visibleAndFetchedTiles()) {
      const gGraphics = document.createElement('g');
      const graphics = tile.graphics;
      const graphicsRotation = (graphics.rotation * 180) / Math.PI;
      const transformText = `translate(${graphics.position.x},${
        graphics.position.y
      }) rotate(${graphicsRotation}) scale(${graphics.scale.x},${
        graphics.scale.y
      }) translate(${-graphics.pivot.x},${-graphics.pivot.y})`;
      gGraphics.setAttribute('transform', transformText);

      const rotation = (tile.sprite.rotation * 180) / Math.PI;
      const g = document.createElement('g');
      g.setAttribute(
        'transform',
        `translate(${tile.sprite.x},${tile.sprite.y}) rotate(${rotation}) scale(${tile.sprite.scale.x},${tile.sprite.scale.y})`,
      );

      const image = document.createElement('image');
      image.setAttributeNS(
        'http://www.w3.org/1999/xlink',
        'xlink:href',
        tile.canvas.toDataURL(),
      );
      image.setAttribute('width', 256);
      image.setAttribute('height', 256);

      g.appendChild(image);
      gGraphics.appendChild(g);

      output.appendChild(gGraphics);
    }

    const gColorbar = this.exportColorBarSVG();
    track.appendChild(gColorbar);

    return [base, base];
  }
}

export default HorizontalHeatmapTrack;
