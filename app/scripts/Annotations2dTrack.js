import { TiledPixiTrack } from './TiledPixiTrack';

// Services
import { tileProxy } from './services';

// Utils
import { colorToHex } from './utils';

class Annotations2dTrack extends TiledPixiTrack {
  constructor(scene, dataConfig, handleTilesetInfoReceived, option, animate) {
    super(scene, dataConfig, handleTilesetInfoReceived, option, animate);

    this.drawnRects = {};

    this.options.minSquareSize = +this.options.minSquareSize;
  }

  /**
   * The local tile identifier
   *
   * @param  {Array}  tile  Array containing [zoomLevel, xPos, yPos]
   * @return  {String}  Joined ID string
   */
  tileToLocalId(tile) {
    // tile contains [zoomLevel, xPos, yPos]
    return `${tile.join('.')}`;
  }

  /**
   * The tile identifier used on the server
   *
   * @param  {Array}  tile  Array containing [zoomLevel, xPos, yPos]
   * @return  {String}  Joined ID string
   */
  tileToRemoteId(tile) {
    return `${tile.join('.')}`;
  }

  localToRemoteId(remoteId) {
    const idParts = remoteId.split('.');
    return idParts.slice(0, idParts.length - 1).join('.');
  }

  calculateZoomLevel() {
    const xZoomLevel = tileProxy.calculateZoomLevel(
      this._xScale, 0, this.tilesetInfo.max_size
    );
    const yZoomLevel = tileProxy.calculateZoomLevel(
      this._yScale, 0, this.tilesetInfo.max_size
    );

    return Math.min(Math.max(xZoomLevel, yZoomLevel), this.maxZoom);
  }

  /**
   * Set which tiles are visible right now.
   *
   * @param tiles: A set of tiles which will be considered the currently visible
   * tile positions.
   */
  setVisibleTiles(tilePositions) {
    this.visibleTiles = tilePositions.map(x => ({
      tileId: this.tileToLocalId(x),
      remoteId: this.tileToRemoteId(x),
    }));

    this.visibleTileIds = new Set(this.visibleTiles.map(x => x.tileId));
  }

  calculateVisibleTiles() {
    // if we don't know anything about this dataset, no point
    // in trying to get tiles
    if (!this.tilesetInfo) return;

    this.zoomLevel = this.calculateZoomLevel();

    this.xTiles = tileProxy.calculateTiles(
      this.zoomLevel,
      this._xScale,
      0,
      this.tilesetInfo.max_size,
      this.tilesetInfo.max_zoom,
      this.tilesetInfo.max_size
    );

    this.yTiles = tileProxy.calculateTiles(
      this.zoomLevel,
      this._yScale,
      0,
      this.tilesetInfo.max_size,
      this.tilesetInfo.max_zoom,
      this.tilesetInfo.max_size
    );

    const zoomLevel = this.zoomLevel;

    // if we're mirroring tiles, then we only need tiles along the diagonal
    const tiles = [];

    // calculate the ids of the tiles that should be visible
    for (let i = 0; i < this.xTiles.length; i++) {
      for (let j = 0; j < this.yTiles.length; j++) {
        tiles.push([zoomLevel, this.xTiles[i], this.yTiles[j]]);
      }
    }

    this.setVisibleTiles(tiles);
  }

  // initTile(tile) {}

  // destroyTile(tile, graphics) {}

  draw() {
    this.drawnRects = {};

    super.draw();
  }

  drawTile(tile) {
    if (!tile.graphics) return;

    const graphics = tile.graphics;
    graphics.clear();

    const stroke = colorToHex(this.options.rectangleDomainStrokeColor || 'black');
    const fill = colorToHex(this.options.rectangleDomainFillColor || 'grey');

    graphics.lineStyle(
      typeof this.options.rectangleDomainStrokeWidth !== 'undefined'
        ? this.options.rectangleDomainStrokeWidth
        : 1,
      stroke,
      typeof this.options.rectangleDomainStrokeOpacity !== 'undefined'
        ? this.options.rectangleDomainStrokeOpacity
        : 1,
    );
    graphics.beginFill(
      fill,
      typeof this.options.rectangleDomainFillOpacity !== 'undefined'
        ? this.options.rectangleDomainFillOpacity
        : 0.4,
    );

    graphics.alpha = this.options.rectangleDomainOpacity || 0.5;

    if (!tile.tileData.length) return;

    tile.tileData
      .filter(td => !(td.uid in this.drawnRects))
      .forEach((td) => {
        const startX = this._xScale(td.xStart);
        const endX = this._xScale(td.xEnd);

        const startY = this._yScale(td.yStart);
        const endY = this._yScale(td.yEnd);

        const uid = td.uid;

        const width = endX - startX;
        const height = endY - startY;

        let drawnRect = {
          x: startX,
          y: startY,
          width,
          height
        };

        if (this.options.minSquareSize) {
          if (
            width < this.options.minSquareSize
            || height < this.options.minSquareSize
          ) {
            drawnRect = {
              x: (startX + endX) / 2,
              y: (startY + endY) / 2,
              width: this.options.minSquareSize,
              height: this.options.minSquareSize
            };
          }
        }

        this.drawnRects[uid] = drawnRect;

        graphics.drawRect(
          drawnRect.x, drawnRect.y, drawnRect.width, drawnRect.height
        );
      });
  }

  exportSVG() {
    let track = null;
    let base = null;

    if (super.exportSVG) {
      [base, track] = super.exportSVG();
    } else {
      base = document.createElement('g');
      track = base;
    }

    const output = document.createElement('g');
    output.setAttribute(
      'transform',
      `translate(${this.position[0]},${this.position[1]})`
    );

    track.appendChild(output);

    this.visibleAndFetchedTiles()
      .filter(tile => tile.tileData && tile.tileData.length)
      .map(tile => ({ graphics: tile.graphics, td: tile.tileData }))
      .forEach(({ td, graphics }) => {
        const gTile = document.createElement('g');

        gTile.setAttribute(
          'transform',
          `translate(${graphics.position.x},${graphics.position.y})scale(${graphics.scale.x},${graphics.scale.y})`
        );
        output.appendChild(gTile);

        if (td.uid in this.drawnRects) {
          const rect = this.drawnRects[td.uid];
          const r = document.createElement('rect');

          r.setAttribute('x', rect.x);
          r.setAttribute('y', rect.y);
          r.setAttribute('width', rect.width);
          r.setAttribute('height', rect.height);

          r.setAttribute('fill', this.options.fillColor || 'grey');
          r.setAttribute('opacity', 0.3);

          r.style.stroke = this.options.fillColor || 'grey';
          r.style.strokeWidth = '1px';

          gTile.appendChild(r);
        }
      });

    return [base, base];
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

export default Annotations2dTrack;
